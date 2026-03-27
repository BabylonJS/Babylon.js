#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../../../../");

const testFiles = [
    "packages/tools/testsMemoryLeaks/test/unit/filters.test.ts",
    "packages/tools/testsMemoryLeaks/test/unit/scenarios.test.ts",
    "packages/tools/testsMemoryLeaks/test/unit/runner.test.ts",
];

const extraArgs = process.argv.slice(2);

const resolveOptionalPackage = (packageName) => {
    try {
        return require.resolve(`${packageName}/package.json`);
    } catch {
        return null;
    }
};

const vitestPackage = resolveOptionalPackage("vitest");
const jestPackage = resolveOptionalPackage("jest");

if (!vitestPackage && !jestPackage) {
    process.stderr.write("Neither Vitest nor Jest could be resolved for memory leak unit tests.\n");
    process.exit(1);
}

const command = vitestPackage ? (process.platform === "win32" ? "npx.cmd" : "npx") : process.execPath;
const args = vitestPackage
    ? ["vitest", "run", "--project=unit", ...testFiles, ...extraArgs]
    : [
          path.join(path.dirname(jestPackage), "bin", "jest.js"),
          "--config",
          path.join(repoRoot, "jest.config.ts"),
          "--selectProjects",
          "unit",
          "--runInBand",
          ...testFiles,
          ...extraArgs,
      ];

const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
});

if (typeof result.status === "number") {
    process.exit(result.status);
}

process.exit(1);
