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

test("scene details remain accessible with keyboard, long labels, and a narrow viewport", async ({ page }, testInfo) => {
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    const summary = page.getByRole("button", { name: "Scene details", exact: true });
    await expect(summary, "the scene summary must be a reachable disclosure").toBeVisible();
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: "Scene details", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Scene details", exact: true }).getByText("Meshes", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(summary).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("region", { name: "Scene details", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: "Scene details", exact: true })).not.toBeVisible();
    await page.setViewportSize({ width: 640, height: 640 });
    const previewHeight = (await page.getByTestId("scene-preview-canvas").boundingBox())!.height;
    await summary.click();
    await page
        .getByRole("region", { name: "Scene details", exact: true })
        .locator("dt")
        .evaluateAll((labels) => {
            labels.forEach((label) => {
                label.textContent = "A very long translated scene category label with several words";
            });
        });
    const layout = await page.getByRole("region", { name: "Scene details", exact: true }).evaluate((element) => ({
        overflow: element.scrollWidth > element.clientWidth,
        labels: element.querySelectorAll("dt").length > 0 && [...element.querySelectorAll("dt")].every((label) => label.getBoundingClientRect().height > 0),
    }));
    expect(layout, "category labels must wrap without hiding their counts").toEqual({ overflow: false, labels: true });
    await expect(page.getByTestId("scene-preview-canvas")).toBeVisible();
    expect((await page.getByTestId("scene-preview-canvas").boundingBox())!.height).toBeGreaterThanOrEqual(previewHeight - 1);
    await page.screenshot({ path: testInfo.outputPath("scene-details-narrow.png"), fullPage: true, animations: "disabled" });
});

test("serializes same-turn audio imports and atomically deduplicates their selection", async ({ page }) => {
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await page.evaluate(() => {
        const runtime = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.contactAudioRuntime;
        (globalThis as any).__imports = [];
        runtime.importAudioAsync = (file: File) => new Promise((resolve, reject) => (globalThis as any).__imports.push({ name: file.name, resolve, reject }));
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Choose audio file"]')!;
        for (const name of ["first.mp3", "second.mp3"]) {
            const transfer = new DataTransfer();
            transfer.items.add(new File(["ID3"], name, { type: "audio/mpeg" }));
            input.files = transfer.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
    expect(await page.evaluate(() => (globalThis as any).__imports.length), "a synchronous guard must prevent overlapping decode operations").toBe(1);
    await page.evaluate(() => (globalThis as any).__imports[0].resolve({ name: "first.mp3", mimeType: "audio/mpeg", uri: "data:audio/mpeg;base64,SUQz" }));
    const sound = page.getByRole("combobox", { name: "Contact sound", exact: true });
    await expect(sound).toHaveText("first.mp3");
    await page.getByLabel("Choose audio file", { exact: true }).setInputFiles({ name: "duplicate.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("ID3") });
    await page.evaluate(() => (globalThis as any).__imports[1].resolve({ name: "duplicate.mp3", mimeType: "audio/mpeg", uri: "data:audio/mpeg;base64,SUQz" }));
    await expect(page.getByRole("button", { name: "Listen", exact: true })).toBeEnabled();
    await expect(sound).toHaveText("first.mp3");
    await sound.click();
    await expect(page.getByRole("option", { name: /first.mp3/ })).toHaveCount(1);
    await expect(page.getByRole("option", { name: /duplicate.mp3/ })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("excludes real glTF GPU instances without hiding other contact targets", async ({ page }) => {
    const source = JSON.parse(readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.gltf", "utf8"));
    delete source.extensions.KHR_interactivity;
    source.extensionsUsed = source.extensionsUsed.filter((name: string) => name !== "KHR_interactivity");
    const translations = Buffer.alloc(24);
    translations.writeFloatLE(20, 12);
    const buffer = source.buffers.length;
    const bufferView = source.bufferViews.length;
    const accessor = source.accessors.length;
    source.buffers.push({ byteLength: 24, uri: `data:application/octet-stream;base64,${translations.toString("base64")}` });
    source.bufferViews.push({ buffer, byteLength: 24 });
    source.accessors.push({ bufferView, componentType: 5126, count: 2, type: "VEC3" });
    source.nodes[3].extensions = { EXT_mesh_gpu_instancing: { attributes: { TRANSLATION: accessor } } };
    source.extensionsUsed.push("EXT_mesh_gpu_instancing");
    const fge = new FlowGraphEditorPage(page);
    await fge.goto({ local: true });
    await page.evaluate(
        ({ json, bin }) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([json], "instances.gltf"));
            transfer.items.add(new File([new Uint8Array(bin)], "PhysicsMath.bin"));
            document.querySelector("canvas")!.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        },
        { json: JSON.stringify(source), bin: [...readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.bin")] }
    );
    await expect(page.getByTestId("contact-instance-warning")).toBeVisible({ timeout: 30000 });
    expect(
        await page.evaluate(() => (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.sceneContext.meshes.find((mesh: any) => mesh.hasThinInstances)?.thinInstanceCount)
    ).toBe(2);
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await page.getByRole("combobox", { name: "Contact balls", exact: true }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: /Sphere-1/ })).toHaveCount(0);
    await expect(page.getByRole("menuitemcheckbox", { name: /Sphere-2/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("scene details support touch, text enlargement and right-to-left long labels", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ ...devices["iPhone 13"], isMobile: browser.browserType().name() !== "firefox", defaultBrowserType: undefined });
    const page = await context.newPage();
    try {
        await new FlowGraphEditorPage(page).goto({ local: true });
        const summary = page.getByRole("button", { name: "Scene details", exact: true });
        await expect(summary).toBeVisible();
        expect((await summary.boundingBox())!.height, "the disclosure needs a usable touch target (allowing browser subpixel rounding)").toBeGreaterThanOrEqual(43.99);
        const previewHeight = (await page.getByTestId("scene-preview-canvas").boundingBox())!.height;
        await summary.tap();
        await expect(page.getByRole("region", { name: "Scene details", exact: true })).toBeVisible();
        await page.getByRole("region", { name: "Scene details", exact: true }).evaluate((details) => {
            details.querySelectorAll<HTMLElement>("dt, dd").forEach((item) => {
                item.style.fontSize = "125%";
            });
            details.querySelectorAll<HTMLElement>("span").forEach((item) => {
                item.style.fontSize = "inherit";
            });
            details.setAttribute("dir", "rtl");
            details.querySelectorAll("dt").forEach((label) => {
                label.textContent = "تصنيف طويل لتفاصيل عناصر المشهد للاختبار";
            });
        });
        const summaryLayout = await page
            .getByRole("region", { name: "Scene details", exact: true })
            .evaluate((details) => ({ horizontalOverflow: details.scrollWidth > details.clientWidth, descriptions: details.querySelectorAll("dd").length }));
        expect(summaryLayout.horizontalOverflow).toBe(false);
        expect(summaryLayout.descriptions).toBeGreaterThan(0);
        const lastCount = page.getByRole("region", { name: "Scene details", exact: true }).locator("dd").last();
        await lastCount.scrollIntoViewIfNeeded();
        await expect(lastCount).toBeVisible();
        expect((await page.getByTestId("scene-preview-canvas").boundingBox())!.height).toBeGreaterThanOrEqual(previewHeight - 1);
        await page.screenshot({ path: testInfo.outputPath("scene-details-touch-rtl.png"), fullPage: true, animations: "disabled" });
        await summary.tap();
        await expect(page.getByRole("region", { name: "Scene details", exact: true })).not.toBeVisible();
    } finally {
        await context.close();
    }
});

test("retains a legacy GLB and value-only variable edits when a sound save is unsupported", async ({ page }) => {
    const source = JSON.parse(readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.gltf", "utf8"));
    delete source.extensions.KHR_interactivity;
    source.extensionsUsed = source.extensionsUsed.filter((name: string) => name !== "KHR_interactivity");
    source.extensionsUsed.push("BABYLON_flow_graph");
    source.extensions.BABYLON_flow_graph = {
        flowGraph: {
            rightHanded: true,
            allBlocks: [],
            executionContexts: [{ uniqueId: "authored-context", _userVariables: { label: "original" }, _variableTypes: { label: "string" }, _connectionValues: {} }],
        },
    };
    delete source.buffers[0].uri;
    const json = Buffer.from(JSON.stringify(source));
    const jsonLength = Math.ceil(json.length / 4) * 4;
    const bin = readFileSync("packages/tools/flowGraphEditor/public/samples/PhysicsMath/PhysicsMath.bin");
    const glb = Buffer.alloc(28 + jsonLength + bin.length, 32);
    glb.writeUInt32LE(0x46546c67, 0);
    glb.writeUInt32LE(2, 4);
    glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(jsonLength, 12);
    glb.writeUInt32LE(0x4e4f534a, 16);
    json.copy(glb, 20);
    glb.writeUInt32LE(bin.length, 20 + jsonLength);
    glb.writeUInt32LE(0x004e4942, 24 + jsonLength);
    bin.copy(glb, 28 + jsonLength);
    await new FlowGraphEditorPage(page).goto({ local: true });
    await page.evaluate(
        (bytes) => {
            const transfer = new DataTransfer();
            transfer.items.add(new File([new Uint8Array(bytes)], "legacy-physics.glb"));
            document.querySelector("canvas")!.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        },
        [...glb]
    );
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    const identity = await page.evaluate(() => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        (globalThis as any).__legacySource = state.sourceGlb;
        (globalThis as any).__legacyScene = state.sceneContext.scene;
        return state.sceneContext.scene.uid;
    });
    const card = page.locator("[class*='fui-Card']").filter({ hasText: "label" }).first();
    await card.locator("input").last().fill("edited from the variables panel");
    const downloads: string[] = [];
    page.on("download", (download) => downloads.push(download.suggestedFilename()));
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await ChooseBalls(page, [3, 4]);
    await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Your scene and edits are retained");
    expect(
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            return {
                uid: state.sceneContext.scene.uid,
                value: state.flowGraph.getContext(0).getVariable("label"),
                sourceRetained: state.sourceGlb === (globalThis as any).__legacySource,
                sceneRetained: state.sceneContext.scene === (globalThis as any).__legacyScene,
            };
        })
    ).toEqual({ uid: identity, value: "edited from the variables panel", sourceRetained: true, sceneRetained: true });
    expect(downloads).toEqual([]);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("retains edits made while a sound save is reading the source", async ({ page }) => {
    await new FlowGraphEditorPage(page).goto({ local: true });
    await page.getByRole("button", { name: "Load PhysicsMath demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Add sound reaction", exact: true })).toBeEnabled({ timeout: 30000 });
    await page.evaluate(async () => {
        const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
        const file = state.sourceGltf.file;
        const text = await file.text();
        (globalThis as any).__savingScene = state.sceneContext.scene;
        Object.defineProperty(file, "text", {
            value: () =>
                new Promise((resolve) => {
                    (globalThis as any).__finishSourceRead = () => resolve(text);
                }),
        });
    });
    const downloads: string[] = [];
    page.on("download", (download) => downloads.push(download.suggestedFilename()));
    await page.getByRole("button", { name: "Add sound reaction", exact: true }).click();
    await ChooseBalls(page, [3, 4]);
    await page.getByRole("button", { name: "Save sound reaction", exact: true }).click();
    await expect(page.getByRole("button", { name: "Preparing…", exact: true })).toBeDisabled();
    await page.evaluate(() => {
        (globalThis as any).BABYLON.FlowGraphEditor._CurrentState.flowGraph.name = "Edited during source read";
        (globalThis as any).__finishSourceRead();
    });
    await expect(page.getByRole("alert")).toContainText("The graph changed while preparing the sound reaction");
    expect(
        await page.evaluate(() => {
            const state = (globalThis as any).BABYLON.FlowGraphEditor._CurrentState;
            return { name: state.flowGraph.name, retained: state.sceneContext.scene === (globalThis as any).__savingScene };
        })
    ).toEqual({ name: "Edited during source read", retained: true });
    expect(downloads).toEqual([]);
});
