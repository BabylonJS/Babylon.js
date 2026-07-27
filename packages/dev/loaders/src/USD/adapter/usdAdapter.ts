import { type ISceneLoaderAsyncResult } from "core/Loading/sceneLoader";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { type AssetContainer } from "core/assetContainer";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type Light } from "core/Lights/light";
import { type Camera } from "core/Cameras/camera";
import { type Skeleton } from "core/Bones/skeleton";
import { type Animation } from "core/Animations/animation";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { type Material } from "core/Materials/material";
import { type Mesh } from "core/Meshes/mesh.pure";

import { type IResolvedStage } from "../resolution/resolvedStage";
import { type USDLoadingOptions } from "../usdLoadingOptions";
import { CreateStageRoot } from "./transformAdapter";
import { AdaptPrim, type IUsdAdapterContext } from "./sceneGraphAdapter";
import { BuildAnimationGroup } from "./animationAdapter";

/**
 * Adapts a fully-resolved {@link IResolvedStage} into Babylon objects, returning them as an
 * {@link ISceneLoaderAsyncResult}. The whole prim tree is parented under a single conversion root so
 * up-axis and unit handling happen once.
 *
 * Babylon performs no USD reasoning here — every value consumed has already been resolved.
 *
 * @param stage the resolved stage to adapt
 * @param scene the scene to create objects in
 * @param assetContainer the asset container being populated, if any (cameras are pushed onto it directly)
 * @param options loader options
 * @returns the loaded Babylon objects
 */
export function AdaptResolvedStageToScene(
    stage: IResolvedStage,
    scene: Scene,
    assetContainer: Nullable<AssetContainer>,
    options: Readonly<USDLoadingOptions>
): ISceneLoaderAsyncResult {
    const existingGeometries = new Set(scene.geometries);
    const meshes: AbstractMesh[] = [];
    const transformNodes: TransformNode[] = [];
    const lights: Light[] = [];
    const cameras: Camera[] = [];
    const skeletons: Skeleton[] = [];
    const animationGroups: AnimationGroup[] = [];
    const animationEntries: { node: TransformNode; animations: Animation[] }[] = [];

    const root = CreateStageRoot(stage.metadata, scene);
    transformNodes.push(root);

    const context: IUsdAdapterContext = {
        scene,
        stage,
        options,
        fps: ResolveFps(stage, options),
        meshes,
        transformNodes,
        lights,
        cameras,
        skeletons,
        animationGroups,
        animationEntries,
        materialCache: new Map<number, Material>(),
        sourceMeshCache: new Map<string, Mesh>(),
        skeletonCache: new Map<number, Skeleton>(),
    };

    for (const child of stage.root.children) {
        AdaptPrim(child, root, context);
    }

    if (animationEntries.length > 0) {
        animationGroups.push(BuildAnimationGroup("usd-animations", scene, animationEntries));
    }

    // ISceneLoaderAsyncResult has no `cameras` field; cameras auto-register on the scene. When an asset
    // container is being populated, also record them there so the container owns them like other objects.
    if (assetContainer) {
        for (const camera of cameras) {
            assetContainer.cameras.push(camera);
        }
    } else if (!scene.activeCamera && cameras.length > 0) {
        scene.activeCamera = cameras[0];
    }

    return {
        meshes,
        particleSystems: [],
        skeletons,
        animationGroups,
        transformNodes,
        geometries: scene.geometries.filter((geometry) => !existingGeometries.has(geometry)),
        lights,
        spriteManagers: [],
    };
}

// Resolves the bake fps: an explicit loader override wins, otherwise the stage's time-codes-per-second.
function ResolveFps(stage: IResolvedStage, options: Readonly<USDLoadingOptions>): number {
    if (options.targetFps && options.targetFps > 0) {
        return options.targetFps;
    }
    const timeCodesPerSecond = stage.metadata.timeCodesPerSecond;
    return timeCodesPerSecond && timeCodesPerSecond > 0 ? timeCodesPerSecond : 24;
}
