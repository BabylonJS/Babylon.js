import { Logger } from "core/Misc/logger";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { type Mesh } from "core/Meshes/mesh.pure";
import { TransformNode } from "core/Meshes/transformNode.pure";
import { type Material } from "core/Materials/material";
import { MultiMaterial, RegisterMultiMaterial } from "core/Materials/multiMaterial.pure";
import { SubMesh } from "core/Meshes/subMesh.pure";
import { type Light } from "core/Lights/light";
import { type Camera } from "core/Cameras/camera";
import { type Skeleton } from "core/Bones/skeleton";
import { type Animation } from "core/Animations/animation";
import { type AnimationGroup } from "core/Animations/animationGroup";

import { type IResolvedStage, type IResolvedPrim, type IResolvedMesh } from "../resolution/resolvedStage";
import { type USDLoadingOptions } from "../usdLoadingOptions";
import { ApplyResolvedTransform } from "./transformAdapter";
import { CreateMeshFromResolved } from "./geometryAdapter";
import { CreateMaterialFromResolved } from "./materialAdapter";
import { CreateLightFromResolved, CreateCameraFromResolved } from "./lightCameraAdapter";
import { CreateInstance, CreatePointInstancerThinInstances } from "./instancingAdapter";
import { CreateSkeletonFromResolved, ApplySkinningToMesh, CreateSkeletonAnimation } from "./skinningAdapter";
import { CreateAnimationsForPrim } from "./animationAdapter";

/**
 * Mutable context threaded through the recursive prim-tree walk. It collects every Babylon object the
 * adapter creates (so the loader can return them and populate an asset container) and caches shared
 * resources — materials, instance source meshes and skeletons — that USD references by stage index.
 */
export interface IUsdAdapterContext {
    /** The scene objects are created in. */
    scene: Scene;
    /** The resolved stage being adapted (provides the shared mesh/material/skeleton pools). */
    stage: IResolvedStage;
    /** Loader options. */
    options: Readonly<USDLoadingOptions>;
    /** Frames/keys per second used when baking USD time samples into Babylon animations. */
    fps: number;
    /** Collected meshes (includes instances and point-instancer prototypes). */
    meshes: AbstractMesh[];
    /** Collected transform nodes. */
    transformNodes: TransformNode[];
    /** Collected lights. */
    lights: Light[];
    /** Collected cameras. */
    cameras: Camera[];
    /** Collected skeletons. */
    skeletons: Skeleton[];
    /** Collected animation groups (skeleton animations plus the per-prim transform group). */
    animationGroups: AnimationGroup[];
    /** Per-prim transform/visibility animation entries, built into a single group after the walk. */
    animationEntries: { node: TransformNode; animations: Animation[] }[];
    /** Materials by stage material index. */
    materialCache: Map<number, Material>;
    /** Instance source meshes by stage mesh index (the first `instanceable` prim becomes the source). */
    sourceMeshCache: Map<string, Mesh>;
    /** Skeletons by stage skeleton index. */
    skeletonCache: Map<number, Skeleton>;
}

/**
 * Recursively adapts a resolved prim (and its descendants) into Babylon nodes parented under `parent`.
 * Each prim `kind` is dispatched to the matching adapter; all USD reasoning is already done.
 * @param prim the resolved prim to adapt
 * @param parent the Babylon node to parent the created node under
 * @param context the adapter context collecting created objects
 */
export function AdaptPrim(prim: IResolvedPrim, parent: TransformNode, context: IUsdAdapterContext): void {
    let node: TransformNode;
    let recurseChildren = true;

    switch (prim.kind) {
        case "mesh":
            node = AdaptMeshPrim(prim, context);
            break;
        case "instance":
            node = AdaptInstancePrim(prim, context);
            break;
        case "pointInstancer":
            node = AdaptPointInstancerPrim(prim, context);
            recurseChildren = false;
            break;
        case "light":
            node = AdaptLightPrim(prim, context);
            break;
        case "camera":
            node = AdaptCameraPrim(prim, context);
            break;
        case "transform":
        default:
            node = new TransformNode(prim.name, context.scene);
            context.transformNodes.push(node);
            break;
    }

    ApplyResolvedTransform(node, prim.transform);
    node.parent = parent;
    if (!prim.visible && node instanceof AbstractMesh && prim.animation?.tracks.some((track) => track.target === "visibility")) {
        node.visibility = 0;
    } else if (!prim.visible) {
        node.setEnabled(false);
    }

    if (prim.animation) {
        const animations = CreateAnimationsForPrim(prim.animation, node, context.fps);
        if (animations.length > 0) {
            context.animationEntries.push({ node, animations });
        }
    }

    if (recurseChildren) {
        for (const child of prim.children) {
            AdaptPrim(child, node, context);
        }
    }
}

function AdaptMeshPrim(prim: IResolvedPrim, context: IUsdAdapterContext): Mesh {
    const resolvedMesh = context.stage.meshes[prim.meshIndex!];
    const mesh = CreateMeshFromResolved(prim.name, resolvedMesh, context.scene);
    context.meshes.push(mesh);

    BindMaterial(mesh, prim.materialBinding, resolvedMesh, context);

    if (prim.skinning) {
        const skeleton = GetOrCreateSkeleton(prim.skinning.skeletonIndex, context);
        ApplySkinningToMesh(mesh, prim.skinning, skeleton, context.scene);
    }

    return mesh;
}

function AdaptInstancePrim(prim: IResolvedPrim, context: IUsdAdapterContext): TransformNode {
    const sourceIndex = prim.instanceSourceMeshIndex!;
    const cacheKey = `${sourceIndex}:${prim.materialBinding?.materialIndex ?? -1}`;
    const cachedSource = context.sourceMeshCache.get(cacheKey);

    // The first instanceable prim for a prototype becomes the rendered source mesh; later prims that
    // share the prototype become Babylon hardware instances of it. This matches USD instanceable
    // semantics (only instances render — there is no extra copy at the prototype location).
    if (!cachedSource) {
        const resolvedMesh = context.stage.meshes[sourceIndex];
        const source = CreateMeshFromResolved(prim.name, resolvedMesh, context.scene);
        context.sourceMeshCache.set(cacheKey, source);
        context.meshes.push(source);
        BindMaterial(source, prim.materialBinding, resolvedMesh, context);
        return source;
    }

    const instance = CreateInstance(cachedSource, prim.name);
    context.meshes.push(instance);
    return instance;
}

function AdaptPointInstancerPrim(prim: IResolvedPrim, context: IUsdAdapterContext): TransformNode {
    const node = new TransformNode(prim.name, context.scene);
    context.transformNodes.push(node);

    const instancer = prim.instancer;
    if (!instancer) {
        return node;
    }

    // Build a dedicated prototype mesh per prototype index (thin-instance buffers are per-mesh, so
    // prototypes are never shared across instancers). The instancer node carries the instancer's own
    // transform; the per-instance matrices stay in the instancer's local space.
    const prototypeMeshes = instancer.prototypeMeshIndices.map((meshIndex, prototypeOrder) => {
        if (meshIndex === undefined) {
            return undefined;
        }
        const resolvedMesh = context.stage.meshes[meshIndex];
        const prototypeMesh = CreateMeshFromResolved(`${prim.name}_proto${prototypeOrder}`, resolvedMesh, context.scene);
        BindMaterial(prototypeMesh, instancer.prototypeMaterialBindings?.[prototypeOrder], resolvedMesh, context);
        return prototypeMesh;
    });

    const rendered = CreatePointInstancerThinInstances(instancer, prototypeMeshes, context.scene);
    const renderedSet = new Set(rendered);
    for (const prototypeMesh of prototypeMeshes) {
        if (!prototypeMesh) {
            continue;
        }
        if (renderedSet.has(prototypeMesh)) {
            prototypeMesh.parent = node;
            context.meshes.push(prototypeMesh);
        } else {
            // Prototype received no visible instances; keep it out of the rendered scene.
            prototypeMesh.dispose();
        }
    }

    return node;
}

function AdaptLightPrim(prim: IResolvedPrim, context: IUsdAdapterContext): TransformNode {
    const node = new TransformNode(prim.name, context.scene);
    context.transformNodes.push(node);

    const light = prim.light ? CreateLightFromResolved(prim.light, prim.name, context.scene) : null;
    if (light) {
        light.parent = node;
        context.lights.push(light);
    } else {
        Logger.Warn(`USD: light at '${prim.path}' could not be mapped to a Babylon light and was skipped.`);
    }

    return node;
}

function AdaptCameraPrim(prim: IResolvedPrim, context: IUsdAdapterContext): TransformNode {
    const node = new TransformNode(prim.name, context.scene);
    context.transformNodes.push(node);

    if (prim.camera) {
        const camera = CreateCameraFromResolved(prim.camera, prim.name, context.scene);
        camera.parent = node;
        context.cameras.push(camera);
    }

    return node;
}

// Binds the prim's material(s) to a mesh, building a MultiMaterial when the mesh has geom subsets.
function BindMaterial(mesh: Mesh, materialBinding: IResolvedPrim["materialBinding"], resolvedMesh: IResolvedMesh, context: IUsdAdapterContext): void {
    const subsets = resolvedMesh.geomSubsets;
    if (subsets && subsets.length > 0) {
        addFallbackSubMeshes(mesh, subsets, materialBinding?.materialIndex);
        RegisterMultiMaterial();
        const multiMaterial = new MultiMaterial(`${mesh.name}_material`, context.scene);
        let maxIndex = -1;
        for (const subset of subsets) {
            maxIndex = Math.max(maxIndex, subset.materialIndex);
        }
        if (materialBinding?.materialIndex !== undefined) {
            maxIndex = Math.max(maxIndex, materialBinding.materialIndex);
        }
        const subMaterials: Nullable<Material>[] = new Array<Nullable<Material>>(maxIndex + 1).fill(null);
        for (const subset of subsets) {
            subMaterials[subset.materialIndex] = GetOrCreateMaterial(subset.materialIndex, context);
        }
        if (materialBinding?.materialIndex !== undefined) {
            subMaterials[materialBinding.materialIndex] = GetOrCreateMaterial(materialBinding.materialIndex, context);
        }
        multiMaterial.subMaterials = subMaterials;
        mesh.material = multiMaterial;
        if (resolvedMesh.doubleSided) {
            for (const subMaterial of subMaterials) {
                if (subMaterial) {
                    subMaterial.backFaceCulling = false;
                }
            }
        }

        function addFallbackSubMeshes(mesh: Mesh, subsets: NonNullable<IResolvedMesh["geomSubsets"]>, fallbackMaterialIndex: number | undefined): void {
            const ranges = subsets.map((subset) => ({ start: subset.indexOffset, end: subset.indexOffset + subset.indexCount })).sort((left, right) => left.start - right.start);
            const materialIndex = fallbackMaterialIndex ?? 0;
            const verticesCount = mesh.getTotalVertices();
            const indexCount = mesh.getTotalIndices();
            let cursor = 0;
            for (const range of ranges) {
                if (range.start > cursor) {
                    new SubMesh(materialIndex, 0, verticesCount, cursor, range.start - cursor, mesh);
                }
                cursor = Math.max(cursor, range.end);
            }
            if (cursor < indexCount) {
                new SubMesh(materialIndex, 0, verticesCount, cursor, indexCount - cursor, mesh);
            }
        }
        return;
    }

    if (materialBinding?.materialIndex !== undefined) {
        BindMaterialByIndex(mesh, resolvedMesh, context, materialBinding.materialIndex);
    }
}

// Binds a single resolved material (by stage index) to a mesh, honoring the mesh's double-sided flag.
function BindMaterialByIndex(mesh: Mesh, resolvedMesh: IResolvedMesh, context: IUsdAdapterContext, materialIndex: number): void {
    const material = GetOrCreateMaterial(materialIndex, context);
    mesh.material = material;
    if (resolvedMesh.doubleSided) {
        material.backFaceCulling = false;
    }
}

function GetOrCreateMaterial(materialIndex: number, context: IUsdAdapterContext): Material {
    let material = context.materialCache.get(materialIndex);
    if (!material) {
        material = CreateMaterialFromResolved(context.stage.materials[materialIndex], context.scene, context.options);
        context.materialCache.set(materialIndex, material);
    }
    return material;
}

function GetOrCreateSkeleton(skeletonIndex: number, context: IUsdAdapterContext): Skeleton {
    let skeleton = context.skeletonCache.get(skeletonIndex);
    if (!skeleton) {
        const resolved = context.stage.skeletons[skeletonIndex];
        skeleton = CreateSkeletonFromResolved(resolved, context.scene);
        context.skeletonCache.set(skeletonIndex, skeleton);
        context.skeletons.push(skeleton);
        if (resolved.animation) {
            context.animationGroups.push(CreateSkeletonAnimation(resolved.animation, skeleton, context.fps, context.scene));
        }
    }
    return skeleton;
}
