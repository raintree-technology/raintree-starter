import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const REQUEST_APIS = ["cookies", "headers"] as const;
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
  "tmp",
]);

type RequestApi = (typeof REQUEST_APIS)[number];

type RequestApiBindings = {
  direct: Map<string, RequestApi>;
  namespaces: Set<string>;
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return IGNORED_DIRECTORIES.has(entry.name) ? [] : walk(path);
    }

    return SOURCE_EXTENSIONS.has(extname(entry.name)) &&
      !entry.name.endsWith(".d.ts")
      ? [path]
      : [];
  });
}

function parse(file: string): ts.SourceFile {
  const extension = extname(file);
  const scriptKind =
    extension === ".tsx" || extension === ".jsx"
      ? ts.ScriptKind.TSX
      : extension === ".js" || extension === ".mjs" || extension === ".cjs"
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

function nextHeadersBindings(sourceFile: ts.SourceFile): RequestApiBindings {
  const bindings: RequestApiBindings = {
    direct: new Map(),
    namespaces: new Set(),
  };

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "next/headers" ||
      !statement.importClause?.namedBindings
    ) {
      continue;
    }

    const { namedBindings } = statement.importClause;
    if (ts.isNamespaceImport(namedBindings)) {
      bindings.namespaces.add(namedBindings.name.text);
      continue;
    }

    for (const element of namedBindings.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      if (REQUEST_APIS.includes(imported as RequestApi)) {
        bindings.direct.set(element.name.text, imported as RequestApi);
      }
    }
  }

  return bindings;
}

function requestApiForCall(
  node: ts.CallExpression,
  bindings: RequestApiBindings,
): RequestApi | null {
  const expression = node.expression;

  if (ts.isIdentifier(expression)) {
    return bindings.direct.get(expression.text) ?? null;
  }

  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    bindings.namespaces.has(expression.expression.text) &&
    REQUEST_APIS.includes(expression.name.text as RequestApi)
  ) {
    return expression.name.text as RequestApi;
  }

  return null;
}

function isUseExpression(node: ts.Expression): boolean {
  return (
    (ts.isIdentifier(node) && node.text === "use") ||
    (ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "React" &&
      node.name.text === "use")
  );
}

function skipParens(node: ts.Expression): ts.Expression {
  return ts.isParenthesizedExpression(node)
    ? skipParens(node.expression)
    : node;
}

function isRequestApiCallAllowed(node: ts.CallExpression): boolean {
  const parent = node.parent;

  if (ts.isAwaitExpression(parent)) {
    return true;
  }

  return ts.isCallExpression(parent) && isUseExpression(parent.expression);
}

function expressionReturnsCookieStore(
  node: ts.Expression,
  bindings: RequestApiBindings,
): boolean {
  const expression = skipParens(node);

  if (ts.isAwaitExpression(expression)) {
    return expressionReturnsCookieStore(expression.expression, bindings);
  }

  if (!ts.isCallExpression(expression)) {
    return false;
  }

  if (requestApiForCall(expression, bindings) === "cookies") {
    return true;
  }

  return (
    isUseExpression(expression.expression) &&
    expression.arguments.some((arg) =>
      expressionReturnsCookieStore(arg, bindings),
    )
  );
}

function hasDirective(
  statements: readonly ts.Statement[],
  directive: string,
): boolean {
  for (const statement of statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      return false;
    }

    if (statement.expression.text === directive) {
      return true;
    }
  }

  return false;
}

function hasTopLevelUseServer(sourceFile: ts.SourceFile): boolean {
  return hasDirective(sourceFile.statements, "use server");
}

function hasFunctionUseServer(node: ts.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (
      (ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current) ||
        ts.isMethodDeclaration(current)) &&
      current.body &&
      ts.isBlock(current.body) &&
      hasDirective(current.body.statements, "use server")
    ) {
      return true;
    }
  }

  return false;
}

function isRouteHandler(file: string): boolean {
  return /^route\.[jt]sx?$/.test(basename(file));
}

function location(
  file: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
): string {
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  return `${relative(process.cwd(), file)}:${position.line + 1}:${position.character + 1}`;
}

function collectNextRequestApiViolations(file: string): {
  cookieMutations: string[];
  unawaitedCalls: string[];
} {
  const sourceFile = parse(file);
  const bindings = nextHeadersBindings(sourceFile);
  const cookieStoreBindings = new Set<string>();
  const cookieMutations: string[] = [];
  const unawaitedCalls: string[] = [];
  const canMutateCookiesInFile =
    isRouteHandler(file) || hasTopLevelUseServer(sourceFile);

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      expressionReturnsCookieStore(node.initializer, bindings)
    ) {
      cookieStoreBindings.add(node.name.text);
    }

    if (ts.isCallExpression(node)) {
      const api = requestApiForCall(node, bindings);
      if (api && !isRequestApiCallAllowed(node)) {
        unawaitedCalls.push(
          `${location(file, sourceFile, node)}: ${api}() must be awaited`,
        );
      }

      if (
        ts.isPropertyAccessExpression(node.expression) &&
        (node.expression.name.text === "set" ||
          node.expression.name.text === "delete") &&
        expressionUsesCookieStore(node.expression.expression)
      ) {
        const allowed = canMutateCookiesInFile || hasFunctionUseServer(node);
        if (!allowed) {
          cookieMutations.push(
            `${location(file, sourceFile, node)}: cookies().${node.expression.name.text}() must run in a route handler or server function`,
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  function expressionUsesCookieStore(node: ts.Expression): boolean {
    const expression = skipParens(node);
    return (
      (ts.isIdentifier(expression) &&
        cookieStoreBindings.has(expression.text)) ||
      expressionReturnsCookieStore(expression, bindings)
    );
  }

  visit(sourceFile);

  return { cookieMutations, unawaitedCalls };
}

describe("Next request API conventions", () => {
  const files = walk(process.cwd());
  const violations = files.flatMap((file) => {
    const fileViolations = collectNextRequestApiViolations(file);
    return [
      ...fileViolations.unawaitedCalls,
      ...fileViolations.cookieMutations,
    ];
  });

  it("uses async cookies and headers APIs safely", () => {
    expect(violations).toEqual([]);
  });
});
