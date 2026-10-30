const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const version = "9.33.1";
const releaseCommit = "c542f49e880526a9a09b850952c6a2332f26ed8c";
const baselineCommit = "87f2cd495ce016b39caa84bd00243311018086ed";
const encoderManifest = "packages/public/umd/babylonjs-ktx2encoder/package.json";
const artifacts = process.env.ARTIFACT_DIRECTORY;
assert(artifacts && path.isAbsolute(artifacts), "ARTIFACT_DIRECTORY must be absolute");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 4) + "\n");
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

function publicPackages() {
    const packages = Object.keys(readJson("package-lock.json").packages)
        .filter((directory) => directory.startsWith("packages/public/") && !directory.includes("/node_modules/"))
        .map((directory) => ({ directory, ...readJson(path.join(directory, "package.json")) }))
        .filter((pkg) => pkg.private !== true);
    assert.equal(packages.length, 40, "Unexpected public package inventory");
    assert.equal(new Set(packages.map((pkg) => pkg.name)).size, 40, "Duplicate public package names");
    assert.equal(readJson(encoderManifest).private, true, "The UMD encoder must remain private");
    for (const pkg of packages) {
        assert.equal(pkg.version, version, `Unexpected version for ${pkg.name}`);
    }
    return packages;
}

async function registry(name, requestedVersion) {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${requestedVersion}?recovery=${crypto.randomUUID()}`, {
        signal: AbortSignal.timeout(30000),
        headers: { "Cache-Control": "no-cache" },
    });
    if (response.status === 404) {
        return null;
    }
    assert(response.ok, `Registry lookup failed for ${name}@${requestedVersion}: HTTP ${response.status}`);
    const manifest = await response.json();
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, requestedVersion);
    return manifest;
}

function checkPublished(manifest, name) {
    assert(manifest, `${name}@${version} is missing`);
    assert.equal(manifest.gitHead, releaseCommit, `Unexpected gitHead for ${name}@${version}`);
}

async function main() {
    const action = process.argv[2];
    if (action === "checkout") {
        assert.equal(readJson(encoderManifest).private, true, "The repair branch must include the private flag");
        assert.equal(process.version, "v24.22.1");
        assert.equal(execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), "11.19.1");
        assert.deepEqual(
            readJson(path.join(artifacts, "source.json")),
            { version, releaseCommit, baselineCommit, node: process.version, npm: "11.19.1" },
            "Unexpected retained recovery source"
        );
        git("checkout", "--detach", releaseCommit);
        assert.equal(readJson("packages/public/umd/babylonjs/package.json").version, version);
        const encoder = readJson(encoderManifest);
        encoder.private = true;
        writeJson(encoderManifest, encoder);
        return;
    }

    assert.equal(git("rev-parse", "HEAD"), releaseCommit, "Recovery must use the exact original release commit");

    if (action === "verify-npm") {
        for (const pkg of publicPackages()) {
            checkPublished(await registry(pkg.name, version), pkg.name);
        }
        console.log("All 40 intended public packages have the original 9.33.1 gitHead.");
    } else if (action === "baseline") {
        const directory = process.env.BASELINE_DIRECTORY;
        assert(directory && path.isAbsolute(directory), "BASELINE_DIRECTORY must be absolute");
        git("fetch", "--no-tags", "origin", "master");
        git("worktree", "add", "--detach", directory, "origin/master");
        const currentVersion = readJson(path.join(directory, "packages/public/umd/babylonjs/package.json")).version;
        assert(/^\d+\.\d+\.\d+$/.test(currentVersion), "Unexpected master version format");
        const currentParts = currentVersion.split(".").map(Number);
        const releaseParts = version.split(".").map(Number);
        const changedPart = currentParts.findIndex((part, index) => part !== releaseParts[index]);
        if (changedPart === -1 || currentParts[changedPart] > releaseParts[changedPart]) {
            console.log(`Master is already at ${currentVersion}; no baseline change is needed.`);
            return;
        }
        assert.equal(currentVersion, "9.33.0", "Unexpected master version baseline");
        const message =
            "Restore the 9.33.1 release baseline\n\n" +
            "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n" +
            "Copilot-Session: 1c2a2e91-d314-4a34-8f57-c4889822045f";
        git("-C", directory, "merge", "--no-edit", "-m", message, baselineCommit);
        assert.equal(readJson(path.join(directory, "packages/public/umd/babylonjs/package.json")).version, version);
        assert.equal(readJson(path.join(directory, encoderManifest)).private, true);
        assert.equal(git("-C", directory, "diff", "origin/master", "--", ".azure-pipelines"), "", "Never merge the temporary pipeline into master");
        git("-C", directory, "push", "origin", "HEAD:refs/heads/master");
        git("fetch", "--no-tags", "origin", "master");
        git("merge-base", "--is-ancestor", baselineCommit, "origin/master");
        console.log("Confirmed master contains the clean 9.33.1 baseline without the temporary pipeline.");
    } else {
        throw new Error(`Unknown recovery action: ${action}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
