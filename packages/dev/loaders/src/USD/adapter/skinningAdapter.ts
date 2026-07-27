import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { type IAnimationKey } from "core/Animations/animationKey";
import { Bone } from "core/Bones/bone.pure";
import { Skeleton } from "core/Bones/skeleton";
import { VertexBuffer } from "core/Buffers/buffer.pure";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type Mesh } from "core/Meshes/mesh.pure";
import { type Scene } from "core/scene";
import { type IResolvedJointAnimation, type IResolvedSkeleton, type IResolvedSkeletonAnimation, type IResolvedSkinning, type Mat4 } from "../resolution/resolvedStage";

const MaxBabylonBoneInfluencers = 8;
const PrimaryInfluencerCount = 4;

/**
 * Creates a Babylon skeleton from resolved UsdSkel joint data.
 *
 * Resolved rest transforms are already local joint matrices, so they are used as both the initial
 * local bone matrix and the user-visible rest matrix. Resolved bind transforms are world-space USD
 * matrices; Babylon stores bind matrices in local bone space and derives inverse bind matrices
 * internally, so each child bind matrix is converted relative to its parent's world bind transform
 * before constructing the bone.
 * @param resolved the resolved skeleton payload
 * @param scene the scene that will own the skeleton
 * @returns the created Babylon skeleton
 */
export function CreateSkeletonFromResolved(resolved: IResolvedSkeleton, scene: Scene): Skeleton {
    const skeleton = new Skeleton(resolved.name, resolved.name, scene);
    const bindWorldMatrices = resolved.bindTransforms.map(CreateMatrixFromMat4);
    const bones: Bone[] = [];

    for (let index = 0; index < resolved.joints.length; index++) {
        const parentIndex = resolved.parentIndices[index];
        const parentBone = parentIndex >= 0 ? bones[parentIndex] : null;
        const restMatrix = CreateMatrixFromMat4(resolved.restTransforms[index]);
        const bindMatrix = CreateLocalBindMatrix(index, parentIndex, bindWorldMatrices);

        bones[index] = new Bone(GetJointLeafName(resolved.joints[index]), skeleton, parentBone, restMatrix, restMatrix.clone(), bindMatrix, index);
    }

    return skeleton;
}

/**
 * Applies resolved UsdSkel vertex influences to a Babylon mesh.
 *
 * Babylon stores up to four primary bone indices/weights and, when needed, four extra
 * indices/weights. This adapter preserves the resolved joint order up to Babylon's eight-influence
 * limit and normalizes the used weights per vertex when their sum is non-zero. If a
 * `geomBindTransform` is present, it is stored as the mesh pose matrix inverse and the skeleton is
 * marked as needing initial skin matrices, matching Babylon's bind-pose path rather than rebaking
 * geometry.
 * @param mesh the mesh to bind to the skeleton
 * @param skinning the resolved per-vertex skinning payload
 * @param skeleton the Babylon skeleton referenced by the skinning payload
 * @param _scene reserved for parity with other USD adapters that need scene context
 */
export function ApplySkinningToMesh(mesh: Mesh, skinning: IResolvedSkinning, skeleton: Skeleton, _scene: Scene): void {
    const buffers = CreateSkinningBuffers(skinning);

    if (skinning.geomBindTransform) {
        skeleton.needInitialSkinMatrix = true;
        mesh.updatePoseMatrix(Matrix.Invert(CreateMatrixFromMat4(skinning.geomBindTransform)));
    }

    mesh.skeleton = skeleton;
    mesh.numBoneInfluencers = buffers.numBoneInfluencers;
    mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, buffers.matricesIndices);
    mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, buffers.matricesWeights);

    if (buffers.matricesIndicesExtra && buffers.matricesWeightsExtra) {
        mesh.setVerticesData(VertexBuffer.MatricesIndicesExtraKind, buffers.matricesIndicesExtra);
        mesh.setVerticesData(VertexBuffer.MatricesWeightsExtraKind, buffers.matricesWeightsExtra);
    }
}

/**
 * Creates a Babylon animation group for resolved skeleton joint animation.
 *
 * The frozen resolved skeleton animation contract carries one shared time array and local TRS
 * samples per joint, but no interpolation metadata. This adapter composes each TRS sample into a
 * local bone matrix, targets the bone's Babylon `_matrix` property, and relies on Babylon's default
 * matrix interpolation behavior. The returned group is assembled only; it is not started.
 * @param resolved the resolved skeleton animation
 * @param skeleton the skeleton whose bones will be targeted
 * @param fps frames per second used to convert resolved seconds to Babylon frames
 * @param scene the scene that will own the animation group
 * @returns the created animation group
 */
export function CreateSkeletonAnimation(resolved: IResolvedSkeletonAnimation, skeleton: Skeleton, fps: number, scene: Scene): AnimationGroup {
    const group = new AnimationGroup(`${skeleton.name}Animation`, scene);

    for (const jointAnimation of resolved.joints) {
        const bone = skeleton.bones[jointAnimation.jointIndex];
        if (!bone) {
            continue;
        }

        const keys = CreateJointMatrixKeys(resolved.times, jointAnimation, fps);
        if (keys.length === 0) {
            continue;
        }

        const animation = new Animation(`${skeleton.name}.${bone.name}._matrix`, "_matrix", fps, Animation.ANIMATIONTYPE_MATRIX, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animation.setKeys(keys);
        group.addTargetedAnimation(animation, bone);
    }

    return group;
}

function CreateMatrixFromMat4(matrix: Mat4 | undefined): Matrix {
    return matrix && matrix.length === 16 ? Matrix.FromArray(matrix) : Matrix.Identity();
}

function CreateLocalBindMatrix(index: number, parentIndex: number, bindWorldMatrices: Matrix[]): Matrix {
    const bindWorldMatrix = bindWorldMatrices[index] ?? Matrix.Identity();
    if (parentIndex < 0) {
        return bindWorldMatrix.clone();
    }

    const parentBindWorldMatrix = bindWorldMatrices[parentIndex];
    return parentBindWorldMatrix ? bindWorldMatrix.multiply(Matrix.Invert(parentBindWorldMatrix)) : bindWorldMatrix.clone();
}

function GetJointLeafName(jointPath: string): string {
    const leafStart = jointPath.lastIndexOf("/") + 1;
    return jointPath.substring(leafStart) || jointPath;
}

function CreateSkinningBuffers(skinning: IResolvedSkinning): {
    matricesIndices: Float32Array;
    matricesWeights: Float32Array;
    matricesIndicesExtra: Float32Array | null;
    matricesWeightsExtra: Float32Array | null;
    numBoneInfluencers: number;
} {
    const sourceInfluenceCount = Math.max(0, skinning.influencesPerVertex);
    const numBoneInfluencers = Math.min(sourceInfluenceCount, MaxBabylonBoneInfluencers);
    const vertexCount =
        sourceInfluenceCount === 0 ? 0 : Math.min(Math.floor(skinning.jointIndices.length / sourceInfluenceCount), Math.floor(skinning.jointWeights.length / sourceInfluenceCount));
    const matricesIndices = new Float32Array(vertexCount * PrimaryInfluencerCount);
    const matricesWeights = new Float32Array(vertexCount * PrimaryInfluencerCount);
    const matricesIndicesExtra = numBoneInfluencers > PrimaryInfluencerCount ? new Float32Array(vertexCount * PrimaryInfluencerCount) : null;
    const matricesWeightsExtra = numBoneInfluencers > PrimaryInfluencerCount ? new Float32Array(vertexCount * PrimaryInfluencerCount) : null;

    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
        const sourceOffset = vertexIndex * sourceInfluenceCount;
        const weightSum = GetWeightSum(skinning.jointWeights, sourceOffset, numBoneInfluencers);

        for (let influenceIndex = 0; influenceIndex < numBoneInfluencers; influenceIndex++) {
            const targetOffset = vertexIndex * PrimaryInfluencerCount + (influenceIndex % PrimaryInfluencerCount);
            const targetIndices = influenceIndex < PrimaryInfluencerCount ? matricesIndices : matricesIndicesExtra!;
            const targetWeights = influenceIndex < PrimaryInfluencerCount ? matricesWeights : matricesWeightsExtra!;

            targetIndices[targetOffset] = skinning.jointIndices[sourceOffset + influenceIndex];
            targetWeights[targetOffset] = weightSum > 0 ? skinning.jointWeights[sourceOffset + influenceIndex] / weightSum : 0;
        }
    }

    return {
        matricesIndices,
        matricesWeights,
        matricesIndicesExtra,
        matricesWeightsExtra,
        numBoneInfluencers: Math.max(numBoneInfluencers, 1),
    };
}

function GetWeightSum(weights: Float32Array, offset: number, count: number): number {
    let sum = 0;
    for (let index = 0; index < count; index++) {
        sum += weights[offset + index];
    }
    return sum;
}

function CreateJointMatrixKeys(times: Float32Array, jointAnimation: IResolvedJointAnimation, fps: number): IAnimationKey[] {
    const sampleCount = Math.min(
        times.length,
        Math.floor(jointAnimation.translations.length / 3),
        Math.floor(jointAnimation.rotations.length / 4),
        Math.floor(jointAnimation.scales.length / 3)
    );
    const keys: IAnimationKey[] = [];

    for (let index = 0; index < sampleCount; index++) {
        const translationOffset = index * 3;
        const rotationOffset = index * 4;
        const scaleOffset = index * 3;

        keys.push({
            frame: times[index] * fps,
            value: Matrix.Compose(
                new Vector3(jointAnimation.scales[scaleOffset], jointAnimation.scales[scaleOffset + 1], jointAnimation.scales[scaleOffset + 2]),
                new Quaternion(
                    jointAnimation.rotations[rotationOffset],
                    jointAnimation.rotations[rotationOffset + 1],
                    jointAnimation.rotations[rotationOffset + 2],
                    jointAnimation.rotations[rotationOffset + 3]
                ),
                new Vector3(jointAnimation.translations[translationOffset], jointAnimation.translations[translationOffset + 1], jointAnimation.translations[translationOffset + 2])
            ),
        });
    }

    return keys;
}
