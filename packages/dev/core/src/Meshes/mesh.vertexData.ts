/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Nullable, FloatArray, IndicesArray, DeepImmutable } from "../types";
import type { Matrix, Vector2 } from "../Maths/math.vector";
import { Vector3, Vector4, TmpVectors } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { _WarnImport } from "../Misc/devTools";
import type { Color3 } from "../Maths/math.color";
import { Color4 } from "../Maths/math.color";
import { Logger } from "../Misc/logger";
import { nativeOverride } from "../Misc/decorators";
import type { Coroutine } from "../Misc/coroutine";
import { makeSyncFunction, runCoroutineSync } from "../Misc/coroutine";
import type { ICreateCapsuleOptions } from "./Builders/capsuleBuilder";
import { RuntimeError, ErrorCodes } from "../Misc/error";

import type { Geometry } from "../Meshes/geometry";
import type { Mesh } from "../Meshes/mesh";
import { SubMesh } from "./subMesh";

/**
 * Define an interface for all classes that will get and set the data on vertices
 */
export interface IGetSetVerticesData {
    /**
     * Gets a boolean indicating if specific vertex data is present
     * @param kind defines the vertex data kind to use
     * @returns true is data kind is present
     */
    isVerticesDataPresent(kind: string): boolean;
    /**
     * Gets a specific vertex data attached to this geometry. Float data is constructed if the vertex buffer data cannot be returned directly.
     * @param kind defines the data kind (Position, normal, etc...)
     * @param copyWhenShared defines if the returned array must be cloned upon returning it if the current geometry is shared between multiple meshes
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns a float array containing vertex data
     */
    getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
    /**
     * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
     * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns the indices array or an empty array if the mesh has no geometry
     */
    getIndices(copyWhenShared?: boolean, forceCopy?: boolean): Nullable<IndicesArray>;
    /**
     * Set specific vertex data
     * @param kind defines the data kind (Position, normal, etc...)
     * @param data defines the vertex data to use
     * @param updatable defines if the vertex must be flagged as updatable (false as default)
     * @param stride defines the stride to use (0 by default). This value is deduced from the kind value if not specified
     */
    setVerticesData(kind: string, data: FloatArray, updatable: boolean): void;
    /**
     * Update a specific associated vertex buffer
     * @param kind defines which buffer to write to (positions, indices, normals, etc). Possible `kind` values :
     * - VertexBuffer.PositionKind
     * - VertexBuffer.UVKind
     * - VertexBuffer.UV2Kind
     * - VertexBuffer.UV3Kind
     * - VertexBuffer.UV4Kind
     * - VertexBuffer.UV5Kind
     * - VertexBuffer.UV6Kind
     * - VertexBuffer.ColorKind
     * - VertexBuffer.MatricesIndicesKind
     * - VertexBuffer.MatricesIndicesExtraKind
     * - VertexBuffer.MatricesWeightsKind
     * - VertexBuffer.MatricesWeightsExtraKind
     * @param data defines the data source
     * @param updateExtends defines if extends info of the mesh must be updated (can be null). This is mostly useful for "position" kind
     * @param makeItUnique defines if the geometry associated with the mesh must be cloned to make the change only for this mesh (and not all meshes associated with the same geometry)
     */
    updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): void;
    /**
     * Creates a new index buffer
     * @param indices defines the indices to store in the index buffer
     * @param totalVertices defines the total number of vertices (could be null)
     * @param updatable defines if the index buffer must be flagged as updatable (false by default)
     */
    setIndices(indices: IndicesArray, totalVertices: Nullable<number>, updatable?: boolean): void;
}

/** Class used to attach material info to sub section of a vertex data class */
export class VertexDataMaterialInfo {
    /** Defines the material index to use */
    public materialIndex: number;
    /** Defines vertex index start*/
    public verticesStart: number;
    /** Defines vertices count */
    public verticesCount: number;
    /** Defines index start */
    public indexStart: number;
    /** Defines indices count */
    public indexCount: number;
}

/**
 * This class contains the various kinds of data on every vertex of a mesh used in determining its shape and appearance
 */
export class VertexData {
    /**
     * Mesh side orientation : usually the external or front surface
     */
    public static readonly FRONTSIDE = 0;
    /**
     * Mesh side orientation : usually the internal or back surface
     */
    public static readonly BACKSIDE = 1;
    /**
     * Mesh side orientation : both internal and external or front and back surfaces
     */
    public static readonly DOUBLESIDE = 2;
    /**
     * Mesh side orientation : by default, `FRONTSIDE`
     */
    public static readonly DEFAULTSIDE = 0;

    private static _UniqueIDGenerator = 0;

    /**
     * An array of the x, y, z position of each vertex  [...., x, y, z, .....]
     */
    public positions: Nullable<FloatArray>;

    /**
     * An array of the x, y, z normal vector of each vertex  [...., x, y, z, .....]
     */
    public normals: Nullable<FloatArray>;

    /**
     * An array of the x, y, z tangent vector of each vertex  [...., x, y, z, .....]
     */
    public tangents: Nullable<FloatArray>;

    /**
     * An array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs: Nullable<FloatArray>;

    /**
     * A second array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs2: Nullable<FloatArray>;

    /**
     * A third array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs3: Nullable<FloatArray>;

    /**
     * A fourth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs4: Nullable<FloatArray>;

    /**
     * A fifth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs5: Nullable<FloatArray>;

    /**
     * A sixth array of u,v which maps a texture image onto each vertex  [...., u, v, .....]
     */
    public uvs6: Nullable<FloatArray>;

    /**
     * An array of the r, g, b, a, color of each vertex  [...., r, g, b, a, .....]
     */
    public colors: Nullable<FloatArray>;

    /**
     * An array containing the list of indices to the array of matrices produced by bones, each vertex have up to 4 indices (8 if the matricesIndicesExtra is set).
     */
    public matricesIndices: Nullable<FloatArray>;

    /**
     * An array containing the list of weights defining the weight of each indexed matrix in the final computation
     */
    public matricesWeights: Nullable<FloatArray>;

    /**
     * An array extending the number of possible indices
     */
    public matricesIndicesExtra: Nullable<FloatArray>;

    /**
     * An array extending the number of possible weights when the number of indices is extended
     */
    public matricesWeightsExtra: Nullable<FloatArray>;

    /**
     * An array of i, j, k the three vertex indices required for each triangular facet  [...., i, j, k .....]
     */
    public indices: Nullable<IndicesArray>;

    /**
     * An array defining material association for sub sections of the vertex data
     */
    public materialInfos: Nullable<Array<VertexDataMaterialInfo>>;

    /**
     * Gets the unique ID of this vertex Data
     */
    public uniqueId = 0;

    /**
     * Metadata used to store contextual values
     */
    public metadata: any = {};

    /**
     * Creates a new VertexData
     */
    public constructor() {
        this.uniqueId = VertexData._UniqueIDGenerator;
        VertexData._UniqueIDGenerator++;
    }

    /**
     * Uses the passed data array to set the set the values for the specified kind of data
     * @param data a linear array of floating numbers
     * @param kind the type of data that is being set, eg positions, colors etc
     */
    public set(data: FloatArray, kind: string) {
        if (!data.length) {
            Logger.Warn(`Setting vertex data kind '${kind}' with an empty array`);
        }

        switch (kind) {
            case VertexBuffer.PositionKind:
                this.positions = data;
                break;
            case VertexBuffer.NormalKind:
                this.normals = data;
                break;
            case VertexBuffer.TangentKind:
                this.tangents = data;
                break;
            case VertexBuffer.UVKind:
                this.uvs = data;
                break;
            case VertexBuffer.UV2Kind:
                this.uvs2 = data;
                break;
            case VertexBuffer.UV3Kind:
                this.uvs3 = data;
                break;
            case VertexBuffer.UV4Kind:
                this.uvs4 = data;
                break;
            case VertexBuffer.UV5Kind:
                this.uvs5 = data;
                break;
            case VertexBuffer.UV6Kind:
                this.uvs6 = data;
                break;
            case VertexBuffer.ColorKind:
                this.colors = data;
                break;
            case VertexBuffer.MatricesIndicesKind:
                this.matricesIndices = data;
                break;
            case VertexBuffer.MatricesWeightsKind:
                this.matricesWeights = data;
                break;
            case VertexBuffer.MatricesIndicesExtraKind:
                this.matricesIndicesExtra = data;
                break;
            case VertexBuffer.MatricesWeightsExtraKind:
                this.matricesWeightsExtra = data;
                break;
        }
    }

    /**
     * Associates the vertexData to the passed Mesh.
     * Sets it as updatable or not (default `false`)
     * @param mesh the mesh the vertexData is applied to
     * @param updatable when used and having the value true allows new data to update the vertexData
     * @returns the VertexData
     */
    public applyToMesh(mesh: Mesh, updatable?: boolean): VertexData {
        this._applyTo(mesh, updatable, false);
        return this;
    }

    /**
     * Associates the vertexData to the passed Geometry.
     * Sets it as updatable or not (default `false`)
     * @param geometry the geometry the vertexData is applied to
     * @param updatable when used and having the value true allows new data to update the vertexData
     * @returns VertexData
     */
    public applyToGeometry(geometry: Geometry, updatable?: boolean): VertexData {
        this._applyTo(geometry, updatable, false);
        return this;
    }

    /**
     * Updates the associated mesh
     * @param mesh the mesh to be updated
     * @returns VertexData
     */
    public updateMesh(mesh: Mesh): VertexData {
        this._update(mesh);
        return this;
    }

    /**
     * Updates the associated geometry
     * @param geometry the geometry to be updated
     * @returns VertexData.
     */
    public updateGeometry(geometry: Geometry): VertexData {
        this._update(geometry);
        return this;
    }

    private readonly _applyTo = makeSyncFunction(this._applyToCoroutine.bind(this));

    /**
     * @internal
     */
    public *_applyToCoroutine(meshOrGeometry: IGetSetVerticesData, updatable: boolean = false, isAsync: boolean): Coroutine<VertexData> {
        if (this.positions) {
            meshOrGeometry.setVerticesData(VertexBuffer.PositionKind, this.positions, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.normals) {
            meshOrGeometry.setVerticesData(VertexBuffer.NormalKind, this.normals, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.tangents) {
            meshOrGeometry.setVerticesData(VertexBuffer.TangentKind, this.tangents, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs) {
            meshOrGeometry.setVerticesData(VertexBuffer.UVKind, this.uvs, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs2) {
            meshOrGeometry.setVerticesData(VertexBuffer.UV2Kind, this.uvs2, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs3) {
            meshOrGeometry.setVerticesData(VertexBuffer.UV3Kind, this.uvs3, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs4) {
            meshOrGeometry.setVerticesData(VertexBuffer.UV4Kind, this.uvs4, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs5) {
            meshOrGeometry.setVerticesData(VertexBuffer.UV5Kind, this.uvs5, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.uvs6) {
            meshOrGeometry.setVerticesData(VertexBuffer.UV6Kind, this.uvs6, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.colors) {
            meshOrGeometry.setVerticesData(VertexBuffer.ColorKind, this.colors, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.matricesIndices) {
            meshOrGeometry.setVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.matricesWeights) {
            meshOrGeometry.setVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.matricesIndicesExtra) {
            meshOrGeometry.setVerticesData(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.matricesWeightsExtra) {
            meshOrGeometry.setVerticesData(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updatable);
            if (isAsync) {
                yield;
            }
        }

        if (this.indices) {
            meshOrGeometry.setIndices(this.indices, null, updatable);
            if (isAsync) {
                yield;
            }
        } else {
            meshOrGeometry.setIndices([], null);
        }

        if ((meshOrGeometry as Mesh).subMeshes && this.materialInfos && this.materialInfos.length > 1) {
            const mesh = meshOrGeometry as Mesh;
            mesh.subMeshes = [];
            for (const matInfo of this.materialInfos) {
                new SubMesh(matInfo.materialIndex, matInfo.verticesStart, matInfo.verticesCount, matInfo.indexStart, matInfo.indexCount, mesh);
            }
        }

        return this;
    }

    private _update(meshOrGeometry: IGetSetVerticesData, updateExtends?: boolean, makeItUnique?: boolean): VertexData {
        if (this.positions) {
            meshOrGeometry.updateVerticesData(VertexBuffer.PositionKind, this.positions, updateExtends, makeItUnique);
        }

        if (this.normals) {
            meshOrGeometry.updateVerticesData(VertexBuffer.NormalKind, this.normals, updateExtends, makeItUnique);
        }

        if (this.tangents) {
            meshOrGeometry.updateVerticesData(VertexBuffer.TangentKind, this.tangents, updateExtends, makeItUnique);
        }

        if (this.uvs) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UVKind, this.uvs, updateExtends, makeItUnique);
        }

        if (this.uvs2) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UV2Kind, this.uvs2, updateExtends, makeItUnique);
        }

        if (this.uvs3) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UV3Kind, this.uvs3, updateExtends, makeItUnique);
        }

        if (this.uvs4) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UV4Kind, this.uvs4, updateExtends, makeItUnique);
        }

        if (this.uvs5) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UV5Kind, this.uvs5, updateExtends, makeItUnique);
        }

        if (this.uvs6) {
            meshOrGeometry.updateVerticesData(VertexBuffer.UV6Kind, this.uvs6, updateExtends, makeItUnique);
        }

        if (this.colors) {
            meshOrGeometry.updateVerticesData(VertexBuffer.ColorKind, this.colors, updateExtends, makeItUnique);
        }

        if (this.matricesIndices) {
            meshOrGeometry.updateVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updateExtends, makeItUnique);
        }

        if (this.matricesWeights) {
            meshOrGeometry.updateVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updateExtends, makeItUnique);
        }

        if (this.matricesIndicesExtra) {
            meshOrGeometry.updateVerticesData(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra, updateExtends, makeItUnique);
        }

        if (this.matricesWeightsExtra) {
            meshOrGeometry.updateVerticesData(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra, updateExtends, makeItUnique);
        }

        if (this.indices) {
            meshOrGeometry.setIndices(this.indices, null);
        }
        return this;
    }

    @nativeOverride.filter((...[coordinates]: Parameters<typeof VertexData._TransformVector3Coordinates>) => !Array.isArray(coordinates))
    private static _TransformVector3Coordinates(coordinates: FloatArray, transformation: DeepImmutable<Matrix>, offset = 0, length = coordinates.length) {
        const coordinate = TmpVectors.Vector3[0];
        const transformedCoordinate = TmpVectors.Vector3[1];
        for (let index = offset; index < offset + length; index += 3) {
            Vector3.FromArrayToRef(coordinates, index, coordinate);
            Vector3.TransformCoordinatesToRef(coordinate, transformation, transformedCoordinate);
            coordinates[index] = transformedCoordinate.x;
            coordinates[index + 1] = transformedCoordinate.y;
            coordinates[index + 2] = transformedCoordinate.z;
        }
    }

    @nativeOverride.filter((...[normals]: Parameters<typeof VertexData._TransformVector3Normals>) => !Array.isArray(normals))
    private static _TransformVector3Normals(normals: FloatArray, transformation: DeepImmutable<Matrix>, offset = 0, length = normals.length) {
        const normal = TmpVectors.Vector3[0];
        const transformedNormal = TmpVectors.Vector3[1];
        for (let index = offset; index < offset + length; index += 3) {
            Vector3.FromArrayToRef(normals, index, normal);
            Vector3.TransformNormalToRef(normal, transformation, transformedNormal);
            normals[index] = transformedNormal.x;
            normals[index + 1] = transformedNormal.y;
            normals[index + 2] = transformedNormal.z;
        }
    }

    @nativeOverride.filter((...[normals]: Parameters<typeof VertexData._TransformVector4Normals>) => !Array.isArray(normals))
    private static _TransformVector4Normals(normals: FloatArray, transformation: DeepImmutable<Matrix>, offset = 0, length = normals.length) {
        const normal = TmpVectors.Vector4[0];
        const transformedNormal = TmpVectors.Vector4[1];
        for (let index = offset; index < offset + length; index += 4) {
            Vector4.FromArrayToRef(normals, index, normal);
            Vector4.TransformNormalToRef(normal, transformation, transformedNormal);
            normals[index] = transformedNormal.x;
            normals[index + 1] = transformedNormal.y;
            normals[index + 2] = transformedNormal.z;
            normals[index + 3] = transformedNormal.w;
        }
    }

    @nativeOverride.filter((...[indices]: Parameters<typeof VertexData._FlipFaces>) => !Array.isArray(indices))
    private static _FlipFaces(indices: IndicesArray, offset = 0, length = indices.length) {
        for (let index = offset; index < offset + length; index += 3) {
            const tmp = indices[index + 1];
            indices[index + 1] = indices[index + 2];
            indices[index + 2] = tmp;
        }
    }

    /**
     * Transforms each position and each normal of the vertexData according to the passed Matrix
     * @param matrix the transforming matrix
     * @returns the VertexData
     */
    public transform(matrix: Matrix): VertexData {
        const flip = matrix.determinant() < 0;
        if (this.positions) {
            VertexData._TransformVector3Coordinates(this.positions, matrix);
        }

        if (this.normals) {
            VertexData._TransformVector3Normals(this.normals, matrix);
        }

        if (this.tangents) {
            VertexData._TransformVector4Normals(this.tangents, matrix);
        }

        if (flip && this.indices) {
            VertexData._FlipFaces(this.indices);
        }

        return this;
    }

    /**
     * Generates an array of vertex data where each vertex data only has one material info
     * @returns An array of VertexData
     */
    public splitBasedOnMaterialID() {
        if (!this.materialInfos || this.materialInfos.length < 2) {
            return [this];
        }

        const result: VertexData[] = [];
        for (const materialInfo of this.materialInfos) {
            const vertexData = new VertexData();

            if (this.positions) {
                vertexData.positions = this.positions.slice(materialInfo.verticesStart * 3, (materialInfo.verticesCount + materialInfo.verticesStart) * 3);
            }

            if (this.normals) {
                vertexData.normals = this.normals.slice(materialInfo.verticesStart * 3, (materialInfo.verticesCount + materialInfo.verticesStart) * 3);
            }

            if (this.tangents) {
                vertexData.tangents = this.tangents.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.colors) {
                vertexData.colors = this.colors.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.uvs) {
                vertexData.uvs = this.uvs.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.uvs2) {
                vertexData.uvs2 = this.uvs2.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.uvs3) {
                vertexData.uvs3 = this.uvs3.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.uvs4) {
                vertexData.uvs4 = this.uvs4.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.uvs5) {
                vertexData.uvs5 = this.uvs5.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.uvs6) {
                vertexData.uvs6 = this.uvs6.slice(materialInfo.verticesStart * 2, (materialInfo.verticesCount + materialInfo.verticesStart) * 2);
            }

            if (this.matricesIndices) {
                vertexData.matricesIndices = this.matricesIndices.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.matricesIndicesExtra) {
                vertexData.matricesIndicesExtra = this.matricesIndicesExtra.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.matricesWeights) {
                vertexData.matricesWeights = this.matricesWeights.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.matricesWeightsExtra) {
                vertexData.matricesWeightsExtra = this.matricesWeightsExtra.slice(materialInfo.verticesStart * 4, (materialInfo.verticesCount + materialInfo.verticesStart) * 4);
            }

            if (this.indices) {
                vertexData.indices = [];
                for (let index = materialInfo.indexStart; index < materialInfo.indexStart + materialInfo.indexCount; index++) {
                    vertexData.indices.push(this.indices[index] - materialInfo.verticesStart);
                }
            }

            const newMaterialInfo = new VertexDataMaterialInfo();
            newMaterialInfo.indexStart = 0;
            newMaterialInfo.indexCount = vertexData.indices ? vertexData.indices.length : 0;
            newMaterialInfo.materialIndex = materialInfo.materialIndex;
            newMaterialInfo.verticesStart = 0;
            newMaterialInfo.verticesCount = (vertexData.positions ? vertexData.positions.length : 0) / 3;
            vertexData.materialInfos = [newMaterialInfo];

            result.push(vertexData);
        }

        return result;
    }

    /**
     * Merges the passed VertexData into the current one
     * @param others the VertexData to be merged into the current one
     * @param use32BitsIndices defines a boolean indicating if indices must be store in a 32 bits array
     * @param forceCloneIndices defines a boolean indicating if indices are forced to be cloned
     * @param mergeMaterialIds defines a boolean indicating if we need to merge the material infos
     * @param enableCompletion defines a boolean indicating if the vertex data should be completed to be compatible
     * @returns the modified VertexData
     */
    public merge(others: VertexData | VertexData[], use32BitsIndices = false, forceCloneIndices = false, mergeMaterialIds = false, enableCompletion = false) {
        const vertexDatas: { vertexData: VertexData; transform?: Matrix }[] = Array.isArray(others)
            ? others.map((other) => {
                  return { vertexData: other };
              })
            : [{ vertexData: others }];
        return runCoroutineSync(this._mergeCoroutine(undefined, vertexDatas, use32BitsIndices, false, forceCloneIndices, mergeMaterialIds, enableCompletion));
    }

    /**
     * @internal
     */
    public *_mergeCoroutine(
        transform: Matrix | undefined,
        vertexDatas: { vertexData: VertexData; transform?: Matrix }[],
        use32BitsIndices = false,
        isAsync: boolean,
        forceCloneIndices: boolean,
        mergeMaterialIds = false,
        enableCompletion = false
    ): Coroutine<VertexData> {
        this._validate();

        let others = vertexDatas.map((vertexData) => vertexData.vertexData);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let root: VertexData = this;

        if (enableCompletion) {
            // First let's make sure we have the max set of attributes on the main vertex data
            for (const other of others) {
                if (!other) {
                    continue;
                }

                other._validate();

                if (!this.normals && other.normals) {
                    this.normals = new Float32Array(this.positions!.length);
                }

                if (!this.tangents && other.tangents) {
                    this.tangents = new Float32Array((this.positions!.length / 3) * 4);
                }

                if (!this.uvs && other.uvs) {
                    this.uvs = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.uvs2 && other.uvs2) {
                    this.uvs2 = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.uvs3 && other.uvs3) {
                    this.uvs3 = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.uvs4 && other.uvs4) {
                    this.uvs4 = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.uvs5 && other.uvs5) {
                    this.uvs5 = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.uvs6 && other.uvs6) {
                    this.uvs6 = new Float32Array((this.positions!.length / 3) * 2);
                }

                if (!this.colors && other.colors) {
                    this.colors = new Float32Array((this.positions!.length / 3) * 4);
                    this.colors.fill(1); // Set to white by default
                }

                if (!this.matricesIndices && other.matricesIndices) {
                    this.matricesIndices = new Float32Array((this.positions!.length / 3) * 4);
                }

                if (!this.matricesWeights && other.matricesWeights) {
                    this.matricesWeights = new Float32Array((this.positions!.length / 3) * 4);
                }

                if (!this.matricesIndicesExtra && other.matricesIndicesExtra) {
                    this.matricesIndicesExtra = new Float32Array((this.positions!.length / 3) * 4);
                }

                if (!this.matricesWeightsExtra && other.matricesWeightsExtra) {
                    this.matricesWeightsExtra = new Float32Array((this.positions!.length / 3) * 4);
                }
            }
        }

        for (const other of others) {
            if (!other) {
                continue;
            }

            if (!enableCompletion) {
                other._validate();
                if (
                    !this.normals !== !other.normals ||
                    !this.tangents !== !other.tangents ||
                    !this.uvs !== !other.uvs ||
                    !this.uvs2 !== !other.uvs2 ||
                    !this.uvs3 !== !other.uvs3 ||
                    !this.uvs4 !== !other.uvs4 ||
                    !this.uvs5 !== !other.uvs5 ||
                    !this.uvs6 !== !other.uvs6 ||
                    !this.colors !== !other.colors ||
                    !this.matricesIndices !== !other.matricesIndices ||
                    !this.matricesWeights !== !other.matricesWeights ||
                    !this.matricesIndicesExtra !== !other.matricesIndicesExtra ||
                    !this.matricesWeightsExtra !== !other.matricesWeightsExtra
                ) {
                    throw new Error("Cannot merge vertex data that do not have the same set of attributes");
                }
            } else {
                // Align the others with main set of attributes
                if (this.normals && !other.normals) {
                    other.normals = new Float32Array(other.positions!.length);
                }

                if (this.tangents && !other.tangents) {
                    other.tangents = new Float32Array((other.positions!.length / 3) * 4);
                }

                if (this.uvs && !other.uvs) {
                    other.uvs = new Float32Array((other.positions!.length / 3) * 2);
                }

                if (this.uvs2 && !other.uvs2) {
                    other.uvs2 = new Float32Array((other.positions!.length / 3) * 2);
                }

                if (this.uvs3 && !other.uvs3) {
                    other.uvs3 = new Float32Array((other.positions!.length / 3) * 2);
                }

                if (this.uvs4 && !other.uvs4) {
                    other.uvs4 = new Float32Array((other.positions!.length / 3) * 2);
                }
                if (this.uvs5 && !other.uvs5) {
                    other.uvs5 = new Float32Array((other.positions!.length / 3) * 2);
                }

                if (this.uvs6 && !other.uvs6) {
                    other.uvs6 = new Float32Array((other.positions!.length / 3) * 2);
                }

                if (this.colors && !other.colors) {
                    other.colors = new Float32Array((other.positions!.length / 3) * 4);
                    other.colors.fill(1); // Set to white by default
                }

                if (this.matricesIndices && !other.matricesIndices) {
                    other.matricesIndices = new Float32Array((other.positions!.length / 3) * 4);
                }
                if (this.matricesWeights && !other.matricesWeights) {
                    other.matricesWeights = new Float32Array((other.positions!.length / 3) * 4);
                }

                if (this.matricesIndicesExtra && !other.matricesIndicesExtra) {
                    other.matricesIndicesExtra = new Float32Array((other.positions!.length / 3) * 4);
                }

                if (this.matricesWeightsExtra && !other.matricesWeightsExtra) {
                    other.matricesWeightsExtra = new Float32Array((other.positions!.length / 3) * 4);
                }
            }
        }

        if (mergeMaterialIds) {
            // Merge material infos
            let materialIndex = 0;
            let indexOffset = 0;
            let vertexOffset = 0;
            const materialInfos: VertexDataMaterialInfo[] = [];
            let currentMaterialInfo: Nullable<VertexDataMaterialInfo> = null;
            const vertexDataList: { vertexData: VertexData; transform?: Matrix }[] = [];

            // We need to split vertexData with more than one materialInfo
            for (const split of this.splitBasedOnMaterialID()) {
                vertexDataList.push({ vertexData: split, transform: transform });
            }

            for (const data of vertexDatas) {
                if (!data.vertexData) {
                    continue;
                }
                for (const split of data.vertexData.splitBasedOnMaterialID()) {
                    vertexDataList.push({ vertexData: split, transform: data.transform });
                }
            }

            // Sort by material IDs
            vertexDataList.sort((a, b) => {
                const matInfoA = a.vertexData.materialInfos ? a.vertexData.materialInfos[0].materialIndex : 0;
                const matInfoB = b.vertexData.materialInfos ? b.vertexData.materialInfos[0].materialIndex : 0;

                if (matInfoA > matInfoB) {
                    return 1;
                }

                if (matInfoA === matInfoB) {
                    return 0;
                }

                return -1;
            });

            // Build the new material info
            for (const vertexDataSource of vertexDataList) {
                const vertexData = vertexDataSource.vertexData;
                if (vertexData.materialInfos) {
                    materialIndex = vertexData.materialInfos[0].materialIndex;
                } else {
                    materialIndex = 0;
                }
                if (currentMaterialInfo && currentMaterialInfo.materialIndex === materialIndex) {
                    currentMaterialInfo.indexCount += vertexData.indices!.length;
                    currentMaterialInfo.verticesCount += vertexData.positions!.length / 3;
                } else {
                    const materialInfo = new VertexDataMaterialInfo();
                    materialInfo.materialIndex = materialIndex;
                    materialInfo.indexStart = indexOffset;
                    materialInfo.indexCount = vertexData.indices!.length;
                    materialInfo.verticesStart = vertexOffset;
                    materialInfo.verticesCount = vertexData.positions!.length / 3;

                    materialInfos.push(materialInfo);
                    currentMaterialInfo = materialInfo;
                }
                indexOffset += vertexData.indices!.length;
                vertexOffset += vertexData.positions!.length / 3;
            }
            // Extract sorted values
            const first = vertexDataList.splice(0, 1)[0];
            root = first.vertexData;
            transform = first.transform;
            others = vertexDataList.map((v) => v.vertexData);
            vertexDatas = vertexDataList;

            this.materialInfos = materialInfos;
        }

        // Merge geometries
        const totalIndices = others.reduce((indexSum, vertexData) => indexSum + (vertexData.indices?.length ?? 0), root.indices?.length ?? 0);
        const sliceIndices = forceCloneIndices || others.some((vertexData) => vertexData.indices === root.indices);
        let indices = sliceIndices ? root.indices?.slice() : root.indices;
        if (totalIndices > 0) {
            let indicesOffset = indices?.length ?? 0;

            if (!indices) {
                indices = new Array<number>(totalIndices);
            }

            if (indices.length !== totalIndices) {
                if (Array.isArray(indices)) {
                    indices.length = totalIndices;
                } else {
                    const temp = use32BitsIndices || indices instanceof Uint32Array ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);
                    temp.set(indices);
                    indices = temp;
                }

                if (transform && transform.determinant() < 0) {
                    VertexData._FlipFaces(indices, 0, indicesOffset);
                }
            }

            let positionsOffset = root.positions ? root.positions.length / 3 : 0;
            for (const { vertexData: other, transform } of vertexDatas) {
                if (other.indices) {
                    for (let index = 0; index < other.indices.length; index++) {
                        indices[indicesOffset + index] = other.indices[index] + positionsOffset;
                    }

                    if (transform && transform.determinant() < 0) {
                        VertexData._FlipFaces(indices, indicesOffset, other.indices.length);
                    }

                    // The call to _validate already checked for positions
                    positionsOffset += other.positions!.length / 3;
                    indicesOffset += other.indices.length;

                    if (isAsync) {
                        yield;
                    }
                }
            }
        }

        this.indices = indices!;

        this.positions = VertexData._MergeElement(
            VertexBuffer.PositionKind,
            root.positions,
            transform,
            vertexDatas.map((other) => [other.vertexData.positions, other.transform])
        );
        if (isAsync) {
            yield;
        }
        if (root.normals) {
            this.normals = VertexData._MergeElement(
                VertexBuffer.NormalKind,
                root.normals,
                transform,
                vertexDatas.map((other) => [other.vertexData.normals, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.tangents) {
            this.tangents = VertexData._MergeElement(
                VertexBuffer.TangentKind,
                root.tangents,
                transform,
                vertexDatas.map((other) => [other.vertexData.tangents, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs) {
            this.uvs = VertexData._MergeElement(
                VertexBuffer.UVKind,
                root.uvs,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs2) {
            this.uvs2 = VertexData._MergeElement(
                VertexBuffer.UV2Kind,
                root.uvs2,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs2, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs3) {
            this.uvs3 = VertexData._MergeElement(
                VertexBuffer.UV3Kind,
                root.uvs3,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs3, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs4) {
            this.uvs4 = VertexData._MergeElement(
                VertexBuffer.UV4Kind,
                root.uvs4,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs4, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs5) {
            this.uvs5 = VertexData._MergeElement(
                VertexBuffer.UV5Kind,
                root.uvs5,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs5, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.uvs6) {
            this.uvs6 = VertexData._MergeElement(
                VertexBuffer.UV6Kind,
                root.uvs6,
                transform,
                vertexDatas.map((other) => [other.vertexData.uvs6, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.colors) {
            this.colors = VertexData._MergeElement(
                VertexBuffer.ColorKind,
                root.colors,
                transform,
                vertexDatas.map((other) => [other.vertexData.colors, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.matricesIndices) {
            this.matricesIndices = VertexData._MergeElement(
                VertexBuffer.MatricesIndicesKind,
                root.matricesIndices,
                transform,
                vertexDatas.map((other) => [other.vertexData.matricesIndices, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.matricesWeights) {
            this.matricesWeights = VertexData._MergeElement(
                VertexBuffer.MatricesWeightsKind,
                root.matricesWeights,
                transform,
                vertexDatas.map((other) => [other.vertexData.matricesWeights, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.matricesIndicesExtra) {
            this.matricesIndicesExtra = VertexData._MergeElement(
                VertexBuffer.MatricesIndicesExtraKind,
                root.matricesIndicesExtra,
                transform,
                vertexDatas.map((other) => [other.vertexData.matricesIndicesExtra, other.transform])
            );
            if (isAsync) {
                yield;
            }
        }
        if (root.matricesWeightsExtra) {
            this.matricesWeightsExtra = VertexData._MergeElement(
                VertexBuffer.MatricesWeightsExtraKind,
                root.matricesWeightsExtra,
                transform,
                vertexDatas.map((other) => [other.vertexData.matricesWeightsExtra, other.transform])
            );
        }

        return this;
    }

    private static _MergeElement(
        kind: string,
        source: Nullable<FloatArray>,
        transform: Matrix | undefined,
        others: readonly (readonly [element: Nullable<FloatArray>, transform?: Matrix])[]
    ): Nullable<FloatArray> {
        const nonNullOthers = others.filter((other): other is [element: FloatArray, transform?: Matrix] => other[0] !== null && other[0] !== undefined);

        // If there is no source to copy and no other non-null sources then skip this element.
        if (!source && nonNullOthers.length == 0) {
            return source;
        }

        if (!source) {
            return this._MergeElement(kind, nonNullOthers[0][0], nonNullOthers[0][1], nonNullOthers.slice(1));
        }

        const len = nonNullOthers.reduce((sumLen, elements) => sumLen + elements[0].length, source.length);

        const transformRange =
            kind === VertexBuffer.PositionKind
                ? VertexData._TransformVector3Coordinates
                : kind === VertexBuffer.NormalKind
                  ? VertexData._TransformVector3Normals
                  : kind === VertexBuffer.TangentKind
                    ? VertexData._TransformVector4Normals
                    : () => {};

        if (source instanceof Float32Array) {
            // use non-loop method when the source is Float32Array
            const ret32 = new Float32Array(len);
            ret32.set(source);
            transform && transformRange(ret32, transform, 0, source.length);

            let offset = source.length;
            for (const [vertexData, transform] of nonNullOthers) {
                ret32.set(vertexData, offset);
                transform && transformRange(ret32, transform, offset, vertexData.length);
                offset += vertexData.length;
            }
            return ret32;
        } else {
            // don't use concat as it is super slow, just loop for other cases
            const ret = new Array<number>(len);
            for (let i = 0; i < source.length; i++) {
                ret[i] = source[i];
            }
            transform && transformRange(ret, transform, 0, source.length);

            let offset = source.length;
            for (const [vertexData, transform] of nonNullOthers) {
                for (let i = 0; i < vertexData.length; i++) {
                    ret[offset + i] = vertexData[i];
                }
                transform && transformRange(ret, transform, offset, vertexData.length);
                offset += vertexData.length;
            }
            return ret;
        }
    }

    private _validate(): void {
        if (!this.positions) {
            throw new RuntimeError("Positions are required", ErrorCodes.MeshInvalidPositionsError);
        }

        const getElementCount = (kind: string, values: FloatArray) => {
            const stride = VertexBuffer.DeduceStride(kind);
            if (values.length % stride !== 0) {
                throw new Error("The " + kind + "s array count must be a multiple of " + stride);
            }

            return values.length / stride;
        };

        const positionsElementCount = getElementCount(VertexBuffer.PositionKind, this.positions);

        const validateElementCount = (kind: string, values: FloatArray) => {
            const elementCount = getElementCount(kind, values);
            if (elementCount !== positionsElementCount) {
                throw new Error("The " + kind + "s element count (" + elementCount + ") does not match the positions count (" + positionsElementCount + ")");
            }
        };

        if (this.normals) {
            validateElementCount(VertexBuffer.NormalKind, this.normals);
        }
        if (this.tangents) {
            validateElementCount(VertexBuffer.TangentKind, this.tangents);
        }
        if (this.uvs) {
            validateElementCount(VertexBuffer.UVKind, this.uvs);
        }
        if (this.uvs2) {
            validateElementCount(VertexBuffer.UV2Kind, this.uvs2);
        }
        if (this.uvs3) {
            validateElementCount(VertexBuffer.UV3Kind, this.uvs3);
        }
        if (this.uvs4) {
            validateElementCount(VertexBuffer.UV4Kind, this.uvs4);
        }
        if (this.uvs5) {
            validateElementCount(VertexBuffer.UV5Kind, this.uvs5);
        }
        if (this.uvs6) {
            validateElementCount(VertexBuffer.UV6Kind, this.uvs6);
        }
        if (this.colors) {
            validateElementCount(VertexBuffer.ColorKind, this.colors);
        }
        if (this.matricesIndices) {
            validateElementCount(VertexBuffer.MatricesIndicesKind, this.matricesIndices);
        }
        if (this.matricesWeights) {
            validateElementCount(VertexBuffer.MatricesWeightsKind, this.matricesWeights);
        }
        if (this.matricesIndicesExtra) {
            validateElementCount(VertexBuffer.MatricesIndicesExtraKind, this.matricesIndicesExtra);
        }
        if (this.matricesWeightsExtra) {
            validateElementCount(VertexBuffer.MatricesWeightsExtraKind, this.matricesWeightsExtra);
        }
    }

    /**
     * Clone the current vertex data
     * @returns a copy of the current data
     */
    public clone() {
        const serializationObject = this.serialize();
        return VertexData.Parse(serializationObject);
    }

    /**
     * Serializes the VertexData
     * @returns a serialized object
     */
    public serialize(): any {
        const serializationObject: any = {};

        if (this.positions) {
            serializationObject.positions = Array.from(this.positions);
        }

        if (this.normals) {
            serializationObject.normals = Array.from(this.normals);
        }

        if (this.tangents) {
            serializationObject.tangents = Array.from(this.tangents);
        }

        if (this.uvs) {
            serializationObject.uvs = Array.from(this.uvs);
        }

        if (this.uvs2) {
            serializationObject.uvs2 = Array.from(this.uvs2);
        }

        if (this.uvs3) {
            serializationObject.uvs3 = Array.from(this.uvs3);
        }

        if (this.uvs4) {
            serializationObject.uvs4 = Array.from(this.uvs4);
        }

        if (this.uvs5) {
            serializationObject.uvs5 = Array.from(this.uvs5);
        }

        if (this.uvs6) {
            serializationObject.uvs6 = Array.from(this.uvs6);
        }

        if (this.colors) {
            serializationObject.colors = Array.from(this.colors);
        }

        if (this.matricesIndices) {
            serializationObject.matricesIndices = Array.from(this.matricesIndices);
            serializationObject.matricesIndices._isExpanded = true;
        }

        if (this.matricesWeights) {
            serializationObject.matricesWeights = Array.from(this.matricesWeights);
        }

        if (this.matricesIndicesExtra) {
            serializationObject.matricesIndicesExtra = Array.from(this.matricesIndicesExtra);
            serializationObject.matricesIndicesExtra._isExpanded = true;
        }

        if (this.matricesWeightsExtra) {
            serializationObject.matricesWeightsExtra = Array.from(this.matricesWeightsExtra);
        }

        serializationObject.indices = Array.from(this.indices as number[]);

        if (this.materialInfos) {
            serializationObject.materialInfos = [];
            for (const materialInfo of this.materialInfos) {
                const materialInfoSerializationObject = {
                    indexStart: materialInfo.indexStart,
                    indexCount: materialInfo.indexCount,
                    materialIndex: materialInfo.materialIndex,
                    verticesStart: materialInfo.verticesStart,
                    verticesCount: materialInfo.verticesCount,
                };
                serializationObject.materialInfos.push(materialInfoSerializationObject);
            }
        }

        return serializationObject;
    }

    // Statics
    /**
     * Extracts the vertexData from a mesh
     * @param mesh the mesh from which to extract the VertexData
     * @param copyWhenShared defines if the VertexData must be cloned when shared between multiple meshes, optional, default false
     * @param forceCopy indicating that the VertexData must be cloned, optional, default false
     * @returns the object VertexData associated to the passed mesh
     */
    public static ExtractFromMesh(mesh: Mesh, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
        return VertexData._ExtractFrom(mesh, copyWhenShared, forceCopy);
    }

    /**
     * Extracts the vertexData from the geometry
     * @param geometry the geometry from which to extract the VertexData
     * @param copyWhenShared defines if the VertexData must be cloned when the geometry is shared between multiple meshes, optional, default false
     * @param forceCopy indicating that the VertexData must be cloned, optional, default false
     * @returns the object VertexData associated to the passed mesh
     */
    public static ExtractFromGeometry(geometry: Geometry, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
        return VertexData._ExtractFrom(geometry, copyWhenShared, forceCopy);
    }

    private static _ExtractFrom(meshOrGeometry: IGetSetVerticesData, copyWhenShared?: boolean, forceCopy?: boolean): VertexData {
        const result = new VertexData();

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.PositionKind)) {
            result.positions = meshOrGeometry.getVerticesData(VertexBuffer.PositionKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            result.normals = meshOrGeometry.getVerticesData(VertexBuffer.NormalKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.TangentKind)) {
            result.tangents = meshOrGeometry.getVerticesData(VertexBuffer.TangentKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UVKind)) {
            result.uvs = meshOrGeometry.getVerticesData(VertexBuffer.UVKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
            result.uvs2 = meshOrGeometry.getVerticesData(VertexBuffer.UV2Kind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV3Kind)) {
            result.uvs3 = meshOrGeometry.getVerticesData(VertexBuffer.UV3Kind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV4Kind)) {
            result.uvs4 = meshOrGeometry.getVerticesData(VertexBuffer.UV4Kind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV5Kind)) {
            result.uvs5 = meshOrGeometry.getVerticesData(VertexBuffer.UV5Kind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV6Kind)) {
            result.uvs6 = meshOrGeometry.getVerticesData(VertexBuffer.UV6Kind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.ColorKind)) {
            result.colors = meshOrGeometry.getVerticesData(VertexBuffer.ColorKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)) {
            result.matricesIndices = meshOrGeometry.getVerticesData(VertexBuffer.MatricesIndicesKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)) {
            result.matricesWeights = meshOrGeometry.getVerticesData(VertexBuffer.MatricesWeightsKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesIndicesExtraKind)) {
            result.matricesIndicesExtra = meshOrGeometry.getVerticesData(VertexBuffer.MatricesIndicesExtraKind, copyWhenShared, forceCopy);
        }

        if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesWeightsExtraKind)) {
            result.matricesWeightsExtra = meshOrGeometry.getVerticesData(VertexBuffer.MatricesWeightsExtraKind, copyWhenShared, forceCopy);
        }

        result.indices = meshOrGeometry.getIndices(copyWhenShared, forceCopy);

        return result;
    }

    /**
     * Creates the VertexData for a Ribbon
     * @param options an object used to set the following optional parameters for the ribbon, required but can be empty
     * * pathArray array of paths, each of which an array of successive Vector3
     * * closeArray creates a seam between the first and the last paths of the pathArray, optional, default false
     * * closePath creates a seam between the first and the last points of each path of the path array, optional, default false
     * * offset a positive integer, only used when pathArray contains a single path (offset = 10 means the point 1 is joined to the point 11), default rounded half size of the pathArray length
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * * invertUV swaps in the U and V coordinates when applying a texture, optional, default false
     * * uvs a linear array, of length 2 * number of vertices, of custom UV values, optional
     * * colors a linear array, of length 4 * number of vertices, of custom color values, optional
     * @param options.pathArray
     * @param options.closeArray
     * @param options.closePath
     * @param options.offset
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @param options.invertUV
     * @param options.uvs
     * @param options.colors
     * @returns the VertexData of the ribbon
     * @deprecated use CreateRibbonVertexData instead
     */
    public static CreateRibbon(options: {
        pathArray: Vector3[][];
        closeArray?: boolean;
        closePath?: boolean;
        offset?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        invertUV?: boolean;
        uvs?: Vector2[];
        colors?: Color4[];
    }): VertexData {
        throw _WarnImport("ribbonBuilder");
    }

    /**
     * Creates the VertexData for a box
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * size sets the width, height and depth of the box to the value of size, optional default 1
     * * width sets the width (x direction) of the box, overwrites the width set by size, optional, default size
     * * height sets the height (y direction) of the box, overwrites the height set by size, optional, default size
     * * depth sets the depth (z direction) of the box, overwrites the depth set by size, optional, default size
     * * faceUV an array of 6 Vector4 elements used to set different images to each box side
     * * faceColors an array of 6 Color3 elements used to set different colors to each box side
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.size
     * @param options.width
     * @param options.height
     * @param options.depth
     * @param options.faceUV
     * @param options.faceColors
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the box
     * @deprecated Please use CreateBoxVertexData from the BoxBuilder file instead
     */
    public static CreateBox(options: {
        size?: number;
        width?: number;
        height?: number;
        depth?: number;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("boxBuilder");
    }

    /**
     * Creates the VertexData for a tiled box
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * faceTiles sets the pattern, tile size and number of tiles for a face
     * * faceUV an array of 6 Vector4 elements used to set different images to each box side
     * * faceColors an array of 6 Color3 elements used to set different colors to each box side
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * @param options.pattern
     * @param options.width
     * @param options.height
     * @param options.depth
     * @param options.tileSize
     * @param options.tileWidth
     * @param options.tileHeight
     * @param options.alignHorizontal
     * @param options.alignVertical
     * @param options.faceUV
     * @param options.faceColors
     * @param options.sideOrientation
     * @returns the VertexData of the box
     * @deprecated Please use CreateTiledBoxVertexData instead
     */
    public static CreateTiledBox(options: {
        pattern?: number;
        width?: number;
        height?: number;
        depth?: number;
        tileSize?: number;
        tileWidth?: number;
        tileHeight?: number;
        alignHorizontal?: number;
        alignVertical?: number;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        sideOrientation?: number;
    }): VertexData {
        throw _WarnImport("tiledBoxBuilder");
    }

    /**
     * Creates the VertexData for a tiled plane
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * pattern a limited pattern arrangement depending on the number
     * * tileSize sets the width, height and depth of the tile to the value of size, optional default 1
     * * tileWidth sets the width (x direction) of the tile, overwrites the width set by size, optional, default size
     * * tileHeight sets the height (y direction) of the tile, overwrites the height set by size, optional, default size
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.pattern
     * @param options.tileSize
     * @param options.tileWidth
     * @param options.tileHeight
     * @param options.size
     * @param options.width
     * @param options.height
     * @param options.alignHorizontal
     * @param options.alignVertical
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the tiled plane
     * @deprecated use CreateTiledPlaneVertexData instead
     */
    public static CreateTiledPlane(options: {
        pattern?: number;
        tileSize?: number;
        tileWidth?: number;
        tileHeight?: number;
        size?: number;
        width?: number;
        height?: number;
        alignHorizontal?: number;
        alignVertical?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("tiledPlaneBuilder");
    }

    /**
     * Creates the VertexData for an ellipsoid, defaults to a sphere
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * segments sets the number of horizontal strips optional, default 32
     * * diameter sets the axes dimensions, diameterX, diameterY and diameterZ to the value of diameter, optional default 1
     * * diameterX sets the diameterX (x direction) of the ellipsoid, overwrites the diameterX set by diameter, optional, default diameter
     * * diameterY sets the diameterY (y direction) of the ellipsoid, overwrites the diameterY set by diameter, optional, default diameter
     * * diameterZ sets the diameterZ (z direction) of the ellipsoid, overwrites the diameterZ set by diameter, optional, default diameter
     * * arc a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the circumference (latitude) given by the arc value, optional, default 1
     * * slice a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the height (latitude) given by the arc value, optional, default 1
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.segments
     * @param options.diameter
     * @param options.diameterX
     * @param options.diameterY
     * @param options.diameterZ
     * @param options.arc
     * @param options.slice
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the ellipsoid
     * @deprecated use CreateSphereVertexData instead
     */
    public static CreateSphere(options: {
        segments?: number;
        diameter?: number;
        diameterX?: number;
        diameterY?: number;
        diameterZ?: number;
        arc?: number;
        slice?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("sphereBuilder");
    }

    /**
     * Creates the VertexData for a cylinder, cone or prism
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * height sets the height (y direction) of the cylinder, optional, default 2
     * * diameterTop sets the diameter of the top of the cone, overwrites diameter,  optional, default diameter
     * * diameterBottom sets the diameter of the bottom of the cone, overwrites diameter,  optional, default diameter
     * * diameter sets the diameter of the top and bottom of the cone, optional default 1
     * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
     * * subdivisions` the number of rings along the cylinder height, optional, default 1
     * * arc a number from 0 to 1, to create an unclosed cylinder based on the fraction of the circumference given by the arc value, optional, default 1
     * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
     * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
     * * hasRings when true makes each subdivision independently treated as a face for faceUV and faceColors, optional, default false
     * * enclose when true closes an open cylinder by adding extra flat faces between the height axis and vertical edges, think cut cake
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.height
     * @param options.diameterTop
     * @param options.diameterBottom
     * @param options.diameter
     * @param options.tessellation
     * @param options.subdivisions
     * @param options.arc
     * @param options.faceColors
     * @param options.faceUV
     * @param options.hasRings
     * @param options.enclose
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the cylinder, cone or prism
     * @deprecated please use CreateCylinderVertexData instead
     */
    public static CreateCylinder(options: {
        height?: number;
        diameterTop?: number;
        diameterBottom?: number;
        diameter?: number;
        tessellation?: number;
        subdivisions?: number;
        arc?: number;
        faceColors?: Color4[];
        faceUV?: Vector4[];
        hasRings?: boolean;
        enclose?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("cylinderBuilder");
    }

    /**
     * Creates the VertexData for a torus
     * @param options an object used to set the following optional parameters for the box, required but can be empty
     * * diameter the diameter of the torus, optional default 1
     * * thickness the diameter of the tube forming the torus, optional default 0.5
     * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.diameter
     * @param options.thickness
     * @param options.tessellation
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the torus
     * @deprecated use CreateTorusVertexData instead
     */
    public static CreateTorus(options: {
        diameter?: number;
        thickness?: number;
        tessellation?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("torusBuilder");
    }

    /**
     * Creates the VertexData of the LineSystem
     * @param options an object used to set the following optional parameters for the LineSystem, required but can be empty
     *  - lines an array of lines, each line being an array of successive Vector3
     *  - colors an array of line colors, each of the line colors being an array of successive Color4, one per line point
     * @param options.lines
     * @param options.colors
     * @returns the VertexData of the LineSystem
     * @deprecated use CreateLineSystemVertexData instead
     */
    public static CreateLineSystem(options: { lines: Vector3[][]; colors?: Nullable<Color4[][]> }): VertexData {
        throw _WarnImport("linesBuilder");
    }

    /**
     * Create the VertexData for a DashedLines
     * @param options an object used to set the following optional parameters for the DashedLines, required but can be empty
     *  - points an array successive Vector3
     *  - dashSize the size of the dashes relative to the dash number, optional, default 3
     *  - gapSize the size of the gap between two successive dashes relative to the dash number, optional, default 1
     *  - dashNb the intended total number of dashes, optional, default 200
     * @param options.points
     * @param options.dashSize
     * @param options.gapSize
     * @param options.dashNb
     * @returns the VertexData for the DashedLines
     * @deprecated use CreateDashedLinesVertexData instead
     */
    public static CreateDashedLines(options: { points: Vector3[]; dashSize?: number; gapSize?: number; dashNb?: number }): VertexData {
        throw _WarnImport("linesBuilder");
    }

    /**
     * Creates the VertexData for a Ground
     * @param options an object used to set the following optional parameters for the Ground, required but can be empty
     *  - width the width (x direction) of the ground, optional, default 1
     *  - height the height (z direction) of the ground, optional, default 1
     *  - subdivisions the number of subdivisions per side, optional, default 1
     * @param options.width
     * @param options.height
     * @param options.subdivisions
     * @param options.subdivisionsX
     * @param options.subdivisionsY
     * @returns the VertexData of the Ground
     * @deprecated Please use CreateGroundVertexData instead
     */
    public static CreateGround(options: { width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number }): VertexData {
        throw _WarnImport("groundBuilder");
    }

    /**
     * Creates the VertexData for a TiledGround by subdividing the ground into tiles
     * @param options an object used to set the following optional parameters for the Ground, required but can be empty
     * * xmin the ground minimum X coordinate, optional, default -1
     * * zmin the ground minimum Z coordinate, optional, default -1
     * * xmax the ground maximum X coordinate, optional, default 1
     * * zmax the ground maximum Z coordinate, optional, default 1
     * * subdivisions a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the ground width and height creating 'tiles', default {w: 6, h: 6}
     * * precision a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the tile width and height, default {w: 2, h: 2}
     * @param options.xmin
     * @param options.zmin
     * @param options.xmax
     * @param options.zmax
     * @param options.subdivisions
     * @param options.subdivisions.w
     * @param options.subdivisions.h
     * @param options.precision
     * @param options.precision.w
     * @param options.precision.h
     * @returns the VertexData of the TiledGround
     * @deprecated use CreateTiledGroundVertexData instead
     */
    public static CreateTiledGround(options: {
        xmin: number;
        zmin: number;
        xmax: number;
        zmax: number;
        subdivisions?: { w: number; h: number };
        precision?: { w: number; h: number };
    }): VertexData {
        throw _WarnImport("groundBuilder");
    }

    /**
     * Creates the VertexData of the Ground designed from a heightmap
     * @param options an object used to set the following parameters for the Ground, required and provided by CreateGroundFromHeightMap
     * * width the width (x direction) of the ground
     * * height the height (z direction) of the ground
     * * subdivisions the number of subdivisions per side
     * * minHeight the minimum altitude on the ground, optional, default 0
     * * maxHeight the maximum altitude on the ground, optional default 1
     * * colorFilter the filter to apply to the image pixel colors to compute the height, optional Color3, default (0.3, 0.59, 0.11)
     * * buffer the array holding the image color data
     * * bufferWidth the width of image
     * * bufferHeight the height of image
     * * alphaFilter Remove any data where the alpha channel is below this value, defaults 0 (all data visible)
     * @param options.width
     * @param options.height
     * @param options.subdivisions
     * @param options.minHeight
     * @param options.maxHeight
     * @param options.colorFilter
     * @param options.buffer
     * @param options.bufferWidth
     * @param options.bufferHeight
     * @param options.alphaFilter
     * @returns the VertexData of the Ground designed from a heightmap
     * @deprecated use CreateGroundFromHeightMapVertexData instead
     */
    public static CreateGroundFromHeightMap(options: {
        width: number;
        height: number;
        subdivisions: number;
        minHeight: number;
        maxHeight: number;
        colorFilter: Color3;
        buffer: Uint8Array;
        bufferWidth: number;
        bufferHeight: number;
        alphaFilter: number;
    }): VertexData {
        throw _WarnImport("groundBuilder");
    }

    /**
     * Creates the VertexData for a Plane
     * @param options an object used to set the following optional parameters for the plane, required but can be empty
     * * size sets the width and height of the plane to the value of size, optional default 1
     * * width sets the width (x direction) of the plane, overwrites the width set by size, optional, default size
     * * height sets the height (y direction) of the plane, overwrites the height set by size, optional, default size
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.size
     * @param options.width
     * @param options.height
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the box
     * @deprecated use CreatePlaneVertexData instead
     */
    public static CreatePlane(options: { size?: number; width?: number; height?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 }): VertexData {
        throw _WarnImport("planeBuilder");
    }

    /**
     * Creates the VertexData of the Disc or regular Polygon
     * @param options an object used to set the following optional parameters for the disc, required but can be empty
     * * radius the radius of the disc, optional default 0.5
     * * tessellation the number of polygon sides, optional, default 64
     * * arc a number from 0 to 1, to create an unclosed polygon based on the fraction of the circumference given by the arc value, optional, default 1
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.radius
     * @param options.tessellation
     * @param options.arc
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the box
     * @deprecated use CreateDiscVertexData instead
     */
    public static CreateDisc(options: { radius?: number; tessellation?: number; arc?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 }): VertexData {
        throw _WarnImport("discBuilder");
    }

    /**
     * Creates the VertexData for an irregular Polygon in the XoZ plane using a mesh built by polygonTriangulation.build()
     * All parameters are provided by CreatePolygon as needed
     * @param polygon a mesh built from polygonTriangulation.build()
     * @param sideOrientation takes the values Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * @param fUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
     * @param fColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
     * @param frontUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * @param backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param wrap a boolean, default false, when true and fUVs used texture is wrapped around all sides, when false texture is applied side
     * @returns the VertexData of the Polygon
     * @deprecated use CreatePolygonVertexData instead
     */
    public static CreatePolygon(polygon: Mesh, sideOrientation: number, fUV?: Vector4[], fColors?: Color4[], frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean): VertexData {
        throw _WarnImport("polygonBuilder");
    }

    /**
     * Creates the VertexData of the IcoSphere
     * @param options an object used to set the following optional parameters for the IcoSphere, required but can be empty
     * * radius the radius of the IcoSphere, optional default 1
     * * radiusX allows stretching in the x direction, optional, default radius
     * * radiusY allows stretching in the y direction, optional, default radius
     * * radiusZ allows stretching in the z direction, optional, default radius
     * * flat when true creates a flat shaded mesh, optional, default true
     * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.radius
     * @param options.radiusX
     * @param options.radiusY
     * @param options.radiusZ
     * @param options.flat
     * @param options.subdivisions
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the IcoSphere
     * @deprecated use CreateIcoSphereVertexData instead
     */
    public static CreateIcoSphere(options: {
        radius?: number;
        radiusX?: number;
        radiusY?: number;
        radiusZ?: number;
        flat?: boolean;
        subdivisions?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("icoSphereBuilder");
    }

    // inspired from // http://stemkoski.github.io/Three.js/Polyhedra.html
    /**
     * Creates the VertexData for a Polyhedron
     * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
     * * type provided types are:
     *  * 0 : Tetrahedron, 1 : Octahedron, 2 : Dodecahedron, 3 : Icosahedron, 4 : Rhombicuboctahedron, 5 : Triangular Prism, 6 : Pentagonal Prism, 7 : Hexagonal Prism, 8 : Square Pyramid (J1)
     *  * 9 : Pentagonal Pyramid (J2), 10 : Triangular Dipyramid (J12), 11 : Pentagonal Dipyramid (J13), 12 : Elongated Square Dipyramid (J15), 13 : Elongated Pentagonal Dipyramid (J16), 14 : Elongated Pentagonal Cupola (J20)
     * * size the size of the IcoSphere, optional default 1
     * * sizeX allows stretching in the x direction, optional, default size
     * * sizeY allows stretching in the y direction, optional, default size
     * * sizeZ allows stretching in the z direction, optional, default size
     * * custom a number that overwrites the type to create from an extended set of polyhedron from https://www.babylonjs-playground.com/#21QRSK#15 with minimised editor
     * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
     * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
     * * flat when true creates a flat shaded mesh, optional, default true
     * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.type
     * @param options.size
     * @param options.sizeX
     * @param options.sizeY
     * @param options.sizeZ
     * @param options.custom
     * @param options.faceUV
     * @param options.faceColors
     * @param options.flat
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the Polyhedron
     * @deprecated use CreatePolyhedronVertexData instead
     */
    public static CreatePolyhedron(options: {
        type?: number;
        size?: number;
        sizeX?: number;
        sizeY?: number;
        sizeZ?: number;
        custom?: any;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        flat?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("polyhedronBuilder");
    }

    /**
     * Creates the VertexData for a Capsule, inspired from https://github.com/maximeq/three-js-capsule-geometry/blob/master/src/CapsuleBufferGeometry.js
     * @param options an object used to set the following optional parameters for the capsule, required but can be empty
     * @returns the VertexData of the Capsule
     * @deprecated Please use CreateCapsuleVertexData from the capsuleBuilder file instead
     */
    public static CreateCapsule(
        options: ICreateCapsuleOptions = {
            orientation: Vector3.Up(),
            subdivisions: 2,
            tessellation: 16,
            height: 1,
            radius: 0.25,
            capSubdivisions: 6,
        }
    ): VertexData {
        throw _WarnImport("capsuleBuilder");
    }

    // based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
    /**
     * Creates the VertexData for a TorusKnot
     * @param options an object used to set the following optional parameters for the TorusKnot, required but can be empty
     * * radius the radius of the torus knot, optional, default 2
     * * tube the thickness of the tube, optional, default 0.5
     * * radialSegments the number of sides on each tube segments, optional, default 32
     * * tubularSegments the number of tubes to decompose the knot into, optional, default 32
     * * p the number of windings around the z axis, optional,  default 2
     * * q the number of windings around the x axis, optional,  default 3
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param options.radius
     * @param options.tube
     * @param options.radialSegments
     * @param options.tubularSegments
     * @param options.p
     * @param options.q
     * @param options.sideOrientation
     * @param options.frontUVs
     * @param options.backUVs
     * @returns the VertexData of the Torus Knot
     * @deprecated use CreateTorusKnotVertexData instead
     */
    public static CreateTorusKnot(options: {
        radius?: number;
        tube?: number;
        radialSegments?: number;
        tubularSegments?: number;
        p?: number;
        q?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    }): VertexData {
        throw _WarnImport("torusKnotBuilder");
    }

    // Tools

    /**
     * Compute normals for given positions and indices
     * @param positions an array of vertex positions, [...., x, y, z, ......]
     * @param indices an array of indices in groups of three for each triangular facet, [...., i, j, k, ......]
     * @param normals an array of vertex normals, [...., x, y, z, ......]
     * @param options an object used to set the following optional parameters for the TorusKnot, optional
     * * facetNormals : optional array of facet normals (vector3)
     * * facetPositions : optional array of facet positions (vector3)
     * * facetPartitioning : optional partitioning array. facetPositions is required for facetPartitioning computation
     * * ratio : optional partitioning ratio / bounding box, required for facetPartitioning computation
     * * bInfo : optional bounding info, required for facetPartitioning computation
     * * bbSize : optional bounding box size data, required for facetPartitioning computation
     * * subDiv : optional partitioning data about subdivisions on  each axis (int), required for facetPartitioning computation
     * * useRightHandedSystem: optional boolean to for right handed system computation
     * * depthSort : optional boolean to enable the facet depth sort computation
     * * distanceTo : optional Vector3 to compute the facet depth from this location
     * * depthSortedFacets : optional array of depthSortedFacets to store the facet distances from the reference location
     * @param options.facetNormals
     * @param options.facetPositions
     * @param options.facetPartitioning
     * @param options.ratio
     * @param options.bInfo
     * @param options.bbSize
     * @param options.subDiv
     * @param options.useRightHandedSystem
     * @param options.depthSort
     * @param options.distanceTo
     * @param options.depthSortedFacets
     */
    public static ComputeNormals(
        positions: any,
        indices: any,
        normals: any,
        options?: {
            facetNormals?: any;
            facetPositions?: any;
            facetPartitioning?: any;
            ratio?: number;
            bInfo?: any;
            bbSize?: Vector3;
            subDiv?: any;
            useRightHandedSystem?: boolean;
            depthSort?: boolean;
            distanceTo?: Vector3;
            depthSortedFacets?: any;
        }
    ): void {
        // temporary scalar variables
        let index = 0; // facet index
        let p1p2x = 0.0; // p1p2 vector x coordinate
        let p1p2y = 0.0; // p1p2 vector y coordinate
        let p1p2z = 0.0; // p1p2 vector z coordinate
        let p3p2x = 0.0; // p3p2 vector x coordinate
        let p3p2y = 0.0; // p3p2 vector y coordinate
        let p3p2z = 0.0; // p3p2 vector z coordinate
        let faceNormalx = 0.0; // facet normal x coordinate
        let faceNormaly = 0.0; // facet normal y coordinate
        let faceNormalz = 0.0; // facet normal z coordinate
        let length = 0.0; // facet normal length before normalization
        let v1x = 0; // vector1 x index in the positions array
        let v1y = 0; // vector1 y index in the positions array
        let v1z = 0; // vector1 z index in the positions array
        let v2x = 0; // vector2 x index in the positions array
        let v2y = 0; // vector2 y index in the positions array
        let v2z = 0; // vector2 z index in the positions array
        let v3x = 0; // vector3 x index in the positions array
        let v3y = 0; // vector3 y index in the positions array
        let v3z = 0; // vector3 z index in the positions array
        let computeFacetNormals = false;
        let computeFacetPositions = false;
        let computeFacetPartitioning = false;
        let computeDepthSort = false;
        let faceNormalSign = 1;
        let ratio = 0;
        let distanceTo: Nullable<Vector3> = null;
        if (options) {
            computeFacetNormals = options.facetNormals ? true : false;
            computeFacetPositions = options.facetPositions ? true : false;
            computeFacetPartitioning = options.facetPartitioning ? true : false;
            faceNormalSign = options.useRightHandedSystem === true ? -1 : 1;
            ratio = options.ratio || 0;
            computeDepthSort = options.depthSort ? true : false;
            distanceTo = <Vector3>options.distanceTo;
            if (computeDepthSort) {
                if (distanceTo === undefined) {
                    distanceTo = Vector3.Zero();
                }
            }
        }

        // facetPartitioning reinit if needed
        let xSubRatio = 0;
        let ySubRatio = 0;
        let zSubRatio = 0;
        let subSq = 0;
        if (computeFacetPartitioning && options && options.bbSize) {
            //let bbSizeMax = options.bbSize.x > options.bbSize.y ? options.bbSize.x : options.bbSize.y;
            //bbSizeMax = bbSizeMax > options.bbSize.z ? bbSizeMax : options.bbSize.z;
            xSubRatio = (options.subDiv.X * ratio) / options.bbSize.x;
            ySubRatio = (options.subDiv.Y * ratio) / options.bbSize.y;
            zSubRatio = (options.subDiv.Z * ratio) / options.bbSize.z;
            subSq = options.subDiv.max * options.subDiv.max;
            options.facetPartitioning.length = 0;
        }

        // reset the normals
        for (index = 0; index < positions.length; index++) {
            normals[index] = 0.0;
        }

        // Loop : 1 indice triplet = 1 facet
        const nbFaces = (indices.length / 3) | 0;
        for (index = 0; index < nbFaces; index++) {
            // get the indexes of the coordinates of each vertex of the facet
            v1x = indices[index * 3] * 3;
            v1y = v1x + 1;
            v1z = v1x + 2;
            v2x = indices[index * 3 + 1] * 3;
            v2y = v2x + 1;
            v2z = v2x + 2;
            v3x = indices[index * 3 + 2] * 3;
            v3y = v3x + 1;
            v3z = v3x + 2;

            p1p2x = positions[v1x] - positions[v2x]; // compute two vectors per facet : p1p2 and p3p2
            p1p2y = positions[v1y] - positions[v2y];
            p1p2z = positions[v1z] - positions[v2z];

            p3p2x = positions[v3x] - positions[v2x];
            p3p2y = positions[v3y] - positions[v2y];
            p3p2z = positions[v3z] - positions[v2z];

            // compute the face normal with the cross product
            faceNormalx = faceNormalSign * (p1p2y * p3p2z - p1p2z * p3p2y);
            faceNormaly = faceNormalSign * (p1p2z * p3p2x - p1p2x * p3p2z);
            faceNormalz = faceNormalSign * (p1p2x * p3p2y - p1p2y * p3p2x);
            // normalize this normal and store it in the array facetData
            length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
            length = length === 0 ? 1.0 : length;
            faceNormalx /= length;
            faceNormaly /= length;
            faceNormalz /= length;

            if (computeFacetNormals && options) {
                options.facetNormals[index].x = faceNormalx;
                options.facetNormals[index].y = faceNormaly;
                options.facetNormals[index].z = faceNormalz;
            }

            if (computeFacetPositions && options) {
                // compute and the facet barycenter coordinates in the array facetPositions
                options.facetPositions[index].x = (positions[v1x] + positions[v2x] + positions[v3x]) / 3.0;
                options.facetPositions[index].y = (positions[v1y] + positions[v2y] + positions[v3y]) / 3.0;
                options.facetPositions[index].z = (positions[v1z] + positions[v2z] + positions[v3z]) / 3.0;
            }

            if (computeFacetPartitioning && options) {
                // store the facet indexes in arrays in the main facetPartitioning array :
                // compute each facet vertex (+ facet barycenter) index in the partiniong array
                const ox = Math.floor((options.facetPositions[index].x - options.bInfo.minimum.x * ratio) * xSubRatio);
                const oy = Math.floor((options.facetPositions[index].y - options.bInfo.minimum.y * ratio) * ySubRatio);
                const oz = Math.floor((options.facetPositions[index].z - options.bInfo.minimum.z * ratio) * zSubRatio);
                const b1x = Math.floor((positions[v1x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                const b1y = Math.floor((positions[v1y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                const b1z = Math.floor((positions[v1z] - options.bInfo.minimum.z * ratio) * zSubRatio);
                const b2x = Math.floor((positions[v2x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                const b2y = Math.floor((positions[v2y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                const b2z = Math.floor((positions[v2z] - options.bInfo.minimum.z * ratio) * zSubRatio);
                const b3x = Math.floor((positions[v3x] - options.bInfo.minimum.x * ratio) * xSubRatio);
                const b3y = Math.floor((positions[v3y] - options.bInfo.minimum.y * ratio) * ySubRatio);
                const b3z = Math.floor((positions[v3z] - options.bInfo.minimum.z * ratio) * zSubRatio);

                const block_idx_v1 = b1x + options.subDiv.max * b1y + subSq * b1z;
                const block_idx_v2 = b2x + options.subDiv.max * b2y + subSq * b2z;
                const block_idx_v3 = b3x + options.subDiv.max * b3y + subSq * b3z;
                const block_idx_o = ox + options.subDiv.max * oy + subSq * oz;

                options.facetPartitioning[block_idx_o] = options.facetPartitioning[block_idx_o] ? options.facetPartitioning[block_idx_o] : new Array();
                options.facetPartitioning[block_idx_v1] = options.facetPartitioning[block_idx_v1] ? options.facetPartitioning[block_idx_v1] : new Array();
                options.facetPartitioning[block_idx_v2] = options.facetPartitioning[block_idx_v2] ? options.facetPartitioning[block_idx_v2] : new Array();
                options.facetPartitioning[block_idx_v3] = options.facetPartitioning[block_idx_v3] ? options.facetPartitioning[block_idx_v3] : new Array();

                // push each facet index in each block containing the vertex
                options.facetPartitioning[block_idx_v1].push(index);
                if (block_idx_v2 != block_idx_v1) {
                    options.facetPartitioning[block_idx_v2].push(index);
                }
                if (!(block_idx_v3 == block_idx_v2 || block_idx_v3 == block_idx_v1)) {
                    options.facetPartitioning[block_idx_v3].push(index);
                }
                if (!(block_idx_o == block_idx_v1 || block_idx_o == block_idx_v2 || block_idx_o == block_idx_v3)) {
                    options.facetPartitioning[block_idx_o].push(index);
                }
            }

            if (computeDepthSort && options && options.facetPositions) {
                const dsf = options.depthSortedFacets[index];
                dsf.ind = index * 3;
                dsf.sqDistance = Vector3.DistanceSquared(options.facetPositions[index], distanceTo!);
            }

            // compute the normals anyway
            normals[v1x] += faceNormalx; // accumulate all the normals per face
            normals[v1y] += faceNormaly;
            normals[v1z] += faceNormalz;
            normals[v2x] += faceNormalx;
            normals[v2y] += faceNormaly;
            normals[v2z] += faceNormalz;
            normals[v3x] += faceNormalx;
            normals[v3y] += faceNormaly;
            normals[v3z] += faceNormalz;
        }
        // last normalization of each normal
        for (index = 0; index < normals.length / 3; index++) {
            faceNormalx = normals[index * 3];
            faceNormaly = normals[index * 3 + 1];
            faceNormalz = normals[index * 3 + 2];

            length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
            length = length === 0 ? 1.0 : length;
            faceNormalx /= length;
            faceNormaly /= length;
            faceNormalz /= length;

            normals[index * 3] = faceNormalx;
            normals[index * 3 + 1] = faceNormaly;
            normals[index * 3 + 2] = faceNormalz;
        }
    }

    /**
     * @internal
     */
    public static _ComputeSides(
        sideOrientation: number,
        positions: FloatArray,
        indices: FloatArray | IndicesArray,
        normals: FloatArray,
        uvs: FloatArray,
        frontUVs?: Vector4,
        backUVs?: Vector4
    ) {
        const li: number = indices.length;
        const ln: number = normals.length;
        let i: number;
        let n: number;
        sideOrientation = sideOrientation || VertexData.DEFAULTSIDE;

        switch (sideOrientation) {
            case VertexData.FRONTSIDE:
                // nothing changed
                break;

            case VertexData.BACKSIDE:
                // indices
                for (i = 0; i < li; i += 3) {
                    const tmp = indices[i];
                    indices[i] = indices[i + 2];
                    indices[i + 2] = tmp;
                }
                // normals
                for (n = 0; n < ln; n++) {
                    normals[n] = -normals[n];
                }
                break;

            case VertexData.DOUBLESIDE: {
                // positions
                const lp: number = positions.length;
                const l: number = lp / 3;
                for (let p = 0; p < lp; p++) {
                    positions[lp + p] = positions[p];
                }
                // indices
                for (i = 0; i < li; i += 3) {
                    indices[i + li] = indices[i + 2] + l;
                    indices[i + 1 + li] = indices[i + 1] + l;
                    indices[i + 2 + li] = indices[i] + l;
                }
                // normals
                for (n = 0; n < ln; n++) {
                    normals[ln + n] = -normals[n];
                }

                // uvs
                const lu: number = uvs.length;
                let u: number = 0;
                for (u = 0; u < lu; u++) {
                    uvs[u + lu] = uvs[u];
                }
                frontUVs = frontUVs ? frontUVs : new Vector4(0.0, 0.0, 1.0, 1.0);
                backUVs = backUVs ? backUVs : new Vector4(0.0, 0.0, 1.0, 1.0);
                u = 0;
                for (i = 0; i < lu / 2; i++) {
                    uvs[u] = frontUVs.x + (frontUVs.z - frontUVs.x) * uvs[u];
                    uvs[u + 1] = frontUVs.y + (frontUVs.w - frontUVs.y) * uvs[u + 1];
                    uvs[u + lu] = backUVs.x + (backUVs.z - backUVs.x) * uvs[u + lu];
                    uvs[u + lu + 1] = backUVs.y + (backUVs.w - backUVs.y) * uvs[u + lu + 1];
                    u += 2;
                }
                break;
            }
        }
    }

    /**
     * Creates a VertexData from serialized data
     * @param parsedVertexData the parsed data from an imported file
     * @returns a VertexData
     */
    public static Parse(parsedVertexData: any) {
        const vertexData = new VertexData();

        // positions
        const positions = parsedVertexData.positions;
        if (positions) {
            vertexData.set(positions, VertexBuffer.PositionKind);
        }

        // normals
        const normals = parsedVertexData.normals;
        if (normals) {
            vertexData.set(normals, VertexBuffer.NormalKind);
        }

        // tangents
        const tangents = parsedVertexData.tangents;
        if (tangents) {
            vertexData.set(tangents, VertexBuffer.TangentKind);
        }

        // uvs
        const uvs = parsedVertexData.uvs;
        if (uvs) {
            vertexData.set(uvs, VertexBuffer.UVKind);
        }

        // uv2s
        const uvs2 = parsedVertexData.uvs2;
        if (uvs2) {
            vertexData.set(uvs2, VertexBuffer.UV2Kind);
        }

        // uv3s
        const uvs3 = parsedVertexData.uvs3;
        if (uvs3) {
            vertexData.set(uvs3, VertexBuffer.UV3Kind);
        }

        // uv4s
        const uvs4 = parsedVertexData.uvs4;
        if (uvs4) {
            vertexData.set(uvs4, VertexBuffer.UV4Kind);
        }

        // uv5s
        const uvs5 = parsedVertexData.uvs5;
        if (uvs5) {
            vertexData.set(uvs5, VertexBuffer.UV5Kind);
        }

        // uv6s
        const uvs6 = parsedVertexData.uvs6;
        if (uvs6) {
            vertexData.set(uvs6, VertexBuffer.UV6Kind);
        }

        // colors
        const colors = parsedVertexData.colors;
        if (colors) {
            vertexData.set(Color4.CheckColors4(colors, positions.length / 3), VertexBuffer.ColorKind);
        }

        // matricesIndices
        const matricesIndices = parsedVertexData.matricesIndices;
        if (matricesIndices) {
            vertexData.set(matricesIndices, VertexBuffer.MatricesIndicesKind);
        }

        // matricesWeights
        const matricesWeights = parsedVertexData.matricesWeights;
        if (matricesWeights) {
            vertexData.set(matricesWeights, VertexBuffer.MatricesWeightsKind);
        }

        // indices
        const indices = parsedVertexData.indices;
        if (indices) {
            vertexData.indices = indices;
        }

        // MaterialInfos
        const materialInfos = parsedVertexData.materialInfos;
        if (materialInfos) {
            vertexData.materialInfos = [];
            for (const materialInfoFromJSON of materialInfos) {
                const materialInfo = new VertexDataMaterialInfo();
                materialInfo.indexCount = materialInfoFromJSON.indexCount;
                materialInfo.indexStart = materialInfoFromJSON.indexStart;
                materialInfo.verticesCount = materialInfoFromJSON.verticesCount;
                materialInfo.verticesStart = materialInfoFromJSON.verticesStart;
                materialInfo.materialIndex = materialInfoFromJSON.materialIndex;
                vertexData.materialInfos.push(materialInfo);
            }
        }

        return vertexData;
    }

    /**
     * Applies VertexData created from the imported parameters to the geometry
     * @param parsedVertexData the parsed data from an imported file
     * @param geometry the geometry to apply the VertexData to
     */
    public static ImportVertexData(parsedVertexData: any, geometry: Geometry) {
        const vertexData = VertexData.Parse(parsedVertexData);

        geometry.setAllVerticesData(vertexData, parsedVertexData.updatable);
    }
}
