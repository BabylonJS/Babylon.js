const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const version = "9.33.1";
const releaseCommit = "c542f49e880526a9a09b850952c6a2332f26ed8c";
const baselineCommit = "87f2cd495ce016b39caa84bd00243311018086ed";
const encoderManifest = "packages/public/umd/babylonjs-ktx2encoder/package.json";
const allowedPackages = [
    "babylonjs-loaders",
    "babylonjs-materials",
    "babylonjs-node-editor",
    "babylonjs-node-geometry-editor",
    "babylonjs-node-particle-editor",
    "babylonjs-node-render-graph-editor",
    "babylonjs-post-process",
    "babylonjs-procedural-textures",
    "babylonjs-serializers",
];
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
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${requestedVersion}`, {
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

function checkPublished(manifest, name, integrity) {
    assert(manifest, `${name}@${version} is missing`);
    assert.equal(manifest.gitHead, releaseCommit, `Unexpected gitHead for ${name}@${version}`);
    if (integrity) {
        assert.equal(manifest.dist?.integrity, integrity, `Published bytes differ from the retained archive for ${name}`);
    }
}

function readPlan() {
    const plan = readJson(path.join(artifacts, "npm-plan.json"));
    assert.equal(plan.version, version);
    assert.equal(plan.releaseCommit, releaseCommit);
    assert.equal(new Set(plan.pending.map((pkg) => pkg.name)).size, plan.pending.length);
    const packages = publicPackages();
    for (const pkg of plan.pending) {
        assert(allowedPackages.includes(pkg.name), `Publishing ${pkg.name} is not allowed`);
        assert(packages.some((candidate) => candidate.name === pkg.name && candidate.directory === pkg.directory));
    }
    return plan;
}

async function main() {
    const action = process.argv[2];
    if (action === "checkout") {
        assert.equal(readJson(encoderManifest).private, true, "The repair branch must include the private flag");
        assert.equal(process.version, "v24.22.1");
        assert.equal(execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), "11.19.1");
        git("checkout", "--detach", releaseCommit);
        assert.equal(readJson("packages/public/umd/babylonjs/package.json").version, version);
        const encoder = readJson(encoderManifest);
        encoder.private = true;
        writeJson(encoderManifest, encoder);
        fs.mkdirSync(artifacts, { recursive: true });
        writeJson(path.join(artifacts, "source.json"), { version, releaseCommit, baselineCommit, node: process.version, npm: "11.19.1" });
        fs.copyFileSync(".build/release-notes.md", path.join(artifacts, "release-notes.md"));
        return;
    }

    assert.equal(git("rev-parse", "HEAD"), releaseCommit, "Recovery must use the exact original release commit");

    if (action === "plan") {
        const pending = [];
        for (const pkg of publicPackages()) {
            const published = await registry(pkg.name, version);
            if (published) {
                checkPublished(published, pkg.name);
            } else {
                assert(allowedPackages.includes(pkg.name), `Unexpected missing package ${pkg.name}; refusing to extend recovery`);
                assert(await registry(pkg.name, "9.33.0"), `Refusing to first-publish ${pkg.name}`);
                pending.push({ name: pkg.name, directory: pkg.directory });
            }
        }
        writeJson(path.join(artifacts, "npm-plan.json"), { version, releaseCommit, baselineCommit, pending });
        console.log(`Verified existing npm provenance; ${pending.length} established packages remain to publish.`);
    } else if (action === "pack") {
        const plan = readPlan();
        const directory = path.join(artifacts, "npm");
        fs.mkdirSync(directory, { recursive: true });
        for (const pkg of plan.pending) {
            const manifest = readJson(path.join(pkg.directory, "package.json"));
            for (const hook of ["prepublishOnly", "prepack", "prepare", "postpack", "publish", "postpublish"]) {
                assert(!manifest.scripts?.[hook], `Unexpected publication hook in ${pkg.name}: ${hook}`);
            }
            for (const file of [manifest.main, manifest.types]) {
                assert(file && fs.statSync(path.join(pkg.directory, file)).size > 0, `Missing build output for ${pkg.name}: ${file}`);
            }
            const [packed] = JSON.parse(execFileSync("npm", ["pack", "--workspace", pkg.name, "--json", "--pack-destination", directory], { encoding: "utf8" }));
            assert.equal(packed.name, pkg.name);
            assert.equal(packed.version, version);
            assert.equal(packed.filename, `${pkg.name}-${version}.tgz`);
            pkg.archive = packed.filename;
            pkg.integrity = packed.integrity;
        }
        writeJson(path.join(artifacts, "npm-plan.json"), plan);
    } else if (action === "publish") {
        const plan = readPlan();
        for (const pkg of plan.pending) {
            const archive = fs.readFileSync(path.join(artifacts, "npm", pkg.archive));
            const integrity = "sha512-" + crypto.createHash("sha512").update(archive).digest("base64");
            assert.equal(integrity, pkg.integrity, `Retained archive changed for ${pkg.name}`);
            let published = await registry(pkg.name, version);
            if (!published) {
                assert(await registry(pkg.name, "9.33.0"), `Refusing to first-publish ${pkg.name}`);
                // Directory publication preserves the original gitHead; verify its bytes against the retained pack.
                execFileSync("npm", ["publish", "--workspace", pkg.name, "--access=public", "--loglevel=error"], { stdio: "inherit" });
                for (let attempt = 0; attempt < 12; ++attempt) {
                    published = await registry(pkg.name, version);
                    if (published) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
            checkPublished(published, pkg.name, integrity);
            console.log(`Verified ${pkg.name}@${version}: original gitHead and retained archive integrity.`);
        }
    } else if (action === "verify-npm") {
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
        const semver = require(path.join(process.cwd(), "node_modules/semver"));
        if (semver.gte(currentVersion, version)) {
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
