import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Animation } from "core/Animations/animation";
import type { Nullable } from "core/types";
import type { Mesh } from "core/Meshes/mesh";
import type { Material } from "core/Materials/material";
import type { Camera } from "core/Cameras/camera";
import type { Light } from "core/Lights/light";
import type { IAssetContainer } from "core/IAssetContainer";

/**
 * The type of the assets that flow graph supports
 */
export const enum FlowGraphAssetType {
    Animation = "Animation",
    AnimationGroup = "AnimationGroup",
    Mesh = "Mesh",
    Material = "Material",
    Camera = "Camera",
    Light = "Light",
    // Further asset types will be added here when needed.
}

export type AssetType<T extends FlowGraphAssetType> = T extends FlowGraphAssetType.Animation
    ? Animation
    : T extends FlowGraphAssetType.AnimationGroup
      ? AnimationGroup
      : T extends FlowGraphAssetType.Mesh
        ? Mesh
        : T extends FlowGraphAssetType.Material
          ? Material
          : T extends FlowGraphAssetType.Camera
            ? Camera
            : T extends FlowGraphAssetType.Light
              ? Light
              : never;

/**
 * Returns the asset with the given index and type from the assets context.
 * @param assetsContext The assets context to get the asset from
 * @param type The type of the asset
 * @param index The index of the asset
 * @param useIndexAsUniqueId If set to true, instead of the index in the array it will search for the unique id of the asset.
 * @returns The asset or null if not found
 */
export function GetFlowGraphAssetWithType<T extends FlowGraphAssetType>(
    assetsContext: IAssetContainer,
    type: T,
    index: number,
    useIndexAsUniqueId?: boolean
): Nullable<AssetType<T>> {
    switch (type) {
        case FlowGraphAssetType.Animation:
            return useIndexAsUniqueId
                ? ((assetsContext.animations.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.animations[index] as AssetType<typeof type>) ?? null);
        case FlowGraphAssetType.AnimationGroup:
            return useIndexAsUniqueId
                ? ((assetsContext.animationGroups.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.animationGroups[index] as AssetType<typeof type>) ?? null);
        case FlowGraphAssetType.Mesh:
            return useIndexAsUniqueId
                ? ((assetsContext.meshes.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.meshes[index] as AssetType<typeof type>) ?? null);
        case FlowGraphAssetType.Material:
            return useIndexAsUniqueId
                ? ((assetsContext.materials.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.materials[index] as AssetType<typeof type>) ?? null);
        case FlowGraphAssetType.Camera:
            return useIndexAsUniqueId
                ? ((assetsContext.cameras.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.cameras[index] as AssetType<typeof type>) ?? null);
        case FlowGraphAssetType.Light:
            return useIndexAsUniqueId
                ? ((assetsContext.lights.find((a) => a.uniqueId === index) as AssetType<typeof type>) ?? null)
                : ((assetsContext.lights[index] as AssetType<typeof type>) ?? null);
        default:
            return null;
    }
}
