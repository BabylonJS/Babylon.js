import { getMaterialSource, markMaterialUboDirty, rebuildMaterial, type Material, type SceneContext } from "@babylonjs/lite";
import { useCallback } from "react";

import { usePropertyChangedNotifier } from "../../../../../contexts/propertyContext";
import { type ISelectionService } from "../../../../../services/selectionService";
import { type ISceneResourceIndexService } from "../../scene/sceneResourceIndexService";
import { type IMaterialResourceRecord } from "../../scene/sceneResources";
import { useLatestAsyncOperation } from "../useLatestAsyncOperation";

type MaterialChange = Readonly<{
    id: string;
    oldValue: unknown;
    newValue: unknown;
    apply: () => void | Promise<void>;
    invalidate: "ubo" | "rebuild" | "owned";
    rebuildFrameGraph?: boolean;
}>;

function GetOwningScenes(record: IMaterialResourceRecord): readonly SceneContext[] {
    if (record.scenes.length === 0) {
        throw new Error("Material rebuild requires at least one owning scene.");
    }
    for (const scene of record.scenes) {
        if (!scene.meshes.some((mesh) => mesh?.material && getMaterialSource(mesh.material) === record.source)) {
            throw new Error("Material is not reachable from every scene in the mutation scope.");
        }
    }
    return record.scenes;
}

function SameValue(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
    }
    return Object.is(a, b);
}

function ValidateValue(id: string, value: unknown): void {
    if (typeof value === "number" && !Number.isFinite(value)) {
        throw new TypeError(`Property "${id}" requires a finite number.`);
    }
    if (Array.isArray(value) && value.some((component) => typeof component !== "number" || !Number.isFinite(component))) {
        throw new TypeError(`Property "${id}" requires finite tuple components.`);
    }
}

/**
 * Tracks guarded, per-field Lite edits without creating material inspection snapshots.
 * @param material The selected source or MaterialView.
 * @param resourceIndexService The instance-owned scene resource index.
 * @param selectionService The owning Inspector selection service.
 * @returns The source record, row states, and a guarded mutation callback.
 */
export function useDirectMaterialOperations(material: Material, resourceIndexService: ISceneResourceIndexService, selectionService: ISelectionService) {
    const source = getMaterialSource(material);
    const record = resourceIndexService.index.getMaterialRecord(source);
    const isDisposed = useCallback(() => resourceIndexService.isDisposed, [resourceIndexService]);
    const [operations, runLatestOperation] = useLatestAsyncOperation(
        material,
        [resourceIndexService.onChanged, resourceIndexService.onDisposed, selectionService.onSelectedEntityChanged],
        isDisposed
    );
    const notifyPropertyChanged = usePropertyChangedNotifier();

    const commit = (change: MaterialChange) => {
        const { id, oldValue, newValue, apply, invalidate, rebuildFrameGraph } = change;
        runLatestOperation({
            id,
            operationAsync: async () => {
                const currentRecord = resourceIndexService.index.getMaterialRecord(source);
                if (!currentRecord || resourceIndexService.isDisposed) {
                    throw new Error("This material is no longer available in an inspected scene.");
                }
                if (SameValue(oldValue, newValue)) {
                    return false;
                }
                ValidateValue(id, newValue);
                const scenes = invalidate === "rebuild" ? GetOwningScenes(currentRecord) : [];
                await apply();
                if (invalidate === "ubo") {
                    markMaterialUboDirty(material);
                } else if (invalidate === "rebuild") {
                    await Promise.all(scenes.map(async (scene) => await rebuildMaterial(scene, material, { rebuildViews: true, rebuildFrameGraph: rebuildFrameGraph === true })));
                }
                return true;
            },
            onSuccess: (changed) => {
                if (changed) {
                    notifyPropertyChanged(source, id, oldValue, newValue);
                    resourceIndexService.refresh();
                }
            },
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The material change failed."),
        });
    };

    return { source, record, operations, commit };
}
