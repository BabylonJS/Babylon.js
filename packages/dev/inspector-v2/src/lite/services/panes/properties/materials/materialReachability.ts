import { getMaterialSource, type Material, type SceneContext } from "@babylonjs/lite";

import { type IMaterialResourceRecord } from "../../scene/sceneResources";

/**
 * Returns scenes that still contain the selected material, rather than just another view of its source.
 * @param record The indexed source record.
 * @param material The selected source or view.
 * @returns Scenes with a live mesh referencing the selected material.
 */
export function GetMaterialOwningScenes(record: IMaterialResourceRecord, material: Material): readonly SceneContext[] {
    return record.scenes.filter(
        (scene) =>
            Array.isArray(scene.meshes) &&
            scene.meshes.some((mesh) => mesh?.material && (material === record.source ? getMaterialSource(mesh.material) === record.source : mesh.material === material))
    );
}
