import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SERVER_SOURCE_ROOTS = ["app", "components", "db", "lib"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function directiveValue(statement: ts.Statement): string | null {
  if (!ts.isExpressionStatement(statement)) return null;
  if (!ts.isStringLiteral(statement.expression)) return null;
  return statement.expression.text;
}

function isBrowserOnlyModule(
  sourceFile: ts.SourceFile,
  source: string,
): boolean {
  for (const statement of sourceFile.statements) {
    const directive = directiveValue(statement);
    if (directive === null) break;
    if (directive === "use client") return true;
  }

  return (
    source.includes('from "client-only"') ||
    source.includes('import "client-only"')
  );
}

function propertyNameText(name: ts.PropertyName): string | null {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return null;
}

function objectProperty(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | undefined {
  return object.properties.find(
    (property): property is ts.PropertyAssignment => {
      return (
        ts.isPropertyAssignment(property) &&
        propertyNameText(property.name) === name
      );
    },
  );
}

function stringLiteralValue(node: ts.Expression): string | null {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return stringLiteralValue(node.expression);
  }

  return null;
}

function hasNextFetchPolicy(init: ts.Expression): boolean {
  if (!ts.isObjectLiteralExpression(init)) return false;

  const cache = objectProperty(init, "cache");
  const next = objectProperty(init, "next");
  if (cache) return true;
  if (!next || !ts.isObjectLiteralExpression(next.initializer)) return false;

  return Boolean(
    objectProperty(next.initializer, "revalidate") ||
      objectProperty(next.initializer, "tags"),
  );
}

function hasConflictingNextFetchPolicy(init: ts.Expression): boolean {
  if (!ts.isObjectLiteralExpression(init)) return false;

  const cache = objectProperty(init, "cache");
  const next = objectProperty(init, "next");
  if (!cache || !next || !ts.isObjectLiteralExpression(next.initializer))
    return false;

  const cacheValue = stringLiteralValue(cache.initializer);
  const revalidate = objectProperty(next.initializer, "revalidate");
  if (!revalidate) return false;

  const revalidateText = revalidate.initializer.getText();
  return (
    (cacheValue === "no-store" && revalidateText !== "0") ||
    (cacheValue === "force-cache" && revalidateText === "0")
  );
}

function lineColumn(sourceFile: ts.SourceFile, position: number): string {
  const { line, character } =
    sourceFile.getLineAndCharacterOfPosition(position);
  return `${line + 1}:${character + 1}`;
}

function directFetchCalls(sourceFile: ts.SourceFile): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "fetch"
    ) {
      calls.push(node);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

describe("server fetch policy", () => {
  const files = SERVER_SOURCE_ROOTS.flatMap((root) =>
    walk(join(process.cwd(), root)),
  )
    .filter((file) => SOURCE_EXTENSIONS.has(extname(file)))
    .filter(
      (file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"),
    );

  it("requires explicit cache semantics for direct server fetch calls", () => {
    const ambiguousFetches: string[] = [];
    const conflictingFetches: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      if (isBrowserOnlyModule(sourceFile, source)) continue;

      for (const call of directFetchCalls(sourceFile)) {
        const init = call.arguments[1];
        const location = `${relative(process.cwd(), file)}:${lineColumn(sourceFile, call.getStart())}`;
        if (!init || !hasNextFetchPolicy(init)) {
          ambiguousFetches.push(location);
          continue;
        }

        if (hasConflictingNextFetchPolicy(init)) {
          conflictingFetches.push(location);
        }
      }
    }

    expect(ambiguousFetches).toEqual([]);
    expect(conflictingFetches).toEqual([]);
  });
});
