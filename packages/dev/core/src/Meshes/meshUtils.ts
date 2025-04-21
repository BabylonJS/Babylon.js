import type { AnimationGroup } from "../Animations/animationGroup";
import type { FloatArray, Nullable } from "../types";
import type { AbstractMesh } from "./abstractMesh";
import type { Mesh } from "./mesh";

import { VertexBuffer } from "../Buffers/buffer";
import { TmpVectors, Vector3 } from "../Maths/math.vector";

function getExtentCorners(extent: { minimum: Vector3; maximum: Vector3 }): Array<Vector3> {
    const minX = extent.minimum.x;
    const minY = extent.minimum.y;
    const minZ = extent.minimum.z;
    const maxX = extent.maximum.x;
    const maxY = extent.maximum.y;
    const maxZ = extent.maximum.z;
    return [
        new Vector3(minX, minY, minZ),
        new Vector3(maxX, maxY, maxZ),
        new Vector3(maxX, minY, minZ),
        new Vector3(minX, maxY, minZ),
        new Vector3(minX, minY, maxZ),
        new Vector3(maxX, maxY, minZ),
        new Vector3(minX, maxY, maxZ),
        new Vector3(maxX, minY, maxZ),
    ];
}

/**
 * Computes the maximum extents of the given meshes considering animation, skeleton, and morph targets.
 * @param meshes The array of meshes to compute
 * @param animationGroup An optional animation group to animate (must be started to take effect)
 * @param animationStep An optional value indicating the number of seconds to step while looping through the given animation group
 * @returns An array of world space extents corresponding to the given meshes
 */
export function computeMaxExtents(
    meshes: Array<AbstractMesh>,
    animationGroup: Nullable<AnimationGroup> = null,
    animationStep = 1 / 6
): Array<{ minimum: Vector3; maximum: Vector3 }> {
    // Local vector to avoid allocations.
    const position = TmpVectors.Vector3[0];

    const meshExtents = new Map<number, { minimum: Vector3; maximum: Vector3 }>();
    const skinnedMeshExtents = new Map<number, Map<number, { minimum: Vector3; maximum: Vector3 }>>();

    // Compute the non-skinned and skinned mesh extents.
    const maxLength = meshes.reduce((previous, current) => Math.max(previous, current.getTotalVertices()), 0);
    const minPositions = Array.from({ length: maxLength }, () => new Vector3());
    const maxPositions = Array.from({ length: maxLength }, () => new Vector3());
    for (const mesh of meshes) {
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        if (!positions) {
            continue;
        }

        // Initialize min/max positions with the original positions.
        const numVertices = mesh.getTotalVertices();
        minPositions.length = Math.max(minPositions.length, numVertices);
        maxPositions.length = Math.max(minPositions.length, numVertices);
        for (let i = 0, j = 0; i < numVertices; i++, j += 3) {
            position.set(positions[j], positions[j + 1], positions[j + 2]);
            minPositions[i].copyFrom(position);
            maxPositions[i].copyFrom(position);
        }

        // Apply morph targets to the min/max positions.
        const morphTargetManager = mesh.morphTargetManager;
        if (morphTargetManager) {
            for (let targetIndex = 0; targetIndex < morphTargetManager.numTargets; ++targetIndex) {
                const target = morphTargetManager.getTarget(targetIndex);
                const positions = target.getPositions();
                if (positions) {
                    for (let i = 0, j = 0; i < numVertices; i++, j += 3) {
                        position.set(positions[j], positions[j + 1], positions[j + 2]);
                        minPositions[i].minimizeInPlace(position);
                        maxPositions[i].maximizeInPlace(position);
                    }
                }
            }
        }

        // Compute extent per mesh.
        const skeleton = mesh.skeleton;
        const weights = skeleton ? mesh.getVerticesData(VertexBuffer.MatricesWeightsKind) : null;
        const indices = skeleton ? mesh.getVerticesData(VertexBuffer.MatricesIndicesKind) : null;
        if (weights && indices) {
            // Compute extent per bone for skinned meshes.
            const needsExtra = mesh.numBoneInfluencers > 4;
            const weightsExtra = needsExtra ? mesh.getVerticesData(VertexBuffer.MatricesWeightsExtraKind) : null;
            const indicesExtra = needsExtra ? mesh.getVerticesData(VertexBuffer.MatricesIndicesExtraKind) : null;

            const perBoneExtents = skinnedMeshExtents.get(mesh.uniqueId) || new Map<number, { minimum: Vector3; maximum: Vector3 }>();
            skinnedMeshExtents.set(mesh.uniqueId, perBoneExtents);

            const updateExtents = (i: number, j: number, weights: FloatArray, indices: FloatArray): void => {
                for (let k = j; k < j + 4; k++) {
                    if (weights[k] > 0) {
                        const boneIndex = indices[k];

                        const extent = perBoneExtents.get(boneIndex);
                        if (extent) {
                            extent.minimum.minimizeInPlace(minPositions[i]);
                            extent.maximum.maximizeInPlace(maxPositions[i]);
                        } else {
                            perBoneExtents.set(boneIndex, {
                                minimum: minPositions[i].clone(),
                                maximum: maxPositions[i].clone(),
                            });
                        }
                    }
                }
            };

            for (let i = 0, j = 0; i < numVertices; i++, j += 4) {
                updateExtents(i, j, weights, indices);

                if (weightsExtra && indicesExtra) {
                    updateExtents(i, j, weightsExtra, indicesExtra);
                }
            }
        } else {
            // Compute extent for the whole mesh for non-skinned meshes.
            const extent = meshExtents.get(mesh.uniqueId) || {
                minimum: new Vector3().setAll(Number.POSITIVE_INFINITY),
                maximum: new Vector3().setAll(Number.NEGATIVE_INFINITY),
            };
            meshExtents.set(mesh.uniqueId, extent);

            for (let i = 0; i < numVertices; i++) {
                extent.minimum.minimizeInPlace(minPositions[i]);
                extent.maximum.maximizeInPlace(maxPositions[i]);
            }
        }
    }

    // Create the 8 corners of each non-skinned and skinned extent.
    const meshCorners = new Map<number, Array<Vector3>>();
    const skinnedMeshCorners = new Map<number, Map<number, Array<Vector3>>>();
    for (const mesh of meshes) {
        const extent = meshExtents.get(mesh.uniqueId);
        if (extent) {
            meshCorners.set(mesh.uniqueId, getExtentCorners(extent));
        } else {
            const perBoneExtents = skinnedMeshExtents.get(mesh.uniqueId);
            if (perBoneExtents) {
                const bones = mesh.skeleton!.bones;

                const perBoneCorners = new Map<number, Array<Vector3>>();
                skinnedMeshCorners.set(mesh.uniqueId, perBoneCorners);

                perBoneExtents.forEach((extent, boneIndex) => {
                    const corners = getExtentCorners(extent);

                    // Transform the coordinates of the corners for skinned meshes to bone space.
                    const inverseBindMatrix = bones[boneIndex].getAbsoluteInverseBindMatrix();
                    for (const corner of corners) {
                        Vector3.TransformCoordinatesToRef(corner, inverseBindMatrix, corner);
                    }

                    perBoneCorners.set(boneIndex, corners);
                });
            }
        }
    }

    const maxExtents = Array.from({ length: meshes.length }, () => ({
        minimum: new Vector3().setAll(Number.POSITIVE_INFINITY),
        maximum: new Vector3().setAll(Number.NEGATIVE_INFINITY),
    }));

    const updateMaxExtents = (): void => {
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
            if (!positions) {
                continue;
            }

            const worldMatrix = mesh.computeWorldMatrix(true);

            const skeleton = mesh.skeleton;
            if (skeleton) {
                skeleton.prepare(true);

                const bones = skeleton.bones;
                const perBoneCorners = skinnedMeshCorners.get(mesh.uniqueId)!;
                perBoneCorners.forEach((corners, boneIndex) => {
                    // Transform the per-bone corners into world space and update the max extent for each corner.
                    for (const corner of corners) {
                        const matrix = bones[boneIndex].getFinalMatrix().multiplyToRef(worldMatrix, TmpVectors.Matrix[0]);
                        Vector3.TransformCoordinatesToRef(corner, matrix, position);
                        maxExtents[i].minimum.minimizeInPlace(position);
                        maxExtents[i].maximum.maximizeInPlace(position);
                    }
                });
            } else {
                // Transform the corners into world space and update the max extent for each corner.
                for (const corner of meshCorners.get(mesh.uniqueId)!) {
                    Vector3.TransformCoordinatesToRef(corner, worldMatrix, position);
                    maxExtents[i].minimum.minimizeInPlace(position);
                    maxExtents[i].maximum.maximizeInPlace(position);
                }
            }
        }
    };

    if (animationGroup && animationGroup.isStarted) {
        const currentFrame = animationGroup.getCurrentFrame();
        const step = animationStep / animationGroup.getLength(0, 1);
        for (let frame = animationGroup.from; frame <= animationGroup.to; frame += step) {
            animationGroup.goToFrame(frame);
            updateMaxExtents();
        }
        animationGroup.goToFrame(currentFrame);
    } else {
        updateMaxExtents();
    }

    return maxExtents;
}

/**
 * @experimental
 * Removes unreferenced vertex data from the given meshes.
 * This is useful for cleaning up unused vertex data, such as UV sets, to reduce memory usage and stay under graphics device limits.
 * @remarks
 * This function currently only removes unreferenced UV sets (UV2, UV3, etc.) from the meshes.
 * @param meshes The array of meshes to clean up.
 */
export function RemoveUnreferencedVerticesData(meshes: readonly Mesh[]) {
    const uvIndexToKind = [VertexBuffer.UVKind, VertexBuffer.UV2Kind, VertexBuffer.UV3Kind, VertexBuffer.UV4Kind, VertexBuffer.UV5Kind, VertexBuffer.UV6Kind] as const;
    for (const mesh of meshes) {
        const unreferencedUVSets = new Set(uvIndexToKind);
        const textures = mesh.material?.getActiveTextures();
        if (textures) {
            for (const texture of textures) {
                unreferencedUVSets.delete(uvIndexToKind[texture.coordinatesIndex]);
            }
        }

        unreferencedUVSets.forEach((unreferencedUVSet) => {
            if (mesh.isVerticesDataPresent(unreferencedUVSet)) {
                mesh.removeVerticesData(unreferencedUVSet);
            }
        });
    }
}
