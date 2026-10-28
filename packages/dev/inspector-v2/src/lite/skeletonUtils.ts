import { getMeshSkeleton, type Bone, type EngineContext, type Mesh, type SceneContext, type Skeleton } from "@babylonjs/lite";

import { GetSceneContexts, GetSceneNodes, IsMesh } from "./sceneEntityUtils";

/**
 * Gets the meshes in a scene, including descendants, in traversal order.
 * @param scene The scene to inspect.
 * @returns The scene's distinct meshes.
 */
export function GetSkeletonSceneMeshes(scene: SceneContext): readonly Mesh[] {
    return GetSceneNodes(scene).filter(IsMesh);
}

/**
 * Gets distinct public skeletons in first-mesh order.
 * @param scene The scene to inspect.
 * @returns Skeletons exposed by meshes loaded with bone control enabled.
 */
export function GetSceneSkeletons(scene: SceneContext): readonly Skeleton[] {
    const skeletons = new Set<Skeleton>();
    for (const mesh of GetSkeletonSceneMeshes(scene)) {
        const skeleton = getMeshSkeleton(mesh);
        if (skeleton) {
            skeletons.add(skeleton);
        }
    }
    return [...skeletons];
}

/**
 * Gets meshes sharing a public skeleton.
 * @param scene The scene to inspect.
 * @param skeleton The skeleton to find.
 * @returns Its meshes in traversal order.
 */
export function GetSkeletonMeshes(scene: SceneContext, skeleton: Skeleton): readonly Mesh[] {
    return GetSkeletonSceneMeshes(scene).filter((mesh) => getMeshSkeleton(mesh) === skeleton);
}

/**
 * Gets direct children in authored bone order.
 * @param skeleton The owning skeleton.
 * @param parent The parent, or null for root bones.
 * @returns The matching bones.
 */
export function GetBoneChildren(skeleton: Skeleton, parent: Bone | null): readonly Bone[] {
    return skeleton.bones.filter((bone) => bone.parent === parent);
}

/**
 * Derives a bone's index from the public bone array.
 * @param skeleton The owning skeleton.
 * @param bone The bone to locate.
 * @returns Its array index, or -1 if absent.
 */
export function GetBoneIndex(skeleton: Skeleton, bone: Bone): number {
    return skeleton.bones.indexOf(bone);
}

/**
 * Gets a skeleton's scene-local label without assuming a skeleton name.
 * @param scene The owning scene.
 * @param skeleton The skeleton to label.
 * @returns The first mesh's name or a numbered fallback.
 */
export function GetSkeletonDisplayName(scene: SceneContext, skeleton: Skeleton): string {
    const mesh = GetSkeletonMeshes(scene, skeleton)[0];
    return mesh?.name ? `Skeleton: ${mesh.name}` : `Skeleton ${GetSceneSkeletons(scene).indexOf(skeleton) + 1}`;
}

/**
 * Gets a bone's name or derived-index fallback.
 * @param skeleton The owning skeleton.
 * @param bone The bone to label.
 * @returns Its display label.
 */
export function GetBoneDisplayName(skeleton: Skeleton, bone: Bone): string {
    return bone.name || `Bone ${GetBoneIndex(skeleton, bone)}`;
}

/**
 * Finds the registered scene containing a skeleton.
 * @param engine The inspected engine.
 * @param skeleton The skeleton to locate.
 * @returns The first owning scene, if reachable.
 */
export function GetSkeletonScene(engine: EngineContext, skeleton: Skeleton): SceneContext | undefined {
    return GetSceneContexts(engine).find((scene) => GetSceneSkeletons(scene).includes(skeleton));
}

/**
 * Finds a reachable bone's skeleton.
 * @param engine The inspected engine.
 * @param bone The bone to locate.
 * @returns Its skeleton, if reachable.
 */
export function GetBoneSkeleton(engine: EngineContext, bone: Bone): Skeleton | undefined {
    return GetSceneContexts(engine)
        .flatMap(GetSceneSkeletons)
        .find((skeleton) => skeleton.bones.includes(bone));
}

/**
 * Tests skeleton identity against registered scene meshes.
 * @param engine The inspected engine.
 * @param entity The candidate.
 * @returns Whether it is a reachable public skeleton.
 */
export function IsSkeleton(engine: EngineContext, entity: unknown): entity is Skeleton {
    return GetSceneContexts(engine).some((scene) => GetSceneSkeletons(scene).some((skeleton) => skeleton === entity));
}

/**
 * Tests bone identity against registered scene skeletons.
 * @param engine The inspected engine.
 * @param entity The candidate.
 * @returns Whether it is a reachable public bone.
 */
export function IsBone(engine: EngineContext, entity: unknown): entity is Bone {
    return GetSceneContexts(engine).some((scene) => GetSceneSkeletons(scene).some((skeleton) => skeleton.bones.some((bone) => bone === entity)));
}
