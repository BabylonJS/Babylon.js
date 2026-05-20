/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXObjectMap } from "./connections";
import { type FBXBoneData, type FBXSkinData, extractBoneTransform, isSkeletonModel } from "./skeleton";

import { cleanFBXName, getPropertyValue } from "../types/fbxTypes";

export type FBXRigBoneData = FBXBoneData;

export interface FBXSkinBindingData {
    skinId: bigint;
    geometryId: bigint;
    rigId: string;
    skinBoneIndexToRigBoneIndex: number[];
    clusterModelIds: Set<bigint>;
}

export interface FBXRigData {
    id: string;
    rootModelIds: bigint[];
    bones: FBXRigBoneData[];
    modelIdToBoneIndex: Map<bigint, number>;
    clusterModelIds: Set<bigint>;
    skinBindings: FBXSkinBindingData[];
    warnings: string[];
}

export function resolveRigs(objectMap: FBXObjectMap, skins: FBXSkinData[]): FBXRigData[] {
    if (skins.length === 0) {
        return [];
    }

    const groupByRoot = new Map<bigint, FBXSkinData[]>();

    for (const skin of skins) {
        const clusterModelIds = skin.bones.filter((bone) => bone.isCluster).map((bone) => bone.modelId);
        if (clusterModelIds.length === 0) {
            continue;
        }

        const rootModelId = findRigGroupingRoot(clusterModelIds, objectMap);
        const group = groupByRoot.get(rootModelId);
        if (group) {
            group.push(skin);
        } else {
            groupByRoot.set(rootModelId, [skin]);
        }
    }

    return Array.from(groupByRoot.entries())
        .sort(([a], [b]) => compareBigInt(a, b))
        .map(([rootModelId, groupSkins]) => buildRig(rootModelId, groupSkins, objectMap));
}

function buildRig(rootModelId: bigint, skins: FBXSkinData[], objectMap: FBXObjectMap): FBXRigData {
    const clusterModelIds = new Set<bigint>();
    const rigModelIds = new Set<bigint>();
    const sourceBonesByModelId = new Map<bigint, FBXBoneData[]>();
    const sourceOrderByModelId = new Map<bigint, number>();

    for (const skin of skins) {
        for (const bone of skin.bones) {
            if (!sourceOrderByModelId.has(bone.modelId)) {
                sourceOrderByModelId.set(bone.modelId, sourceOrderByModelId.size);
            }

            let sources = sourceBonesByModelId.get(bone.modelId);
            if (!sources) {
                sources = [];
                sourceBonesByModelId.set(bone.modelId, sources);
            }
            sources.push(bone);

            if (!bone.isCluster) {
                continue;
            }

            clusterModelIds.add(bone.modelId);
            for (const ancestorId of getModelAncestorChain(bone.modelId, objectMap)) {
                rigModelIds.add(ancestorId);
            }
        }
    }

    const warnings = collectTransformLinkWarnings(sourceBonesByModelId);
    const preferredBoneByModelId = new Map<bigint, FBXBoneData>();
    for (const [modelId, sources] of Array.from(sourceBonesByModelId)) {
        preferredBoneByModelId.set(modelId, choosePreferredBoneSource(sources));
    }

    const parentByModelId = buildParentMap(rigModelIds, objectMap);
    const orderedModelIds = orderParentsBeforeChildren(rigModelIds, parentByModelId, sourceOrderByModelId);
    const bones: FBXRigBoneData[] = [];
    const modelIdToBoneIndex = new Map<bigint, number>();

    for (const modelId of orderedModelIds) {
        const sourceBone = preferredBoneByModelId.get(modelId) ?? createFallbackBone(modelId, objectMap);
        if (!sourceBone) {
            continue;
        }

        const parentModelId = parentByModelId.get(modelId);
        const parentIndex = parentModelId === undefined ? -1 : (modelIdToBoneIndex.get(parentModelId) ?? -1);
        const index = bones.length;
        const bone: FBXRigBoneData = {
            ...sourceBone,
            index,
            parentIndex,
            isCluster: clusterModelIds.has(modelId),
        };
        bones.push(bone);
        modelIdToBoneIndex.set(modelId, index);
    }

    const skinBindings = skins.map((skin) => buildSkinBinding(skin, `rig_${rootModelId.toString()}`, modelIdToBoneIndex));

    return {
        id: `rig_${rootModelId.toString()}`,
        rootModelIds: bones.filter((bone) => bone.parentIndex < 0).map((bone) => bone.modelId),
        bones,
        modelIdToBoneIndex,
        clusterModelIds,
        skinBindings,
        warnings,
    };
}

function buildSkinBinding(skin: FBXSkinData, rigId: string, modelIdToBoneIndex: Map<bigint, number>): FBXSkinBindingData {
    const skinBoneIndexToRigBoneIndex = skin.bones.map((bone) => {
        const rigBoneIndex = modelIdToBoneIndex.get(bone.modelId);
        if (rigBoneIndex === undefined && bone.isCluster) {
            throw new Error(`FBX rig resolver: cluster bone ${bone.name} is missing from resolved rig ${rigId}`);
        }
        return rigBoneIndex ?? -1;
    });

    return {
        skinId: skin.id,
        geometryId: skin.geometryId,
        rigId,
        skinBoneIndexToRigBoneIndex,
        clusterModelIds: new Set(skin.bones.filter((bone) => bone.isCluster).map((bone) => bone.modelId)),
    };
}

function findRigGroupingRoot(clusterModelIds: bigint[], objectMap: FBXObjectMap): bigint {
    const lca = findLowestCommonAncestor(clusterModelIds, objectMap) ?? clusterModelIds[0];
    let root = lca;
    let parentId = findModelParentId(root, objectMap);

    while (parentId !== undefined) {
        const parentNode = objectMap.objects.get(parentId);
        if (!parentNode || parentNode.name !== "Model" || !isSkeletonModel(parentNode)) {
            break;
        }

        root = parentId;
        parentId = findModelParentId(parentId, objectMap);
    }

    return root;
}

function findLowestCommonAncestor(modelIds: bigint[], objectMap: FBXObjectMap): bigint | undefined {
    if (modelIds.length === 0) {
        return undefined;
    }

    const chains = modelIds.map((modelId) => getModelAncestorChain(modelId, objectMap));
    const common = new Set(chains[0]);
    for (const chain of chains.slice(1)) {
        for (const modelId of Array.from(common)) {
            if (!chain.includes(modelId)) {
                common.delete(modelId);
            }
        }
    }

    return chains[0].find((modelId) => common.has(modelId));
}

function getModelAncestorChain(modelId: bigint, objectMap: FBXObjectMap): bigint[] {
    const chain: bigint[] = [];
    let currentId: bigint | undefined = modelId;

    while (currentId !== undefined) {
        const node = objectMap.objects.get(currentId);
        if (!node || node.name !== "Model") {
            break;
        }

        chain.push(currentId);
        currentId = findModelParentId(currentId, objectMap);
    }

    return chain;
}

function buildParentMap(modelIds: Set<bigint>, objectMap: FBXObjectMap): Map<bigint, bigint> {
    const parentByModelId = new Map<bigint, bigint>();

    for (const modelId of Array.from(modelIds)) {
        const parentId = findModelParentId(modelId, objectMap);
        if (parentId !== undefined && modelIds.has(parentId)) {
            parentByModelId.set(modelId, parentId);
        }
    }

    return parentByModelId;
}

function orderParentsBeforeChildren(modelIds: Set<bigint>, parentByModelId: Map<bigint, bigint>, sourceOrderByModelId: Map<bigint, number>): bigint[] {
    const childrenByModelId = new Map<bigint, bigint[]>();
    for (const modelId of Array.from(modelIds)) {
        const parentId = parentByModelId.get(modelId);
        if (parentId === undefined) {
            continue;
        }

        let children = childrenByModelId.get(parentId);
        if (!children) {
            children = [];
            childrenByModelId.set(parentId, children);
        }
        children.push(modelId);
    }

    for (const children of Array.from(childrenByModelId.values())) {
        children.sort((a, b) => compareSourceOrder(a, b, sourceOrderByModelId));
    }

    const roots = Array.from(modelIds)
        .filter((modelId) => !parentByModelId.has(modelId))
        .sort((a, b) => compareSourceOrder(a, b, sourceOrderByModelId));
    const ordered: bigint[] = [];
    const queue = [...roots];

    while (queue.length > 0) {
        const modelId = queue.shift()!;
        ordered.push(modelId);
        queue.push(...(childrenByModelId.get(modelId) ?? []));
    }

    return ordered;
}

function findModelParentId(modelId: bigint, objectMap: FBXObjectMap): bigint | undefined {
    const parentConnection = objectMap.connections.find((conn) => conn.type === "OO" && conn.childId === modelId && objectMap.objects.get(conn.parentId)?.name === "Model");
    return parentConnection?.parentId;
}

function choosePreferredBoneSource(sources: FBXBoneData[]): FBXBoneData {
    return (
        sources.find((bone) => bone.isCluster && bone.transformLinkMatrix) ??
        sources.find((bone) => bone.isCluster) ??
        sources.find((bone) => bone.modelBindPoseMatrix) ??
        sources[0]
    );
}

function collectTransformLinkWarnings(sourceBonesByModelId: Map<bigint, FBXBoneData[]>): string[] {
    const warnings: string[] = [];

    for (const [modelId, sources] of Array.from(sourceBonesByModelId)) {
        const matrices = sources.filter((bone) => bone.isCluster && bone.transformLinkMatrix).map((bone) => bone.transformLinkMatrix!);
        if (matrices.length < 2) {
            continue;
        }

        const first = matrices[0];
        if (matrices.some((matrix) => !areMatricesEquivalent(first, matrix, 1e-5))) {
            warnings.push(`Model ${modelId.toString()} has differing Cluster.TransformLink matrices across skins`);
        }
    }

    return warnings;
}

function areMatricesEquivalent(a: Float64Array, b: Float64Array, epsilon: number): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > epsilon) {
            return false;
        }
    }
    return true;
}

function createFallbackBone(modelId: bigint, objectMap: FBXObjectMap): FBXBoneData | null {
    const modelNode = objectMap.objects.get(modelId);
    if (!modelNode || modelNode.name !== "Model") {
        return null;
    }

    const transform = extractBoneTransform(modelNode);
    return {
        modelId,
        name: cleanFBXName(getPropertyValue<string>(modelNode, 1) ?? `Bone${modelId.toString()}`),
        index: -1,
        parentIndex: -1,
        isCluster: false,
        translation: transform.translation,
        rotation: transform.rotation,
        preRotation: transform.preRotation,
        postRotation: transform.postRotation,
        rotationPivot: transform.rotationPivot,
        scalingPivot: transform.scalingPivot,
        rotationOffset: transform.rotationOffset,
        scalingOffset: transform.scalingOffset,
        scale: transform.scale,
        rotationOrder: transform.rotationOrder,
        inheritType: transform.inheritType,
        clusterMode: "Unknown",
        bindPoseMatrix: null,
        transformLinkMatrix: null,
        transformAssociateModelMatrix: null,
        modelBindPoseMatrix: null,
        diagnostics: [],
    };
}

function compareBigInt(a: bigint, b: bigint): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

function compareSourceOrder(a: bigint, b: bigint, sourceOrderByModelId: Map<bigint, number>): number {
    const aOrder = sourceOrderByModelId.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = sourceOrderByModelId.get(b) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || compareBigInt(a, b);
}
