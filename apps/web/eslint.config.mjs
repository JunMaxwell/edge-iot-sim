import { FlatCompat } from "@eslint/eslintrc";

// ESLint v9 flat config. `next lint` is deprecated (removed in Next 16), so we
// run the ESLint CLI directly (`eslint .`). FlatCompat bridges Next's shareable
// configs (still eslintrc-format) into flat config. Keep `next/*` last so its
// rules win. See docs/phase-6-plan.md (workstream 3 follow-up).
const compat = new FlatCompat({
  // import.meta.dirname requires Node.js >= 20.11.
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
  }),
];

export default eslintConfig;
