import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  eslint.configs.recommended,
  {
    files: ["**/*.{ts,mts,cts}"],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: true, ignoreMixedLogicalExpressions: true },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["plugin/assets/consent.js", "plugin/assets/landing.js"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      "src/teletype-api.ts",
      "src/entity-resolver.ts",
      "src/tool-helpers.ts",
      "src/conversation-tools.ts",
      "src/messaging-tools.ts",
      "src/workspace-tools.ts",
    ],
    rules: {
      // Teletype API payloads are untrusted; these runtime guards are intentional.
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: ["src/tools.ts"],
    rules: {
      // Keep the exported class API stable for existing consumers.
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
  {
    files: ["src/server.ts"],
    rules: {
      // The low-level SDK Server is required for these protocol request handlers.
      "@typescript-eslint/no-deprecated": "off",
    },
  },
);
