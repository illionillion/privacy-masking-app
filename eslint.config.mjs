import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output (static export)
    "docs/**",
    // Serwist generated service worker
    "public/sw.js",
    "public/swe-worker*",
    // Test coverage output
    "coverage/**",
  ]),
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    plugins: {
      "testing-library": testingLibrary,
      vitest,
    },
    rules: {
      /**
       * click / change / keyboard 等は userEvent を優先する。
       * drop / wheel / touch / composition 等に相当 API が無いものはルール対象外。
       */
      "testing-library/prefer-user-event": "error",
      "vitest/no-conditional-expect": "error",
      "vitest/no-conditional-in-test": "error",
      "vitest/no-conditional-tests": "error",
    },
  },
]);

export default eslintConfig;
