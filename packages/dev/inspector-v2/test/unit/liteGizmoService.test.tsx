/**
 * @vitest-environment jsdom
 */

import { createTransformNode, type EngineContext, type Mesh, type SceneContext, type SceneNode, type SurfaceContext, type UtilityLayer } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Logger } from "core/Misc/logger";
import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

import { GetInspectableRenderingContexts, GetSceneContexts } from "../../src/lite/sceneEntityUtils";
import { GizmoServiceDefinition } from "../../src/lite/services/gizmoService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IWatcherService } from "../../src/services/watcherService";

const Mocks = vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    const modes = ["Position", "Rotation", "Scale", "BoundingBox"] as const;
    return {
        createLayer: vi.fn<(engine: EngineContext, scene: SceneContext) => UtilityLayer>(),
        registerLayer: vi.fn<(layer: UtilityLayer) => Promise<void>>(),
        disposeLayer: vi.fn<(layer: UtilityLayer) => void>(),
        dragging: vi.fn<(canvas: HTMLCanvasElement) => boolean>(),
        pendingPick: vi.fn<(canvas: HTMLCanvasElement) => boolean>(),
        create: Object.fromEntries(modes.map((mode) => [mode, vi.fn(() => ({ mode }))])),
        attach: Object.fromEntries(modes.map((mode) => [mode, vi.fn<(gizmo: object, node: SceneNode | null) => void>()])),
        coordinates: Object.fromEntries(modes.map((mode) => [mode, vi.fn<(gizmo: object, local: boolean) => void>()])),
        dispose: Object.fromEntries(modes.map((mode) => [mode, vi.fn()])),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    createUtilityLayer: Mocks.createLayer,
    registerUtilityLayer: Mocks.registerLayer,
    disposeUtilityLayer: Mocks.disposeLayer,
    isGizmoDragging: Mocks.dragging,
    isGizmoPickPending: Mocks.pendingPick,
    ...Object.fromEntries(
        ["Position", "Rotation", "Scale", "BoundingBox"].flatMap((mode) => [
            [`create${mode}Gizmo`, Mocks.create[mode]],
            [`attach${mode}GizmoToNode`, Mocks.attach[mode]],
            [`set${mode}GizmoLocalCoordinates`, Mocks.coordinates[mode]],
            [`dispose${mode}Gizmo`, Mocks.dispose[mode]],
        ])
    ),
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

function Deferred() {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe("Babylon Lite gizmo service", () => {
    const cleanups: (() => void)[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
        Mocks.createLayer.mockImplementation((engine, mainScene) => ({
            mainScene,
            scene: { _kind: "scene", surface: engine, camera: mainScene.camera, meshes: [] } as unknown as SceneContext,
        }));
        Mocks.registerLayer.mockResolvedValue();
        Mocks.dragging.mockReturnValue(false);
        Mocks.pendingPick.mockReturnValue(false);
    });

    afterEach(async () => {
        await act(async () =>
            cleanups
                .splice(0)
                .reverse()
                .forEach((cleanup) => cleanup())
        );
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    function MakeScene() {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        const surfaces: SurfaceContext[] = [];
        const engine = { canvas, surfaces, _renderingContexts: [] as SceneContext[] } as unknown as EngineContext & { _renderingContexts: SceneContext[] };
        Object.assign(engine, { engine });
        surfaces.push(engine);
        const mesh = Object.assign(createTransformNode("Mesh"), { material: {}, receiveShadows: false }) as Mesh;
        const otherMesh = Object.assign(createTransformNode("Other Mesh"), { material: {}, receiveShadows: false }) as Mesh;
        const scene = { _kind: "scene", surface: engine, camera: {}, meshes: [mesh, otherMesh] } as unknown as SceneContext;
        engine._renderingContexts = [scene];
        return { engine, canvas, surfaces, scene, mesh, otherMesh };
    }

    function MakeHarness(withScene = true, fixture = MakeScene()) {
        const { engine, canvas, surfaces, scene, mesh, otherMesh } = fixture;
        if (!withScene) {
            engine._renderingContexts = [];
        }
        let selectedEntity: object | null = engine;
        const onSelectedEntityChanged = new Observable<void>();
        const selection: ISelectionService = {
            get selectedEntity() {
                return selectedEntity;
            },
            set selectedEntity(value) {
                selectedEntity = value;
                onSelectedEntityChanged.notifyObservers();
            },
            onSelectedEntityChanged,
        };
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const toolbarDispose = vi.fn(() => root.render(null));
        const shell = {
            addToolbarItem: vi.fn((options: Parameters<IShellService["addToolbarItem"]>[0]) => {
                const Toolbar = options.component;
                act(() =>
                    root.render(
                        <FluentProvider theme={webLightTheme}>
                            <Toolbar />
                        </FluentProvider>
                    )
                );
                return { dispose: toolbarDispose };
            }),
        } as unknown as IShellService;
        let refresh!: () => void;
        const watcherDispose = vi.fn();
        const watcher: IWatcherService = {
            watchProperty: vi.fn(() => ({ dispose: vi.fn() })),
            refresh: () => refresh(),
            watchValue: <T,>(getter: () => T, callback: (value: T) => void, equals: (left: T, right: T) => boolean = Object.is) => {
                let previous = getter();
                refresh = () => {
                    const current = getter();
                    if (!equals(previous, current)) {
                        previous = current;
                        callback(current);
                    }
                };
                return { dispose: watcherDispose };
            },
        };
        let service!: Partial<IDisposable>;
        act(() => {
            const instance = GizmoServiceDefinition.factory({ engine }, shell, selection, watcher);
            if (!instance?.dispose) {
                throw new Error("Expected a disposable gizmo service.");
            }
            service = instance;
        });
        cleanups.push(
            () => root.unmount(),
            () => service.dispose?.()
        );
        const select = async (entity: object | null) =>
            act(async () => {
                selection.selectedEntity = entity;
            });
        const button = (name: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`);
        const click = async (name: string) =>
            act(async () => {
                button(name)!.click();
            });
        return {
            engine,
            canvas,
            surfaces,
            scene,
            mesh,
            otherMesh,
            selection,
            onSelectedEntityChanged,
            select,
            button,
            click,
            service,
            shell,
            toolbarDispose,
            watcherDispose,
            refresh: async () => act(async () => refresh()),
        };
    }

    it("is opt-in and registers disabled controls only while a supported scene exists", async () => {
        const h = MakeHarness(false);
        expect(h.button("Translate")).toBeNull();
        h.engine._renderingContexts.push(h.scene);
        await h.refresh();
        expect(h.button("Translate")?.disabled).toBe(true);
        await h.select(h.mesh);
        expect(h.button("Translate")?.disabled).toBe(false);
        expect(Mocks.createLayer).not.toHaveBeenCalled();
        h.engine._renderingContexts.length = 0;
        await h.refresh();
        expect(h.button("Translate")).toBeNull();
        expect(h.toolbarDispose).toHaveBeenCalledTimes(1);
    });

    it.each([
        ["Translate", "Position"],
        ["Rotate", "Rotation"],
        ["Scale", "Scale"],
        ["Bounding Box", "BoundingBox"],
    ])("attaches native %s gizmos and releases all resources when toggled off", async (button, kind) => {
        const h = MakeHarness();
        await h.select(h.mesh);
        await h.click(button);
        const layer = Mocks.createLayer.mock.results[0].value;
        expect(Mocks.createLayer).toHaveBeenCalledExactlyOnceWith(h.engine, h.scene);
        expect(Mocks.create[kind]).toHaveBeenCalledExactlyOnceWith(h.engine, layer);
        expect(Mocks.attach[kind]).toHaveBeenCalledWith(expect.anything(), h.mesh);
        expect(h.button(button)?.getAttribute("aria-pressed")).toBe("true");
        await h.click(button);
        expect(Mocks.dispose[kind]).toHaveBeenCalledTimes(1);
        expect(Mocks.disposeLayer).toHaveBeenCalledExactlyOnceWith(layer);
        expect(h.button(button)?.getAttribute("aria-pressed")).toBe("false");
    });

    it("reattaches within a scene and retains coordinates across mode changes", async () => {
        const h = MakeHarness();
        await h.select(h.mesh);
        await h.click("Translate");
        await h.select(h.otherMesh);
        expect(Mocks.createLayer).toHaveBeenCalledTimes(1);
        expect(Mocks.attach.Position).toHaveBeenLastCalledWith(expect.anything(), h.otherMesh);
        await h.click("Local Coordinates");
        expect(Mocks.coordinates.Position).toHaveBeenLastCalledWith(expect.anything(), false);
        await h.click("Rotate");
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(Mocks.coordinates.Rotation).toHaveBeenLastCalledWith(expect.anything(), false);
        await h.click("World Coordinates");
        expect(Mocks.coordinates.Rotation).toHaveBeenLastCalledWith(expect.anything(), true);
    });

    it("keeps rotated-node scaling local without changing the translation and rotation coordinate preference", async () => {
        const h = MakeHarness();
        h.mesh.rotationQuaternion.set(0, 0, Math.SQRT1_2, Math.SQRT1_2);
        await h.select(h.mesh);
        await h.click("Translate");
        await h.click("Local Coordinates");
        await h.click("Scale");
        expect(Mocks.coordinates.Scale).toHaveBeenCalledExactlyOnceWith(expect.anything(), true);
        await vi.waitFor(() => {
            expect(h.button("Local Coordinates")).toBeNull();
            expect(h.button("World Coordinates")).toBeNull();
        });
        await h.select(h.otherMesh);
        expect(Mocks.coordinates.Scale).toHaveBeenCalledExactlyOnceWith(expect.anything(), true);
        await h.click("Rotate");
        expect(Mocks.coordinates.Rotation).toHaveBeenLastCalledWith(expect.anything(), false);
        expect(h.button("World Coordinates")).not.toBeNull();
    });

    it("lets native capture handlers manipulate gizmos without also moving application cameras", async () => {
        const h = MakeHarness();
        const nativeMove = vi.fn();
        const cameraMove = vi.fn();
        h.canvas.addEventListener("pointermove", nativeMove, true);
        h.canvas.addEventListener("pointermove", cameraMove);
        await h.select(h.mesh);
        await h.click("Translate");
        Mocks.pendingPick.mockReturnValue(true);
        h.canvas.dispatchEvent(new Event("pointermove", { bubbles: true }));
        Mocks.pendingPick.mockReturnValue(false);
        Mocks.dragging.mockReturnValue(true);
        h.canvas.dispatchEvent(new Event("pointermove", { bubbles: true }));
        expect(nativeMove).toHaveBeenCalledTimes(2);
        expect(cameraMove).not.toHaveBeenCalled();
        Mocks.dragging.mockReturnValue(false);
        h.canvas.dispatchEvent(new Event("pointermove", { bubbles: true }));
        expect(cameraMove).toHaveBeenCalledTimes(1);
        await h.click("Translate");
        Mocks.dragging.mockReturnValue(true);
        h.canvas.dispatchEvent(new Event("pointermove", { bubbles: true }));
        expect(cameraMove).toHaveBeenCalledTimes(2);
    });

    it("supports hierarchy transform nodes and disables gizmos for resources and auxiliary nodes", async () => {
        const h = MakeHarness();
        const parent = createTransformNode("Parent");
        parent.children.push(h.mesh);
        h.mesh.parent = parent;
        await h.select(parent);
        await h.click("Translate");
        expect(Mocks.attach.Position).toHaveBeenLastCalledWith(expect.anything(), parent);
        await h.select(h.mesh.material);
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(h.button("Translate")?.disabled).toBe(true);
        const auxiliaryNode = createTransformNode("Auxiliary");
        const surface = { canvas: document.createElement("canvas"), _renderingContexts: [{ _kind: "scene", camera: {}, meshes: [auxiliaryNode] }] };
        h.surfaces.push(surface as unknown as SurfaceContext);
        await h.select(auxiliaryNode);
        expect(h.button("Translate")?.disabled).toBe(true);
        expect(Mocks.createLayer).toHaveBeenCalledTimes(1);
    });

    it("disposes removed nodes or cameras and restores the mode when a valid target returns", async () => {
        const h = MakeHarness();
        await h.select(h.mesh);
        await h.click("Scale");
        h.scene.meshes.splice(0, 1);
        await h.refresh();
        expect(Mocks.dispose.Scale).toHaveBeenCalledTimes(1);
        expect(h.button("Scale")?.disabled).toBe(true);
        h.scene.meshes.unshift(h.mesh);
        await h.refresh();
        expect(Mocks.create.Scale).toHaveBeenCalledTimes(2);
        h.scene.camera = null;
        await h.refresh();
        expect(Mocks.dispose.Scale).toHaveBeenCalledTimes(2);
    });

    it("filters only Inspector-owned utility scenes from scene and rendering-context discovery", async () => {
        const h = MakeHarness();
        await h.select(h.mesh);
        await h.click("Translate");
        const layer = Mocks.createLayer.mock.results[0].value;
        const userUtilityScene = { _kind: "scene", meshes: [], name: "UtilityLayer" } as unknown as SceneContext;
        h.engine._renderingContexts.push(layer.scene, userUtilityScene);
        expect(GetSceneContexts(h.engine)).toEqual([h.scene, userUtilityScene]);
        expect(GetInspectableRenderingContexts(h.engine)).toEqual([h.scene, userUtilityScene]);
    });

    it("moves the utility layer when a selected node changes owning scene", async () => {
        const h = MakeHarness();
        const otherScene = { ...h.scene, meshes: [] } as SceneContext;
        h.engine._renderingContexts.push(otherScene);
        await h.select(h.mesh);
        await h.click("Translate");
        h.scene.meshes.splice(0, 1);
        otherScene.meshes.push(h.mesh);
        await h.refresh();
        expect(Mocks.disposeLayer).toHaveBeenCalledTimes(1);
        expect(Mocks.createLayer).toHaveBeenLastCalledWith(h.engine, otherScene);
    });

    it("resets the mode after the last supported scene is removed", async () => {
        const h = MakeHarness();
        await h.select(h.mesh);
        await h.click("Translate");
        h.engine._renderingContexts.length = 0;
        await h.refresh();
        expect(Mocks.disposeLayer).toHaveBeenCalledTimes(1);
        h.engine._renderingContexts.push(h.scene);
        await h.refresh();
        expect(h.button("Translate")?.getAttribute("aria-pressed")).toBe("false");
        expect(Mocks.createLayer).toHaveBeenCalledTimes(1);
    });

    it("serializes async registration and discards stale targets before creating the next mode", async () => {
        const h = MakeHarness();
        const deferred = Deferred();
        Mocks.registerLayer.mockReturnValueOnce(deferred.promise);
        await h.select(h.mesh);
        await h.click("Translate");
        await h.click("Rotate");
        await h.select(h.otherMesh);
        expect(Mocks.create.Rotation).not.toHaveBeenCalled();
        expect(Mocks.dispose.Position).not.toHaveBeenCalled();
        await act(async () => deferred.resolve());
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(Mocks.create.Rotation).toHaveBeenCalledTimes(1);
        expect(Mocks.attach.Rotation).toHaveBeenLastCalledWith(expect.anything(), h.otherMesh);
    });

    it("waits for pending registration before cleanup and never resurrects a disposed Inspector", async () => {
        const h = MakeHarness();
        const deferred = Deferred();
        Mocks.registerLayer.mockReturnValueOnce(deferred.promise);
        await h.select(h.mesh);
        await h.click("Translate");
        await act(async () => {
            h.service.dispose?.();
            h.service.dispose?.();
        });
        expect(Mocks.disposeLayer).not.toHaveBeenCalled();
        await act(async () => deferred.resolve());
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(Mocks.disposeLayer).toHaveBeenCalledTimes(1);
        expect(h.watcherDispose).toHaveBeenCalledTimes(1);
        expect(h.onSelectedEntityChanged.observers).toEqual([]);
    });

    it("reports registration failure, clears the mode, and allows an explicit retry", async () => {
        const warning = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const h = MakeHarness();
        Mocks.registerLayer.mockRejectedValueOnce(new Error("GPU registration failed"));
        await h.select(h.mesh);
        await h.click("Translate");
        expect(warning).toHaveBeenCalledWith(expect.stringContaining("GPU registration failed"));
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(Mocks.disposeLayer).toHaveBeenCalledTimes(1);
        expect(h.button("Translate")?.getAttribute("aria-pressed")).toBe("false");
        await h.click("Translate");
        expect(Mocks.create.Position).toHaveBeenCalledTimes(2);
    });

    it.each(["resolve", "reject"] as const)("waits for a disposed Inspector's %s registration to retire before its replacement creates resources", async (settlement) => {
        const warning = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const h = MakeHarness();
        const deferred = Deferred();
        Mocks.registerLayer.mockReturnValueOnce(deferred.promise);
        await h.select(h.mesh);
        await h.click("Translate");
        const retiredLayer = Mocks.createLayer.mock.results[0].value;
        await act(async () => h.service.dispose?.());
        const replacement = MakeHarness(true, h);
        await replacement.select(h.otherMesh);
        await replacement.click("Rotate");
        expect(Mocks.createLayer).toHaveBeenCalledTimes(1);
        expect(Mocks.create.Rotation).not.toHaveBeenCalled();
        expect(Mocks.disposeLayer).not.toHaveBeenCalled();

        await act(async () => {
            if (settlement === "resolve") {
                deferred.resolve();
            } else {
                deferred.reject(new Error("Retired registration failed"));
            }
        });
        expect(Mocks.dispose.Position).toHaveBeenCalledTimes(1);
        expect(Mocks.disposeLayer).toHaveBeenCalledExactlyOnceWith(retiredLayer);
        expect(Mocks.createLayer).toHaveBeenCalledTimes(2);
        expect(Mocks.create.Rotation).toHaveBeenCalledTimes(1);
        expect(Mocks.attach.Rotation).toHaveBeenLastCalledWith(expect.anything(), h.otherMesh);
        expect(Mocks.dispose.Rotation).not.toHaveBeenCalled();
        expect(Mocks.disposeLayer.mock.invocationCallOrder[0]).toBeLessThan(Mocks.createLayer.mock.invocationCallOrder[1]);
        expect(warning).toHaveBeenCalledTimes(settlement === "reject" ? 1 : 0);
    });

    it("skips a disposed queued replacement and creates only the latest replacement mode and target", async () => {
        const h = MakeHarness();
        const deferred = Deferred();
        Mocks.registerLayer.mockReturnValueOnce(deferred.promise);
        await h.select(h.mesh);
        await h.click("Translate");
        await act(async () => h.service.dispose?.());
        const skipped = MakeHarness(true, h);
        await skipped.select(h.mesh);
        await skipped.click("Rotate");
        await act(async () => skipped.service.dispose?.());
        const replacement = MakeHarness(true, h);
        await replacement.select(h.mesh);
        await replacement.click("Rotate");
        await replacement.click("Scale");
        await replacement.select(h.otherMesh);
        expect(Mocks.createLayer).toHaveBeenCalledTimes(1);
        await act(async () => deferred.resolve());
        expect(Mocks.createLayer).toHaveBeenCalledTimes(2);
        expect(Mocks.create.Rotation).not.toHaveBeenCalled();
        expect(Mocks.create.Scale).toHaveBeenCalledTimes(1);
        expect(Mocks.attach.Scale).toHaveBeenLastCalledWith(expect.anything(), h.otherMesh);
        expect(Mocks.disposeLayer.mock.invocationCallOrder[0]).toBeLessThan(Mocks.createLayer.mock.invocationCallOrder[1]);
    });

    it("does not delay another canvas while a retired Inspector's registration is pending", async () => {
        const h = MakeHarness();
        const deferred = Deferred();
        Mocks.registerLayer.mockReturnValueOnce(deferred.promise);
        await h.select(h.mesh);
        await h.click("Translate");
        await act(async () => h.service.dispose?.());
        const independent = MakeHarness();
        await independent.select(independent.mesh);
        await independent.click("Rotate");
        expect(Mocks.create.Rotation).toHaveBeenCalledTimes(1);
        expect(Mocks.disposeLayer).not.toHaveBeenCalled();
        await act(async () => deferred.resolve());
        expect(Mocks.disposeLayer).toHaveBeenCalledTimes(1);
        expect(Mocks.dispose.Rotation).not.toHaveBeenCalled();
    });
});
