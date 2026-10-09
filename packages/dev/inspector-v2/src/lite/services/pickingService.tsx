import { createGpuPicker, disposePicker, pickAsync, type GpuPicker, type PickingInfo, type SceneContext } from "@babylonjs/lite";
import { TargetRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { useKeyListener } from "shared-ui-components/fluent/hooks/keyboardHooks";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { type ISelectionService, SelectionServiceIdentity } from "../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../engineContext";
import { GetSceneContexts } from "../sceneEntityUtils";

type PickerState = {
    picker: GpuPicker;
    pending: number;
    retired: boolean;
};

/**
 * Adds opt-in mesh picking to the canvases hosting Babylon Lite scenes.
 * Picking uses CSS canvas coordinates and updates the shared Inspector selection.
 */
export const PickingServiceDefinition: ServiceDefinition<[], [IEngineContext, IShellService, ISelectionService, IWatcherService]> = {
    friendlyName: "Babylon Lite Picking",
    consumes: [EngineContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, selectionService, watcherService) => {
        const onChanged = new Observable<void>();
        const pickers = new Map<SceneContext, PickerState>();
        const canvasBindings = new Map<HTMLCanvasElement, () => void>();
        const documentBindings = new Map<Document, () => void>();
        let toolbarRegistration: ReturnType<IShellService["addToolbarItem"]> | undefined;
        let enabled = false;
        let disposed = false;
        let generation = 0;

        const retirePicker = (scene: SceneContext, state: PickerState) => {
            pickers.delete(scene);
            state.retired = true;
            // GPU readback cannot be cancelled. Keep its buffers alive until all outstanding picks finish.
            if (state.pending === 0) {
                disposePicker(state.picker);
            }
        };

        const pickCanvasAsync = async (canvas: HTMLCanvasElement, x: number, y: number) => {
            const requestGeneration = ++generation;
            const scenes = GetSceneContexts(engineContext.engine).filter((scene) => scene.surface.canvas === canvas);
            const isCurrent = () => !disposed && enabled && generation === requestGeneration;

            try {
                // Later scenes render over earlier ones on the same surface.
                for (const scene of scenes.reverse()) {
                    if (!isCurrent()) {
                        return;
                    }
                    const camera = scene.camera;
                    if (!camera || scene.meshes.length === 0) {
                        continue;
                    }
                    let state = pickers.get(scene);
                    if (!state) {
                        state = { picker: createGpuPicker(scene), pending: 0, retired: false };
                        pickers.set(scene, state);
                    }

                    state.pending++;
                    let result: PickingInfo;
                    try {
                        // Lite serializes overlapping requests on each picker. A mesh filter also excludes
                        // contributors (such as billboards) that do not yet have Inspector selection support.
                        // eslint-disable-next-line no-await-in-loop
                        result = await pickAsync(state.picker, x, y, { filter: (mesh) => mesh.visible !== false });
                    } finally {
                        state.pending--;
                        if (state.retired && state.pending === 0) {
                            disposePicker(state.picker);
                        }
                    }

                    if (!isCurrent() || state.retired || scene.camera !== camera || !GetSceneContexts(engineContext.engine).includes(scene)) {
                        return;
                    }
                    if (result.hit && result.pickedMesh && scene.meshes.some((mesh) => mesh === result.pickedMesh && mesh.visible !== false && mesh.pickable !== false)) {
                        selectionService.selectedEntity = result.pickedMesh;
                        return;
                    }
                }
            } catch (error) {
                Logger.Warn(`Babylon Lite GPU picking failed: ${error}`);
            }
        };

        const bindCanvas = (canvas: HTMLCanvasElement) => {
            const originalCursor = canvas.style.cursor;
            canvas.style.cursor = "crosshair";
            let pointer: { id: number; x: number; y: number; dragged: boolean } | undefined;
            const isDragged = (event: PointerEvent) => !!pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5;
            const onPointerDown = (event: PointerEvent) => {
                pointer = event.isPrimary && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false } : undefined;
            };
            const onPointerMove = (event: PointerEvent) => {
                if (pointer?.id === event.pointerId && isDragged(event)) {
                    pointer.dragged = true;
                }
            };
            const onPointerCancel = () => {
                pointer = undefined;
            };
            const onPointerUp = (event: PointerEvent) => {
                const tap = pointer?.id === event.pointerId && event.button === 0 && !pointer.dragged && !isDragged(event);
                pointer = undefined;
                if (!tap) {
                    return;
                }
                const rect = canvas.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) {
                    return;
                }
                // Account for CSS scaling without applying DPR; Lite's picker handles backing-store scaling.
                const x = ((event.clientX - rect.left) * (canvas.offsetWidth || canvas.clientWidth)) / rect.width - canvas.clientLeft;
                const y = ((event.clientY - rect.top) * (canvas.offsetHeight || canvas.clientHeight)) / rect.height - canvas.clientTop;
                if (x < 0 || y < 0 || x >= canvas.clientWidth || y >= canvas.clientHeight) {
                    return;
                }
                void pickCanvasAsync(canvas, x, y);
            };
            canvas.addEventListener("pointerdown", onPointerDown);
            canvas.addEventListener("pointermove", onPointerMove);
            canvas.addEventListener("pointerup", onPointerUp);
            canvas.addEventListener("pointercancel", onPointerCancel);
            canvas.addEventListener("pointerleave", onPointerCancel);
            return () => {
                canvas.removeEventListener("pointerdown", onPointerDown);
                canvas.removeEventListener("pointermove", onPointerMove);
                canvas.removeEventListener("pointerup", onPointerUp);
                canvas.removeEventListener("pointercancel", onPointerCancel);
                canvas.removeEventListener("pointerleave", onPointerCancel);
                canvas.style.cursor = originalCursor;
            };
        };

        const refresh = () => {
            const scenes = disposed ? [] : GetSceneContexts(engineContext.engine);
            if (scenes.length === 0) {
                enabled = false;
                toolbarRegistration?.dispose();
                toolbarRegistration = undefined;
            } else if (!toolbarRegistration) {
                toolbarRegistration = shellService.addToolbarItem({
                    key: "Picking Service",
                    verticalLocation: "top",
                    horizontalLocation: "left",
                    teachingMoment: false,
                    component: pickingToolbar,
                });
            }
            const activeScenes = enabled ? scenes : [];
            const canvases = new Set(activeScenes.map((scene) => scene.surface.canvas).filter((canvas): canvas is HTMLCanvasElement => canvas instanceof HTMLCanvasElement));
            const documents = new Set([...canvases].map((canvas) => canvas.ownerDocument));
            for (const [canvas, unbind] of canvasBindings) {
                if (!canvases.has(canvas)) {
                    unbind();
                    canvasBindings.delete(canvas);
                }
            }
            for (const canvas of canvases) {
                if (!canvasBindings.has(canvas)) {
                    canvasBindings.set(canvas, bindCanvas(canvas));
                }
            }
            for (const [document, unbind] of documentBindings) {
                if (!documents.has(document)) {
                    unbind();
                    documentBindings.delete(document);
                }
            }
            for (const document of documents) {
                if (!documentBindings.has(document)) {
                    const onKeyDown = (event: KeyboardEvent) => {
                        if (event.key === "Escape") {
                            setEnabled(false);
                        }
                    };
                    document.addEventListener("keydown", onKeyDown);
                    documentBindings.set(document, () => document.removeEventListener("keydown", onKeyDown));
                }
            }
            for (const [scene, state] of pickers) {
                if (!activeScenes.includes(scene)) {
                    retirePicker(scene, state);
                }
            }
        };

        const setEnabled = (value: boolean) => {
            if (disposed || enabled === value) {
                return;
            }
            enabled = value;
            generation++;
            refresh();
            onChanged.notifyObservers();
        };
        const pickingToolbar: FunctionComponent = () => {
            const pickingEnabled = useObservableState(() => enabled, onChanged);
            useKeyListener({
                onKeyDown: (event) => {
                    if (event.key === "Escape") {
                        setEnabled(false);
                    }
                },
            });
            return (
                <ToggleButton
                    title={`${pickingEnabled ? "Disable" : "Enable"} Picking`}
                    appearance="transparent"
                    checkedIcon={TargetRegular}
                    value={pickingEnabled}
                    onChange={setEnabled}
                />
            );
        };
        const selectionObserver = selectionService.onSelectedEntityChanged.add(() => generation++);
        const topologyWatcher = watcherService.watchValue(
            () => GetSceneContexts(engineContext.engine),
            () => {
                generation++;
                refresh();
            },
            (left, right) => left.length === right.length && left.every((scene, index) => scene === right[index])
        );
        refresh();

        return {
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                generation++;
                refresh();
                topologyWatcher.dispose();
                selectionObserver.remove();
                onChanged.clear();
            },
        };
    },
};
