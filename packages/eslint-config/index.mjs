// @ts-check
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Shared flat ESLint config for the backend TypeScript apps (`@repo/api`,
 * `@repo/simulator`). ESLint v9 flat config. Plugins are imported as objects
 * (via the unified `typescript-eslint` package) rather than resolved by name,
 * so this sidesteps the Bun isolated-node_modules plugin-resolution quirk that
 * affects eslintrc-style shareable configs.
 *
 * Non-type-checked `recommended` preset: fast, no per-app `projectService`
 * wiring required. `no-explicit-any` ships as a warning here, matching the
 * backend code style's "never use bare `any`" rule.
 */
export default defineConfig(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,mjs,ts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
