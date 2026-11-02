import { setMorphTargetWeights, type Mesh, type MorphTargetData, type SceneContext } from "@babylonjs/lite";

/**
 * Gets a mesh's nonempty morph data.
 * @param mesh The mesh to inspect.
 * @returns Its morph data when it has targets.
 */
export function GetMeshMorphTargets(mesh: Mesh): MorphTargetData | undefined {
    return mesh.morphTargets && mesh.morphTargets.count > 0 ? mesh.morphTargets : undefined;
}

/**
 * Gets a target's source name or numbered fallback.
 * @param data The shared morph data.
 * @param index The target index.
 * @returns Its label.
 */
export function GetMorphTargetDisplayName(data: MorphTargetData, index: number): string {
    return data.names?.[index] || `Target ${index}`;
}

/**
 * Updates one target through the public API without mutating the CPU mirror first.
 * @param scene The scene owning the mesh.
 * @param data The shared morph data.
 * @param index The target index.
 * @param weight The new weight.
 */
export function SetMorphTargetWeight(scene: SceneContext, data: MorphTargetData, index: number, weight: number): void {
    const weights = data.weights.slice();
    weights[index] = weight;
    setMorphTargetWeights(scene.surface.engine, data, weights);
}
