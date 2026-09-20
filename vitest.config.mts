import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    include: ["lib/**/*.test.ts", "features/**/*.test.ts", "services/**/*.test.ts"],
  },
});
