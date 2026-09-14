// @ts-check
const tseslint = require("typescript-eslint");

// src/lib/* is the intentionally-unchanged ported rule engine (see
// vision.md -> Key Constraints) and is exempt from linting.
module.exports = tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "src/lib/**"] },
  {
    files: ["src/commands/**/*.ts", "src/io/**/*.ts", "src/cli.ts", "test-files/**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
);
