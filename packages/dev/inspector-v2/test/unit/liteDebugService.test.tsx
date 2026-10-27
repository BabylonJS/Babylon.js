/**
 * @vitest-environment jsdom
 */

import { type EngineContext, type Mesh, type SceneContext } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type IShellService, type SidePaneDefinition } from "shared-ui-components/modularTool/services/shellService";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { type ISettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { Observable } from "core/Misc/observable";
import { DebugServiceDefinition } from "../../src/lite/services/panes/debugService";
import { type IWatcherService } from "../../src/services/watcherService";

const { Ground, Lines } = vi.hoisted(() => ({ Ground: vi.fn(), Lines: vi.fn() }));

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe() {}
            public unobserve() {}
            public disconnect() {}
        }
    );
});

vi.mock("@babylonjs/lite", () => ({
    createGround: Ground,
    createLineSystem: Lines,
    createGridMaterial: () => ({}),
    updateLineSystem: vi.fn(),
    disposeMeshGpu: vi.fn(),
    setParent: vi.fn(),
    setMeshVisible: (mesh: Mesh, visible: boolean) => Object.assign(mesh, { visible }),
    addToScene: (scene: SceneContext, mesh: Mesh) => scene.meshes.push(mesh),
    removeFromScene: (scene: SceneContext, mesh: Mesh) => scene.meshes.splice(scene.meshes.indexOf(mesh), 1),
    getRenderingContexts: (surface: { contexts: SceneContext[] }) => surface.contexts,
    getRenderingContextKind: () => "scene",
}));

function CreateMesh(): Mesh {
    return { name: "Mesh", children: [], boundMin: [-1, -1, -1], boundMax: [1, 1, 1], visible: true } as Mesh;
}

describe("Babylon Lite debug service", () => {
    beforeEach(() => {
        Ground.mockReset().mockImplementation(CreateMesh);
        Lines.mockReset().mockImplementation(CreateMesh);
    });

    it.each(["Ground Grid", "Bounding Boxes"])("keeps %s off after failed creation and accepts a successful retry", (label) => {
        const create = label === "Ground Grid" ? Ground : Lines;
        create.mockImplementationOnce(() => {
            throw new Error("Helper creation failed");
        });
        const scene = { name: "Scene", meshes: [CreateMesh()] } as SceneContext;
        const engine = { contexts: [scene] } as unknown as EngineContext;
        Object.assign(engine, { surfaces: [engine] });
        let pane!: SidePaneDefinition;
        const unregister = vi.fn();
        const unregisterWatcher = vi.fn();
        const shell = {
            addSidePane: (definition: SidePaneDefinition) => {
                pane = definition;
                return { dispose: unregister };
            },
        } as IShellService;
        const watcher = { watchValue: () => ({ dispose: unregisterWatcher }) } as unknown as IWatcherService;
        const service = DebugServiceDefinition.factory({ engine }, shell, watcher);
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const Pane = pane.content;
        const settings: ISettingsStore = {
            readSetting: (descriptor) => descriptor.defaultValue,
            writeSetting: vi.fn(),
            onChanged: new Observable<string>(),
        };
        try {
            act(() =>
                root.render(
                    <FluentProvider theme={webLightTheme}>
                        <SettingsStoreContext.Provider value={settings}>
                            <Pane />
                        </SettingsStoreContext.Provider>
                    </FluentProvider>
                )
            );
            const input = container.querySelector<HTMLInputElement>(`input[role="switch"][aria-label="${label}"]`)!;
            expect(input.checked).toBe(false);
            act(() => input.click());
            expect(container.textContent).toContain("Helper creation failed");
            expect(input.checked).toBe(false);
            expect(scene.meshes).toHaveLength(1);
            act(() => input.click());
            expect(input.checked).toBe(true);
            expect(container.textContent).not.toContain("Helper creation failed");
            expect(create).toHaveBeenCalledTimes(2);
            expect(scene.meshes).toHaveLength(2);
        } finally {
            act(() => root.unmount());
            service?.dispose?.();
            container.remove();
        }
        expect(scene.meshes).toHaveLength(1);
        expect(unregister).toHaveBeenCalledOnce();
        expect(unregisterWatcher).toHaveBeenCalledOnce();
    });
});
