/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { NullEngine } from "core/Engines/nullEngine";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});

vi.mock("../../src/components/properties/boundProperty", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../../src/components/properties/boundProperty")>()),
    BoundProperty: (props: { propertyKey: string; target: { minPixelSize: number }; convertFrom?: (value: number) => number }) =>
        props.propertyKey === "minPixelSize" ? (
            <button type="button" onClick={() => (props.target.minPixelSize = props.convertFrom?.(3.5) ?? 3.5)}>
                Set Min Pixel Size
            </button>
        ) : null,
}));

import { GaussianSplattingDisplayProperties } from "../../src/components/properties/nodes/gaussianSplattingProperties";
import { GaussianSplattingDebugController } from "../../src/services/panes/properties/gaussianSplattingDebugController";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { type IWatcherService } from "../../src/services/watcherService";

describe("Inspector Gaussian splat mode control", () => {
    const roots: Array<ReturnType<typeof createRoot>> = [];
    const containers: HTMLElement[] = [];
    const engines: NullEngine[] = [];
    const scenes: Scene[] = [];
    const controllers: GaussianSplattingDebugController[] = [];

    afterEach(() => {
        for (const root of roots.splice(0)) {
            act(() => root.unmount());
        }
        for (const controller of controllers.splice(0)) {
            controller.dispose();
        }
        scenes.splice(0).forEach((scene) => scene.dispose());
        engines.splice(0).forEach((engine) => engine.dispose());
        containers.splice(0).forEach((container) => container.remove());
    });

    it("switches the per-mesh mode and retains it across properties remount", () => {
        const engine = new NullEngine();
        engines.push(engine);
        const scene = new Scene(engine);
        scenes.push(scene);
        const mesh = new GaussianSplattingMesh("mesh", null, scene);
        const original = mesh.material;
        const controller = new GaussianSplattingDebugController();
        controllers.push(controller);
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        let root = createRoot(container);
        roots.push(root);
        const render = () => (
            <FluentProvider theme={webLightTheme}>
                <GaussianSplattingDisplayProperties mesh={mesh} debugController={controller} />
            </FluentProvider>
        );
        act(() => root.render(render()));
        expect(container.textContent).toContain("Debug Rendering");
        act(() => (container.querySelector('[role="combobox"]') as HTMLElement).click());
        const sizeOption = [...document.querySelectorAll('[role="option"]')].find((option) => option.textContent?.includes("Projected size")) as HTMLElement;
        act(() => sizeOption.click());
        expect(controller.getMode(mesh)).toBe("size");
        expect(mesh.material).not.toBe(original);
        act(() => ([...container.querySelectorAll("button")].find((button) => button.textContent === "Set Min Pixel Size") as HTMLElement).click());
        expect((original as GaussianSplattingMaterial).minPixelSize).toBe(3.5);
        expect(mesh.minPixelSize).toBe(3.5);
        act(() => root.unmount());
        roots.pop();
        root = createRoot(container);
        roots.push(root);
        act(() => root.render(render()));
        expect(container.textContent).toContain("Projected size");
        const replacement = new GaussianSplattingMaterial("replacement", scene);
        act(() => {
            mesh.material = replacement;
        });
        expect(container.querySelector('[role="combobox"]')?.textContent).toContain("Normal");
        expect(controller.getPlugins(mesh)).toBeUndefined();
        expect(controller.getMode(mesh)).toBe("normal");
        expect(mesh.material).toBe(replacement);
        controller.setMode(mesh, "normal");
        expect(mesh.material).toBe(replacement);
    });

    it("renders range-residency diagnostics and follows watcher refresh without redundant stats reads", () => {
        const engine = new NullEngine();
        engines.push(engine);
        const scene = new Scene(engine);
        scenes.push(scene);
        const mesh = new GaussianSplattingMesh("stream", null, scene);
        vi.spyOn(mesh, "getClassName").mockReturnValue("GaussianSplattingStream");
        Object.defineProperties(mesh, {
            lod0SplatCount: { value: { status: "pending" } },
            renderedSplatCount: { value: 0 },
            residentSplatBudget: { value: 0 },
            maxDetailLod: { value: 0 },
            maxLodLevel: { value: 1 },
        });
        let stats = { enabled: true, pages: 2, sourcePackLoads: 3, sourcePackReuses: 4, splitPackLoads: 5, cachedSourceSplats: 100 };
        const getStats = vi.fn(() => stats);
        Object.defineProperty(mesh, "rangeResidencyStats", { get: getStats });
        const controller = new GaussianSplattingDebugController();
        controllers.push(controller);
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        const refreshes: Array<() => void> = [];
        const watcher: IWatcherService = {
            watchValue: (getValue, onChanged) => {
                const refresh = () => onChanged(getValue());
                refreshes.push(refresh);
                return { dispose: () => refreshes.splice(refreshes.indexOf(refresh), 1) };
            },
            watchProperty: () => ({ dispose: vi.fn() }),
            refresh: () => refreshes.forEach((refresh) => refresh()),
        };
        act(() =>
            root.render(
                <WatcherContext.Provider value={watcher}>
                    <FluentProvider theme={webLightTheme}>
                        <GaussianSplattingDisplayProperties mesh={mesh} debugController={controller} />
                    </FluentProvider>
                </WatcherContext.Provider>
            )
        );
        for (const label of ["Range Residency", "Residency Pages", "Source Pack Loads", "Source Pack Reuses", "Split Pack Loads", "Cached Source Splats"]) {
            expect(container.textContent).toContain(label);
        }
        expect(container.textContent).toContain("100");
        getStats.mockClear();
        stats = { enabled: false, pages: 0, sourcePackLoads: 3, sourcePackReuses: 4, splitPackLoads: 5, cachedSourceSplats: 0 };
        act(() => watcher.refresh());
        expect(container.textContent).toContain("Disabled");
        expect(container.textContent).toContain("0");
        expect(getStats).toHaveBeenCalledOnce();
    });

    it("does not show range diagnostics for an ordinary Gaussian mesh", () => {
        const engine = new NullEngine();
        engines.push(engine);
        const scene = new Scene(engine);
        scenes.push(scene);
        const mesh = new GaussianSplattingMesh("mesh", null, scene);
        const controller = new GaussianSplattingDebugController();
        controllers.push(controller);
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <GaussianSplattingDisplayProperties mesh={mesh} debugController={controller} />
                </FluentProvider>
            )
        );
        expect(container.textContent).not.toContain("Range Residency");
    });
});
