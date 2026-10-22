import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "prisma/seed-data/**"],
      exclude: ["src/generated/**"],
      // Policy and scope code needs 100% coverage (AGENTS.md §6). The framework glue in
      // src/lib/authz (session.ts, action.ts, query.ts) is covered by e2e tests instead.
      thresholds: {
        "src/lib/authz/{catalog,policy,scope,resource,user}.ts": {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
});
