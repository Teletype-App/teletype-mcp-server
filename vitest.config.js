import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Catalog keys and template parameters are checked by types and i18n tests.
      exclude: ["src/**/*.test.ts", "src/test-support/**", "src/locales/**"],
      reporter: ["text", "html", "lcov", "json-summary"],
      thresholds: { statements: 63, branches: 53, functions: 66, lines: 64 },
    },
  },
});
