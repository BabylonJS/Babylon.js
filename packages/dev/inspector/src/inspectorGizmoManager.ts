import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";

function CreateInspectorGizmoManager(scene: Scene): GizmoManager {
    const layer1 = scene.frameGraph ? FrameGraphUtils.CreateUtilityLayerRenderer(scene.frameGraph) : new UtilityLayerRenderer(scene);
    const layer2 = scene.frameGraph ? FrameGraphUtils.CreateUtilityLayerRenderer(scene.frameGraph) : new UtilityLayerRenderer(scene);
    const gizmoManager = new GizmoManager(scene, undefined, layer1, layer2);
    scene.reservedDataStore ??= {};
    scene.reservedDataStore.gizmoManager = gizmoManager;
    return gizmoManager;
}

export function GetInspectorGizmoManager(scene: Nullable<Scene> | undefined, create: true): GizmoManager;
export function GetInspectorGizmoManager(scene: Nullable<Scene> | undefined, create: false): Nullable<GizmoManager>;
export function GetInspectorGizmoManager(scene: Nullable<Scene> | undefined, create: boolean): Nullable<GizmoManager> {
    let gizmoManager = scene && scene.reservedDataStore && scene.reservedDataStore.gizmoManager ? (scene.reservedDataStore.gizmoManager as GizmoManager) : null;
    if (!gizmoManager && create) {
        if (!scene) {
            throw new Error("Invalid scene provided to GetInspectorGizmoManager");
        }
        gizmoManager = CreateInspectorGizmoManager(scene);
    }
    return gizmoManager;
}

export function DisposeInspectorGizmoManager(scene: Nullable<Scene> | undefined): void {
    const gizmoManager = GetInspectorGizmoManager(scene, false);
    if (!gizmoManager) {
        return;
    }
    gizmoManager.dispose();
    scene!.reservedDataStore.gizmoManager = null;
}
