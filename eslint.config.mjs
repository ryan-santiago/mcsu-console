import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Project rules: docs/07-conventions.md § Lint rules.
const groupComparison = {
  selector:
    "BinaryExpression[operator=/^[!=]==?$/] > MemberExpression[property.name=/^(groupId|groupName)$/], BinaryExpression[operator=/^[!=]==?$/] > MemberExpression[object.property.name='group'][property.name=/^(id|name)$/]",
  message:
    "Never branch on a group name or id. Use can(), scopeWhere() or the policy helpers (AGENTS.md §1).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": ["error", groupComparison],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              allowTypeImports: true,
              group: [
                "@prisma/client",
                "@prisma/client/*",
                "@/generated/prisma/client",
                "**/generated/prisma/client",
              ],
              message:
                "Import the Prisma client from @/lib/db. Type-only imports from @/generated/prisma/client are fine.",
            },
          ],
        },
      ],
    },
  },
  {
    // The DB module, seed and authz policy code are the allowed exceptions.
    files: ["src/lib/db.ts", "prisma/**", "src/lib/authz/**", "tests/e2e/global-setup.ts"],
    rules: { "@typescript-eslint/no-restricted-imports": "off", "no-restricted-syntax": "off" },
  },
  {
    // Public config reaches the browser as props, never through process.env (ADR 0014).
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        groupComparison,
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Don't read process.env in components. Pass config as props from a Server Component (ADR 0014).",
        },
      ],
    },
  },
]);

export default eslintConfig;
