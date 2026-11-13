import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "update-native-test-inputs.mjs");
const config = "packages/tools/tests/test/visualization/config.json";
const images = "packages/tools/tests/test/visualization/ReferenceImages";
const oldPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAB3RFWHRzb3VyY2UAOkK6dwAAABFJREFUeNpjbHBQ+M/AwMAAAAuNAeGk0TMYAAAAAElFTkSuQmCC", "base64");
const reencodedPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEHRFWHRzb3VyY2UAcmVlbmNvZGVkTvrLNQAAABFJREFUeAFjbHBQ+M/AwMAAAAuNAeFqrj01AAAAAElFTkSuQmCC",
    "base64"
);
const changedPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADHRFWHRzb3VyY2UAb3RoZXK20iDWAAAAEUlEQVR4AWOsd1D4z8DAwAAAC4UB4KwDQlAAAAAASUVORK5CYII=", "base64");
const nativePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGM0mib3P0qOiwEADUECaSbFfIgAAAAASUVORK5CYII=", "base64");

function fixture(t, before, after, native, oldImages, newImages, roots = {}) {
    const root = mkdtempSync(join(tmpdir(), "native-inputs-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const repo = join(root, "repo");
    const playground = join(root, "playground");
    mkdirSync(join(repo, images), { recursive: true });
    mkdirSync(join(repo, ".azure-pipelines", "scripts"), { recursive: true });
    mkdirSync(join(playground, "Scripts"), { recursive: true });
    mkdirSync(join(playground, "ReferenceImages"), { recursive: true });
    copyFileSync(script, join(repo, ".azure-pipelines", "scripts", "update-native-test-inputs.mjs"));
    copyFileSync(join(dirname(script), "compare-native-images.ps1"), join(repo, ".azure-pipelines", "scripts", "compare-native-images.ps1"));
    writeFileSync(join(repo, ".azure-pipelines", "scripts", "native-reference-overrides.json"), JSON.stringify(roots.referenceOverrides || {}));
    const git = (...args) =>
        execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
            cwd: repo,
            stdio: "pipe",
        });
    git("init");
    git("config", "core.autocrlf", "false");
    const saveConfig = (tests, root) => writeFileSync(join(repo, config), JSON.stringify({ root, tests }));
    const saveImages = (files, directory) => {
        for (const [name, data] of Object.entries(files)) {
            mkdirSync(dirname(join(directory, name)), { recursive: true });
            writeFileSync(join(directory, name), data);
        }
    };
    saveConfig(before, roots.previous);
    saveImages(oldImages, join(repo, images));
    git("add", ".");
    git("commit", "-m", "base");
    git("checkout", "-b", "feature");
    saveConfig(after, roots.current);
    saveImages(newImages, join(repo, images));
    git("add", ".");
    git("commit", "-m", "feature");
    git("checkout", "-");
    writeFileSync(join(repo, "target.txt"), "target");
    git("add", "target.txt");
    git("commit", "-m", "target");
    git("merge", "--no-ff", "feature", "-m", "merge");
    writeFileSync(join(playground, "Scripts", "config.json"), JSON.stringify({ root: roots.native, tests: native }));
    saveImages(oldImages, join(playground, "ReferenceImages"));
    return { root, repo, playground };
}

function run(repo, playground) {
    return spawnSync(process.execPath, [join(repo, ".azure-pipelines", "scripts", "update-native-test-inputs.mjs"), playground], { cwd: repo, encoding: "utf8" });
}

function nativeTests(playground) {
    return JSON.parse(readFileSync(join(playground, "Scripts", "config.json"), "utf8")).tests;
}

test("updates the test root unless Native overrides it", (t) => {
    for (const [nativeRoot, expectedRoot] of [
        ["old", "new"],
        ["native", "native"],
    ]) {
        const { repo, playground } = fixture(t, [], [], [], {}, {}, { previous: "old", current: "new", native: nativeRoot });
        const result = run(repo, playground);
        assert.equal(result.status, 0, result.stderr);
        const nativeConfig = JSON.parse(readFileSync(join(playground, "Scripts", "config.json"), "utf8"));
        assert.equal(nativeConfig.root, expectedRoot);
    }
});

test("updates matching tests without altering Native overrides or shared references", (t) => {
    const before = [{ title: "Shared Test", playgroundId: "#A#1", referenceImage: "shared.png", renderCount: 2, excludeFromAutomaticTesting: true }];
    const after = [
        { title: "Shared Test", playgroundId: "#A#2", referenceImage: "shared.png", renderCount: 3 },
        { title: "New test", playgroundId: "#B#0" },
    ];
    const native = [
        { ...before[0], renderCount: 9, workarounds: ["native"] },
        { title: "Shared Test", playgroundId: "#A#0", referenceImage: "shared.png" },
    ];
    const { repo, playground } = fixture(t, before, after, native, { "shared.png": "old" }, { "shared.png": "new" });
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    const [updated, original] = nativeTests(playground);
    assert.equal(updated.playgroundId, "#A#2");
    assert.equal(updated.renderCount, 9);
    assert.equal(updated.excludeFromAutomaticTesting, true);
    assert.deepEqual(updated.workarounds, ["native"]);
    assert.equal(original.playgroundId, "#A#0");
    assert.equal(original.referenceImage, "shared.png");
    assert.notEqual(updated.referenceImage, "shared.png");
    assert.equal(readFileSync(join(playground, "ReferenceImages", original.referenceImage), "utf8"), "old");
    assert.equal(readFileSync(join(playground, "ReferenceImages", updated.referenceImage), "utf8"), "new");
    assert.match(result.stderr, /New web test "New test" requires a Native suite entry/);
});

test("handles a renamed test and reference while preserving Native-only entries", (t) => {
    const before = [
        { title: "Old title", playgroundId: "#A#1" },
        { title: "Removed", playgroundId: "#B#1", referenceImage: "removed.png" },
    ];
    const after = [{ title: "New title", playgroundId: "#A#1", referenceImage: "new-reference.png" }];
    const native = [
        { ...before[0], referenceImage: "Old-title.png", excludedGraphicsApis: ["Vulkan"] },
        { ...before[1] },
        { title: "Removed", playgroundId: "#B#0", referenceImage: "removed.png" },
    ];
    const { repo, playground } = fixture(t, before, after, native, { "Old-title.png": "old", "removed.png": "removed" }, { "new-reference.png": "new" });
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    const tests = nativeTests(playground);
    assert.equal(tests.length, 2);
    assert.equal(tests[0].title, "New title");
    assert.equal(tests[0].referenceImage, "new-reference.png");
    assert.deepEqual(tests[0].excludedGraphicsApis, ["Vulkan"]);
    assert.equal(tests[1].playgroundId, "#B#0");
    assert.equal(readFileSync(join(playground, "ReferenceImages", "new-reference.png"), "utf8"), "new");
});

test("renames a test and updates its Playground revision without losing Native overrides", (t) => {
    const before = [{ title: "Old title", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ title: "New title", playgroundId: "#A#2", referenceImage: "test.png" }];
    const native = [{ ...before[0], workarounds: ["native"] }];
    const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(nativeTests(playground), [{ ...after[0], workarounds: ["native"] }]);
});

test("rejects a rename that collides with a Native-only test identity", (t) => {
    const before = [{ title: "Old title", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], title: "New title" }];
    const native = [before[0], { ...after[0], workarounds: ["native"] }];
    const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Ambiguous Native test/);
    assert.deepEqual(nativeTests(playground), native);
});

test("rejects a source update that collides with a Native-only test identity", (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const native = [before[0], { ...after[0], workarounds: ["native"] }];
    const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Ambiguous Native test/);
    assert.deepEqual(nativeTests(playground), native);
});

for (const source of [
    { sceneFolder: "scenes/", sceneFilename: "one.babylon" },
    { scriptToRun: "scripts/scene.js", functionToCall: "createScene" },
]) {
    test(`renames a ${source.sceneFolder ? "scene" : "script"} test without losing Native overrides`, (t) => {
        const before = [{ title: "Old title", ...source, referenceImage: "test.png" }];
        const after = [{ title: "New title", ...source, referenceImage: "test.png" }];
        const native = [{ ...before[0], workarounds: ["native"] }];
        const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
        const result = run(repo, playground);
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(nativeTests(playground), [{ ...after[0], workarounds: ["native"] }]);
    });
}

test("rejects ambiguous Playground renames instead of losing Native tests", (t) => {
    const before = [
        { title: "First variant", playgroundId: "#A#1", referenceImage: "test.png" },
        { title: "Second variant", playgroundId: "#A#2", referenceImage: "test.png" },
    ];
    const after = [{ title: "New title", playgroundId: "#A#3", referenceImage: "test.png" }];
    const { repo, playground } = fixture(t, before, after, before, { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ambiguous/i);
    assert.deepEqual(nativeTests(playground), before);
});

for (const [source, otherSource, update] of [
    [{ sceneFolder: "scenes/", sceneFilename: "one.babylon" }, { sceneFolder: "scenes/", sceneFilename: "other.babylon" }, true],
    [{ scriptToRun: "scripts/scene.js", functionToCall: "createScene" }, { scriptToRun: "scripts/other.js", functionToCall: "createScene" }, false],
]) {
    test(`rejects a matching title with a different ${source.sceneFolder ? "scene" : "script"} source`, (t) => {
        const before = [{ title: "Shared title", ...source, referenceImage: "test.png" }];
        const native = [{ title: "Shared title", ...otherSource, referenceImage: "test.png" }];
        const after = update ? [{ ...before[0], renderCount: 2 }] : [];
        const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
        const result = run(repo, playground);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /does not match/);
        assert.deepEqual(nativeTests(playground), native);
    });
}

test("preserves a recorded Native reference override when the web image changes", { skip: process.platform !== "win32" }, (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const referenceOverrides = { "test.png": { sha256: createHash("sha256").update(nativePng).digest("hex") } };
    const { repo, playground } = fixture(t, before, after, before, { "test.png": oldPng }, { "test.png": changedPng }, { referenceOverrides });
    writeFileSync(join(playground, "ReferenceImages", "test.png"), nativePng);
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readFileSync(join(playground, "ReferenceImages", "test.png")), nativePng);
    assert.deepEqual(nativeTests(playground), after);
});

test("rejects a Native reference that differs from its recorded override", { skip: process.platform !== "win32" }, (t) => {
    const tests = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const referenceOverrides = { "test.png": { sha256: createHash("sha256").update(nativePng).digest("hex") } };
    const { repo, playground } = fixture(t, tests, tests, tests, { "test.png": oldPng }, { "test.png": reencodedPng }, { referenceOverrides });
    writeFileSync(join(playground, "ReferenceImages", "test.png"), changedPng);
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /differs from both pull-request versions/);
    assert.deepEqual(readFileSync(join(playground, "ReferenceImages", "test.png")), changedPng);
});

test("rejects conflicting Native references before writing any inputs", { skip: process.platform !== "win32" }, (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const { repo, playground } = fixture(t, before, after, before, { "test.png": oldPng }, { "test.png": reencodedPng });
    const configPath = join(playground, "Scripts", "config.json");
    const originalConfig = readFileSync(configPath);
    writeFileSync(join(playground, "ReferenceImages", "test.png"), changedPng);
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /differs from both pull-request versions/);
    assert.deepEqual(readFileSync(configPath), originalConfig);
    assert.deepEqual(readFileSync(join(playground, "ReferenceImages", "test.png")), changedPng);
});

test("compares Native reference pixels rather than PNG encoding", { skip: process.platform !== "win32" }, (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const { repo, playground } = fixture(t, before, before, before, { "test.png": oldPng }, { "test.png": changedPng });
    writeFileSync(join(playground, "ReferenceImages", "test.png"), reencodedPng);
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readFileSync(join(playground, "ReferenceImages", "test.png")), changedPng);
});

test("ignores reference changes in WebGPU subdirectories", (t) => {
    const tests = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const { repo, playground } = fixture(t, tests, tests, tests, { "test.png": "old" }, { "webgpu/test.png": "webgpu" });
    writeFileSync(join(playground, "ReferenceImages", "test.png"), "native override");
    const result = run(repo, playground);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(playground, "ReferenceImages", "test.png"), "utf8"), "native override");
    assert.doesNotMatch(result.stdout, /Updated Native reference/);
});

test("rejects ambiguous duplicate identities", (t) => {
    const before = [{ title: "Duplicate", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const { repo, playground } = fixture(t, before, after, [before[0], before[0]], { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Ambiguous Native test/);
});

test("rejects changes when the Native test is older than the pull-request base", (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const native = [{ ...before[0], playgroundId: "#A#0" }];
    const { repo, playground } = fixture(t, before, after, native, { "test.png": "old" }, {});
    const result = run(repo, playground);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match the pull-request base/);
    assert.equal(nativeTests(playground)[0].playgroundId, "#A#0");
});

test("works with a depth-two checkout of the merge commit", (t) => {
    const before = [{ title: "Test", playgroundId: "#A#1", referenceImage: "test.png" }];
    const after = [{ ...before[0], playgroundId: "#A#2" }];
    const { root, repo, playground } = fixture(t, before, after, before, { "test.png": "old" }, {});
    const shallow = resolve(root, "shallow");
    execFileSync("git", ["clone", "--no-local", "--depth", "2", repo, shallow], { stdio: "pipe" });
    const result = run(shallow, playground);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(nativeTests(playground)[0].playgroundId, "#A#2");
});
