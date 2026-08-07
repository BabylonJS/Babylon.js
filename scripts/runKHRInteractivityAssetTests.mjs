/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The pinned revision lives in its own file so the CI pipeline can key its asset cache on the
// same value without duplicating the SHA.
const AssetManifest = JSON.parse(readFileSync(path.join(RootDirectory, "scripts", "khr-interactivity-assets.json"), "utf8"));
const RepositoryUrl = AssetManifest.repository;
const RepositoryRevision = AssetManifest.revision;
const CacheRoot = process.env.KHR_ASSETS_CACHE_DIR
    ? path.resolve(process.env.KHR_ASSETS_CACHE_DIR)
    : path.join(RootDirectory, "node_modules", ".cache", "khr-interactivity-assets");
const AssetDirectory = path.join(CacheRoot, RepositoryRevision);

// The currently-running child process and the in-progress staging directory, tracked so the signal
// handlers below can tear both down. CI sends SIGTERM/SIGINT on cancel or timeout; without this the
// script would die leaving orphaned children holding the dev-server port and stale `.tmp-*` dirs.
let ActiveChild = null;
let StagingDirectory = null;

function cleanup() {
    if (ActiveChild) {
        try {
            ActiveChild.kill("SIGTERM");
        } catch {
            // The child may already be gone; nothing to do.
        }
        ActiveChild = null;
    }
    if (StagingDirectory) {
        try {
            rmSync(StagingDirectory, { recursive: true, force: true });
        } catch {
            // Best-effort cleanup during shutdown.
        }
        StagingDirectory = null;
    }
}

for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        cleanup();
        // Re-raise with the default disposition so the exit code reflects the signal.
        process.exit(signal === "SIGINT" ? 130 : 143);
    });
}

async function run(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: RootDirectory,
        env: process.env,
        stdio: "inherit",
        ...options,
    });
    ActiveChild = child;
    await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (exitCode, signal) => {
            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} failed (${signal ?? `exit ${exitCode}`}).`));
            }
        });
    }).finally(() => {
        if (ActiveChild === child) {
            ActiveChild = null;
        }
    });
}

async function capture(command, args) {
    const child = spawn(command, args, {
        cwd: RootDirectory,
        env: process.env,
        stdio: ["ignore", "pipe", "inherit"],
    });
    ActiveChild = child;
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
        stdout += chunk;
    });
    await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (exitCode) => {
            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} failed with exit ${exitCode}.`));
            }
        });
    }).finally(() => {
        if (ActiveChild === child) {
            ActiveChild = null;
        }
    });
    return stdout.trim();
}

async function cacheIsValid() {
    if (!existsSync(path.join(AssetDirectory, ".git")) || !existsSync(path.join(AssetDirectory, "Tests", "Interactivity")) || !existsSync(path.join(AssetDirectory, "Models"))) {
        return false;
    }
    const revision = await capture("git", ["-C", AssetDirectory, "rev-parse", "HEAD"]);
    const status = await capture("git", ["-C", AssetDirectory, "status", "--porcelain"]);
    return revision === RepositoryRevision && status === "";
}

async function ensureAssets() {
    if (await cacheIsValid()) {
        console.log(`Using cached KHR_interactivity assets at ${AssetDirectory}`);
        return;
    }

    await mkdir(CacheRoot, { recursive: true });
    await rm(AssetDirectory, { recursive: true, force: true });
    const temporaryDirectory = `${AssetDirectory}.tmp-${process.pid}`;
    await rm(temporaryDirectory, { recursive: true, force: true });
    await mkdir(temporaryDirectory, { recursive: true });
    // Track the staging dir so the signal handlers can remove it, and use try/finally so it is also
    // cleaned up on the failure path (a failed fetch/checkout must not leave a stale `.tmp-*` behind).
    StagingDirectory = temporaryDirectory;
    try {
        await run("git", ["-C", temporaryDirectory, "init"]);
        await run("git", ["-C", temporaryDirectory, "remote", "add", "origin", RepositoryUrl]);
        await run("git", ["-C", temporaryDirectory, "fetch", "--depth", "1", "--filter=blob:none", "origin", RepositoryRevision]);
        await run("git", ["-C", temporaryDirectory, "sparse-checkout", "init", "--cone"]);
        await run("git", ["-C", temporaryDirectory, "sparse-checkout", "set", "Tests/Interactivity", "Models", "LICENSES"]);
        await run("git", ["-C", temporaryDirectory, "checkout", "--detach", "FETCH_HEAD"]);
        const revision = await capture("git", ["-C", temporaryDirectory, "rev-parse", "HEAD"]);
        if (revision !== RepositoryRevision) {
            throw new Error(`Expected KHR_interactivity assets ${RepositoryRevision}, got ${revision}.`);
        }
        await rename(temporaryDirectory, AssetDirectory);
    } catch (error) {
        await rm(temporaryDirectory, { recursive: true, force: true });
        throw error;
    } finally {
        StagingDirectory = null;
    }
    console.log(`Fetched KHR_interactivity assets ${RepositoryRevision} to ${AssetDirectory}`);
}

async function main() {
    await ensureAssets();
    const playwright = path.join(RootDirectory, "node_modules", "playwright", "cli.js");
    console.log(`Running pinned KHR_interactivity browser tests from ${AssetDirectory}`);
    await run(process.execPath, [playwright, "test", "--config=playwright.khr-interactivity.config.ts", ...process.argv.slice(2)], {
        env: {
            ...process.env,
            CDN_BASE_URL: "http://127.0.0.1:1337",
            CDN_PORT: "1337",
            KHR_ASSETS_REPO: AssetDirectory,
        },
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
