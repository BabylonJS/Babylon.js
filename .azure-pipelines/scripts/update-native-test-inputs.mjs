import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const configPath = "packages/tools/tests/test/visualization/config.json";
const imagesPath = "packages/tools/tests/test/visualization/ReferenceImages";
const nativeDirectory = process.argv[2];

if (!nativeDirectory) {
    throw new Error("Usage: node update-native-test-inputs.mjs <native-playground-directory>");
}

function git(...args) {
    return execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024 });
}

function testsByTitle(tests, source) {
    const result = new Map();
    for (const test of tests) {
        if (!test.title || result.has(test.title)) {
            throw new Error(`${source} has a missing or duplicate test title: "${test.title}"`);
        }
        result.set(test.title, test);
    }
    return result;
}

function referenceName(test) {
    const name = (test.referenceImage || test.title).replace(".png", "");
    // Match Playwright's screenshot filename sanitization.
    // eslint-disable-next-line no-control-regex
    return `${name.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-")}.png`;
}

function sameImage(bytes, path) {
    if (bytes.equals(readFileSync(path))) {
        return true;
    }
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "native-reference-"));
    try {
        const previousImage = join(temporaryDirectory, "previous.png");
        writeFileSync(previousImage, bytes);
        const comparator = join(dirname(fileURLToPath(import.meta.url)), "compare-native-images.ps1");
        const result = spawnSync("pwsh", ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", comparator, previousImage, path], { encoding: "utf8" });
        if (result.error || result.status === null || (result.status !== 0 && result.status !== 1) || result.stderr) {
            throw new Error(`Could not compare Native reference "${path}": ${result.error || result.stderr || `exit ${result.status}`}`);
        }
        return result.status === 0;
    } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}

const parents = git("rev-list", "--parents", "-n", "1", "HEAD").toString().trim().split(" ");
if (parents.length !== 3) {
    throw new Error("Native pull-request inputs require a merge commit with two parents");
}
const base = parents[1];
const previous = JSON.parse(git("show", `${base}:${configPath}`).toString());
const current = JSON.parse(readFileSync(configPath, "utf8"));
const nativeConfigPath = join(nativeDirectory, "Scripts", "config.json");
const native = JSON.parse(readFileSync(nativeConfigPath, "utf8"));
const oldTests = testsByTitle(previous.tests, "Pull-request base");
const newTests = testsByTitle(current.tests, "Pull-request checkout");
if (previous.root !== current.root) {
    if (native.root === previous.root) {
        native.root = current.root;
        console.log("Updated Native test root");
    } else {
        console.warn("Keeping Native-specific test root");
    }
}
const fields = [
    "playgroundId",
    "sceneFolder",
    "sceneFilename",
    "scriptToRun",
    "functionToCall",
    "replace",
    "replaceUrl",
    "rootPath",
    "specificRoot",
    "renderCount",
    "threshold",
    "errorRatio",
    "canvasBackgroundColor",
    "useLargeWorldRendering",
    "useHighPrecisionMatrix",
    "requiresHavok",
    "onlyVisual",
    "excludeFromAutomaticTesting",
];
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const changedImages = new Set(
    git("diff", "--name-only", "-z", "--no-renames", base, "HEAD", "--", imagesPath)
        .toString()
        .split("\0")
        .filter((path) => path.startsWith(`${imagesPath}/`) && !path.slice(imagesPath.length + 1).includes("/"))
        .map((path) => path.slice(imagesPath.length + 1))
);
const removed = new Set();
const references = [];
const pairedNewTitles = new Set();

for (const oldTest of previous.tests) {
    let newTest = newTests.get(oldTest.title);
    if (!newTest && oldTest.playgroundId) {
        const oldWithId = previous.tests.filter((test) => test.playgroundId === oldTest.playgroundId);
        const renamed = current.tests.filter((test) => test.playgroundId === oldTest.playgroundId && !oldTests.has(test.title));
        if (oldWithId.length === 1 && renamed.length === 1) {
            newTest = renamed[0];
        }
    }
    if (newTest) {
        pairedNewTitles.add(newTest.title);
    }

    const oldReference = referenceName(oldTest);
    const newReference = newTest && referenceName(newTest);
    const referenceChanged = newTest && (oldReference !== newReference || changedImages.has(newReference));
    const configChanged = !newTest || oldTest.title !== newTest.title || fields.some((field) => !same(oldTest[field], newTest[field]));
    if (!configChanged && !referenceChanged) {
        continue;
    }

    const candidates = native.tests.filter((test) => test.title === oldTest.title);
    const matches = candidates.filter((test) => same(test.playgroundId, oldTest.playgroundId));
    if (matches.length > 1) {
        throw new Error(`Ambiguous Native test "${oldTest.title}" with Playground ID "${oldTest.playgroundId}"`);
    }
    if (!matches.length) {
        if (candidates.length) {
            throw new Error(`Native test "${oldTest.title}" does not match the pull-request base; update the Native artifact before applying its changes`);
        }
        console.warn(`No matching Native test for "${oldTest.title}"; preserving the curated Native suite`);
        continue;
    }

    const test = matches[0];
    if (!newTest) {
        removed.add(test);
        console.log(`Removed Native test "${test.title}"`);
        continue;
    }
    if (oldTest.title !== newTest.title) {
        test.title = newTest.title;
    }
    for (const field of fields) {
        if (same(oldTest[field], newTest[field])) {
            continue;
        }
        if ((field === "onlyVisual" || field === "excludeFromAutomaticTesting") && test[field]) {
            console.warn(`Keeping Native-specific ${field} for "${test.title}"`);
            continue;
        }
        if (!same(test[field], oldTest[field])) {
            console.warn(`Keeping Native-specific ${field} for "${test.title}"`);
            continue;
        }
        if (newTest[field] === undefined) {
            delete test[field];
        } else {
            test[field] = newTest[field];
        }
        console.log(`Updated ${field} for "${test.title}"`);
    }
    if (referenceChanged) {
        if (test.referenceImage !== oldReference) {
            console.warn(`Keeping Native-specific reference for "${test.title}"`);
            continue;
        }
        const oldImage = git("show", `${base}:${imagesPath}/${oldReference}`);
        const newImage = readFileSync(join(imagesPath, newReference));
        const existingImagePath = join(nativeDirectory, "ReferenceImages", oldReference);
        if (!sameImage(oldImage, existingImagePath) && !(oldReference === newReference && sameImage(newImage, existingImagePath))) {
            throw new Error(`Native reference "${oldReference}" differs from both pull-request versions`);
        }
        references.push({ test, name: newReference, data: newImage });
    }
}

for (const test of current.tests) {
    if (!pairedNewTitles.has(test.title)) {
        console.warn(`New web test "${test.title}" requires a Native suite entry before it can run in Native CI`);
    }
}
native.tests = native.tests.filter((test) => !removed.has(test));

const pendingImages = new Map();
for (const reference of references) {
    let name = reference.name;
    const path = join(nativeDirectory, "ReferenceImages", name);
    const existing = existsSync(path) ? readFileSync(path) : undefined;
    const protectedUse = native.tests.some((test) => test.referenceImage === name && !references.some((item) => item.test === test && item.name === name));
    if (existing && !existing.equals(reference.data) && protectedUse) {
        const stem = name.slice(0, -4);
        let suffix = 1;
        do {
            name = `${stem}-pull-request-${suffix++}.png`;
        } while (existsSync(join(nativeDirectory, "ReferenceImages", name)) || pendingImages.has(name));
    }
    const pending = pendingImages.get(name);
    if (pending && !pending.equals(reference.data)) {
        throw new Error(`Conflicting pull-request references for "${name}"`);
    }
    pendingImages.set(name, reference.data);
    reference.test.referenceImage = name;
}

for (const [name, data] of pendingImages) {
    writeFileSync(join(nativeDirectory, "ReferenceImages", name), data);
    console.log(`Updated Native reference "${name}"`);
}
writeFileSync(nativeConfigPath, `${JSON.stringify(native, null, 4)}\n`);
