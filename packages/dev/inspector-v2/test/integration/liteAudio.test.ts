import {
    type AudioBus,
    type AudioEngine,
    type AudioGraphHost,
    type LightBase,
    type Mesh,
    type SceneContext,
    type SoundState,
    type SpatialTarget,
    type StaticSound,
} from "@babylonjs/lite";
import { expect, test, type Page } from "@playwright/test";

import { type LiteAudioFixture } from "../app/liteAudio";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteCreateAudioEngine: () => Promise<AudioEngine>;
        liteDisposeAudioEngine: () => void;
        liteGetAudioFixture: () => LiteAudioFixture | null;
        liteAttachSpatialTarget: (target: AudioGraphHost | AudioEngine, worldTarget: SpatialTarget) => void;
        liteDetachSpatialTarget: (target: AudioGraphHost | AudioEngine) => void;
        liteDisposeAudioBus: (bus: AudioBus) => void;
        liteDisposeSound: (sound: StaticSound) => void;
        liteLights: LightBase[];
        liteMeshes: Mesh[];
        litePrimaryScene: SceneContext;
        liteInspectorToken: { dispose: () => Promise<void>; readonly isDisposed: boolean; setAudioEngine: (engine: AudioEngine | null) => void };
        testAudioPanners: PannerNode[];
        previousAudioEngine: AudioEngine;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&physics=off`;
const Started: SoundState = 3;
const Stopped: SoundState = 1;
const Paused: SoundState = 5;

async function SetVolume(page: Page, value: string): Promise<void> {
    const input = page.getByText("Volume", { exact: true }).locator("xpath=ancestor::div[.//input][1]").getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
}

async function SetWatchMode(page: Page, mode: "polling" | "manual"): Promise<void> {
    if (mode === "manual") {
        await page.addLocatorHandler(page.getByRole("dialog").filter({ hasText: "Refresh Properties" }), async (dialog) => {
            await dialog.getByRole("button", { name: "dismiss" }).click();
        });
        await page.locator('[role="radio"][value="Tools"]').click();
        await page.locator('[role="radio"][value="Settings"]').click();
        const watchMode = page.getByText("Preferred Watch Mode", { exact: true }).locator("xpath=ancestor::div[.//*[@role='combobox']][1]");
        await watchMode.getByRole("combobox").click();
        await page.getByRole("option", { name: "Manual", exact: true }).click();
    }
}

async function RefreshIfManual(page: Page, mode: "polling" | "manual"): Promise<void> {
    if (mode === "manual") {
        await page.getByRole("button", { name: /^Update all UI/ }).click();
    }
}

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");

test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

test("Lite Inspector test app creates playable audio and follows spatial targets", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
        const panners: PannerNode[] = [];
        class TestPannerNode extends PannerNode {
            public constructor(context: BaseAudioContext, options?: PannerOptions) {
                super(context, options);
                panners.push(this);
            }
        }
        Object.assign(window, { PannerNode: TestPannerNode, testAudioPanners: panners });
    });

    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteGetAudioFixture" in window);
    const audioRoot = page.getByRole("treeitem", { name: "Audio Engine", exact: true });
    await expect(audioRoot).toBeVisible();
    expect(
        await page.evaluate(() => {
            const fixture = (window as LiteTestWindow).liteGetAudioFixture()!;
            return {
                buses: [fixture.musicBus.name, fixture.effectsBus.name, fixture.spatialBus.name],
                durations: [fixture.boxSound.buffer.duration, fixture.sphereSound.buffer.duration, fixture.musicSound.buffer.duration],
                streamingPreloaded: fixture.streamingSound.preloadCompletedCount,
                source: fixture.oscillatorSource.name,
            };
        })
    ).toEqual({
        buses: ["Music", "Effects", "Sphere Effects"],
        durations: [expect.any(Number), expect.any(Number), expect.any(Number)],
        streamingPreloaded: 1,
        source: "Oscillator",
    });
    expect(await page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.boxSound.buffer.duration)).toBeGreaterThan(0);

    await audioRoot.click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.engine.state)).toBe("running");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const state = window as LiteTestWindow;
                if (state.testAudioPanners.length !== 3) {
                    return Infinity;
                }
                return Math.max(
                    ...state.testAudioPanners.map((panner, index) => {
                        const matrix = state.liteMeshes[index].worldMatrix;
                        return Math.hypot(panner.positionX.value - matrix[12], panner.positionY.value - matrix[13], panner.positionZ.value - matrix[14]);
                    })
                );
            })
        )
        .toBeLessThan(0.1);
    await expect
        .poll(() =>
            page.evaluate(() => {
                const state = window as LiteTestWindow;
                const listener = state.liteGetAudioFixture()!.engine.audioContext.listener;
                const matrix = state.litePrimaryScene.camera!.worldMatrix;
                return Math.hypot(listener.positionX.value - matrix[12], listener.positionY.value - matrix[13], listener.positionZ.value - matrix[14]);
            })
        )
        .toBeLessThan(0.1);

    await page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.play());
    await expect
        .poll(() =>
            page.evaluate(() => {
                const fixture = (window as LiteTestWindow).liteGetAudioFixture()!;
                return [fixture.boxSound.state, fixture.sphereSound.state, fixture.musicSound.state, fixture.streamingSound.state];
            })
        )
        .toEqual([Started, Started, Started, Started]);
    await page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.stop());
    expect(
        await page.evaluate(() => {
            const fixture = (window as LiteTestWindow).liteGetAudioFixture()!;
            return [fixture.boxSound.state, fixture.sphereSound.state, fixture.musicSound.state, fixture.streamingSound.state];
        })
    ).toEqual([Stopped, Stopped, Stopped, Stopped]);

    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.previousAudioEngine = state.liteGetAudioFixture()!.engine;
        state.liteDisposeAudioEngine();
    });
    await expect(audioRoot).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();
    expect(
        await page.evaluate(async () => {
            const state = window as LiteTestWindow;
            const engine = await state.liteCreateAudioEngine();
            return engine !== state.previousAudioEngine && engine === state.liteGetAudioFixture()?.engine;
        })
    ).toBe(true);
    await expect(audioRoot).toBeVisible();
    const disposal = await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        const audioEngine = state.liteGetAudioFixture()!.engine;
        await state.liteInspectorToken.dispose();
        state.liteInspectorToken.setAudioEngine(audioEngine);
        return { inspectorDisposed: state.liteInspectorToken.isDisposed, audioState: audioEngine.state };
    });
    expect(disposal.inspectorDisposed).toBe(true);
    expect(disposal.audioState).not.toBe("closed");
    expect(errors).toEqual([]);
});

test("Lite Inspector exposes routed audio properties, spatial links, and playback controls", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteGetAudioFixture" in window);

    await page.getByRole("treeitem", { name: "Audio Engine", exact: true }).click();
    await expect(page.getByText("Listener", { exact: true })).toBeVisible();
    const cameraName = await page.evaluate(() => (window as LiteTestWindow).litePrimaryScene.camera!.name || "Unnamed target");
    await SetVolume(page, "0.25");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const engine = (window as LiteTestWindow).liteGetAudioFixture()!.engine as unknown as { _volume: number };
                return engine._volume;
            })
        )
        .toBeCloseTo(0.25);
    await page.getByRole("button", { name: cameraName, exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).litePrimaryScene.camera)).toBe(true);
    await page.getByRole("button", { name: "Audio Engine", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.engine)).toBe(true);

    const mainBus = page.getByRole("treeitem", { name: "Main Bus (default)", exact: true });
    await mainBus.click();
    await SetVolume(page, "0.7");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const engine = (window as LiteTestWindow).liteGetAudioFixture()!.engine as unknown as { _mainBus: { _volumeRamp: { _targetValue: number } } };
                return engine._mainBus._volumeRamp._targetValue;
            })
        )
        .toBeCloseTo(0.7);
    await mainBus.press("ArrowRight");
    const effects = page.getByRole("treeitem", { name: "Effects", exact: true });
    await effects.click();
    await SetVolume(page, "0.6");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const bus = (window as LiteTestWindow).liteGetAudioFixture()!.effectsBus as unknown as { _graph: { _volumeRamp: { _targetValue: number } } };
                return bus._graph._volumeRamp._targetValue;
            })
        )
        .toBeCloseTo(0.6);
    await effects.press("ArrowRight");
    const boxSound = page.getByRole("treeitem", { name: "Static Sound 1", exact: true });
    await boxSound.click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.boxSound)).toBe(true);
    await expect(page.getByRole("button", { name: "Red Box", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Effects", exact: true })).toBeVisible();

    await SetVolume(page, "0.42");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const sound = (window as LiteTestWindow).liteGetAudioFixture()!.boxSound as unknown as { _graph: { _volumeRamp: { _targetValue: number } } };
                return sound._graph._volumeRamp._targetValue;
            })
        )
        .toBeCloseTo(0.42);

    for (const [command, state] of [
        ["Play", Started],
        ["Pause", Paused],
        ["Play", Started],
        ["Stop", Stopped],
    ] as const) {
        await page.getByRole("button", { name: command, exact: true }).click();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.boxSound.state)).toBe(state);
    }

    await page.getByRole("button", { name: "Red Box", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
    await page.getByRole("button", { name: "Static Sound 1", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.boxSound)).toBe(true);
    await boxSound.click();
    await page.getByRole("button", { name: "Effects", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.effectsBus)).toBe(true);

    await page.getByRole("treeitem", { name: "Sphere Effects", exact: true }).click();
    await page.getByRole("button", { name: "Blue Sphere", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[1])).toBe(true);
    await page.getByRole("button", { name: "Sphere Effects", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.spatialBus)).toBe(true);
    await page.getByRole("treeitem", { name: "Oscillator", exact: true }).click();
    await SetVolume(page, "0.08");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const source = (window as LiteTestWindow).liteGetAudioFixture()!.oscillatorSource as unknown as { _graph: { _volumeRamp: { _targetValue: number } } };
                return source._graph._volumeRamp._targetValue;
            })
        )
        .toBeCloseTo(0.08);
    await page.getByRole("button", { name: "Small Red Box", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[2])).toBe(true);
    await page.getByRole("button", { name: "Oscillator", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.oscillatorSource)).toBe(true);

    const music = page.getByRole("treeitem", { name: "Music", exact: true });
    await music.click();
    await music.press("ArrowRight");
    await page.getByRole("treeitem", { name: "Streaming Sound 1", exact: true }).click();
    await SetVolume(page, "0.12");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const sound = (window as LiteTestWindow).liteGetAudioFixture()!.streamingSound as unknown as { _graph: { _volumeRamp: { _targetValue: number } } };
                return sound._graph._volumeRamp._targetValue;
            })
        )
        .toBeCloseTo(0.12);
    for (const [command, state] of [
        ["Play", Started],
        ["Pause", Paused],
        ["Play", Started],
        ["Stop", Stopped],
    ] as const) {
        await page.getByRole("button", { name: command, exact: true }).click();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteGetAudioFixture()!.streamingSound.state)).toBe(state);
    }

    const detachedState = await page.evaluate(() => {
        const state = window as LiteTestWindow;
        const engine = state.liteGetAudioFixture()!.engine;
        state.liteInspectorToken.setAudioEngine(null);
        return engine.state;
    });
    expect(detachedState).not.toBe("closed");
    await expect(page.getByRole("treeitem", { name: "Audio Engine", exact: true })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();

    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.liteInspectorToken.setAudioEngine(state.liteGetAudioFixture()!.engine);
    });
    await expect(page.getByRole("treeitem", { name: "Audio Engine", exact: true })).toBeVisible();
    await boxSound.click();
    await page.getByRole("button", { name: "Red Box", exact: true }).click();
    await page.evaluate(() => (window as LiteTestWindow).liteInspectorToken.setAudioEngine(null));
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);

    await page.evaluate(() => (window as LiteTestWindow).liteDisposeAudioEngine());
    expect(errors).toEqual([]);
});

for (const mode of ["polling", "manual"] as const) {
    test(`Lite Inspector keeps reverse audio links synchronized in ${mode} mode`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(TestUrl);
        await page.waitForFunction(() => "liteGetAudioFixture" in window);
        await SetWatchMode(page, mode);
        const refresh = () => RefreshIfManual(page, mode);
        const mainBus = page.getByRole("treeitem", { name: "Main Bus (default)", exact: true });
        await mainBus.click();
        await mainBus.press("ArrowRight");
        const effects = page.getByRole("treeitem", { name: "Effects", exact: true });
        await effects.click();
        await effects.press("ArrowRight");
        await page.getByRole("treeitem", { name: "Static Sound 1", exact: true }).click();
        await page.getByRole("button", { name: "Red Box", exact: true }).click();
        const soundLink = page.getByRole("button", { name: "Static Sound 1", exact: true });
        const busLink = page.getByRole("button", { name: "Sphere Effects", exact: true });
        const sourceLink = page.getByRole("button", { name: "Oscillator", exact: true });
        await expect(soundLink).toBeVisible();

        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            const fixture = state.liteGetAudioFixture()!;
            state.liteAttachSpatialTarget(fixture.spatialBus, state.liteMeshes[0]);
            state.liteAttachSpatialTarget(fixture.oscillatorSource, state.liteMeshes[0]);
        });
        if (mode === "manual") {
            await expect(busLink).toHaveCount(0);
        }
        await refresh();
        await expect(busLink).toBeVisible();
        await expect(sourceLink).toBeVisible();

        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            state.liteAttachSpatialTarget(state.liteGetAudioFixture()!.boxSound, state.liteMeshes[2]);
        });
        await refresh();
        await expect(soundLink).toHaveCount(0);
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            state.liteAttachSpatialTarget(state.liteGetAudioFixture()!.boxSound, state.liteMeshes[0]);
        });
        await refresh();
        await expect(soundLink).toBeVisible();
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            const fixture = state.liteGetAudioFixture()!;
            state.liteDisposeSound(fixture.boxSound);
            state.liteDetachSpatialTarget(fixture.spatialBus);
        });
        await refresh();
        await expect(soundLink).toHaveCount(0);
        await expect(busLink).toHaveCount(0);
        await expect(sourceLink).toBeVisible();

        await page.evaluate(() => (window as LiteTestWindow).liteInspectorToken.setAudioEngine(null));
        await expect(sourceLink).toHaveCount(0);
        await expect(page.getByText("Attached Audio", { exact: true })).toBeVisible();
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            state.liteInspectorToken.setAudioEngine(state.liteGetAudioFixture()!.engine);
        });
        await expect(sourceLink).toBeVisible();
        await page.evaluate(async () => {
            const state = window as LiteTestWindow;
            state.liteDisposeAudioEngine();
            await state.liteCreateAudioEngine();
        });
        await expect(soundLink).toBeVisible();
        await expect(sourceLink).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
        expect(errors).toEqual([]);
    });

    test(`Lite Inspector follows output bus names and disposal in ${mode} mode`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(TestUrl);
        await page.waitForFunction(() => "liteGetAudioFixture" in window);
        await SetWatchMode(page, mode);

        const mainBus = page.getByRole("treeitem", { name: "Main Bus (default)", exact: true });
        await mainBus.click();
        await mainBus.press("ArrowRight");
        const effects = page.getByRole("treeitem", { name: "Effects", exact: true });
        await effects.click();
        await effects.press("ArrowRight");
        await page.getByRole("treeitem", { name: "Static Sound 1", exact: true }).click();
        await expect(page.getByRole("button", { name: "Effects", exact: true })).toBeVisible();

        await page.evaluate(() => {
            Object.assign((window as LiteTestWindow).liteGetAudioFixture()!.effectsBus, { name: "Renamed Effects" });
        });
        if (mode === "manual") {
            await expect(page.getByRole("button", { name: "Effects", exact: true })).toBeVisible();
        }
        await RefreshIfManual(page, mode);
        await expect(page.getByRole("button", { name: "Renamed Effects", exact: true })).toBeVisible();

        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            state.liteDisposeAudioBus(state.liteGetAudioFixture()!.effectsBus);
        });
        if (mode === "manual") {
            await page.getByRole("button", { name: "Renamed Effects", exact: true }).click();
            await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.boxSound)).toBe(true);
        }
        await RefreshIfManual(page, mode);
        await expect(page.getByRole("button", { name: "Renamed Effects", exact: true })).toHaveCount(0);
        await expect(page.getByText("Renamed Effects", { exact: true })).toBeVisible();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.boxSound)).toBe(true);
        expect(errors).toEqual([]);
    });

    test(`Lite Inspector links a light and its attached sound in ${mode} mode`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(TestUrl);
        await page.waitForFunction(() => "liteGetAudioFixture" in window);
        await SetWatchMode(page, mode);

        const mainBus = page.getByRole("treeitem", { name: "Main Bus (default)", exact: true });
        await mainBus.click();
        await mainBus.press("ArrowRight");
        const effects = page.getByRole("treeitem", { name: "Effects", exact: true });
        await effects.click();
        await effects.press("ArrowRight");
        await page.getByRole("treeitem", { name: "Static Sound 1", exact: true }).click();

        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            const light = state.liteLights[2];
            light.name = "Audio Test Light";
            state.liteAttachSpatialTarget(state.liteGetAudioFixture()!.boxSound, light);
        });
        await RefreshIfManual(page, mode);
        await page.getByRole("button", { name: "Audio Test Light", exact: true }).click();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteLights[2])).toBe(true);
        await page.getByRole("button", { name: "Static Sound 1", exact: true }).click();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteGetAudioFixture()!.boxSound)).toBe(true);
        expect(errors).toEqual([]);
    });
}
