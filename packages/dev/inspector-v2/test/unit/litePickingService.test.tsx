/**
 * @vitest-environment jsdom
 */

import { type EngineContext, type GpuPicker, type Mesh, type PickingInfo, type PickOptions, type SceneContext, type SurfaceContext } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

import { PickingServiceDefinition } from "../../src/lite/services/pickingService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IWatcherService } from "../../src/services/watcherService";

const { CreatePicker, DisposePicker, Pick } = vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
    return {
        CreatePicker: vi.fn<(scene: SceneContext) => GpuPicker>(),
        DisposePicker: vi.fn<(picker: GpuPicker) => void>(),
        Pick: vi.fn<(picker: GpuPicker, x: number, y: number, options?: PickOptions) => Promise<PickingInfo>>(),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    createGpuPicker: CreatePicker,
    disposePicker: DisposePicker,
    pickAsync: Pick,
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

function Deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function Result(mesh: Mesh | null = null): PickingInfo {
    return { hit: !!mesh, pickedMesh: mesh } as PickingInfo;
}

function MakeCanvas(ownerDocument = document) {
    const canvas = ownerDocument.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    Object.defineProperties(canvas, {
        clientWidth: { value: 400 },
        clientHeight: { value: 300 },
    });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, width: 200, height: 150 } as DOMRect);
    ownerDocument.body.appendChild(canvas);
    return canvas;
}

function Pointer(canvas: HTMLCanvasElement, type: string, init: Partial<PointerEvent> = {}) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { pointerId: 1, isPrimary: true, button: 0, clientX: 150, clientY: 75, ...init });
    canvas.dispatchEvent(event);
}

function Tap(canvas: HTMLCanvasElement) {
    Pointer(canvas, "pointerdown");
    Pointer(canvas, "pointerup");
}

describe("Babylon Lite picking service", () => {
    const cleanups: (() => void)[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
        CreatePicker.mockImplementation(() => ({}));
        Pick.mockResolvedValue(Result());
    });

    afterEach(() => {
        act(() =>
            cleanups
                .splice(0)
                .reverse()
                .forEach((cleanup) => cleanup())
        );
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    function MakeHarness(withScene = true, toolbarDocument = document) {
        const canvas = MakeCanvas();
        const engine = { canvas, surfaces: [] } as unknown as EngineContext;
        const surfaces: SurfaceContext[] = [engine];
        Object.assign(engine, { engine, surfaces, _renderingContexts: [] });
        const mesh = { name: "Mesh", visible: true } as Mesh;
        const scene = { _kind: "scene", surface: engine, camera: {}, meshes: [mesh] } as unknown as SceneContext;
        const setScenes = (surface: SurfaceContext, scenes: readonly object[]) => Object.assign(surface, { _renderingContexts: scenes });
        setScenes(engine, withScene ? [scene] : [{ _kind: "sprite-renderer" }, { _kind: "text-renderer" }]);

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

        const container = toolbarDocument.createElement("div");
        toolbarDocument.body.appendChild(container);
        const root: Root = createRoot(container);
        const toolbarDispose = vi.fn(() => root.render(null));
        const shell = {
            addToolbarItem: vi.fn((options: Parameters<IShellService["addToolbarItem"]>[0]) => {
                const Toolbar = options.component;
                act(() =>
                    root.render(
                        <FluentProvider theme={webLightTheme} targetDocument={toolbarDocument}>
                            <Toolbar />
                        </FluentProvider>
                    )
                );
                return { dispose: toolbarDispose };
            }),
        } as unknown as IShellService;
        let refresh!: () => void;
        const watcherDispose = vi.fn();
        const watcher = {
            watchValue: vi.fn(
                (
                    getValue: () => readonly SceneContext[],
                    onChanged: (value: readonly SceneContext[]) => void,
                    equals: (left: readonly SceneContext[], right: readonly SceneContext[]) => boolean
                ) => {
                    let previous = getValue();
                    refresh = () => {
                        const current = getValue();
                        if (!equals(previous, current)) {
                            previous = current;
                            onChanged(current);
                        }
                    };
                    return { dispose: watcherDispose };
                }
            ),
        } as unknown as IWatcherService;
        const service = PickingServiceDefinition.factory({ engine }, shell, selection, watcher);
        if (!service?.dispose) {
            throw new Error("Expected a disposable picking service.");
        }
        cleanups.push(
            () => root.unmount(),
            () => service.dispose?.()
        );

        const toggle = () => act(() => container.querySelector("button")!.click());
        const auxiliary = (ownerDocument = document) => {
            const auxiliaryCanvas = MakeCanvas(ownerDocument);
            const surface = { canvas: auxiliaryCanvas, engine } as SurfaceContext;
            surfaces.push(surface);
            const auxiliaryMesh = { name: "Auxiliary Mesh" } as Mesh;
            const auxiliaryScene = { _kind: "scene", surface, camera: {}, meshes: [auxiliaryMesh] } as unknown as SceneContext;
            setScenes(surface, [auxiliaryScene]);
            return { canvas: auxiliaryCanvas, surface, scene: auxiliaryScene, mesh: auxiliaryMesh };
        };

        return {
            canvas,
            engine,
            surfaces,
            scene,
            mesh,
            selection,
            onSelectedEntityChanged,
            toggle,
            refresh,
            setScenes,
            auxiliary,
            container,
            service,
            shell,
            toolbarDispose,
            watcherDispose,
        };
    }

    it("registers the toolbar only while a scene exists, even when picking is disabled", () => {
        const h = MakeHarness(false);
        expect(h.container.querySelector("button")).toBeNull();
        expect(h.shell.addToolbarItem).not.toHaveBeenCalled();

        h.setScenes(h.engine, [h.scene]);
        act(() => h.refresh());
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
        expect(h.shell.addToolbarItem).toHaveBeenCalledTimes(1);
        act(() => h.refresh());
        expect(h.shell.addToolbarItem).toHaveBeenCalledTimes(1);
        expect(CreatePicker).not.toHaveBeenCalled();

        h.setScenes(h.engine, []);
        act(() => h.refresh());
        expect(h.container.querySelector("button")).toBeNull();
        expect(h.toolbarDispose).toHaveBeenCalledTimes(1);
    });

    it("shows the toolbar for an auxiliary-only scene and keeps it while another scene remains", () => {
        const h = MakeHarness(false);
        const auxiliary = h.auxiliary();
        act(() => h.refresh());
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
        h.toggle();
        expect(auxiliary.canvas.style.cursor).toBe("crosshair");
        expect(h.canvas.style.cursor).toBe("");

        h.setScenes(h.engine, [h.scene]);
        h.setScenes(auxiliary.surface, []);
        act(() => h.refresh());
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
        expect(h.shell.addToolbarItem).toHaveBeenCalledTimes(1);
        expect(h.toolbarDispose).not.toHaveBeenCalled();
        expect(auxiliary.canvas.style.cursor).toBe("");
        expect(h.canvas.style.cursor).toBe("crosshair");
    });

    it("exits picking when the last scene is removed and restores the toolbar disabled without accepting stale GPU results", async () => {
        const h = MakeHarness();
        const deferred = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(deferred.promise);
        h.toggle();
        Tap(h.canvas);
        const picker = CreatePicker.mock.results[0].value;

        h.setScenes(h.engine, [{ _kind: "sprite-renderer" }]);
        act(() => h.refresh());
        expect(h.container.querySelector("button")).toBeNull();
        expect(h.canvas.style.cursor).toBe("");
        expect(DisposePicker).not.toHaveBeenCalled();

        h.setScenes(h.engine, [h.scene]);
        act(() => h.refresh());
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
        expect(h.canvas.style.cursor).toBe("");
        expect(h.shell.addToolbarItem).toHaveBeenCalledTimes(2);
        await act(async () => deferred.resolve(Result(h.mesh)));
        expect(h.selection.selectedEntity).toBe(h.engine);
        expect(DisposePicker).toHaveBeenCalledExactlyOnceWith(picker);
    });

    it("is opt-in, maps transformed CSS coordinates without applying DPR, and reuses the scene picker", async () => {
        const consoleError = vi.spyOn(console, "error");
        const h = MakeHarness();
        h.canvas.style.cursor = "grab";
        Tap(h.canvas);
        expect(CreatePicker).not.toHaveBeenCalled();
        h.toggle();
        expect(h.canvas.style.cursor).toBe("crosshair");
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");

        Pick.mockResolvedValue(Result(h.mesh));
        await act(async () => Tap(h.canvas));
        expect(CreatePicker).toHaveBeenCalledWith(h.scene);
        expect(Pick).toHaveBeenCalledWith(expect.anything(), 100, 50, expect.objectContaining({ filter: expect.any(Function) }));
        expect(h.selection.selectedEntity).toBe(h.mesh);
        await act(async () => Tap(h.canvas));
        expect(CreatePicker).toHaveBeenCalledTimes(1);

        h.toggle();
        expect(h.canvas.style.cursor).toBe("grab");
        expect(DisposePicker).toHaveBeenCalledTimes(1);
        Tap(h.canvas);
        expect(Pick).toHaveBeenCalledTimes(2);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("accounts for canvas borders and ignores taps outside the canvas content", async () => {
        const h = MakeHarness();
        Object.defineProperties(h.canvas, {
            offsetWidth: { value: 404 },
            offsetHeight: { value: 304 },
            clientLeft: { value: 2 },
            clientTop: { value: 2 },
        });
        vi.spyOn(h.canvas, "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, width: 202, height: 152 } as DOMRect);
        h.toggle();
        await act(async () => {
            Pointer(h.canvas, "pointerdown", { clientX: 151, clientY: 76 });
            Pointer(h.canvas, "pointerup", { clientX: 151, clientY: 76 });
        });
        expect(Pick).toHaveBeenCalledWith(expect.anything(), 100, 50, expect.anything());
        Pointer(h.canvas, "pointerdown", { clientX: 100.5, clientY: 51 });
        Pointer(h.canvas, "pointerup", { clientX: 100.5, clientY: 51 });
        expect(Pick).toHaveBeenCalledTimes(1);
    });

    it("does not pick camera drags, secondary pointers, non-left clicks, cancelled gestures, or unmatched pointerups", () => {
        const h = MakeHarness();
        h.toggle();
        Pointer(h.canvas, "pointerup");
        Pointer(h.canvas, "pointerdown");
        Pointer(h.canvas, "pointermove", { clientX: 200 });
        Pointer(h.canvas, "pointerup");
        Pointer(h.canvas, "pointerdown", { button: 2 });
        Pointer(h.canvas, "pointerup", { button: 2 });
        Pointer(h.canvas, "pointerdown", { isPrimary: false });
        Pointer(h.canvas, "pointerup", { isPrimary: false });
        Pointer(h.canvas, "pointerdown");
        Pointer(h.canvas, "pointercancel");
        Pointer(h.canvas, "pointerup");
        Pointer(h.canvas, "pointerdown");
        Pointer(h.canvas, "pointerup", { clientX: 156 });
        expect(Pick).not.toHaveBeenCalled();
    });

    it("preserves selection on a miss and excludes hidden meshes using the public mesh filter", async () => {
        const h = MakeHarness();
        h.toggle();
        await act(async () => Tap(h.canvas));
        expect(h.selection.selectedEntity).toBe(h.engine);
        const filter = Pick.mock.calls[0][3]?.filter;
        expect(filter?.(h.mesh)).toBe(true);
        h.mesh.visible = false;
        expect(filter?.(h.mesh)).toBe(false);
    });

    it("clears a gesture when the pointer leaves the canvas and still accepts the next tap", async () => {
        const h = MakeHarness();
        h.toggle();
        Pointer(h.canvas, "pointerdown");
        Pointer(h.canvas, "pointerleave");
        Pointer(h.canvas, "pointerup");
        expect(Pick).not.toHaveBeenCalled();

        Pick.mockResolvedValueOnce(Result(h.mesh));
        await act(async () => Tap(h.canvas));
        expect(Pick).toHaveBeenCalledTimes(1);
        expect(h.selection.selectedEntity).toBe(h.mesh);
    });

    it("exits picking on Escape from an undocked toolbar document and cleans up its listener", () => {
        const frame = document.createElement("iframe");
        document.body.appendChild(frame);
        const toolbarDocument = frame.contentDocument!;
        const addListener = vi.spyOn(toolbarDocument, "addEventListener");
        const removeListener = vi.spyOn(toolbarDocument, "removeEventListener");
        const h = MakeHarness(true, toolbarDocument);
        h.canvas.style.cursor = "grab";
        h.toggle();
        const button = h.container.querySelector("button")!;
        button.focus();
        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(h.canvas.ownerDocument).not.toBe(toolbarDocument);

        act(() => button.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(h.canvas.style.cursor).toBe("grab");

        const handler = addListener.mock.calls.filter(([name, , options]) => name === "keydown" && options === undefined).pop()?.[1];
        expect(handler).toBeDefined();
        act(() => h.service.dispose?.());
        expect(removeListener).toHaveBeenCalledWith("keydown", handler);
    });

    it("retains Escape handling for auxiliary canvas documents", () => {
        const h = MakeHarness();
        const auxiliary = h.auxiliary();
        const auxiliaryDocument = document.implementation.createHTMLDocument("Auxiliary canvas");
        auxiliaryDocument.body.appendChild(auxiliary.canvas);
        act(() => h.refresh());
        h.toggle();
        expect(auxiliary.canvas.style.cursor).toBe("crosshair");

        act(() => auxiliaryDocument.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
        expect(h.container.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
        expect(auxiliary.canvas.style.cursor).toBe("");
        expect(h.canvas.style.cursor).toBe("");
    });

    it.each(["Escape", "toggle", "dispose"] as const)("picks an auxiliary canvas created in a child document and cleans up on %s", async (exit) => {
        const h = MakeHarness();
        h.toggle();
        const frame = document.createElement("iframe");
        document.body.appendChild(frame);
        const auxiliaryDocument = frame.contentDocument!;
        const auxiliary = h.auxiliary(auxiliaryDocument);
        expect(auxiliary.canvas.ownerDocument).toBe(auxiliaryDocument);
        expect(auxiliary.canvas).not.toBeInstanceOf(HTMLCanvasElement);
        auxiliary.canvas.style.cursor = "grab";
        const addListener = vi.spyOn(auxiliaryDocument, "addEventListener");
        const removeListener = vi.spyOn(auxiliaryDocument, "removeEventListener");

        act(() => h.refresh());
        expect(auxiliary.canvas.style.cursor).toBe("crosshair");
        Pick.mockResolvedValueOnce(Result(auxiliary.mesh));
        await act(async () => Tap(auxiliary.canvas));
        expect(CreatePicker).toHaveBeenCalledTimes(1);
        // Avoid serializing the child-window DOM in Chai's mock argument formatter.
        expect(CreatePicker.mock.calls[0][0] === auxiliary.scene).toBe(true);
        expect(Pick).toHaveBeenCalledWith(expect.anything(), 100, 50, expect.anything());
        expect(h.selection.selectedEntity).toBe(auxiliary.mesh);

        const handler = addListener.mock.calls.find(([name]) => name === "keydown")?.[1];
        expect(handler).toBeDefined();
        act(() => {
            if (exit === "Escape") {
                auxiliaryDocument.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            } else if (exit === "toggle") {
                h.toggle();
            } else {
                h.service.dispose?.();
            }
        });
        expect(auxiliary.canvas.style.cursor).toBe("grab");
        expect(removeListener).toHaveBeenCalledWith("keydown", handler);
        expect(DisposePicker).toHaveBeenCalledTimes(1);
        Tap(auxiliary.canvas);
        expect(Pick).toHaveBeenCalledTimes(1);
    });

    it.each(["Escape", "toggle", "dispose"] as const)("invalidates pending results on %s and defers GPU disposal until readback finishes", async (exit) => {
        const h = MakeHarness();
        const deferred = Deferred<PickingInfo>();
        Pick.mockReturnValue(deferred.promise);
        h.toggle();
        Tap(h.canvas);
        const picker = CreatePicker.mock.results[0].value;
        act(() => {
            if (exit === "Escape") {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            } else if (exit === "toggle") {
                h.toggle();
            } else {
                h.service.dispose?.();
            }
        });
        expect(h.canvas.style.cursor).toBe("");
        expect(DisposePicker).not.toHaveBeenCalled();
        await act(async () => deferred.resolve(Result(h.mesh)));
        expect(h.selection.selectedEntity).toBe(h.engine);
        expect(DisposePicker).toHaveBeenCalledExactlyOnceWith(picker);
    });

    it("applies only the latest click and does not overwrite a later Explorer selection", async () => {
        const h = MakeHarness();
        const first = Deferred<PickingInfo>();
        const second = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        h.toggle();
        Tap(h.canvas);
        Tap(h.canvas);
        const secondMesh = { name: "Second Mesh" } as Mesh;
        h.scene.meshes.push(secondMesh);
        await act(async () => second.resolve(Result(secondMesh)));
        await act(async () => first.resolve(Result(h.mesh)));
        expect(h.selection.selectedEntity).toBe(secondMesh);

        const third = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(third.promise);
        Tap(h.canvas);
        h.selection.selectedEntity = h.scene;
        await act(async () => third.resolve(Result(h.mesh)));
        expect(h.selection.selectedEntity).toBe(h.scene);
    });

    it("does not revive a retired picker when picking is re-enabled before overlapping requests finish", async () => {
        const h = MakeHarness();
        const first = Deferred<PickingInfo>();
        const second = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        h.toggle();
        Tap(h.canvas);
        Tap(h.canvas);
        const oldPicker = CreatePicker.mock.results[0].value;
        h.toggle();
        h.toggle();
        Pick.mockResolvedValueOnce(Result(h.mesh));
        await act(async () => Tap(h.canvas));
        expect(CreatePicker).toHaveBeenCalledTimes(2);
        expect(h.selection.selectedEntity).toBe(h.mesh);
        await act(async () => first.resolve(Result()));
        expect(DisposePicker).not.toHaveBeenCalled();
        await act(async () => second.resolve(Result()));
        expect(DisposePicker).toHaveBeenCalledExactlyOnceWith(oldPicker);
        expect(h.selection.selectedEntity).toBe(h.mesh);
    });

    it("binds newly registered auxiliary scene canvases and retires removed scenes, including in-flight picks", async () => {
        const h = MakeHarness();
        h.toggle();
        const auxiliary = h.auxiliary();
        act(() => h.refresh());
        expect(auxiliary.canvas.style.cursor).toBe("crosshair");
        const deferred = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(deferred.promise);
        Tap(auxiliary.canvas);
        expect(CreatePicker).toHaveBeenCalledWith(auxiliary.scene);
        h.setScenes(auxiliary.surface, []);
        act(() => h.refresh());
        expect(auxiliary.canvas.style.cursor).toBe("");
        expect(DisposePicker).not.toHaveBeenCalled();
        await act(async () => deferred.resolve(Result(auxiliary.mesh)));
        expect(h.selection.selectedEntity).toBe(h.engine);
        expect(DisposePicker).toHaveBeenCalledTimes(1);
        Tap(auxiliary.canvas);
        expect(Pick).toHaveBeenCalledTimes(1);
    });

    it("picks scenes in reverse rendering order on only the clicked surface", async () => {
        const h = MakeHarness();
        const topMesh = { name: "Top Mesh" } as Mesh;
        const topScene = { _kind: "scene", surface: h.engine, camera: {}, meshes: [topMesh] } as unknown as SceneContext;
        h.setScenes(h.engine, [h.scene, topScene]);
        h.auxiliary();
        h.toggle();
        Pick.mockResolvedValueOnce(Result()).mockResolvedValueOnce(Result(h.mesh));
        await act(async () => Tap(h.canvas));
        expect(CreatePicker.mock.calls.map(([scene]) => scene)).toEqual([topScene, h.scene]);
        expect(h.selection.selectedEntity).toBe(h.mesh);
    });

    it.each(["mesh", "camera", "scene", "visibility", "pickability"] as const)("ignores a pending hit after its %s changes, even before a watcher refresh", async (target) => {
        const h = MakeHarness();
        const deferred = Deferred<PickingInfo>();
        Pick.mockReturnValueOnce(deferred.promise);
        h.toggle();
        Tap(h.canvas);
        if (target === "mesh") {
            h.scene.meshes.length = 0;
        } else if (target === "camera") {
            h.scene.camera = null;
        } else if (target === "scene") {
            h.setScenes(h.engine, []);
        } else if (target === "visibility") {
            h.mesh.visible = false;
        } else {
            h.mesh.pickable = false;
        }
        await act(async () => deferred.resolve(Result(h.mesh)));
        expect(h.selection.selectedEntity).toBe(h.engine);
    });

    it("logs GPU failures explicitly and remains usable for another pick", async () => {
        const h = MakeHarness();
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => undefined);
        h.toggle();
        Pick.mockRejectedValueOnce(new Error("GPU unavailable"));
        await act(async () => Tap(h.canvas));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("GPU unavailable"));
        expect(h.selection.selectedEntity).toBe(h.engine);
        Pick.mockResolvedValueOnce(Result(h.mesh));
        await act(async () => Tap(h.canvas));
        expect(h.selection.selectedEntity).toBe(h.mesh);
    });

    it("skips scenes without cameras and does not bind non-scene or offscreen surfaces", async () => {
        const h = MakeHarness();
        const auxiliary = h.auxiliary();
        h.setScenes(auxiliary.surface, [{ _kind: "sprite-renderer" }]);
        const offscreen = { canvas: {}, engine: h.engine } as SurfaceContext;
        h.surfaces.push(offscreen);
        h.setScenes(offscreen, [{ _kind: "scene", surface: offscreen, camera: {}, meshes: [h.mesh] }]);
        h.scene.camera = null;
        h.toggle();
        await act(async () => {
            Tap(h.canvas);
            Tap(auxiliary.canvas);
        });
        expect(auxiliary.canvas.style.cursor).toBe("");
        expect(CreatePicker).not.toHaveBeenCalled();
    });

    it("removes UI registrations, watchers, keyboard listeners, and selection observers on disposal", async () => {
        const h = MakeHarness();
        h.toggle();
        await act(async () => Tap(h.canvas));
        act(() => h.service.dispose?.());
        expect(h.toolbarDispose).toHaveBeenCalledTimes(1);
        expect(h.watcherDispose).toHaveBeenCalledTimes(1);
        expect(h.onSelectedEntityChanged.observers).toHaveLength(0);
        expect(DisposePicker).toHaveBeenCalledTimes(1);
        expect(h.canvas.style.cursor).toBe("");
        Tap(h.canvas);
        expect(Pick).toHaveBeenCalledTimes(1);
    });
});
