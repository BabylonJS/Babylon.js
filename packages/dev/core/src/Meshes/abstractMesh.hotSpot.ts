import { Vector3, TmpVectors, Matrix } from "../Maths/math.vector";
import type { AbstractMesh } from "./abstractMesh";
import { VertexBuffer } from "../Buffers/buffer";
import { Constants } from "core/Engines/constants";

/**
 * Data for mesh hotspot computation
 */
export type HotSpotQuery = {
    /**
     * 3 point indices
     */
    pointIndex: [number, number, number];
    /**
     * 3 barycentric coordinates
     */
    barycentric: [number, number, number];
};

/**
 * Return a transformed local position from a mesh and vertex index
 * @param mesh mesh used to get vertex array from
 * @param index vertex index
 * @param res resulting local position
 * @returns false if it was not possible to compute the position for that vertex
 */
export function GetTransformedPosition(mesh: AbstractMesh, index: number, res: Vector3): boolean {
    const data = mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!data) {
        return false;
    }
    const base = index * 3;
    const values = [data[base + 0], data[base + 1], data[base + 2]];
    if (values.some((value) => isNaN(value ?? Number.NaN))) {
        return false;
    }

    if (mesh.morphTargetManager) {
        for (let component = 0; component < 3; component++) {
            let value = values[component];
            for (let targetCount = 0; targetCount < mesh.morphTargetManager.numTargets; targetCount++) {
                const target = mesh.morphTargetManager.getTarget(targetCount);
                const influence = target.influence;
                if (influence !== 0) {
                    const targetData = target.getPositions();
                    if (targetData) {
                        value += (targetData[base + component] - data[base + component]) * influence;
                    }
                }
            }
            values[component] = value;
        }
    }
    res.fromArray(values);
    if (mesh.skeleton) {
        const matricesIndicesData = mesh.getVerticesData(VertexBuffer.MatricesIndicesKind);
        const matricesWeightsData = mesh.getVerticesData(VertexBuffer.MatricesWeightsKind);
        if (matricesWeightsData && matricesIndicesData) {
            const needExtras = mesh.numBoneInfluencers > 4;
            const matricesIndicesExtraData = needExtras ? mesh.getVerticesData(VertexBuffer.MatricesIndicesExtraKind) : null;
            const matricesWeightsExtraData = needExtras ? mesh.getVerticesData(VertexBuffer.MatricesWeightsExtraKind) : null;
            const skeletonMatrices = mesh.skeleton.getTransformMatrices(mesh);

            const finalMatrix = TmpVectors.Matrix[0];
            const tempMatrix = TmpVectors.Matrix[1];

            finalMatrix.reset();
            const matWeightIdx = index * 4;

            let inf: number;
            let weight: number;
            for (inf = 0; inf < 4; inf++) {
                weight = matricesWeightsData[matWeightIdx + inf];
                if (weight > 0) {
                    Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, Math.floor(matricesIndicesData[matWeightIdx + inf] * 16), weight, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }
            }
            if (matricesIndicesExtraData && matricesWeightsExtraData) {
                for (inf = 0; inf < 4; inf++) {
                    weight = matricesWeightsExtraData[matWeightIdx + inf];
                    if (weight > 0) {
                        Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, Math.floor(matricesIndicesExtraData[matWeightIdx + inf] * 16), weight, tempMatrix);
                        finalMatrix.addToSelf(tempMatrix);
                    }
                }
            }

            Vector3.TransformCoordinatesFromFloatsToRef(values[0], values[1], values[2], finalMatrix, res);
        }
    }

    return true;
}

/**
 * Compute a world space hotspot position
 * TmpVectors.Vector3[0..4] are modified by this function. Do not use them as result output.
 * @param mesh mesh used to get hotspot from
 * @param hotSpotQuery point indices and barycentric
 * @param resPosition output world position
 * @param resNormal optional output world normal
 * @returns false if it was not possible to compute the hotspot position
 */
export function GetHotSpotToRef(mesh: AbstractMesh, hotSpotQuery: HotSpotQuery, resPosition: Vector3, resNormal?: Vector3): boolean {
    resPosition.set(0, 0, 0);
    for (let i = 0; i < 3; i++) {
        const index = hotSpotQuery.pointIndex[i];
        if (!GetTransformedPosition(mesh, index, TmpVectors.Vector3[i])) {
            return false;
        }
        TmpVectors.Vector3[i].scaleAndAddToRef(hotSpotQuery.barycentric[i], resPosition);
    }

    // Convert the result to world space
    Vector3.TransformCoordinatesToRef(resPosition, mesh.getWorldMatrix(), resPosition);

    // compute normal in world space
    if (resNormal) {
        const pointA = TmpVectors.Vector3[0];
        const pointB = TmpVectors.Vector3[1];
        const pointC = TmpVectors.Vector3[2];
        const segmentA = TmpVectors.Vector3[3];
        const segmentB = TmpVectors.Vector3[4];
        segmentA.copyFrom(pointB);
        segmentA.subtractInPlace(pointA);
        segmentB.copyFrom(pointC);
        segmentB.subtractInPlace(pointA);
        segmentA.normalize();
        segmentB.normalize();
        Vector3.CrossToRef(segmentA, segmentB, resNormal);

        // flip normal when face culling is changed
        const flipNormal =
            mesh.material &&
            mesh.material.sideOrientation ===
                (mesh.getScene().useRightHandedSystem ? Constants.MATERIAL_ClockWiseSideOrientation : Constants.MATERIAL_CounterClockWiseSideOrientation);

        if (flipNormal) {
            resNormal.scaleInPlace(-1);
        }

        // Convert the result to world space
        Vector3.TransformNormalToRef(resNormal, mesh.getWorldMatrix(), resNormal);
        resNormal.normalize();
    }

    return true;
}
