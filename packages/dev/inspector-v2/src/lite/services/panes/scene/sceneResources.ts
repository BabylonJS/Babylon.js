import { getMaterialTextures, type Material, type SceneContext, type Texture2D } from "@babylonjs/lite";

/**
 * Gets the unique materials referenced by a scene's meshes.
 * @param scene The scene to inspect.
 * @returns The referenced materials in mesh order.
 */
export function GetSceneMaterials(scene: SceneContext): readonly Material[] {
    return [...new Set(scene.meshes.map((mesh) => mesh.material))];
}

/**
 * Gets the unique textures referenced by a scene's materials.
 * @param scene The scene to inspect.
 * @returns The referenced textures in material order.
 */
export function GetSceneTextures(scene: SceneContext): readonly Texture2D[] {
    return [...new Set(GetSceneMaterials(scene).flatMap((material) => getMaterialTextures(material)))];
}
