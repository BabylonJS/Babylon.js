import { test, expect, devices, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { FlowGraphEditorPage } from "./fge.utils";

const AudioFixtures = "packages/tools/flowGraphEditor/test/fixtures/audio/";

async function ChooseBalls(page: Page, nodes: number[] = [3, 4, 5]) {
    await page.getByRole("combobox", { name: "Contact balls", exact: true }).click();
    for (const node of nodes) {
        await page.getByRole("menuitemcheckbox", { name: new RegExp(`Sphere-${node - 2} \\(glTF node ${node}, sphere\\)`) }).click();
    }
    await page.keyboard.press("Escape");
}

async function ChoosePlatforms(page: Page) {
    await page.getByRole("combobox", { name: "Contact with", exact: true }).click();
    await page.getByRole("option", { name: "Other objects", exact: true }).click();
    await page.getByRole("combobox", { name: "Contact partners", exact: true }).click();
    for (let node = 7; node <= 16; node++) {
        await page.getByRole("menuitemcheckbox", { name: new RegExp(`Cube-${node - 6} \\(glTF node ${node}, box bounds\\)`) }).click();
    }
    await page.keyboard.press("Escape");
}

test("saves two different encoded impact sounds and reopens the playable PhysicsMath scene", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    const original = readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.gltf", "utf8");
    for (const [file, platforms] of [
        ["tap.ogg", false],
        ["tap.mp3", true],
    ] as const) {
        await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
        await ChooseBalls(page);
        if (platforms) {
            await ChoosePlatforms(page);
        }
        await page.getByLabel("Choose audio file", { exact: true }).setInputFiles(AudioFixtures + file);
        await expect(page.getByRole("combobox", { name: "Contact sound", exact: true })).toHaveText(new RegExp(file.replace(".", "\\.")));
        await expect(page.getByRole("button", { name: "Save sound reaction", exact: true })).toBeEnabled();
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
        const download = await downloadPromise;
        const saved = readFileSync((await download.path())!, "utf8");
        const document = JSON.parse(saved);
        const source = JSON.parse(original);
        delete document.extras?.babylonContactAudio;
        if (!source.extras && !Object.keys(document.extras ?? {}).length) {
            delete document.extras;
        }
        expect(document, "every unrelated source field is retained").toEqual(source);
        const audio = JSON.parse(saved).extras.babylonContactAudio;
        const imported = audio.audio.find((asset: any) => asset.name === file);
        expect(Buffer.from(imported.uri.split(",")[1], "base64")).toEqual(readFileSync(AudioFixtures + file));
        if (platforms) {
            expect(audio.rules).toHaveLength(2);
            const sourceBytes = Array.from(Buffer.from(saved));
            const binBytes = Array.from(readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.bin"));
            await page.evaluate(
                ({ json, bin }) => {
                    const transfer = new DataTransfer();
                    transfer.items.add(new File([new Uint8Array(json)], "reopened.gltf"));
                    transfer.items.add(new File([new Uint8Array(bin)], "PhysicsMath.bin"));
                    (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                },
                { json: sourceBytes, bin: binBytes }
            );
            await expect
                .poll(async () => page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sourceGltf?.file.name), { timeout: 30000 })
                .toBe("reopened.gltf");
        }
        await expect(page.getByRole("button", { name: "Enable sound", exact: true })).toBeEnabled({ timeout: 30000 });
    }
    await page.getByRole("button", { name: "Enable sound", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sound enabled", exact: true })).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
        (globalThis as any).__contactCues = [];
        (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.contactAudioRuntime.onCueObservable.add((event: any) =>
            (globalThis as any).__contactCues.push({ cue: event.cue, nodes: event.nodes, point: event.point.asArray() })
        );
    });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect
        .poll(async () => page.evaluate(() => (globalThis as any).__contactCues.filter((event: any) => event.nodes.some((node: number) => node >= 7 && node <= 16)).length), {
            timeout: 20000,
        })
        .toBeGreaterThan(0);
    const visiblePixels = await page.evaluate(async () => {
        const engine = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.engine;
        const pixels = new Uint8Array((await engine.readPixels(0, 0, engine.getRenderWidth(), engine.getRenderHeight())).buffer);
        let foreground = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            if (Math.abs(pixels[i] - pixels[0]) + Math.abs(pixels[i + 1] - pixels[1]) + Math.abs(pixels[i + 2] - pixels[2]) > 30) {
                foreground++;
            }
        }
        return foreground;
    });
    expect(visiblePixels, "source reloads must retain visible scene geometry, beyond isolated debug points").toBeGreaterThan(200);
    await page.screenshot({ path: testInfo.outputPath("contact-audio-playing.png"), fullPage: true });
    const pairPlayback = await page.evaluate(() => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        const meshes = state.sceneContext.meshes;
        const byNode = (index: number) => meshes.find((mesh: any) => mesh._internalMetadata?.gltf?.pointers?.includes(`/nodes/${index}`));
        byNode(3).position.set(0, 300, 0);
        byNode(4).position.set(3, 300, 0);
        byNode(5).position.set(100, 300, 0);
        state.sceneContext.scene.onAfterRenderObservable.notifyObservers(state.sceneContext.scene);
        byNode(4).position.set(1, 300, 0);
        const before = (globalThis as any).__contactCues.length;
        state.sceneContext.scene.onAfterRenderObservable.notifyObservers(state.sceneContext.scene);
        const cue = state.contactAudioData.rules[0].cue;
        const voices = state.contactAudioRuntime._voices.get(cue);
        const playing = voices.filter((voice: any) => voice.activeInstancesCount > 0).map((voice: any) => voice.spatial.position.asArray());
        state.sceneContext.scene.onAfterRenderObservable.notifyObservers(state.sceneContext.scene);
        return { playing, newCues: (globalThis as any).__contactCues.slice(before), ready: state.contactAudioRuntime.ready };
    });
    expect(pairPlayback.ready).toBe(true);
    expect(pairPlayback.newCues).toHaveLength(1);
    expect(pairPlayback.newCues[0].nodes).toEqual([3, 4]);
    expect(pairPlayback.playing).toEqual([pairPlayback.newCues[0].point]);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    const count = await page.evaluate(() => (globalThis as any).__contactCues.length);
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect.poll(async () => page.evaluate(() => (globalThis as any).__contactCues.length)).toBe(count);
    expect(errors).toEqual([]);
});

for (const aacUnavailable of [false, true]) {
    test(`reports invalid and long audio without changing the scene (${aacUnavailable ? "unavailable AAC" : "native codecs"})`, async ({ page }) => {
        test.setTimeout(60000);
        if (aacUnavailable) {
            await page.addInitScript(() => {
                const NativeAudio = window.Audio;
                const setSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src")!.set!;
                (window as any).Audio = function () {
                    const element = new NativeAudio();
                    const canPlayType = element.canPlayType.bind(element);
                    element.canPlayType = (type) => (type.includes("mp4") ? "" : canPlayType(type));
                    Object.defineProperty(element, "src", {
                        set(value: string) {
                            void fetch(value)
                                .then((response) => response.blob())
                                .then((blob) => {
                                    if (blob.type === "audio/mp4") {
                                        element.dispatchEvent(new Event("error"));
                                    } else {
                                        setSrc.call(element, value);
                                    }
                                });
                        },
                    });
                    return element;
                };
            });
        }
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
        await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
        const identity = await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid);
        await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
        const picker = page.getByLabel("Choose audio file", { exact: true });
        await picker.setInputFiles({ name: "fake.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("not audio") });
        await expect(page.getByRole("alert")).toContainText("file contents do not match");
        await picker.setInputFiles(AudioFixtures + "too-long.mp3");
        await expect(page.getByRole("alert")).toContainText("30 seconds or less");
        const canReadAAC = await page.evaluate(() => new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "");
        await picker.setInputFiles(AudioFixtures + "tap.m4a");
        const sound = page.getByRole("combobox", { name: "Contact sound", exact: true });
        if (canReadAAC) {
            await expect(sound).toHaveText(/tap.m4a/);
        } else {
            await expect(page.getByRole("alert")).toContainText("This browser cannot decode this audio file");
            await expect(sound).not.toHaveText(/tap.m4a/);
            expect(await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid)).toBe(identity);
            // Keep the real audition and cleanup assertions active when this browser lacks AAC.
            await picker.setInputFiles(AudioFixtures + "tap.mp3");
            await expect(sound).toHaveText(/tap.mp3/);
        }
        await page.getByRole("button", { name: "Listen", exact: true }).click();
        await expect(page.getByRole("button", { name: "Listen", exact: true })).toBeEnabled();
        await expect(page.getByRole("alert")).not.toBeVisible();
        await page.evaluate(() => {
            (globalThis as any).__auditionDisposed = false;
            const runtime = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.contactAudioRuntime;
            const voice = runtime._audition ?? runtime._voices.get("audition")?.[0];
            voice.onDisposeObservable.add(() => ((globalThis as any).__auditionDisposed = true));
        });
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        expect(await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.uid)).toBe(identity);
        expect(await page.evaluate(() => (globalThis as any).__auditionDisposed), "closing the chooser must release its audition voice").toBe(true);
        expect(
            await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.contactAudioRuntime._buffers.size),
            "canceled clips must not consume the preview budget"
        ).toBe(0);
    });
}

test("supports choosing contact sounds on a touch viewport", async ({ browser }, testInfo) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ ...devices["iPhone 13"], isMobile: browser.browserType().name() !== "firefox", defaultBrowserType: undefined });
    const page = await context.newPage();
    try {
        const fge = new FlowGraphEditorPage(page);
        await fge.goto({ local: true });
        await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).tap();
        await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
        await page.getByRole("button", { name: "Add sound reaction", exact: true }).tap();
        await ChooseBalls(page, [3, 4]);
        await page.getByLabel("Choose audio file", { exact: true }).setInputFiles(AudioFixtures + "tap.ogg");
        await expect(page.getByRole("combobox", { name: "Contact sound", exact: true })).toHaveText(/tap.ogg/);
        const surface = await page.getByRole("dialog", { name: "Add sound reaction" }).boundingBox();
        const save = await page.getByRole("button", { name: "Save sound reaction", exact: true }).boundingBox();
        expect(save!.y + save!.height, "the full save button remains inside the touch dialog").toBeLessThanOrEqual(surface!.y + surface!.height - 8);
        await page.screenshot({ path: testInfo.outputPath("contact-audio-touch.png"), fullPage: true });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "Save sound reaction", exact: true }).tap();
        await download;
        await page.getByRole("button", { name: "Enable sound", exact: true }).tap();
        await expect(page.getByRole("button", { name: "Sound enabled", exact: true })).toBeVisible();
    } finally {
        await context.close();
    }
});

test("preserves source GLB chunks and graph edits while editing and removing a sound reaction", async ({ page }) => {
    test.setTimeout(90000);
    const source = JSON.parse(readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.gltf", "utf8"));
    // Use a current-spec graph here; the unchanged public demo is a compatibility import.
    source.extensions.KHR_interactivity = { graphs: [{ name: "Contact fixture", declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }] };
    delete source.buffers[0].uri;
    source.extras = { stableId: "physics-demo-7", preciseId: "9007199254740993" };
    const json = Buffer.from(JSON.stringify(source));
    const jsonLength = Math.ceil(json.length / 4) * 4;
    const bin = readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.bin");
    const glb = Buffer.alloc(20 + jsonLength + 8 + bin.length + 12, 32);
    glb.writeUInt32LE(0x46546c67, 0);
    glb.writeUInt32LE(2, 4);
    glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(jsonLength, 12);
    glb.writeUInt32LE(0x4e4f534a, 16);
    json.copy(glb, 20);
    glb.writeUInt32LE(bin.length, 20 + jsonLength);
    glb.writeUInt32LE(0x004e4942, 24 + jsonLength);
    bin.copy(glb, 28 + jsonLength);
    glb.writeUInt32LE(4, 28 + jsonLength + bin.length);
    glb.writeUInt32LE(0x12345678, 32 + jsonLength + bin.length);
    glb.set([9, 8, 7, 6], 36 + jsonLength + bin.length);
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await fge.assertEditorReady();
    await expect(page.getByRole("button", { name: "Load PhysicsMath demo", exact: true })).toBeEnabled();
    await page.evaluate(
        (bytes) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([new Uint8Array(bytes)], "physics.glb"));
            (document.querySelector("canvas") ?? document.body).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        },
        [...glb]
    );
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await ChooseBalls(page, [3, 4]);
    const first = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
    const firstBytes = readFileSync((await (await first).path())!);
    const firstDoc = JSON.parse(firstBytes.subarray(20, 20 + firstBytes.readUInt32LE(12)).toString());
    expect(firstBytes.subarray(20 + firstBytes.readUInt32LE(12))).toEqual(glb.subarray(20 + jsonLength));
    const cue = firstDoc.extras.babylonContactAudio.rules[0].cue;
    await page.evaluate(() => {
        (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.flowGraph.name = "Edited physics behavior";
    });
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await page.getByRole("combobox", { name: "Sound reaction", exact: true }).click();
    await page.getByRole("option", { name: /Soft tap: 2 balls/ }).click();
    await page.getByRole("combobox", { name: "Contact sound", exact: true }).click();
    await page.getByRole("option", { name: /Bright click/ }).click();
    const second = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
    const secondBytes = readFileSync((await (await second).path())!);
    const secondDoc = JSON.parse(secondBytes.subarray(20, 20 + secondBytes.readUInt32LE(12)).toString());
    expect(secondDoc.extensions.KHR_interactivity.graphs[0].name, "sound authoring must include the user's graph edit").toBe("Edited physics behavior");
    expect(secondDoc.extras.babylonContactAudio.rules).toHaveLength(1);
    expect(secondDoc.extras.babylonContactAudio.rules[0].cue).toBe(cue);
    expect(secondDoc.extras.babylonContactAudio.audio).toHaveLength(1);
    expect(secondDoc.extras.babylonContactAudio.audio[0].name).toBe("Bright click");
    expect(secondDoc.nodes).toEqual(source.nodes);
    expect(secondDoc.extras.stableId).toBe("physics-demo-7");
    expect(secondBytes.subarray(20 + secondBytes.readUInt32LE(12))).toEqual(glb.subarray(20 + jsonLength));
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await page.getByRole("combobox", { name: "Sound reaction", exact: true }).click();
    await page.getByRole("option", { name: /Bright click: 2 balls/ }).click();
    const removed = page.waitForEvent("download");
    await page.getByRole("button", { name: "Remove reaction", exact: true }).click();
    const removedBytes = readFileSync((await (await removed).path())!);
    const removedDoc = JSON.parse(removedBytes.subarray(20, 20 + removedBytes.readUInt32LE(12)).toString());
    expect(removedDoc.extras.babylonContactAudio.audio).toHaveLength(0);
    expect(removedDoc.extras.babylonContactAudio.rules).toHaveLength(0);
    await expect(page.getByRole("button", { name: "Enable sound", exact: true })).not.toBeVisible();
});

test("opens the PhysicsMath contact sound chooser with source-indexed balls and platforms", async ({ page }, testInfo) => {
    test.setTimeout(60000);
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    const canvas = await page.getByTestId("scene-preview-canvas").boundingBox();
    expect(canvas?.height, "the contact authoring toolbar must leave a usable scene viewport").toBeGreaterThan(100);
    expect(
        await page.evaluate(() => !!(globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.environmentTexture),
        "the metallic PhysicsMath sample needs visible preview lighting"
    ).toBe(true);
    expect(
        await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.activeCamera.radius),
        "rigid contact targets must be framed rather than the sample's huge debug geometry"
    ).toBeLessThan(100);
    expect(
        await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene.activeCamera.minZ),
        "the demo's debug geometry must not leave a near plane that clips contact objects"
    ).toBeLessThanOrEqual(0.1);
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await page.getByRole("combobox", { name: "Contact balls", exact: true }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: /Sphere-1 \(glTF node 3, sphere\)/ })).toBeVisible();
    await page.getByRole("menuitemcheckbox", { name: /Sphere-1 \(glTF node 3, sphere\)/ }).click();
    await page.getByRole("menuitemcheckbox", { name: /Sphere-2 \(glTF node 4, sphere\)/ }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("1 distinct contact pair.", { exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Contact with", exact: true }).click();
    await page.getByRole("option", { name: "Other objects", exact: true }).click();
    await page.getByRole("combobox", { name: "Contact partners", exact: true }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: /Cube-1 \(glTF node 7, box bounds\)/ })).toBeVisible();
    await page.getByRole("menuitemcheckbox", { name: /Cube-1 \(glTF node 7, box bounds\)/ }).click();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath("contact-audio-desktop.png"), fullPage: true });
});

test("retains compatibility graph edits and the current scene when sound export is blocked", async ({ page }) => {
    test.setTimeout(60000);
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    const identity = await page.evaluate(() => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        state.flowGraph.name = "My legacy graph edit";
        return state.sceneContext.scene.uid;
    });
    const downloads: string[] = [];
    page.on("download", (download) => downloads.push(download.suggestedFilename()));
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await ChooseBalls(page, [3, 4]);
    await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Your scene and edits are retained");
    const retained = await page.evaluate(() => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        return { uid: state.sceneContext.scene.uid, name: state.flowGraph.name, file: state.sourceGltf.file.name, rules: state.contactAudioData.rules.length };
    });
    expect(retained).toEqual({ uid: identity, name: "My legacy graph edit", file: "PhysicsMath.gltf", rules: 0 });
    expect(downloads).toEqual([]);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("preselects a ball clicked in the stopped scene preview", async ({ page }) => {
    test.setTimeout(60000);
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    await page.evaluate(() => {
        const scene = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.scene;
        const ball = scene.meshes.find((mesh: any) => mesh._internalMetadata?.gltf?.pointers?.includes("/nodes/3"));
        ball.computeWorldMatrix(true);
        scene.activeCamera.setTarget(ball.getBoundingInfo().boundingSphere.centerWorld);
        scene.activeCamera.radius = 3;
        scene.render();
    });
    const canvas = page.getByTestId("scene-preview-canvas");
    const box = (await canvas.boundingBox())!;
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Contact balls", exact: true })).toHaveText(/Sphere-1 \(glTF node 3, sphere\)/);
    await ChooseBalls(page, [4]);
    await expect(page.getByText("1 distinct contact pair.", { exact: true })).toBeVisible();
});
