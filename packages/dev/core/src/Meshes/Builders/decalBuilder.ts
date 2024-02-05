import type { Nullable, IndicesArray, FloatArray } from "../../types";
import { Vector3, Matrix, Vector2, TmpVectors } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { Mesh } from "../mesh";
import { VertexBuffer } from "../../Buffers/buffer";
import { VertexData } from "../mesh.vertexData";
import type { AbstractMesh } from "../abstractMesh";
import type { Camera } from "../../Cameras/camera";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

const xpAxis = new Vector3(1, 0, 0);
const xnAxis = new Vector3(-1, 0, 0);
const ypAxis = new Vector3(0, 1, 0);
const ynAxis = new Vector3(0, -1, 0);
const zpAxis = new Vector3(0, 0, 1);
const znAxis = new Vector3(0, 0, -1);

/** @internal */
class DecalVertex {
    constructor(
        public position: Vector3 = Vector3.Zero(),
        public normal: Vector3 = Vector3.Up(),
        public uv: Vector2 = Vector2.Zero(),
        public vertexIdx: number = 0,
        public vertexIdxForBones: number = 0,
        public localPositionOverride: Nullable<number[]> = null,
        public localNormalOverride: Nullable<number[]> = null,
        public matrixIndicesOverride: Nullable<number[]> = null,
        public matrixWeightsOverride: Nullable<number[]> = null
    ) {}
    public clone(): DecalVertex {
        return new DecalVertex(
            this.position.clone(),
            this.normal.clone(),
            this.uv.clone(),
            this.vertexIdx,
            this.vertexIdxForBones,
            this.localPositionOverride?.slice(),
            this.localNormalOverride?.slice(),
            this.matrixIndicesOverride?.slice(),
            this.matrixWeightsOverride?.slice()
        );
    }
}

/**
 * Creates a decal mesh.
 * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal
 * * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates
 * * The parameter `normal` (Vector3, default `Vector3.Up`) sets the normal of the mesh where the decal is applied onto in World coordinates
 * * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling
 * * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal
 * * The parameter `captureUVS` defines if we need to capture the uvs or compute them
 * * The parameter `cullBackFaces` defines if the back faces should be removed from the decal mesh
 * * The parameter `localMode` defines that the computations should be done with the local mesh coordinates instead of the world space coordinates.
 * *    Use this mode if you want the decal to be parented to the sourceMesh and move/rotate with it.
 * Note: Meshes with morph targets are not supported!
 * @param name defines the name of the mesh
 * @param sourceMesh defines the mesh where the decal must be applied
 * @param options defines the options used to create the mesh
 * @returns the decal mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals
 */
export function CreateDecal(
    name: string,
    sourceMesh: AbstractMesh,
    options: { position?: Vector3; normal?: Vector3; size?: Vector3; angle?: number; captureUVS?: boolean; cullBackFaces?: boolean; localMode?: boolean }
): Mesh {
    const hasSkeleton = !!sourceMesh.skeleton;
    const useLocalComputation = options.localMode || hasSkeleton;
    const meshHasOverridenMaterial = (sourceMesh as Mesh).overrideMaterialSideOrientation !== null && (sourceMesh as Mesh).overrideMaterialSideOrientation !== undefined;

    const indices = <IndicesArray>sourceMesh.getIndices();
    const positions = hasSkeleton ? sourceMesh.getPositionData(true, true) : sourceMesh.getVerticesData(VertexBuffer.PositionKind);
    const normals = hasSkeleton ? sourceMesh.getNormalsData(true, true) : sourceMesh.getVerticesData(VertexBuffer.NormalKind);
    const localPositions = useLocalComputation ? (hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.PositionKind) : positions) : null;
    const localNormals = useLocalComputation ? (hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.NormalKind) : normals) : null;
    const uvs = sourceMesh.getVerticesData(VertexBuffer.UVKind);
    const matIndices = hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.MatricesIndicesKind) : null;
    const matWeights = hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.MatricesWeightsKind) : null;
    const matIndicesExtra = hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.MatricesIndicesExtraKind) : null;
    const matWeightsExtra = hasSkeleton ? sourceMesh.getVerticesData(VertexBuffer.MatricesWeightsExtraKind) : null;

    const position = options.position || Vector3.Zero();
    let normal = options.normal || Vector3.Up();
    const size = options.size || Vector3.One();
    const angle = options.angle || 0;

    // Getting correct rotation
    if (!normal) {
        const target = new Vector3(0, 0, 1);
        const camera = <Camera>sourceMesh.getScene().activeCamera;
        const cameraWorldTarget = Vector3.TransformCoordinates(target, camera.getWorldMatrix());

        normal = camera.globalPosition.subtract(cameraWorldTarget);
    }

    const yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
    const len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
    const pitch = Math.atan2(normal.y, len);

    const vertexData = new VertexData();
    vertexData.indices = [];
    vertexData.positions = [];
    vertexData.normals = [];
    vertexData.uvs = [];
    vertexData.matricesIndices = hasSkeleton ? [] : null;
    vertexData.matricesWeights = hasSkeleton ? [] : null;
    vertexData.matricesIndicesExtra = matIndicesExtra ? [] : null;
    vertexData.matricesWeightsExtra = matWeightsExtra ? [] : null;

    let currentVertexDataIndex = 0;

    const extractDecalVector3 = (indexId: number, transformMatrix: Matrix): DecalVertex => {
        const result = new DecalVertex();
        if (!indices || !positions || !normals) {
            return result;
        }

        const vertexId = indices[indexId];

        result.vertexIdx = vertexId * 3;
        result.vertexIdxForBones = vertexId * 4;

        // Send vector to decal local world
        result.position = new Vector3(positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2]);
        Vector3.TransformCoordinatesToRef(result.position, transformMatrix, result.position);

        // Get normal
        result.normal = new Vector3(normals[vertexId * 3], normals[vertexId * 3 + 1], normals[vertexId * 3 + 2]);
        Vector3.TransformNormalToRef(result.normal, transformMatrix, result.normal);

        if (options.captureUVS && uvs) {
            const v = uvs[vertexId * 2 + 1];
            result.uv = new Vector2(uvs[vertexId * 2], CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
        }

        return result;
    };

    const emptyArray = [0, 0, 0, 0];

    // Inspired by https://github.com/mrdoob/three.js/blob/eee231960882f6f3b6113405f524956145148146/examples/js/geometries/DecalGeometry.js
    const clip = (vertices: DecalVertex[], axis: Vector3): Nullable<DecalVertex[]> => {
        if (vertices.length === 0) {
            return vertices;
        }

        const clipSize = 0.5 * Math.abs(Vector3.Dot(size, axis));

        const indexOf = (arr: FloatArray | number[], val: number, start: number, num: number) => {
            for (let i = 0; i < num; ++i) {
                if (arr[start + i] === val) {
                    return start + i;
                }
            }
            return -1;
        };

        const clipVertices = (v0: DecalVertex, v1: DecalVertex): DecalVertex => {
            const clipFactor = Vector3.GetClipFactor(v0.position, v1.position, axis, clipSize);

            let indices = emptyArray;
            let weights = emptyArray;

            if (matIndices && matWeights) {
                const mat0Index = v0.matrixIndicesOverride ? 0 : v0.vertexIdxForBones;
                const v0Indices = v0.matrixIndicesOverride ?? matIndices;
                const v0Weights = v0.matrixWeightsOverride ?? matWeights;

                const mat1Index = v1.matrixIndicesOverride ? 0 : v1.vertexIdxForBones;
                const v1Indices = v1.matrixIndicesOverride ?? matIndices;
                const v1Weights = v1.matrixWeightsOverride ?? matWeights;

                indices = [0, 0, 0, 0];
                weights = [0, 0, 0, 0];

                let index = 0;
                for (let i = 0; i < 4; ++i) {
                    if (v0Weights[mat0Index + i] > 0) {
                        const idx = indexOf(v1Indices, v0Indices[mat0Index + i], mat1Index, 4);
                        indices[index] = v0Indices[mat0Index + i];
                        weights[index] = Scalar.Lerp(v0Weights[mat0Index + i], idx >= 0 ? v1Weights[idx] : 0, clipFactor);
                        index++;
                    }
                }

                for (let i = 0; i < 4 && index < 4; ++i) {
                    const ind = v1Indices[mat1Index + i];
                    if (indexOf(v0Indices, ind, mat0Index, 4) !== -1) continue;

                    indices[index] = ind;
                    weights[index] = Scalar.Lerp(0, v1Weights[mat1Index + i], clipFactor);
                    index++;
                }

                const sumw = weights[0] + weights[1] + weights[2] + weights[3];

                weights[0] /= sumw;
                weights[1] /= sumw;
                weights[2] /= sumw;
                weights[3] /= sumw;
            }

            const v0LocalPositionX = v0.localPositionOverride ? v0.localPositionOverride[0] : localPositions?.[v0.vertexIdx] ?? 0;
            const v0LocalPositionY = v0.localPositionOverride ? v0.localPositionOverride[1] : localPositions?.[v0.vertexIdx + 1] ?? 0;
            const v0LocalPositionZ = v0.localPositionOverride ? v0.localPositionOverride[2] : localPositions?.[v0.vertexIdx + 2] ?? 0;

            const v1LocalPositionX = v1.localPositionOverride ? v1.localPositionOverride[0] : localPositions?.[v1.vertexIdx] ?? 0;
            const v1LocalPositionY = v1.localPositionOverride ? v1.localPositionOverride[1] : localPositions?.[v1.vertexIdx + 1] ?? 0;
            const v1LocalPositionZ = v1.localPositionOverride ? v1.localPositionOverride[2] : localPositions?.[v1.vertexIdx + 2] ?? 0;

            const v0LocalNormalX = v0.localNormalOverride ? v0.localNormalOverride[0] : localNormals?.[v0.vertexIdx] ?? 0;
            const v0LocalNormalY = v0.localNormalOverride ? v0.localNormalOverride[1] : localNormals?.[v0.vertexIdx + 1] ?? 0;
            const v0LocalNormalZ = v0.localNormalOverride ? v0.localNormalOverride[2] : localNormals?.[v0.vertexIdx + 2] ?? 0;

            const v1LocalNormalX = v1.localNormalOverride ? v1.localNormalOverride[0] : localNormals?.[v1.vertexIdx] ?? 0;
            const v1LocalNormalY = v1.localNormalOverride ? v1.localNormalOverride[1] : localNormals?.[v1.vertexIdx + 1] ?? 0;
            const v1LocalNormalZ = v1.localNormalOverride ? v1.localNormalOverride[2] : localNormals?.[v1.vertexIdx + 2] ?? 0;

            const interpNormalX = v0LocalNormalX + (v1LocalNormalX - v0LocalNormalX) * clipFactor;
            const interpNormalY = v0LocalNormalY + (v1LocalNormalY - v0LocalNormalY) * clipFactor;
            const interpNormalZ = v0LocalNormalZ + (v1LocalNormalZ - v0LocalNormalZ) * clipFactor;

            const norm = Math.sqrt(interpNormalX * interpNormalX + interpNormalY * interpNormalY + interpNormalZ * interpNormalZ);

            return new DecalVertex(
                Vector3.Lerp(v0.position, v1.position, clipFactor),
                Vector3.Lerp(v0.normal, v1.normal, clipFactor).normalize(),
                Vector2.Lerp(v0.uv, v1.uv, clipFactor),
                -1,
                -1,
                localPositions
                    ? [
                          v0LocalPositionX + (v1LocalPositionX - v0LocalPositionX) * clipFactor,
                          v0LocalPositionY + (v1LocalPositionY - v0LocalPositionY) * clipFactor,
                          v0LocalPositionZ + (v1LocalPositionZ - v0LocalPositionZ) * clipFactor,
                      ]
                    : null,
                localNormals ? [interpNormalX / norm, interpNormalY / norm, interpNormalZ / norm] : null,
                indices,
                weights
            );
        };

        let clipResult: Nullable<DecalVertex[]> = null;

        if (vertices.length > 3) {
            clipResult = [] as DecalVertex[];
        }

        for (let index = 0; index < vertices.length; index += 3) {
            let total = 0;
            let nV1: Nullable<DecalVertex> = null;
            let nV2: Nullable<DecalVertex> = null;
            let nV3: Nullable<DecalVertex> = null;
            let nV4: Nullable<DecalVertex> = null;

            const d1 = Vector3.Dot(vertices[index].position, axis) - clipSize;
            const d2 = Vector3.Dot(vertices[index + 1].position, axis) - clipSize;
            const d3 = Vector3.Dot(vertices[index + 2].position, axis) - clipSize;

            const v1Out = d1 > 0;
            const v2Out = d2 > 0;
            const v3Out = d3 > 0;

            total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);

            switch (total) {
                case 0:
                    if (vertices.length > 3) {
                        clipResult!.push(vertices[index]);
                        clipResult!.push(vertices[index + 1]);
                        clipResult!.push(vertices[index + 2]);
                    } else {
                        clipResult = vertices;
                    }
                    break;
                case 1:
                    clipResult = clipResult ?? new Array<DecalVertex>();
                    if (v1Out) {
                        nV1 = vertices[index + 1];
                        nV2 = vertices[index + 2];
                        nV3 = clipVertices(vertices[index], nV1);
                        nV4 = clipVertices(vertices[index], nV2);
                    }

                    if (v2Out) {
                        nV1 = vertices[index];
                        nV2 = vertices[index + 2];
                        nV3 = clipVertices(vertices[index + 1], nV1);
                        nV4 = clipVertices(vertices[index + 1], nV2);

                        clipResult.push(nV3);
                        clipResult.push(nV2.clone());
                        clipResult.push(nV1.clone());

                        clipResult.push(nV2.clone());
                        clipResult.push(nV3.clone());
                        clipResult.push(nV4);
                        break;
                    }
                    if (v3Out) {
                        nV1 = vertices[index];
                        nV2 = vertices[index + 1];
                        nV3 = clipVertices(vertices[index + 2], nV1);
                        nV4 = clipVertices(vertices[index + 2], nV2);
                    }

                    if (nV1 && nV2 && nV3 && nV4) {
                        clipResult.push(nV1.clone());
                        clipResult.push(nV2.clone());
                        clipResult.push(nV3);

                        clipResult.push(nV4);
                        clipResult.push(nV3.clone());
                        clipResult.push(nV2.clone());
                    }
                    break;
                case 2:
                    clipResult = clipResult ?? new Array<DecalVertex>();
                    if (!v1Out) {
                        nV1 = vertices[index].clone();
                        nV2 = clipVertices(nV1, vertices[index + 1]);
                        nV3 = clipVertices(nV1, vertices[index + 2]);
                        clipResult.push(nV1);
                        clipResult.push(nV2);
                        clipResult.push(nV3);
                    }
                    if (!v2Out) {
                        nV1 = vertices[index + 1].clone();
                        nV2 = clipVertices(nV1, vertices[index + 2]);
                        nV3 = clipVertices(nV1, vertices[index]);
                        clipResult.push(nV1);
                        clipResult.push(nV2);
                        clipResult.push(nV3);
                    }
                    if (!v3Out) {
                        nV1 = vertices[index + 2].clone();
                        nV2 = clipVertices(nV1, vertices[index]);
                        nV3 = clipVertices(nV1, vertices[index + 1]);
                        clipResult.push(nV1);
                        clipResult.push(nV2);
                        clipResult.push(nV3);
                    }
                    break;
                case 3:
                    break;
            }
        }

        return clipResult;
    };

    const sourceMeshAsMesh = sourceMesh instanceof Mesh ? sourceMesh : null;
    const matrixData = sourceMeshAsMesh?._thinInstanceDataStorage.matrixData;

    const numMatrices = sourceMeshAsMesh?.thinInstanceCount || 1;
    const thinInstanceMatrix = TmpVectors.Matrix[0];

    thinInstanceMatrix.copyFrom(Matrix.IdentityReadOnly);

    for (let m = 0; m < numMatrices; ++m) {
        if (sourceMeshAsMesh?.hasThinInstances && matrixData) {
            const ofst = m * 16;

            thinInstanceMatrix.setRowFromFloats(0, matrixData[ofst + 0], matrixData[ofst + 1], matrixData[ofst + 2], matrixData[ofst + 3]);
            thinInstanceMatrix.setRowFromFloats(1, matrixData[ofst + 4], matrixData[ofst + 5], matrixData[ofst + 6], matrixData[ofst + 7]);
            thinInstanceMatrix.setRowFromFloats(2, matrixData[ofst + 8], matrixData[ofst + 9], matrixData[ofst + 10], matrixData[ofst + 11]);
            thinInstanceMatrix.setRowFromFloats(3, matrixData[ofst + 12], matrixData[ofst + 13], matrixData[ofst + 14], matrixData[ofst + 15]);
        }

        // Matrix
        const decalWorldMatrix = Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(Matrix.Translation(position.x, position.y, position.z));
        const inverseDecalWorldMatrix = Matrix.Invert(decalWorldMatrix);
        const meshWorldMatrix = sourceMesh.getWorldMatrix();
        const transformMatrix = thinInstanceMatrix.multiply(meshWorldMatrix).multiply(inverseDecalWorldMatrix);

        const oneFaceVertices = new Array<DecalVertex>(3);

        for (let index = 0; index < indices.length; index += 3) {
            let faceVertices: Nullable<DecalVertex[]> = oneFaceVertices;

            faceVertices[0] = extractDecalVector3(index, transformMatrix);
            if (meshHasOverridenMaterial && useLocalComputation) {
                faceVertices[1] = extractDecalVector3(index + 2, transformMatrix);
                faceVertices[2] = extractDecalVector3(index + 1, transformMatrix);
            } else {
                faceVertices[1] = extractDecalVector3(index + 1, transformMatrix);
                faceVertices[2] = extractDecalVector3(index + 2, transformMatrix);
            }

            if (options.cullBackFaces) {
                // If all the normals of the vertices of the face are pointing away from the view direction we discard the face.
                // As computations are done in the decal coordinate space, the viewDirection is (0,0,1), so when dot(vertexNormal, -viewDirection) <= 0 the vertex is culled
                if (-faceVertices[0].normal.z <= 0 && -faceVertices[1].normal.z <= 0 && -faceVertices[2].normal.z <= 0) {
                    continue;
                }
            }

            // Clip
            faceVertices = clip(faceVertices, xpAxis);
            if (!faceVertices) continue;
            faceVertices = clip(faceVertices, xnAxis);
            if (!faceVertices) continue;
            faceVertices = clip(faceVertices, ypAxis);
            if (!faceVertices) continue;
            faceVertices = clip(faceVertices, ynAxis);
            if (!faceVertices) continue;
            faceVertices = clip(faceVertices, zpAxis);
            if (!faceVertices) continue;
            faceVertices = clip(faceVertices, znAxis);
            if (!faceVertices) continue;

            // Add UVs and get back to world
            for (let vIndex = 0; vIndex < faceVertices.length; vIndex++) {
                const vertex = faceVertices[vIndex];

                //TODO check for Int32Array | Uint32Array | Uint16Array
                (<number[]>vertexData.indices).push(currentVertexDataIndex);
                if (useLocalComputation) {
                    if (vertex.localPositionOverride) {
                        vertexData.positions[currentVertexDataIndex * 3] = vertex.localPositionOverride[0];
                        vertexData.positions[currentVertexDataIndex * 3 + 1] = vertex.localPositionOverride[1];
                        vertexData.positions[currentVertexDataIndex * 3 + 2] = vertex.localPositionOverride[2];
                    } else if (localPositions) {
                        vertexData.positions[currentVertexDataIndex * 3] = localPositions[vertex.vertexIdx];
                        vertexData.positions[currentVertexDataIndex * 3 + 1] = localPositions[vertex.vertexIdx + 1];
                        vertexData.positions[currentVertexDataIndex * 3 + 2] = localPositions[vertex.vertexIdx + 2];
                    }
                    if (vertex.localNormalOverride) {
                        vertexData.normals[currentVertexDataIndex * 3] = vertex.localNormalOverride[0];
                        vertexData.normals[currentVertexDataIndex * 3 + 1] = vertex.localNormalOverride[1];
                        vertexData.normals[currentVertexDataIndex * 3 + 2] = vertex.localNormalOverride[2];
                    } else if (localNormals) {
                        vertexData.normals[currentVertexDataIndex * 3] = localNormals[vertex.vertexIdx];
                        vertexData.normals[currentVertexDataIndex * 3 + 1] = localNormals[vertex.vertexIdx + 1];
                        vertexData.normals[currentVertexDataIndex * 3 + 2] = localNormals[vertex.vertexIdx + 2];
                    }
                } else {
                    vertex.position.toArray(vertexData.positions, currentVertexDataIndex * 3);
                    vertex.normal.toArray(vertexData.normals, currentVertexDataIndex * 3);
                }
                if (vertexData.matricesIndices && vertexData.matricesWeights) {
                    if (vertex.matrixIndicesOverride) {
                        vertexData.matricesIndices[currentVertexDataIndex * 4] = vertex.matrixIndicesOverride[0];
                        vertexData.matricesIndices[currentVertexDataIndex * 4 + 1] = vertex.matrixIndicesOverride[1];
                        vertexData.matricesIndices[currentVertexDataIndex * 4 + 2] = vertex.matrixIndicesOverride[2];
                        vertexData.matricesIndices[currentVertexDataIndex * 4 + 3] = vertex.matrixIndicesOverride[3];
                    } else {
                        if (matIndices) {
                            vertexData.matricesIndices[currentVertexDataIndex * 4] = matIndices[vertex.vertexIdxForBones];
                            vertexData.matricesIndices[currentVertexDataIndex * 4 + 1] = matIndices[vertex.vertexIdxForBones + 1];
                            vertexData.matricesIndices[currentVertexDataIndex * 4 + 2] = matIndices[vertex.vertexIdxForBones + 2];
                            vertexData.matricesIndices[currentVertexDataIndex * 4 + 3] = matIndices[vertex.vertexIdxForBones + 3];
                        }
                        if (matIndicesExtra && vertexData.matricesIndicesExtra) {
                            vertexData.matricesIndicesExtra[currentVertexDataIndex * 4] = matIndicesExtra[vertex.vertexIdxForBones];
                            vertexData.matricesIndicesExtra[currentVertexDataIndex * 4 + 1] = matIndicesExtra[vertex.vertexIdxForBones + 1];
                            vertexData.matricesIndicesExtra[currentVertexDataIndex * 4 + 2] = matIndicesExtra[vertex.vertexIdxForBones + 2];
                            vertexData.matricesIndicesExtra[currentVertexDataIndex * 4 + 3] = matIndicesExtra[vertex.vertexIdxForBones + 3];
                        }
                    }
                    if (vertex.matrixWeightsOverride) {
                        vertexData.matricesWeights[currentVertexDataIndex * 4] = vertex.matrixWeightsOverride[0];
                        vertexData.matricesWeights[currentVertexDataIndex * 4 + 1] = vertex.matrixWeightsOverride[1];
                        vertexData.matricesWeights[currentVertexDataIndex * 4 + 2] = vertex.matrixWeightsOverride[2];
                        vertexData.matricesWeights[currentVertexDataIndex * 4 + 3] = vertex.matrixWeightsOverride[3];
                    } else {
                        if (matWeights) {
                            vertexData.matricesWeights[currentVertexDataIndex * 4] = matWeights[vertex.vertexIdxForBones];
                            vertexData.matricesWeights[currentVertexDataIndex * 4 + 1] = matWeights[vertex.vertexIdxForBones + 1];
                            vertexData.matricesWeights[currentVertexDataIndex * 4 + 2] = matWeights[vertex.vertexIdxForBones + 2];
                            vertexData.matricesWeights[currentVertexDataIndex * 4 + 3] = matWeights[vertex.vertexIdxForBones + 3];
                        }
                        if (matWeightsExtra && vertexData.matricesWeightsExtra) {
                            vertexData.matricesWeightsExtra[currentVertexDataIndex * 4] = matWeightsExtra[vertex.vertexIdxForBones];
                            vertexData.matricesWeightsExtra[currentVertexDataIndex * 4 + 1] = matWeightsExtra[vertex.vertexIdxForBones + 1];
                            vertexData.matricesWeightsExtra[currentVertexDataIndex * 4 + 2] = matWeightsExtra[vertex.vertexIdxForBones + 2];
                            vertexData.matricesWeightsExtra[currentVertexDataIndex * 4 + 3] = matWeightsExtra[vertex.vertexIdxForBones + 3];
                        }
                    }
                }

                if (!options.captureUVS) {
                    (<number[]>vertexData.uvs).push(0.5 + vertex.position.x / size.x);
                    const v = 0.5 + vertex.position.y / size.y;
                    (<number[]>vertexData.uvs).push(CompatibilityOptions.UseOpenGLOrientationForUV ? 1 - v : v);
                } else {
                    vertex.uv.toArray(vertexData.uvs, currentVertexDataIndex * 2);
                }
                currentVertexDataIndex++;
            }
        }
    }

    // Avoid the "Setting vertex data kind 'XXX' with an empty array" warning when calling vertexData.applyToMesh
    if (vertexData.indices.length === 0) vertexData.indices = null;
    if (vertexData.positions.length === 0) vertexData.positions = null;
    if (vertexData.normals.length === 0) vertexData.normals = null;
    if (vertexData.uvs.length === 0) vertexData.uvs = null;
    if (vertexData.matricesIndices?.length === 0) vertexData.matricesIndices = null;
    if (vertexData.matricesWeights?.length === 0) vertexData.matricesWeights = null;
    if (vertexData.matricesIndicesExtra?.length === 0) vertexData.matricesIndicesExtra = null;
    if (vertexData.matricesWeightsExtra?.length === 0) vertexData.matricesWeightsExtra = null;

    // Return mesh
    const decal = new Mesh(name, sourceMesh.getScene());
    vertexData.applyToMesh(decal);

    if (useLocalComputation) {
        decal.skeleton = sourceMesh.skeleton;
        decal.parent = sourceMesh;
    } else {
        decal.position = position.clone();
        decal.rotation = new Vector3(pitch, yaw, angle);
    }

    decal.computeWorldMatrix(true);
    decal.refreshBoundingInfo(true, true);

    return decal;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const DecalBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateDecal,
};

Mesh.CreateDecal = (name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number): Mesh => {
    const options = {
        position,
        normal,
        size,
        angle,
    };

    return CreateDecal(name, sourceMesh, options);
};
