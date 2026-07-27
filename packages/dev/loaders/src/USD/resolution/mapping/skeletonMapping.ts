import {
    type IResolvedJointAnimation,
    type IResolvedMesh,
    type IResolvedSkeleton,
    type IResolvedSkeletonAnimation,
    type IResolvedSkinning,
    type Mat4,
    type Quat,
    type Vec3,
} from "../resolvedStage";
import { type ISdfAttributeSpec, type ISdfPrimSpec, type SdfValue } from "../sdf/index";
import { type IStageMappingContext } from "./mappingContext";
import {
    AsMat4,
    AsNumber,
    AsNumberArray,
    AsQuat,
    AsTokenArray,
    AsVec3,
    AsVec3Array,
    GetAttribute,
    GetAttributeValue,
    GetRelationship,
    GetRelationshipTargets,
    GetTokenArrayAttribute,
} from "./valueAccess";
import { UsdMatrixToResolvedLayout } from "./transformMapping";

/** Mapping context extensions needed while resolving UsdSkel skeletons and bindings. */
export interface ISkeletonMappingContext extends IStageMappingContext {
    /** Shared skeleton pool owned by the resolved stage under construction. */
    skeletons: IResolvedSkeleton[];
    /** Skeleton pool lookup by absolute Skeleton prim path. */
    skeletonIndexByPath: Map<string, number>;
}

/**
 * Resolves and pools a UsdSkel Skeleton prim by path.
 * @param skeletonPath absolute path to the Skeleton prim
 * @param context mapping context with skeleton pool, prim lookup, and diagnostics
 * @param timeCodesPerSecond stage time-code rate used to convert skeleton animation samples
 * @returns skeleton pool index, or undefined when the target is not a valid Skeleton prim
 */
export function ResolveSkeletonIndex(skeletonPath: string, context: ISkeletonMappingContext, timeCodesPerSecond: number): number | undefined {
    const normalizedPath = NormalizePrimPath(skeletonPath);
    const existing = context.skeletonIndexByPath.get(normalizedPath);
    if (existing !== undefined) {
        return existing;
    }

    const skeletonPrim = context.primByPath.get(normalizedPath);
    if (!skeletonPrim || skeletonPrim.typeName !== "Skeleton") {
        context.diagnostics.push({ severity: "warning", path: normalizedPath, message: "Skel binding target was not found or was not a Skeleton prim." });
        return undefined;
    }

    const joints = GetTokenArrayAttribute(skeletonPrim, "joints") ?? [];
    if (joints.length === 0) {
        context.diagnostics.push({ severity: "warning", path: skeletonPrim.path, message: "Skeleton is missing joints and was skipped." });
        return undefined;
    }

    const skeleton: IResolvedSkeleton = {
        name: skeletonPrim.name,
        joints,
        parentIndices: BuildParentIndices(joints),
        bindTransforms: ResolveMatrixArray(skeletonPrim, "bindTransforms", joints.length),
        restTransforms: ResolveMatrixArray(skeletonPrim, "restTransforms", joints.length),
    };

    const animation = ResolveSkeletonAnimation(skeletonPrim, joints, context, timeCodesPerSecond);
    if (animation) {
        skeleton.animation = animation;
    }

    const index = context.skeletons.length;
    context.skeletons.push(skeleton);
    context.skeletonIndexByPath.set(normalizedPath, index);
    return index;
}

/**
 * Resolves static UsdSkel skinning data authored on a Mesh prim.
 * @param meshPrim mesh prim that may bind a skeleton
 * @param context mapping context with skeleton pool, prim lookup, and diagnostics
 * @param timeCodesPerSecond stage time-code rate used if the skeleton must be resolved
 * @param resolvedMesh already-resolved mesh geometry used to align influence buffers
 * @returns resolved skinning payload, or undefined when the mesh is not statically skinned
 */
export function ResolveSkinning(meshPrim: ISdfPrimSpec, context: ISkeletonMappingContext, timeCodesPerSecond: number, resolvedMesh: IResolvedMesh): IResolvedSkinning | undefined {
    const skeletonPath = GetRelationshipTargets(GetRelationship(meshPrim, "skel:skeleton"))[0];
    if (!skeletonPath) {
        return undefined;
    }

    const skeletonIndex = ResolveSkeletonIndex(skeletonPath, context, timeCodesPerSecond);
    if (skeletonIndex === undefined) {
        return undefined;
    }

    const jointIndicesAttribute = GetAttribute(meshPrim, "primvars:skel:jointIndices");
    const jointWeightsAttribute = GetAttribute(meshPrim, "primvars:skel:jointWeights");
    const jointIndices = AsNumberArray(GetAttributeValue(jointIndicesAttribute));
    const jointWeights = AsNumberArray(GetAttributeValue(jointWeightsAttribute));
    const influencesPerVertex = ResolveInfluencesPerVertex(jointIndicesAttribute, jointWeightsAttribute, jointIndices, jointWeights);
    if (!jointIndices || !jointWeights || influencesPerVertex <= 0) {
        context.diagnostics.push({ severity: "warning", path: meshPrim.path, message: "Skinned Mesh is missing joint indices, joint weights, or influence elementSize." });
        return undefined;
    }

    const aligned = AlignSkinningBuffers(meshPrim, resolvedMesh, jointIndices, jointWeights, influencesPerVertex);
    const skeleton = context.skeletons[skeletonIndex];
    const bindingJoints = ResolveBindingJoints(meshPrim, context);
    // Index the skeleton joints once so remapping is O(V + J) rather than O(V * J) via indexOf.
    // First occurrence wins on duplicate joint tokens, matching USD and the previous indexOf behavior.
    const jointIndexByPath = new Map<string, number>();
    skeleton?.joints.forEach((joint, index) => {
        if (!jointIndexByPath.has(joint)) {
            jointIndexByPath.set(joint, index);
        }
    });
    const skeletonJointCount = skeleton?.joints.length ?? 0;

    let hasInvalidInfluence = false;
    const remappedJointIndices = aligned.jointIndices.map((value) => {
        const resolved = ResolveInfluenceJoint(value, bindingJoints, jointIndexByPath, skeletonJointCount);
        if (resolved === undefined) {
            // Explicit, reported fallback to the root joint. The weight is preserved so a fully-invalid
            // vertex is not left unweighted (which would collapse it to the skeleton origin) and its
            // per-vertex weight normalization is kept.
            hasInvalidInfluence = true;
            return 0;
        }
        return resolved;
    });
    if (hasInvalidInfluence) {
        context.diagnostics.push({
            severity: "warning",
            path: meshPrim.path,
            message: "Skinned Mesh has joint influences that are invalid or reference joints absent from the bound Skeleton; they were bound to the root joint.",
        });
    }
    const skinning: IResolvedSkinning = {
        skeletonIndex,
        influencesPerVertex,
        jointIndices: new Uint32Array(remappedJointIndices),
        jointWeights: new Float32Array(aligned.jointWeights),
    };

    const geomBindTransform = AsMat4(GetAttributeValue(GetAttribute(meshPrim, "primvars:skel:geomBindTransform")));
    if (geomBindTransform) {
        skinning.geomBindTransform = UsdMatrixToResolvedLayout(geomBindTransform);
    }

    return skinning;
}

// Reads the mesh's skel:joints binding order. USD SkelBindingAPI authors it as a uniform token[]
// attribute; a relationship or any other authored type is rejected with a diagnostic and treated as
// absent, which falls back to indexing the skeleton's joints directly.
function ResolveBindingJoints(meshPrim: ISdfPrimSpec, context: ISkeletonMappingContext): string[] | undefined {
    const attribute = GetAttribute(meshPrim, "skel:joints");
    if (attribute) {
        if (attribute.typeName !== "token[]") {
            context.diagnostics.push({
                severity: "warning",
                path: meshPrim.path,
                message: `Mesh skel:joints must be a token[] attribute but was authored as '${attribute.typeName}'; the binding was ignored.`,
            });
            return undefined;
        }
        return AsTokenArray(GetAttributeValue(attribute)) ?? [];
    }
    if (GetRelationship(meshPrim, "skel:joints")) {
        context.diagnostics.push({
            severity: "warning",
            path: meshPrim.path,
            message: "Mesh skel:joints must be a token[] attribute but was authored as a relationship; the binding was ignored.",
        });
    }
    return undefined;
}

// Resolves one authored joint-influence index to a skeleton joint index, or undefined when the
// influence is invalid: non-finite, fractional, negative, out of the binding list, referencing a joint
// absent from the skeleton, or out of the skeleton's range when no binding list is authored.
function ResolveInfluenceJoint(value: number, bindingJoints: string[] | undefined, jointIndexByPath: ReadonlyMap<string, number>, skeletonJointCount: number): number | undefined {
    if (!Number.isInteger(value) || value < 0) {
        return undefined;
    }
    if (bindingJoints && bindingJoints.length > 0) {
        const jointPath = bindingJoints[value];
        return jointPath === undefined ? undefined : jointIndexByPath.get(jointPath);
    }
    return value < skeletonJointCount ? value : undefined;
}

function BuildParentIndices(joints: string[]): Int32Array {
    const indexByJoint = new Map<string, number>();
    joints.forEach((joint, index) => indexByJoint.set(joint, index));

    const parentIndices = new Int32Array(joints.length);
    joints.forEach((joint, index) => {
        const parentPath = GetParentJointPath(joint);
        parentIndices[index] = parentPath ? (indexByJoint.get(parentPath) ?? -1) : -1;
    });
    return parentIndices;
}

function GetParentJointPath(joint: string): string | undefined {
    const slashIndex = joint.lastIndexOf("/");
    return slashIndex > 0 ? joint.slice(0, slashIndex) : undefined;
}

function ResolveMatrixArray(prim: ISdfPrimSpec, attributeName: string, jointCount: number): Mat4[] {
    const authored = AsMat4Array(GetAttributeValue(GetAttribute(prim, attributeName))) ?? [];
    const matrices: Mat4[] = [];
    for (let index = 0; index < jointCount; index++) {
        matrices.push(authored[index] ? UsdMatrixToResolvedLayout(authored[index]) : IdentityMatrix());
    }
    return matrices;
}

function AsMat4Array(value: SdfValue | undefined): Mat4[] | undefined {
    if (!Array.isArray(value?.value) || !value.value.every((item) => IsNumericTuple(item, 16))) {
        return undefined;
    }
    return value.value.map((item) => [...item]);
}

function ResolveSkeletonAnimation(
    skeletonPrim: ISdfPrimSpec,
    skeletonJoints: string[],
    context: ISkeletonMappingContext,
    timeCodesPerSecond: number
): IResolvedSkeletonAnimation | undefined {
    const animationPrim = ResolveAnimationSourcePrim(skeletonPrim, context);
    if (!animationPrim) {
        return undefined;
    }

    const translations = GetAttribute(animationPrim, "translations");
    const rotations = GetAttribute(animationPrim, "rotations");
    const scales = GetAttribute(animationPrim, "scales");
    const sampleTimes = ResolveAnimationSampleTimes(translations, rotations, scales);
    if (sampleTimes.length === 0) {
        return undefined;
    }

    const animationJoints = GetTokenArrayAttribute(animationPrim, "joints") ?? skeletonJoints;
    const sourceIndexByJoint = new Map<string, number>();
    animationJoints.forEach((joint, index) => sourceIndexByJoint.set(joint, index));

    const joints: IResolvedJointAnimation[] = [];
    for (let jointIndex = 0; jointIndex < skeletonJoints.length; jointIndex++) {
        const sourceIndex = sourceIndexByJoint.get(skeletonJoints[jointIndex]) ?? jointIndex;
        joints.push(BuildJointAnimation(jointIndex, sourceIndex, sampleTimes.length, translations, rotations, scales));
    }

    return {
        times: new Float32Array(sampleTimes.map((time) => time / timeCodesPerSecond)),
        joints,
    };
}

function ResolveAnimationSourcePrim(skeletonPrim: ISdfPrimSpec, context: ISkeletonMappingContext): ISdfPrimSpec | undefined {
    for (const path of GetAnimationSourceTargets(skeletonPrim, context)) {
        const prim = context.primByPath.get(path);
        if (prim?.typeName === "SkelAnimation") {
            return prim;
        }
    }
    return undefined;
}

function GetAnimationSourceTargets(skeletonPrim: ISdfPrimSpec, context: ISkeletonMappingContext): string[] {
    const targets: string[] = [];
    targets.push(...GetRelationshipTargets(GetRelationship(skeletonPrim, "skel:animationSource")).map(NormalizePrimPath));

    let parentPath = GetParentPrimPath(skeletonPrim.path);
    while (parentPath) {
        const parent = context.primByPath.get(parentPath);
        if (parent) {
            targets.push(...GetRelationshipTargets(GetRelationship(parent, "skel:animationSource")).map(NormalizePrimPath));
        }
        parentPath = GetParentPrimPath(parentPath);
    }
    return targets;
}

function ResolveAnimationSampleTimes(...attributes: (ISdfAttributeSpec | undefined)[]): number[] {
    for (const attribute of attributes) {
        if (attribute?.timeSamples?.times.length) {
            return attribute.timeSamples.times;
        }
    }
    return [];
}

function BuildJointAnimation(
    jointIndex: number,
    sourceIndex: number,
    sampleCount: number,
    translationsAttribute: ISdfAttributeSpec | undefined,
    rotationsAttribute: ISdfAttributeSpec | undefined,
    scalesAttribute: ISdfAttributeSpec | undefined
): IResolvedJointAnimation {
    const translations: number[] = [];
    const rotations: number[] = [];
    const scales: number[] = [];

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
        const translation = ResolveVec3ArraySample(translationsAttribute, sampleIndex, sourceIndex, [0, 0, 0]);
        const rotation = ResolveQuatArraySample(rotationsAttribute, sampleIndex, sourceIndex, [0, 0, 0, 1]);
        const scale = ResolveVec3ArraySample(scalesAttribute, sampleIndex, sourceIndex, [1, 1, 1]);
        translations.push(translation[0], translation[1], translation[2]);
        rotations.push(rotation[0], rotation[1], rotation[2], rotation[3]);
        scales.push(scale[0], scale[1], scale[2]);
    }

    return {
        jointIndex,
        translations: new Float32Array(translations),
        rotations: new Float32Array(rotations),
        scales: new Float32Array(scales),
    };
}

function ResolveVec3ArraySample(attribute: ISdfAttributeSpec | undefined, sampleIndex: number, sourceIndex: number, fallback: Vec3): Vec3 {
    const sample = attribute?.timeSamples?.values[sampleIndex] ?? GetAttributeValue(attribute);
    return AsVec3Array(sample)?.[sourceIndex] ?? AsVec3(sample) ?? fallback;
}

function ResolveQuatArraySample(attribute: ISdfAttributeSpec | undefined, sampleIndex: number, sourceIndex: number, fallback: Quat): Quat {
    const sample = attribute?.timeSamples?.values[sampleIndex] ?? GetAttributeValue(attribute);
    return AsQuatArray(sample)?.[sourceIndex] ?? AsQuat(sample) ?? fallback;
}

function ResolveInfluencesPerVertex(
    jointIndicesAttribute: ISdfAttributeSpec | undefined,
    jointWeightsAttribute: ISdfAttributeSpec | undefined,
    jointIndices: number[] | undefined,
    jointWeights: number[] | undefined
): number {
    const authored =
        AsNumber(jointIndicesAttribute?.metadata?.elementSize) ??
        AsNumber(jointWeightsAttribute?.metadata?.elementSize) ??
        AsNumber(jointIndicesAttribute?.metadata?.elementsize) ??
        AsNumber(jointWeightsAttribute?.metadata?.elementsize);
    if (authored !== undefined) {
        return Math.max(0, Math.trunc(authored));
    }
    if (jointIndices && jointWeights && jointIndices.length === jointWeights.length && jointIndices.length % 4 === 0) {
        return 4;
    }
    return 0;
}

function AlignSkinningBuffers(
    _meshPrim: ISdfPrimSpec,
    resolvedMesh: IResolvedMesh,
    jointIndices: number[],
    jointWeights: number[],
    influencesPerVertex: number
): { jointIndices: number[]; jointWeights: number[] } {
    const resolvedVertexCount = Math.floor(resolvedMesh.positions.length / 3);
    const sourceVertexCount = Math.floor(Math.min(jointIndices.length, jointWeights.length) / influencesPerVertex);
    const alignedJointIndices: number[] = [];
    const alignedJointWeights: number[] = [];
    for (let vertexIndex = 0; vertexIndex < resolvedVertexCount; vertexIndex++) {
        const sourceIndex = resolvedMesh.sourcePointIndices?.[vertexIndex] ?? Math.min(vertexIndex, Math.max(0, sourceVertexCount - 1));
        const sourceOffset = sourceIndex * influencesPerVertex;
        for (let influenceIndex = 0; influenceIndex < influencesPerVertex; influenceIndex++) {
            alignedJointIndices.push(jointIndices[sourceOffset + influenceIndex] ?? 0);
            alignedJointWeights.push(jointWeights[sourceOffset + influenceIndex] ?? 0);
        }
    }
    return { jointIndices: alignedJointIndices, jointWeights: alignedJointWeights };
}

function AsQuatArray(value: SdfValue | undefined): Quat[] | undefined {
    if (!Array.isArray(value?.value) || !value.value.every((item) => IsNumericTuple(item, 4))) {
        return undefined;
    }
    return value.value.map((item): Quat => {
        const tuple = item as number[];
        return [tuple[0], tuple[1], tuple[2], tuple[3]];
    });
}

function IsNumericTuple(value: unknown, length: number): value is number[] {
    return Array.isArray(value) && value.length >= length && value.slice(0, length).every((item) => typeof item === "number");
}

function NormalizePrimPath(path: string): string {
    const propertyIndex = path.indexOf(".");
    return propertyIndex >= 0 ? path.slice(0, propertyIndex) : path;
}

function GetParentPrimPath(path: string): string | undefined {
    const slashIndex = path.lastIndexOf("/");
    return slashIndex > 0 ? path.slice(0, slashIndex) : undefined;
}

function IdentityMatrix(): Mat4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
