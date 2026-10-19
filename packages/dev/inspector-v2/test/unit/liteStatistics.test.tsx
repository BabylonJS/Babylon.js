/**
 * @vitest-environment jsdom
 */

import { createStandardMaterial, type EngineContext, type Material, type RenderTaskGpuTimings, type SceneContext, type Texture2D } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { GetTimings, SetEnabled, Chart } = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    return {
        GetTimings: vi.fn<(engine: EngineContext) => RenderTaskGpuTimings>(),
        SetEnabled: vi.fn<(engine: EngineContext, enabled: boolean) => Promise<RenderTaskGpuTimings>>(),
        Chart: vi.fn<(props: { samples: readonly { durationMs: number }[] }) => null>(() => null),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    getRenderTaskGpuTimings: GetTimings,
    setRenderTaskGpuTimingEnabled: SetEnabled,
}));

vi.mock("../../src/lite/components/gpuTimingChart", () => ({ GpuTimingChart: Chart }));

import { Logger } from "core/Misc/logger";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { SettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { LiteCountStats, LiteFrameStepStats, LitePerformanceStats, LiteSystemStats } from "../../src/lite/components/stats";
import { GetLiteCounts, LiteStatistics } from "../../src/lite/statistics";

function Timing(overrides: Partial<RenderTaskGpuTimings> = {}): RenderTaskGpuTimings {
    return { status: "disabled", supported: true, enabled: false, frameIndex: 0, tasks: [], totalDurationMs: 0, droppedTaskCount: 0, ...overrides };
}

function Engine(contexts: object[] = []) {
    const engine = {
        drawCallCount: 4,
        canvas: { width: 640, height: 480 },
        format: "bgra8unorm",
        msaaSamples: 4,
        useHighPrecisionMatrix: false,
        useFloatingOrigin: false,
        _renderingContexts: contexts,
        _device: {
            features: new Set(["timestamp-query"]),
            limits: { maxTextureDimension2D: 8192, maxBindGroups: 4, maxStorageBufferBindingSize: 128 * 1024 * 1024 },
        },
    } as EngineContext & { _renderingContexts: object[] };
    Object.assign(engine, { engine, surfaces: [engine] });
    return engine;
}

function Scene(material: Material): SceneContext {
    return {
        _kind: "scene",
        meshes: [{ material }],
        lights: [{}],
        shadowGenerators: [{}],
        animationGroups: [{}],
    } as SceneContext;
}

describe("Babylon Lite statistics", () => {
    const statistics: LiteStatistics[] = [];
    const unmounts: (() => void)[] = [];
    let timing: RenderTaskGpuTimings;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        timing = Timing();
        GetTimings.mockImplementation(() => timing);
        SetEnabled.mockImplementation(async (_engine, enabled) => {
            timing = Timing({ enabled, status: enabled ? "pending" : "disabled" });
            return timing;
        });
    });

    afterEach(() => {
        act(() => unmounts.splice(0).forEach((unmount) => unmount()));
        statistics.splice(0).forEach((session) => session.dispose());
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    function Session(engine = Engine()) {
        const session = new LiteStatistics(engine);
        statistics.push(session);
        return session;
    }

    function Render(children: ReactNode) {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const settings = new SettingsStore();
        act(() =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <SettingsStoreContext.Provider value={settings}>
                        <Accordion uniqueId="TestStatistics">
                            <AccordionSection title="Statistics">{children}</AccordionSection>
                        </Accordion>
                    </SettingsStoreContext.Provider>
                </FluentProvider>
            )
        );
        const unmount = () => root.unmount();
        unmounts.push(unmount);
        return { container, root };
    }

    it("deduplicates shared resources across all registered surfaces without counting unregistered scenes", () => {
        const texture = {} as Texture2D;
        const material = createStandardMaterial();
        material.diffuseTexture = texture;
        const scene = Scene(material);
        scene.meshes.push(scene.meshes[0]);
        const textLayer = {};
        const spriteLayer = {};
        const engine = Engine([scene, { _kind: "text-renderer", layers: [textLayer] }]);
        const secondScene = Scene(material);
        secondScene.lights = scene.lights;
        secondScene.animationGroups = scene.animationGroups;
        const surface = Engine([scene, secondScene, { _kind: "sprite-renderer", layers: [spriteLayer, spriteLayer] }, { _kind: "text-renderer", layers: [textLayer] }]);
        Object.assign(engine, { surfaces: [engine, surface] });

        expect(GetLiteCounts(engine)).toEqual({
            surfaces: 2,
            contexts: 5,
            scenes: 2,
            meshes: 2,
            lights: 1,
            materials: 1,
            textures: 1,
            animationGroups: 1,
            shadowGenerators: 2,
            textLayers: 1,
            spriteLayers: 1,
        });
        surface._renderingContexts.length = 0;
        expect(GetLiteCounts(engine)).toMatchObject({ scenes: 1, meshes: 1, shadowGenerators: 1, spriteLayers: 0 });
    });

    it("does not enable profiling by opening statistics and leaves application-owned timing unchanged", async () => {
        timing = Timing({ enabled: true, status: "pending" });
        const session = Session();
        expect(SetEnabled).not.toHaveBeenCalled();
        expect(session.applicationOwnsTiming).toBe(true);
        await expect(session.setEnabledAsync(false)).rejects.toThrow("managed by the application");
        session.dispose();
        expect(SetEnabled).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("samples distinct readbacks, retains only 120, and exports exact numeric CSV columns", async () => {
        const session = Session();
        await session.setEnabledAsync(true);
        timing = Timing({ enabled: true, status: "available", frameIndex: 1, totalDurationMs: 0 });
        vi.advanceTimersByTime(1000);
        expect(session.samples).toHaveLength(1);
        expect(session.samples[0]).toMatchObject({ frameIndex: 1, durationMs: 0, latestDrawCalls: 4 });
        for (let frameIndex = 2; frameIndex <= 125; frameIndex++) {
            timing = Timing({ enabled: true, status: "available", frameIndex, totalDurationMs: frameIndex * 0.25 });
            vi.advanceTimersByTime(250);
        }
        expect(session.samples).toHaveLength(120);
        expect(session.samples[0].frameIndex).toBe(6);
        expect(session.samples.at(-1)?.durationMs).toBe(31.25);
        const rows = session.toCsv().split("\n");
        expect(rows[0]).toBe("sampleTimeMs,gpuFrameIndex,gpuTaskSpanMs,latestDrawCalls");
        expect(rows).toHaveLength(121);
        expect(rows.at(-1)?.split(",").slice(1)).toEqual(["125", "31.25", "4"]);
        expect(rows.slice(1).every((row) => row.split(",").every((column) => Number.isFinite(Number(column))))).toBe(true);
        await session.setEnabledAsync(false);
        vi.advanceTimersByTime(1000);
        expect(session.samples).toHaveLength(120);
        await session.setEnabledAsync(true);
        expect(session.samples).toHaveLength(0);
    });

    it("exposes elapsed profiling time between readbacks and resets it when profiling restarts", async () => {
        const now = vi.spyOn(performance, "now");
        now.mockReturnValue(1000);
        const session = Session();
        now.mockReturnValue(1250);
        expect(session.elapsedMs).toBe(250);
        await session.setEnabledAsync(true);
        now.mockReturnValue(1500);
        expect(session.elapsedMs).toBe(250);
        timing = Timing({ enabled: true, status: "available", frameIndex: 1, totalDurationMs: 1 });
        vi.advanceTimersByTime(250);
        expect(session.samples[0].elapsedMs).toBe(session.elapsedMs);
        now.mockReturnValue(1550);
        expect(session.elapsedMs).toBe(300);
        expect(session.samples[0].elapsedMs).toBe(250);
        await session.setEnabledAsync(false);
        now.mockReturnValue(2000);
        await session.setEnabledAsync(true);
        expect(session.elapsedMs).toBe(0);
    });

    it("disables owned timing and removes polling even if the lazy enable is still pending", async () => {
        let resolve!: (snapshot: RenderTaskGpuTimings) => void;
        SetEnabled.mockImplementationOnce(
            () =>
                new Promise((done) => {
                    resolve = done;
                })
        );
        const engine = Engine();
        const session = Session(engine);
        const enabling = session.setEnabledAsync(true);
        expect(session.busy).toBe(true);
        session.dispose();
        expect(SetEnabled).toHaveBeenNthCalledWith(2, engine, false);
        resolve(Timing());
        await enabling;
        expect(vi.getTimerCount()).toBe(0);
        expect(session.onChanged.hasObservers()).toBe(false);
        session.dispose();
        expect(SetEnabled).toHaveBeenCalledTimes(2);
    });

    it("surfaces enable failures and cleans up partial profiler state", async () => {
        const logger = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        SetEnabled.mockRejectedValueOnce(new Error("Profiler import failed"));
        const session = Session();
        await session.setEnabledAsync(true);
        expect(session.error).toContain("Profiler import failed");
        expect(logger).toHaveBeenCalledWith(expect.stringContaining("Profiler import failed"));
        expect(SetEnabled.mock.calls.map((call) => call[1])).toEqual([true, false]);
        expect(session.busy).toBe(false);
        expect(session.timing.status).toBe("disabled");
    });

    it("retains ownership after a failed disable so disposal retries cleanup", async () => {
        const logger = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const session = Session();
        await session.setEnabledAsync(true);
        SetEnabled.mockRejectedValueOnce(new Error("Disable failed"));
        await session.setEnabledAsync(false);
        expect(session.error).toContain("Disable failed");
        expect(logger).toHaveBeenCalledWith(expect.stringContaining("Disable failed"));
        session.dispose();
        expect(SetEnabled.mock.calls.map((call) => call[1])).toEqual([true, false, false]);
    });

    it("renders unsupported, pending, available, and error states without invented zero timings", async () => {
        timing = Timing({ status: "unsupported", supported: false });
        const session = Session();
        const { container } = Render(<LitePerformanceStats statistics={session} />);
        await act(async () => {
            await import("../../src/lite/components/gpuTimingChart");
        });
        const toggle = container.querySelector<HTMLInputElement>('input[role="switch"]')!;
        expect(toggle.disabled).toBe(true);
        expect(container.textContent).toContain("does not support timestamp queries");
        expect(container.textContent).toContain("Not available");

        timing = Timing();
        act(() => vi.advanceTimersByTime(250));
        await act(async () => toggle.click());
        expect(session.timing.status).toBe("pending");
        timing = Timing({ enabled: true, status: "available", frameIndex: 3, totalDurationMs: 2.5 });
        act(() => vi.advanceTimersByTime(250));
        expect(container.textContent).toContain("2.50 ms");
        expect(Chart.mock.lastCall?.[0].samples).toEqual([expect.objectContaining({ durationMs: 2.5 })]);
        timing = Timing({ enabled: true, status: "error", error: "Readback failed" });
        act(() => vi.advanceTimersByTime(250));
        expect(container.textContent).toContain("Readback failed");
    });

    it("renders each GPU task independently without summing overlapping durations", () => {
        timing = Timing({
            enabled: true,
            status: "available",
            frameIndex: 8,
            totalDurationMs: 3,
            tasks: [
                { index: 0, name: "scene", durationMs: 2 },
                { index: 1, name: "scene", durationMs: 2 },
            ],
            droppedTaskCount: 1,
        });
        const session = Session();
        const { container } = Render(<LiteFrameStepStats statistics={session} />);
        expect(container.textContent).toContain("1. scene");
        expect(container.textContent).toContain("2. scene");
        expect(container.textContent?.match(/2.00 ms/g)).toHaveLength(2);
        expect(session.timing.totalDurationMs).toBe(3);
    });

    it("refreshes counts and surface dimensions on telemetry polling without a watcher service", () => {
        const engine = Engine();
        const { container } = Render(
            <>
                <LiteCountStats context={engine} />
                <LiteSystemStats context={engine} />
            </>
        );
        expect(container.textContent).toContain("640 x 480");
        const scene = Scene(createStandardMaterial());
        engine._renderingContexts.push(scene);
        engine.canvas.width = 800;
        act(() => vi.advanceTimersByTime(1000));
        expect(container.textContent).toContain("800 x 480");
        expect(GetLiteCounts(engine)).toMatchObject({ meshes: 1, materials: 1 });
    });
});
