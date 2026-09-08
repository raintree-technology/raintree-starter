import next from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "tmp/agent-browser/**",
      "test-results/**",
    ],
  },
  ...next,
  {
    rules: {
      "@next/next/no-img-element": "error",
    },
  },
];

export default eslintConfig;
