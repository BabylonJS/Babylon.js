#!/usr/bin/env node
import { execFileSync } from "node:child_process";

try {
    execFileSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" });
} catch {
    process.exit(0);
}

try {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
} catch {
    console.warn("Could not configure Git hooks. Run `git config core.hooksPath .githooks` manually to enable pre-commit checks.");
}
