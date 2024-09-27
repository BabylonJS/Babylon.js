import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Animation } from "core/Animations/animation";
import type { Nullable } from "core/types";
import type { Mesh } from "core/Meshes/mesh";
import type { Material } from "core/Materials/material";
import type { Camera } from "core/Cameras/camera";
import type { Light } from "core/Lights/light";
import type { IAssetContainer } from "core/IAssetContainer";

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
 * @returns The asset or null if not found
 */
export function GetFlowGraphAssetWithType<T extends FlowGraphAssetType>(assetsContext: IAssetContainer, type: T, index: number): Nullable<AssetType<T>> {
    switch (type) {
        case FlowGraphAssetType.Animation:
            return (assetsContext.animations[index] as AssetType<typeof type>) ?? null;
        case FlowGraphAssetType.AnimationGroup:
            return (assetsContext.animationGroups[index] as AssetType<typeof type>) ?? null;
        case FlowGraphAssetType.Mesh:
            return (assetsContext.meshes[index] as AssetType<typeof type>) ?? null;
        case FlowGraphAssetType.Material:
            return (assetsContext.materials[index] as AssetType<typeof type>) ?? null;
        case FlowGraphAssetType.Camera:
            return (assetsContext.cameras[index] as AssetType<typeof type>) ?? null;
        case FlowGraphAssetType.Light:
            return (assetsContext.lights[index] as AssetType<typeof type>) ?? null;
        default:
            return null;
    }
}
