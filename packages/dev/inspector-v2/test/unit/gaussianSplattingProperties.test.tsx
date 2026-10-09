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

vi.mock("../../src/components/properties/boundProperty", () => ({
    BoundProperty: (props: { propertyKey: string; target: { minPixelSize: number }; convertFrom?: (value: number) => number }) =>
        props.propertyKey === "minPixelSize" ? (
            <button type="button" onClick={() => (props.target.minPixelSize = props.convertFrom?.(3.5) ?? 3.5)}>
                Set Min Pixel Size
            </button>
        ) : null,
    ComputedProperty: () => null,
}));

import { GaussianSplattingDisplayProperties } from "../../src/components/properties/nodes/gaussianSplattingProperties";
import { GaussianSplattingDebugController } from "../../src/services/panes/properties/gaussianSplattingDebugController";

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
            scene.onBeforeRenderObservable.notifyObservers(scene);
        });
        expect(controller.getMode(mesh)).toBe("normal");
        expect(container.querySelector('[role="combobox"]')?.textContent).toContain("Normal");
        expect(mesh.material).toBe(replacement);
        controller.setMode(mesh, "normal");
        expect(mesh.material).toBe(replacement);
    });
});
