import {
    attachBoundingBoxGizmoToNode,
    attachPositionGizmoToNode,
    attachRotationGizmoToNode,
    attachScaleGizmoToNode,
    createBoundingBoxGizmo,
    createPositionGizmo,
    createRotationGizmo,
    createScaleGizmo,
    createUtilityLayer,
    disposeBoundingBoxGizmo,
    disposePositionGizmo,
    disposeRotationGizmo,
    disposeScaleGizmo,
    disposeUtilityLayer,
    isGizmoDragging,
    isGizmoPickPending,
    registerUtilityLayer,
    setPositionGizmoLocalCoordinates,
    setRotationGizmoLocalCoordinates,
    setScaleGizmoLocalCoordinates,
    type EngineContext,
    type SceneContext,
    type SceneNode,
    type UtilityLayer,
} from "@babylonjs/lite";
import { ArrowExpandRegular, ArrowRotateClockwiseRegular, CubeRegular, GlobeRegular, SelectObjectRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { TranslateIcon } from "shared-ui-components/fluent/icons";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { type ISelectionService, SelectionServiceIdentity } from "../../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "../engineContext";
import { GetSceneContexts, GetSceneNodes, InspectorUtilityScenes, IsSceneNode } from "../sceneEntityUtils";

type GizmoMode = "translate" | "rotate" | "scale" | "boundingBox";

function CreateGizmo(engine: EngineContext, layer: UtilityLayer, mode: GizmoMode) {
    switch (mode) {
        case "translate": {
            const gizmo = createPositionGizmo(engine, layer);
            return {
                attach: (node: SceneNode) => attachPositionGizmoToNode(gizmo, node),
                setLocalCoordinates: (local: boolean) => setPositionGizmoLocalCoordinates(gizmo, local),
                dispose: () => disposePositionGizmo(gizmo, layer),
            };
        }
        case "rotate": {
            const gizmo = createRotationGizmo(engine, layer);
            return {
                attach: (node: SceneNode) => attachRotationGizmoToNode(gizmo, node),
                setLocalCoordinates: (local: boolean) => setRotationGizmoLocalCoordinates(gizmo, local),
                dispose: () => disposeRotationGizmo(gizmo, layer),
            };
        }
        case "scale": {
            const gizmo = createScaleGizmo(engine, layer);
            setScaleGizmoLocalCoordinates(gizmo, true);
            return {
                attach: (node: SceneNode) => attachScaleGizmoToNode(gizmo, node),
                setLocalCoordinates: undefined,
                dispose: () => disposeScaleGizmo(gizmo, layer),
            };
        }
        case "boundingBox": {
            const gizmo = createBoundingBoxGizmo(engine, layer);
            return {
                attach: (node: SceneNode) => attachBoundingBoxGizmoToNode(gizmo, node),
                setLocalCoordinates: undefined,
                dispose: () => disposeBoundingBoxGizmo(gizmo, layer),
            };
        }
    }
}

/**
 * Adds opt-in transform gizmos for scene nodes on Babylon Lite's primary HTML canvas.
 * Native Lite utility layers own the rendering, picking, and transform manipulation.
 */
export const GizmoServiceDefinition: ServiceDefinition<[], [IEngineContext, IShellService, ISelectionService, IWatcherService]> = {
    friendlyName: "Babylon Lite Gizmos",
    consumes: [EngineContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, selectionService, watcherService) => {
        const engine = engineContext.engine;
        const onChanged = new Observable<void>();
        let mode: GizmoMode | undefined;
        let localCoordinates = true;
        let disposed = false;
        let updating = false;
        let generation = 0;
        let toolbarRegistration: ReturnType<IShellService["addToolbarItem"]> | undefined;
        let active:
            { scene: SceneContext; node: SceneNode; mode: GizmoMode; layer: UtilityLayer; gizmo: ReturnType<typeof CreateGizmo>; unbindCameraGuard?: () => void } | undefined;

        const getScenes = () => GetSceneContexts(engine).filter((scene) => scene.surface === engine && "ownerDocument" in engine.canvas);
        const getTarget = () => {
            const node = selectionService.selectedEntity;
            if (!IsSceneNode(node)) {
                return undefined;
            }
            const scene = getScenes().find((scene) => scene.camera && GetSceneNodes(scene).includes(node));
            return scene ? { scene, node } : undefined;
        };
        const destroyActive = () => {
            if (active) {
                active.unbindCameraGuard?.();
                active.gizmo.dispose();
                disposeUtilityLayer(active.layer);
                active = undefined;
            }
        };

        const syncAsync = async () => {
            updating = true;
            let requestGeneration = generation;
            try {
                do {
                    requestGeneration = generation;
                    const target = disposed || !mode ? undefined : getTarget();
                    if (!target || active?.scene !== target.scene || active.mode !== mode) {
                        destroyActive();
                    }
                    if (target && mode) {
                        if (active) {
                            if (active.node !== target.node) {
                                active.node = target.node;
                                active.gizmo.attach(target.node);
                            }
                            active.gizmo.setLocalCoordinates?.(localCoordinates);
                        } else {
                            const nextMode = mode;
                            const layer = createUtilityLayer(engine, target.scene);
                            InspectorUtilityScenes.add(layer.scene);
                            let gizmo: ReturnType<typeof CreateGizmo> | undefined;
                            let unbindCameraGuard: (() => void) | undefined;
                            let retained = false;
                            try {
                                gizmo = CreateGizmo(engine, layer, nextMode);
                                if ("ownerDocument" in engine.canvas) {
                                    const canvas = engine.canvas;
                                    const onPointerMove = (event: PointerEvent) => {
                                        if (isGizmoDragging(canvas) || isGizmoPickPending(canvas)) {
                                            event.stopPropagation();
                                        }
                                    };
                                    // Run after Lite's capture-phase dispatcher, before application camera controls.
                                    canvas.addEventListener("pointermove", onPointerMove, true);
                                    unbindCameraGuard = () => canvas.removeEventListener("pointermove", onPointerMove, true);
                                }
                                gizmo.attach(target.node);
                                gizmo.setLocalCoordinates?.(localCoordinates);
                                // Serialize creation: Lite allows only one gizmo dispatcher/layer per canvas.
                                // Keep resources alive until registration settles, even if selection changes.
                                // eslint-disable-next-line no-await-in-loop
                                await registerUtilityLayer(layer);
                                const latest = getTarget();
                                if (!disposed && mode === nextMode && latest?.scene === target.scene && latest.node === target.node) {
                                    gizmo.setLocalCoordinates?.(localCoordinates);
                                    // eslint-disable-next-line require-atomic-updates -- Target and mode are rechecked after registration.
                                    active = { ...target, mode: nextMode, layer, gizmo, unbindCameraGuard };
                                    retained = true;
                                }
                            } finally {
                                if (!retained) {
                                    unbindCameraGuard?.();
                                    gizmo?.dispose();
                                    disposeUtilityLayer(layer);
                                }
                            }
                        }
                    }
                } while (!disposed && requestGeneration !== generation);
            } catch (error) {
                Logger.Warn(`Babylon Lite gizmo creation failed: ${error}`);
                if (requestGeneration === generation) {
                    // eslint-disable-next-line require-atomic-updates -- Only the current failed request resets the mode.
                    mode = undefined;
                    onChanged.notifyObservers();
                }
            } finally {
                updating = false;
                if (!disposed && requestGeneration !== generation) {
                    void syncAsync();
                }
            }
        };
        const sync = () => {
            generation++;
            if (!updating) {
                void syncAsync();
            }
        };
        const refresh = () => {
            const scenes = disposed ? [] : getScenes();
            if (scenes.length === 0) {
                mode = undefined;
                toolbarRegistration?.dispose();
                toolbarRegistration = undefined;
            } else if (!toolbarRegistration) {
                toolbarRegistration = shellService.addToolbarItem({
                    key: "Gizmo Toolbar",
                    verticalLocation: "top",
                    horizontalLocation: "left",
                    teachingMoment: false,
                    component: gizmoToolbar,
                });
            }
            sync();
            onChanged.notifyObservers();
        };
        const getToolbarState = () => ({ mode, localCoordinates, enabled: !!getTarget() });
        const gizmoToolbar: FunctionComponent = () => {
            const state = useObservableState(getToolbarState, onChanged);
            const toggleMode = (value: GizmoMode) => {
                mode = mode === value ? undefined : value;
                sync();
                onChanged.notifyObservers();
            };
            return (
                <>
                    <ToggleButton
                        title="Translate"
                        checkedIcon={TranslateIcon}
                        disabled={!state.enabled}
                        value={state.mode === "translate"}
                        onChange={() => toggleMode("translate")}
                    />
                    <ToggleButton
                        title="Rotate"
                        checkedIcon={ArrowRotateClockwiseRegular}
                        disabled={!state.enabled}
                        value={state.mode === "rotate"}
                        onChange={() => toggleMode("rotate")}
                    />
                    <ToggleButton title="Scale" checkedIcon={ArrowExpandRegular} disabled={!state.enabled} value={state.mode === "scale"} onChange={() => toggleMode("scale")} />
                    <ToggleButton
                        title="Bounding Box"
                        checkedIcon={SelectObjectRegular}
                        disabled={!state.enabled}
                        value={state.mode === "boundingBox"}
                        onChange={() => toggleMode("boundingBox")}
                    />
                    <Collapse visible={state.mode === "translate" || state.mode === "rotate"} orientation="horizontal">
                        <ToggleButton
                            title={state.localCoordinates ? "Local Coordinates" : "World Coordinates"}
                            checkedIcon={CubeRegular}
                            uncheckedIcon={GlobeRegular}
                            value={state.localCoordinates}
                            onChange={(value) => {
                                localCoordinates = value;
                                active?.gizmo.setLocalCoordinates?.(value);
                                onChanged.notifyObservers();
                            }}
                        />
                    </Collapse>
                </>
            );
        };
        const selectionObserver = selectionService.onSelectedEntityChanged.add(refresh);
        const topologyWatcher = watcherService.watchValue(
            () => {
                const target = getTarget();
                return getScenes().map((scene) => ({
                    scene,
                    camera: scene.camera,
                    selectedEntity: selectionService.selectedEntity,
                    node: scene === target?.scene ? target.node : undefined,
                }));
            },
            refresh,
            (left, right) =>
                left.length === right.length &&
                left.every(
                    (value, index) =>
                        value.scene === right[index].scene &&
                        value.camera === right[index].camera &&
                        value.selectedEntity === right[index].selectedEntity &&
                        value.node === right[index].node
                )
        );
        refresh();

        return {
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                topologyWatcher.dispose();
                selectionObserver.remove();
                refresh();
                destroyActive();
                onChanged.clear();
            },
        };
    },
};
