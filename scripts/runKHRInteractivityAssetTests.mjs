/* eslint-disable no-console */
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RepositoryUrl = "https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity.git";
const RepositoryRevision = "da6dd1fe5019aa5b1c09bb35205ad948ed4fb5de";
const RootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CacheRoot = path.join(RootDirectory, "node_modules", ".cache", "khr-interactivity-assets");
const AssetDirectory = path.join(CacheRoot, RepositoryRevision);

async function run(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: RootDirectory,
        env: process.env,
        stdio: "inherit",
        ...options,
    });
    await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (exitCode, signal) => {
            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`${command} ${args.join(" ")} failed (${signal ?? `exit ${exitCode}`}).`));
            }
        });
    });
}

async function capture(command, args) {
    const child = spawn(command, args, {
        cwd: RootDirectory,
        env: process.env,
        stdio: ["ignore", "pipe", "inherit"],
    });
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
