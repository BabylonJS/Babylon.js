import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { SubMesh } from "../subMesh";
import type { AbstractMesh } from "../abstractMesh";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Matrix, TmpVectors, Vector2, Vector3 } from "core/Maths/math.vector";
import type { Quaternion } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import "core/Meshes/thinInstanceMesh";
import type { ThinEngine } from "core/Engines/thinEngine";
import { ToHalfFloat } from "core/Misc/textureTools";
import type { Material } from "core/Materials/material";
import { Scalar } from "core/Maths/math.scalar";
import { runCoroutineSync, runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { EngineStore } from "core/Engines/engineStore";

interface DelayedTextureUpdate {
    covA: Uint16Array;
    covB: Uint16Array;
    colors: Uint8Array;
    centers: Float32Array;
    sh?: Uint8Array[];
}

// @internal
const unpackUnorm = (value: number, bits: number) => {
    const t = (1 << bits) - 1;
    return (value & t) / t;
};

// @internal
const unpack111011 = (value: number, result: Vector3) => {
    result.x = unpackUnorm(value >>> 21, 11);
    result.y = unpackUnorm(value >>> 11, 10);
    result.z = unpackUnorm(value, 11);
};

// @internal
const unpack8888 = (value: number, result: Uint8ClampedArray) => {
    result[0] = unpackUnorm(value >>> 24, 8) * 255;
    result[1] = unpackUnorm(value >>> 16, 8) * 255;
    result[2] = unpackUnorm(value >>> 8, 8) * 255;
    result[3] = unpackUnorm(value, 8) * 255;
};

// @internal
// unpack quaternion with 2,10,10,10 format (largest element, 3x10bit element)
const unpackRot = (value: number, result: Quaternion) => {
    const norm = 1.0 / (Math.sqrt(2) * 0.5);
    const a = (unpackUnorm(value >>> 20, 10) - 0.5) * norm;
    const b = (unpackUnorm(value >>> 10, 10) - 0.5) * norm;
    const c = (unpackUnorm(value, 10) - 0.5) * norm;
    const m = Math.sqrt(1.0 - (a * a + b * b + c * c));

    switch (value >>> 30) {
        case 0:
            result.set(m, a, b, c);
            break;
        case 1:
            result.set(a, m, b, c);
            break;
        case 2:
            result.set(a, b, m, c);
            break;
        case 3:
            result.set(a, b, c, m);
            break;
    }
};

// @internal
interface CompressedPLYChunk {
    min: Vector3;
    max: Vector3;
    minScale: Vector3;
    maxScale: Vector3;
    minColor: Vector3;
    maxColor: Vector3;
}

// @internal
interface PLYConversionBuffers {
    buffer: ArrayBuffer;
    sh?: [];
}
/**
 * Representation of the types
 */
const enum PLYType {
    FLOAT,
    INT,
    UINT,
    DOUBLE,
    UCHAR,
    UNDEFINED,
}

/**
 * Usage types of the PLY values
 */
const enum PLYValue {
    MIN_X,
    MIN_Y,
    MIN_Z,
    MAX_X,
    MAX_Y,
    MAX_Z,

    MIN_SCALE_X,
    MIN_SCALE_Y,
    MIN_SCALE_Z,

    MAX_SCALE_X,
    MAX_SCALE_Y,
    MAX_SCALE_Z,

    PACKED_POSITION,
    PACKED_ROTATION,
    PACKED_SCALE,
    PACKED_COLOR,
    X,
    Y,
    Z,
    SCALE_0,
    SCALE_1,
    SCALE_2,

    DIFFUSE_RED,
    DIFFUSE_GREEN,
    DIFFUSE_BLUE,
    OPACITY,

    F_DC_0,
    F_DC_1,
    F_DC_2,
    F_DC_3,

    ROT_0,
    ROT_1,
    ROT_2,
    ROT_3,

    MIN_COLOR_R,
    MIN_COLOR_G,
    MIN_COLOR_B,

    MAX_COLOR_R,
    MAX_COLOR_G,
    MAX_COLOR_B,

    SH_0,
    SH_1,
    SH_2,
    SH_3,
    SH_4,
    SH_5,
    SH_6,
    SH_7,
    SH_8,
    SH_9,
    SH_10,
    SH_11,
    SH_12,
    SH_13,
    SH_14,
    SH_15,
    SH_16,
    SH_17,
    SH_18,
    SH_19,
    SH_20,
    SH_21,
    SH_22,
    SH_23,
    SH_24,
    SH_25,
    SH_26,
    SH_27,
    SH_28,
    SH_29,
    SH_30,
    SH_31,
    SH_32,
    SH_33,
    SH_34,
    SH_35,
    SH_36,
    SH_37,
    SH_38,
    SH_39,
    SH_40,
    SH_41,
    SH_42,
    SH_43,
    SH_44,

    UNDEFINED,
}

/**
 * Property field found in PLY header
 */
export type PlyProperty = {
    /**
     * Value usage
     */
    value: PLYValue;
    /**
     * Value type
     */
    type: PLYType;
    /**
     * offset in byte from te beginning of the splat
     */
    offset: number;
};

/**
 * meta info on Splat file
 */
export interface PLYHeader {
    /**
     * number of splats
     */
    vertexCount: number;
    /**
     * number of spatial chunks for compressed ply
     */
    chunkCount: number;
    /**
     * length in bytes of the vertex info
     */
    rowVertexLength: number;
    /**
     * length in bytes of the chunk
     */
    rowChunkLength: number;
    /**
     * array listing properties per vertex
     */
    vertexProperties: PlyProperty[];
    /**
     * array listing properties per chunk
     */
    chunkProperties: PlyProperty[];
    /**
     * data view for parsing chunks and vertices
     */
    dataView: DataView;
    /**
     * buffer for the data view
     */
    buffer: ArrayBuffer;
    /**
     * degree of SH coefficients
     */
    shDegree: number;
    /**
     * number of coefficient per splat
     */
    shCoefficientCount: number;
    /**
     * buffer for SH coefficients
     */
    shBuffer: ArrayBuffer | null;
}
/**
 * Class used to render a gaussian splatting mesh
 */
export class GaussianSplattingMesh extends Mesh {
    private _vertexCount = 0;
    private _worker: Nullable<Worker> = null;
    private _frameIdLastUpdate = -1;
    private _modelViewMatrix = Matrix.Identity();
    private _depthMix: BigInt64Array;
    private _canPostToWorker = true;
    private _readyToDisplay = false;
    private _covariancesATexture: Nullable<BaseTexture> = null;
    private _covariancesBTexture: Nullable<BaseTexture> = null;
    private _centersTexture: Nullable<BaseTexture> = null;
    private _colorsTexture: Nullable<BaseTexture> = null;
    private _splatPositions: Nullable<Float32Array> = null;
    private _splatIndex: Nullable<Float32Array> = null;
    private _shTextures: Nullable<BaseTexture[]> = null;
    private _splatsData: Nullable<ArrayBuffer> = null;
    private _sh: Nullable<Uint8Array[]> = null;
    private readonly _keepInRam: boolean = false;

    private _delayedTextureUpdate: Nullable<DelayedTextureUpdate> = null;
    private _oldDirection = new Vector3();
    private _useRGBACovariants = false;
    private _material: Nullable<Material> = null;

    private _tmpCovariances = [0, 0, 0, 0, 0, 0];
    private _sortIsDirty = false;

    private static _RowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
    private static _SH_C0 = 0.28209479177387814;
    // batch size between 2 yield calls. This value is a tradeoff between updates overhead and framerate hiccups
    // This step is faster the PLY conversion. So batch size can be bigger
    private static _SplatBatchSize = 327680;
    // batch size between 2 yield calls during the PLY to splat conversion.
    private static _PlyConversionBatchSize = 32768;
    private _shDegree = 0;

    /**
     * SH degree. 0 = no sh (default). 1 = 3 parameters. 2 = 8 parameters. 3 = 15 parameters.
     */
    public get shDegree() {
        return this._shDegree;
    }

    /**
     * returns the splats data array buffer that contains in order : postions (3 floats), size (3 floats), color (4 bytes), orientation quaternion (4 bytes)
     */
    public get splatsData() {
        return this._splatsData;
    }

    /**
     * Set the number of batch (a batch is 16384 splats) after which a display update is performed
     * A value of 0 (default) means display update will not happens before splat is ready.
     */
    public static ProgressiveUpdateAmount = 0;

    /**
     * Gets the covariancesA texture
     */
    public get covariancesATexture() {
        return this._covariancesATexture;
    }

    /**
     * Gets the covariancesB texture
     */
    public get covariancesBTexture() {
        return this._covariancesBTexture;
    }

    /**
     * Gets the centers texture
     */
    public get centersTexture() {
        return this._centersTexture;
    }

    /**
     * Gets the colors texture
     */
    public get colorsTexture() {
        return this._colorsTexture;
    }

    /**
     * Gets the SH textures
     */
    public get shTextures() {
        return this._shTextures;
    }

    /**
     * set rendering material
     */
    public override set material(value: Material) {
        this._material = value;
        this._material.backFaceCulling = true;
        this._material.cullBackFaces = false;
        value.resetDrawCache();
    }

    /**
     * get rendering material
     */
    public override get material(): Nullable<Material> {
        return this._material;
    }

    /**
     * Creates a new gaussian splatting mesh
     * @param name defines the name of the mesh
     * @param url defines the url to load from (optional)
     * @param scene defines the hosting scene (optional)
     * @param keepInRam keep datas in ram for editing purpose
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null, keepInRam: boolean = false) {
        super(name, scene);

        const vertexData = new VertexData();

        // Use an intanced quad or triangle. Triangle might be a bit faster because of less shader invocation but I didn't see any difference.
        // Keeping both and use triangle for now.
        // for quad, use following lines
        //vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        //vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.positions = [-3, -2, 0, 3, -2, 0, 0, 4, 0];
        vertexData.indices = [0, 1, 2];
        vertexData.applyToMesh(this);

        this.subMeshes = [];
        // for quad, use following line
        //new SubMesh(0, 0, 4, 0, 6, this);
        new SubMesh(0, 0, 3, 0, 3, this);

        this.setEnabled(false);
        // webGL2 and webGPU support for RG texture with float16 is fine. not webGL1
        this._useRGBACovariants = !this.getEngine().isWebGPU && this.getEngine().version === 1.0;

        this._keepInRam = keepInRam;
        if (url) {
            this.loadFileAsync(url);
        }
        this._material = new GaussianSplattingMaterial(this.name + "_material", this._scene);
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingMesh";
    }

    /**
     * Returns the total number of vertices (splats) within the mesh
     * @returns the total number of vertices
     */
    public override getTotalVertices(): number {
        return this._vertexCount;
    }

    /**
     * Is this node ready to be used/rendered
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns true when ready
     */
    public override isReady(completeCheck = false): boolean {
        if (!super.isReady(completeCheck, true)) {
            return false;
        }

        if (!this._readyToDisplay) {
            // mesh is ready when worker has done at least 1 sorting
            this._postToWorker(true);
            return false;
        }
        return true;
    }

    /** @internal */
    public _postToWorker(forced = false): void {
        const frameId = this.getScene().getFrameId();
        if ((forced || frameId !== this._frameIdLastUpdate) && this._worker && this._scene.activeCamera && this._canPostToWorker) {
            const cameraMatrix = this._scene.activeCamera.getViewMatrix();
            this.getWorldMatrix().multiplyToRef(cameraMatrix, this._modelViewMatrix);
            cameraMatrix.invertToRef(TmpVectors.Matrix[0]);
            this.getWorldMatrix().multiplyToRef(TmpVectors.Matrix[0], TmpVectors.Matrix[1]);
            Vector3.TransformNormalToRef(Vector3.Forward(this._scene.useRightHandedSystem), TmpVectors.Matrix[1], TmpVectors.Vector3[2]);
            TmpVectors.Vector3[2].normalize();

            const dot = Vector3.Dot(TmpVectors.Vector3[2], this._oldDirection);
            if (forced || Math.abs(dot - 1) >= 0.01) {
                this._oldDirection.copyFrom(TmpVectors.Vector3[2]);
                this._frameIdLastUpdate = frameId;
                this._canPostToWorker = false;
                this._worker.postMessage({ view: this._modelViewMatrix.m, depthMix: this._depthMix, useRightHandedSystem: this._scene.useRightHandedSystem }, [
                    this._depthMix.buffer,
                ]);
            }
        }
    }
    /**
     * Triggers the draw call for the mesh. Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager
     * @param subMesh defines the subMesh to render
     * @param enableAlphaMode defines if alpha mode can be changed
     * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering
     * @returns the current mesh
     */
    public override render(subMesh: SubMesh, enableAlphaMode: boolean, effectiveMeshReplacement?: AbstractMesh): Mesh {
        this._postToWorker();
        return super.render(subMesh, enableAlphaMode, effectiveMeshReplacement);
    }

    private static _TypeNameToEnum(name: string): PLYType {
        switch (name) {
            case "float":
                return PLYType.FLOAT;
            case "int":
                return PLYType.INT;
                break;
            case "uint":
                return PLYType.UINT;
            case "double":
                return PLYType.DOUBLE;
            case "uchar":
                return PLYType.UCHAR;
        }
        return PLYType.UNDEFINED;
    }

    private static _ValueNameToEnum(name: string): PLYValue {
        switch (name) {
            case "min_x":
                return PLYValue.MIN_X;
            case "min_y":
                return PLYValue.MIN_Y;
            case "min_z":
                return PLYValue.MIN_Z;
            case "max_x":
                return PLYValue.MAX_X;
            case "max_y":
                return PLYValue.MAX_Y;
            case "max_z":
                return PLYValue.MAX_Z;
            case "min_scale_x":
                return PLYValue.MIN_SCALE_X;
            case "min_scale_y":
                return PLYValue.MIN_SCALE_Y;
            case "min_scale_z":
                return PLYValue.MIN_SCALE_Z;
            case "max_scale_x":
                return PLYValue.MAX_SCALE_X;
            case "max_scale_y":
                return PLYValue.MAX_SCALE_Y;
            case "max_scale_z":
                return PLYValue.MAX_SCALE_Z;
            case "packed_position":
                return PLYValue.PACKED_POSITION;
            case "packed_rotation":
                return PLYValue.PACKED_ROTATION;
            case "packed_scale":
                return PLYValue.PACKED_SCALE;
            case "packed_color":
                return PLYValue.PACKED_COLOR;
            case "x":
                return PLYValue.X;
            case "y":
                return PLYValue.Y;
            case "z":
                return PLYValue.Z;
            case "scale_0":
                return PLYValue.SCALE_0;
            case "scale_1":
                return PLYValue.SCALE_1;
            case "scale_2":
                return PLYValue.SCALE_2;
            case "diffuse_red":
            case "red":
                return PLYValue.DIFFUSE_RED;
            case "diffuse_green":
            case "green":
                return PLYValue.DIFFUSE_GREEN;
            case "diffuse_blue":
            case "blue":
                return PLYValue.DIFFUSE_BLUE;
            case "f_dc_0":
                return PLYValue.F_DC_0;
            case "f_dc_1":
                return PLYValue.F_DC_1;
            case "f_dc_2":
                return PLYValue.F_DC_2;
            case "f_dc_3":
                return PLYValue.F_DC_3;
            case "opacity":
                return PLYValue.OPACITY;
            case "rot_0":
                return PLYValue.ROT_0;
            case "rot_1":
                return PLYValue.ROT_1;
            case "rot_2":
                return PLYValue.ROT_2;
            case "rot_3":
                return PLYValue.ROT_3;
            case "min_r":
                return PLYValue.MIN_COLOR_R;
            case "min_g":
                return PLYValue.MIN_COLOR_G;
            case "min_b":
                return PLYValue.MIN_COLOR_B;
            case "max_r":
                return PLYValue.MAX_COLOR_R;
            case "max_g":
                return PLYValue.MAX_COLOR_G;
            case "max_b":
                return PLYValue.MAX_COLOR_B;
            case "f_rest_0":
                return PLYValue.SH_0;
            case "f_rest_1":
                return PLYValue.SH_1;
            case "f_rest_2":
                return PLYValue.SH_2;
            case "f_rest_3":
                return PLYValue.SH_3;
            case "f_rest_4":
                return PLYValue.SH_4;
            case "f_rest_5":
                return PLYValue.SH_5;
            case "f_rest_6":
                return PLYValue.SH_6;
            case "f_rest_7":
                return PLYValue.SH_7;
            case "f_rest_8":
                return PLYValue.SH_8;
            case "f_rest_9":
                return PLYValue.SH_9;
            case "f_rest_10":
                return PLYValue.SH_10;
            case "f_rest_11":
                return PLYValue.SH_11;
            case "f_rest_12":
                return PLYValue.SH_12;
            case "f_rest_13":
                return PLYValue.SH_13;
            case "f_rest_14":
                return PLYValue.SH_14;
            case "f_rest_15":
                return PLYValue.SH_15;
            case "f_rest_16":
                return PLYValue.SH_16;
            case "f_rest_17":
                return PLYValue.SH_17;
            case "f_rest_18":
                return PLYValue.SH_18;
            case "f_rest_19":
                return PLYValue.SH_19;
            case "f_rest_20":
                return PLYValue.SH_20;
            case "f_rest_21":
                return PLYValue.SH_21;
            case "f_rest_22":
                return PLYValue.SH_22;
            case "f_rest_23":
                return PLYValue.SH_23;
            case "f_rest_24":
                return PLYValue.SH_24;
            case "f_rest_25":
                return PLYValue.SH_25;
            case "f_rest_26":
                return PLYValue.SH_26;
            case "f_rest_27":
                return PLYValue.SH_27;
            case "f_rest_28":
                return PLYValue.SH_28;
            case "f_rest_29":
                return PLYValue.SH_29;
            case "f_rest_30":
                return PLYValue.SH_30;
            case "f_rest_31":
                return PLYValue.SH_31;
            case "f_rest_32":
                return PLYValue.SH_32;
            case "f_rest_33":
                return PLYValue.SH_33;
            case "f_rest_34":
                return PLYValue.SH_34;
            case "f_rest_35":
                return PLYValue.SH_35;
            case "f_rest_36":
                return PLYValue.SH_36;
            case "f_rest_37":
                return PLYValue.SH_37;
            case "f_rest_38":
                return PLYValue.SH_38;
            case "f_rest_39":
                return PLYValue.SH_39;
            case "f_rest_40":
                return PLYValue.SH_40;
            case "f_rest_41":
                return PLYValue.SH_41;
            case "f_rest_42":
                return PLYValue.SH_42;
            case "f_rest_43":
                return PLYValue.SH_43;
            case "f_rest_44":
                return PLYValue.SH_44;
        }

        return PLYValue.UNDEFINED;
    }
    /**
     * Parse a PLY file header and returns metas infos on splats and chunks
     * @param data the loaded buffer
     * @returns a PLYHeader
     */
    static ParseHeader(data: ArrayBuffer): PLYHeader | null {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return null;
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);
        const chunkElement = /element chunk (\d+)\n/.exec(header);
        let chunkCount = 0;
        if (chunkElement) {
            chunkCount = parseInt(chunkElement[1]);
        }
        let rowVertexOffset = 0;
        let rowChunkOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
            list: 0,
        };

        const enum ElementMode {
            Vertex = 0,
            Chunk = 1,
            SH = 2,
        }
        let chunkMode = ElementMode.Chunk;
        const vertexProperties: PlyProperty[] = [];
        const chunkProperties: PlyProperty[] = [];
        const filtered = header.slice(0, headerEndIndex).split("\n");
        let shDegree = 0;
        for (const prop of filtered) {
            if (prop.startsWith("property ")) {
                const [, typeName, name] = prop.split(" ");

                const value = GaussianSplattingMesh._ValueNameToEnum(name);
                // SH degree 1,2 or 3 for 9, 24 or 45 values
                if (value >= PLYValue.SH_44) {
                    shDegree = 3;
                } else if (value >= PLYValue.SH_24) {
                    shDegree = 2;
                } else if (value >= PLYValue.SH_8) {
                    shDegree = 1;
                }
                const type = GaussianSplattingMesh._TypeNameToEnum(typeName);
                if (chunkMode == ElementMode.Chunk) {
                    chunkProperties.push({ value, type, offset: rowChunkOffset });
                    rowChunkOffset += offsets[typeName];
                } else if (chunkMode == ElementMode.Vertex) {
                    vertexProperties.push({ value, type, offset: rowVertexOffset });
                    rowVertexOffset += offsets[typeName];
                } else if (chunkMode == ElementMode.SH) {
                    // SH doesn't count for vertex row size but its properties are used to retrieve SH
                    vertexProperties.push({ value, type, offset: rowVertexOffset });
                }

                if (!offsets[typeName]) {
                    Logger.Warn(`Unsupported property type: ${typeName}.`);
                }
            } else if (prop.startsWith("element ")) {
                const [, type] = prop.split(" ");
                if (type == "chunk") {
                    chunkMode = ElementMode.Chunk;
                } else if (type == "vertex") {
                    chunkMode = ElementMode.Vertex;
                } else if (type == "sh") {
                    chunkMode = ElementMode.SH;
                }
            }
        }

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(GaussianSplattingMesh._RowOutputLength * vertexCount);

        let shBuffer = null;
        let shCoefficientCount = 0;
        if (shDegree) {
            const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1;
            shCoefficientCount = shVectorCount * 3;
            shBuffer = new ArrayBuffer(shCoefficientCount * vertexCount);
        }

        return {
            vertexCount: vertexCount,
            chunkCount: chunkCount,
            rowVertexLength: rowVertexOffset,
            rowChunkLength: rowChunkOffset,
            vertexProperties: vertexProperties,
            chunkProperties: chunkProperties,
            dataView: dataView,
            buffer: buffer,
            shDegree: shDegree,
            shCoefficientCount: shCoefficientCount,
            shBuffer: shBuffer,
        };
    }
    private static _GetCompressedChunks(header: PLYHeader, offset: { value: number }): Array<CompressedPLYChunk> | null {
        if (!header.chunkCount) {
            return null;
        }
        const dataView = header.dataView;
        const compressedChunks = new Array<CompressedPLYChunk>(header.chunkCount);
        for (let i = 0; i < header.chunkCount; i++) {
            const currentChunk = {
                min: new Vector3(),
                max: new Vector3(),
                minScale: new Vector3(),
                maxScale: new Vector3(),
                minColor: new Vector3(0, 0, 0),
                maxColor: new Vector3(1, 1, 1),
            };
            compressedChunks[i] = currentChunk;
            for (let propertyIndex = 0; propertyIndex < header.chunkProperties.length; propertyIndex++) {
                const property = header.chunkProperties[propertyIndex];
                let value;
                switch (property.type) {
                    case PLYType.FLOAT:
                        value = dataView.getFloat32(property.offset + offset.value, true);
                        break;
                    default:
                        continue;
                }

                switch (property.value) {
                    case PLYValue.MIN_X:
                        currentChunk.min.x = value;
                        break;
                    case PLYValue.MIN_Y:
                        currentChunk.min.y = value;
                        break;
                    case PLYValue.MIN_Z:
                        currentChunk.min.z = value;
                        break;
                    case PLYValue.MAX_X:
                        currentChunk.max.x = value;
                        break;
                    case PLYValue.MAX_Y:
                        currentChunk.max.y = value;
                        break;
                    case PLYValue.MAX_Z:
                        currentChunk.max.z = value;
                        break;
                    case PLYValue.MIN_SCALE_X:
                        currentChunk.minScale.x = value;
                        break;
                    case PLYValue.MIN_SCALE_Y:
                        currentChunk.minScale.y = value;
                        break;
                    case PLYValue.MIN_SCALE_Z:
                        currentChunk.minScale.z = value;
                        break;
                    case PLYValue.MAX_SCALE_X:
                        currentChunk.maxScale.x = value;
                        break;
                    case PLYValue.MAX_SCALE_Y:
                        currentChunk.maxScale.y = value;
                        break;
                    case PLYValue.MAX_SCALE_Z:
                        currentChunk.maxScale.z = value;
                        break;
                    case PLYValue.MIN_COLOR_R:
                        currentChunk.minColor.x = value;
                        break;
                    case PLYValue.MIN_COLOR_G:
                        currentChunk.minColor.y = value;
                        break;
                    case PLYValue.MIN_COLOR_B:
                        currentChunk.minColor.z = value;
                        break;
                    case PLYValue.MAX_COLOR_R:
                        currentChunk.maxColor.x = value;
                        break;
                    case PLYValue.MAX_COLOR_G:
                        currentChunk.maxColor.y = value;
                        break;
                    case PLYValue.MAX_COLOR_B:
                        currentChunk.maxColor.z = value;
                        break;
                }
            }
            offset.value += header.rowChunkLength;
        }
        return compressedChunks;
    }

    private static _GetSplat(header: PLYHeader, index: number, compressedChunks: Array<CompressedPLYChunk> | null, offset: { value: number }): void {
        const q = TmpVectors.Quaternion[0];
        const temp3 = TmpVectors.Vector3[0];

        const rowOutputLength = GaussianSplattingMesh._RowOutputLength;
        const buffer = header.buffer;
        const dataView = header.dataView;
        const position = new Float32Array(buffer, index * rowOutputLength, 3);
        const scale = new Float32Array(buffer, index * rowOutputLength + 12, 3);
        const rgba = new Uint8ClampedArray(buffer, index * rowOutputLength + 24, 4);
        const rot = new Uint8ClampedArray(buffer, index * rowOutputLength + 28, 4);
        let sh = null;
        if (header.shBuffer) {
            sh = new Uint8ClampedArray(header.shBuffer, index * header.shCoefficientCount, header.shCoefficientCount);
        }
        const chunkIndex = index >> 8;
        let r0: number = 255;
        let r1: number = 0;
        let r2: number = 0;
        let r3: number = 0;

        const plySH = [];

        for (let propertyIndex = 0; propertyIndex < header.vertexProperties.length; propertyIndex++) {
            const property = header.vertexProperties[propertyIndex];
            let value;
            switch (property.type) {
                case PLYType.FLOAT:
                    value = dataView.getFloat32(offset.value + property.offset, true);
                    break;
                case PLYType.INT:
                    value = dataView.getInt32(offset.value + property.offset, true);
                    break;
                case PLYType.UINT:
                    value = dataView.getUint32(offset.value + property.offset, true);
                    break;
                case PLYType.DOUBLE:
                    value = dataView.getFloat64(offset.value + property.offset, true);
                    break;
                case PLYType.UCHAR:
                    value = dataView.getUint8(offset.value + property.offset);
                    break;
                default:
                    continue;
            }

            switch (property.value) {
                case PLYValue.PACKED_POSITION:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        unpack111011(value, temp3);
                        position[0] = Scalar.Lerp(compressedChunk.min.x, compressedChunk.max.x, temp3.x);
                        position[1] = -Scalar.Lerp(compressedChunk.min.y, compressedChunk.max.y, temp3.y);
                        position[2] = -Scalar.Lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                    }
                    break;
                case PLYValue.PACKED_ROTATION:
                    {
                        unpackRot(value, q);

                        r0 = q.x;
                        r1 = q.y;
                        r2 = -q.z;
                        r3 = -q.w;
                    }
                    break;
                case PLYValue.PACKED_SCALE:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        unpack111011(value, temp3);
                        scale[0] = Math.exp(Scalar.Lerp(compressedChunk.minScale.x, compressedChunk.maxScale.x, temp3.x));
                        scale[1] = Math.exp(Scalar.Lerp(compressedChunk.minScale.y, compressedChunk.maxScale.y, temp3.y));
                        scale[2] = Math.exp(Scalar.Lerp(compressedChunk.minScale.z, compressedChunk.maxScale.z, temp3.z));
                    }
                    break;
                case PLYValue.PACKED_COLOR:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        unpack8888(value, rgba);
                        rgba[0] = Scalar.Lerp(compressedChunk.minColor.x, compressedChunk.maxColor.x, rgba[0] / 255) * 255;
                        rgba[1] = Scalar.Lerp(compressedChunk.minColor.y, compressedChunk.maxColor.y, rgba[1] / 255) * 255;
                        rgba[2] = Scalar.Lerp(compressedChunk.minColor.z, compressedChunk.maxColor.z, rgba[2] / 255) * 255;
                    }
                    break;
                case PLYValue.X:
                    position[0] = value;
                    break;
                case PLYValue.Y:
                    position[1] = -value;
                    break;
                case PLYValue.Z:
                    position[2] = -value;
                    break;
                case PLYValue.SCALE_0:
                    scale[0] = Math.exp(value);
                    break;
                case PLYValue.SCALE_1:
                    scale[1] = Math.exp(value);
                    break;
                case PLYValue.SCALE_2:
                    scale[2] = Math.exp(value);
                    break;
                case PLYValue.DIFFUSE_RED:
                    rgba[0] = value;
                    break;
                case PLYValue.DIFFUSE_GREEN:
                    rgba[1] = value;
                    break;
                case PLYValue.DIFFUSE_BLUE:
                    rgba[2] = value;
                    break;
                case PLYValue.F_DC_0:
                    rgba[0] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_1:
                    rgba[1] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_2:
                    rgba[2] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_3:
                    rgba[3] = (0.5 + GaussianSplattingMesh._SH_C0 * value) * 255;
                    break;
                case PLYValue.OPACITY:
                    rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                    break;
                case PLYValue.ROT_0:
                    r0 = value;
                    break;
                case PLYValue.ROT_1:
                    r1 = value;
                    break;
                case PLYValue.ROT_2:
                    r2 = -value;
                    break;
                case PLYValue.ROT_3:
                    r3 = -value;
                    break;
            }
            if (sh && property.value >= PLYValue.SH_0 && property.value <= PLYValue.SH_44) {
                const shIndex = property.value - PLYValue.SH_0;
                if (property.type == PLYType.UCHAR && header.chunkCount) {
                    // compressed ply. dataView points to beginning of vertex
                    // could be improved with a direct copy instead of a per SH index computation + copy
                    const compressedValue = dataView.getUint8(
                        header.rowChunkLength * header.chunkCount + header.vertexCount * header.rowVertexLength + index * header.shCoefficientCount + shIndex
                    );
                    // compressed .ply SH import : https://github.com/playcanvas/engine/blob/fda3f0368b45d7381f0b5a1722bd2056128eaebe/src/scene/gsplat/gsplat-compressed-data.js#L88C81-L88C98
                    plySH[shIndex] = (compressedValue * (8 / 255) - 4) * 127.5 + 127.5;
                } else {
                    const clampedValue = Scalar.Clamp(value * 127.5 + 127.5, 0, 255);
                    plySH[shIndex] = clampedValue;
                }
            }
        }

        if (sh) {
            const shDim = header.shDegree == 1 ? 3 : header.shDegree == 2 ? 8 : 15;
            for (let j = 0; j < shDim; j++) {
                sh[j * 3 + 0] = plySH[j];
                sh[j * 3 + 1] = plySH[j + shDim];
                sh[j * 3 + 2] = plySH[j + shDim * 2];
            }
        }

        q.set(r1, r2, r3, r0);
        q.normalize();
        rot[0] = q.w * 128 + 128;
        rot[1] = q.x * 128 + 128;
        rot[2] = q.y * 128 + 128;
        rot[3] = q.z * 128 + 128;
        offset.value += header.rowVertexLength;
    }

    /**
     * Converts a .ply data with SH coefficients splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @param useCoroutine use coroutine and yield
     * @returns the loaded splat buffer and optional array of sh coefficients
     */
    public static *ConvertPLYWithSHToSplat(data: ArrayBuffer, useCoroutine = false) {
        const header = GaussianSplattingMesh.ParseHeader(data);
        if (!header) {
            return { buffer: data };
        }

        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMesh._PlyConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
        }

        let sh = null;
        // make SH texture buffers
        if (header.shDegree && header.shBuffer) {
            const textureCount = Math.ceil(header.shCoefficientCount / 16); // 4 components can be stored per texture, 4 sh per component
            let shIndexRead = 0;
            const ubuf = new Uint8Array(header.shBuffer);

            // sh is an array of uint8array that will be used to create sh textures
            sh = [];

            const splatCount = header.vertexCount;
            const engine = EngineStore.LastCreatedEngine;
            if (engine) {
                const width = engine.getCaps().maxTextureSize;
                const height = Math.ceil(splatCount / width);
                // create array for the number of textures needed.
                for (let textureIndex = 0; textureIndex < textureCount; textureIndex++) {
                    const texture = new Uint8Array(height * width * 4 * 4); // 4 components per texture, 4 sh per component
                    sh.push(texture);
                }

                for (let i = 0; i < splatCount; i++) {
                    for (let shIndexWrite = 0; shIndexWrite < header.shCoefficientCount; shIndexWrite++) {
                        const shValue = ubuf[shIndexRead++];

                        const textureIndex = Math.floor(shIndexWrite / 16);
                        const shArray = sh[textureIndex];

                        const byteIndexInTexture = shIndexWrite % 16; // [0..15]
                        const offsetPerSplat = i * 16; // 16 sh values per texture per splat.
                        shArray[byteIndexInTexture + offsetPerSplat] = shValue;
                    }
                }
            }
        }

        return { buffer: header.buffer, sh: sh };
    }

    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @param useCoroutine use coroutine and yield
     * @returns the loaded splat buffer without SH coefficient, whether ply contains or not SH.
     */
    public static *ConvertPLYToSplat(data: ArrayBuffer, useCoroutine = false) {
        const header = GaussianSplattingMesh.ParseHeader(data);
        if (!header) {
            return data;
        }

        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMesh._PlyConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
        }

        return header.buffer;
    }

    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    public static async ConvertPLYToSplatAsync(data: ArrayBuffer) {
        return runCoroutineAsync(GaussianSplattingMesh.ConvertPLYToSplat(data, true), createYieldingScheduler());
    }

    /**
     * Converts a .ply with SH data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer with SH
     */
    public static async ConvertPLYWithSHToSplatAsync(data: ArrayBuffer) {
        return runCoroutineAsync(GaussianSplattingMesh.ConvertPLYWithSHToSplat(data, true), createYieldingScheduler());
    }
    /**
     * Loads a .splat Gaussian Splatting array buffer asynchronously
     * @param data arraybuffer containing splat file
     * @returns a promise that resolves when the operation is complete
     */

    public loadDataAsync(data: ArrayBuffer): Promise<void> {
        return this.updateDataAsync(data);
    }

    /**
     * Loads a .splat Gaussian or .ply Splatting file asynchronously
     * @param url path to the splat file to load
     * @returns a promise that resolves when the operation is complete
     * @deprecated Please use SceneLoader.ImportMeshAsync instead
     */
    public loadFileAsync(url: string): Promise<void> {
        return Tools.LoadFileAsync(url, true).then(async (plyBuffer) => {
            (GaussianSplattingMesh.ConvertPLYWithSHToSplatAsync(plyBuffer) as any).then((splatsData: PLYConversionBuffers) => {
                this.updateDataAsync(splatsData.buffer, splatsData.sh);
            });
        });
    }

    /**
     * Releases resources associated with this mesh.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     */
    public override dispose(doNotRecurse?: boolean): void {
        this._covariancesATexture?.dispose();
        this._covariancesBTexture?.dispose();
        this._centersTexture?.dispose();
        this._colorsTexture?.dispose();
        if (this._shTextures) {
            for (const shTexture of this._shTextures) {
                shTexture.dispose();
            }
        }

        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        this._shTextures = null;

        this._worker?.terminate();
        this._worker = null;

        super.dispose(doNotRecurse, true);
    }

    private _copyTextures(source: GaussianSplattingMesh): void {
        this._covariancesATexture = source.covariancesATexture?.clone()!;
        this._covariancesBTexture = source.covariancesBTexture?.clone()!;
        this._centersTexture = source.centersTexture?.clone()!;
        this._colorsTexture = source.colorsTexture?.clone()!;
        if (source._shTextures) {
            this._shTextures = [];
            for (const shTexture of this._shTextures) {
                this._shTextures?.push(shTexture.clone()!);
            }
        }
    }

    /**
     * Returns a new Mesh object generated from the current mesh properties.
     * @param name is a string, the name given to the new mesh
     * @returns a new Gaussian Splatting Mesh
     */
    public override clone(name: string = ""): GaussianSplattingMesh {
        const newGS = new GaussianSplattingMesh(name, undefined, this.getScene());
        newGS._copySource(this);
        newGS.makeGeometryUnique();
        newGS._vertexCount = this._vertexCount;
        newGS._copyTextures(this);
        newGS._modelViewMatrix = Matrix.Identity();
        newGS._splatPositions = this._splatPositions;
        newGS._readyToDisplay = false;
        newGS._instanciateWorker();

        const binfo = this.getBoundingInfo();
        newGS.getBoundingInfo().reConstruct(binfo.minimum, binfo.maximum, this.getWorldMatrix());

        newGS.forcedInstanceCount = newGS._vertexCount;
        newGS.setEnabled(true);
        return newGS;
    }

    private static _CreateWorker = function (self: Worker) {
        let vertexCount = 0;
        let positions: Float32Array;
        let depthMix: BigInt64Array;
        let indices: Uint32Array;
        let floatMix: Float32Array;

        self.onmessage = (e: any) => {
            // updated on init
            if (e.data.positions) {
                positions = e.data.positions;
                vertexCount = e.data.vertexCount;
            }
            // udpate on view changed
            else {
                const viewProj = e.data.view;
                if (!positions || !viewProj) {
                    // Sanity check, it shouldn't happen!
                    throw new Error("positions or view is not defined!");
                }

                depthMix = e.data.depthMix;
                indices = new Uint32Array(depthMix.buffer);
                floatMix = new Float32Array(depthMix.buffer);

                // Sort
                for (let j = 0; j < vertexCount; j++) {
                    indices[2 * j] = j;
                }

                let depthFactor = -1;
                if (e.data.useRightHandedSystem) {
                    depthFactor = 1;
                }

                for (let j = 0; j < vertexCount; j++) {
                    floatMix[2 * j + 1] = 10000 + (viewProj[2] * positions[4 * j + 0] + viewProj[6] * positions[4 * j + 1] + viewProj[10] * positions[4 * j + 2]) * depthFactor;
                }

                depthMix.sort();

                self.postMessage({ depthMix }, [depthMix.buffer]);
            }
        };
    };

    private _makeSplat(
        index: number,
        fBuffer: Float32Array,
        uBuffer: Uint8Array,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        minimum: Vector3,
        maximum: Vector3
    ): void {
        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;

        const x = fBuffer[8 * index + 0];
        const y = -fBuffer[8 * index + 1];
        const z = fBuffer[8 * index + 2];

        this._splatPositions![4 * index + 0] = x;
        this._splatPositions![4 * index + 1] = y;
        this._splatPositions![4 * index + 2] = z;

        minimum.minimizeInPlaceFromFloats(x, y, z);
        maximum.maximizeInPlaceFromFloats(x, y, z);

        quaternion.set(
            (uBuffer[32 * index + 28 + 1] - 127.5) / 127.5,
            (uBuffer[32 * index + 28 + 2] - 127.5) / 127.5,
            (uBuffer[32 * index + 28 + 3] - 127.5) / 127.5,
            -(uBuffer[32 * index + 28 + 0] - 127.5) / 127.5
        );
        quaternion.toRotationMatrix(matrixRotation);

        Matrix.ScalingToRef(fBuffer[8 * index + 3 + 0] * 2, fBuffer[8 * index + 3 + 1] * 2, fBuffer[8 * index + 3 + 2] * 2, matrixScale);

        const M = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;

        const covariances = this._tmpCovariances;
        covariances[0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
        covariances[1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
        covariances[2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
        covariances[3] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
        covariances[4] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
        covariances[5] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];

        // normalize covA, covB
        let factor = -10000;
        for (let covIndex = 0; covIndex < 6; covIndex++) {
            factor = Math.max(factor, Math.abs(covariances[covIndex]));
        }

        this._splatPositions![4 * index + 3] = factor;
        const transform = factor;

        covA[index * 4 + 0] = ToHalfFloat(covariances[0] / transform);
        covA[index * 4 + 1] = ToHalfFloat(covariances[1] / transform);
        covA[index * 4 + 2] = ToHalfFloat(covariances[2] / transform);
        covA[index * 4 + 3] = ToHalfFloat(covariances[3] / transform);
        covB[index * covBSItemSize + 0] = ToHalfFloat(covariances[4] / transform);
        covB[index * covBSItemSize + 1] = ToHalfFloat(covariances[5] / transform);

        // colors
        colorArray[index * 4 + 0] = uBuffer[32 * index + 24 + 0];
        colorArray[index * 4 + 1] = uBuffer[32 * index + 24 + 1];
        colorArray[index * 4 + 2] = uBuffer[32 * index + 24 + 2];
        colorArray[index * 4 + 3] = uBuffer[32 * index + 24 + 3];
    }

    private _updateTextures(covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array, sh?: Uint8Array[]): void {
        const textureSize = this._getTextureSize(this._vertexCount);
        // Update the textures
        const createTextureFromData = (data: Float32Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
        };

        const createTextureFromDataU8 = (data: Uint8Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE);
        };

        const createTextureFromDataU32 = (data: Uint32Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_INTEGER);
        };

        const createTextureFromDataF16 = (data: Uint16Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_HALF_FLOAT);
        };

        if (this._covariancesATexture) {
            this._delayedTextureUpdate = { covA: covA, covB: covB, colors: colorArray, centers: this._splatPositions!, sh: sh };
            const positions = Float32Array.from(this._splatPositions!);
            const vertexCount = this._vertexCount;
            this._worker!.postMessage({ positions, vertexCount }, [positions.buffer]);

            this._postToWorker(true);
        } else {
            this._covariancesATexture = createTextureFromDataF16(covA, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            this._covariancesBTexture = createTextureFromDataF16(
                covB,
                textureSize.x,
                textureSize.y,
                this._useRGBACovariants ? Constants.TEXTUREFORMAT_RGBA : Constants.TEXTUREFORMAT_RG
            );
            this._centersTexture = createTextureFromData(this._splatPositions!, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            this._colorsTexture = createTextureFromDataU8(colorArray, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            if (sh) {
                this._shTextures = [];
                for (const shData of sh) {
                    const buffer = new Uint32Array(shData.buffer);
                    const shTexture = createTextureFromDataU32(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA_INTEGER);
                    shTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                    shTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                    this._shTextures!.push(shTexture);
                }
            }
            this._instanciateWorker();
        }
    }

    private *_updateData(data: ArrayBuffer, isAsync: boolean, sh?: Uint8Array[]): Coroutine<void> {
        // if a covariance texture is present, then it's not a creation but an update
        if (!this._covariancesATexture) {
            this._readyToDisplay = false;
        }

        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        if (this._keepInRam) {
            this._splatsData = data;
            if (sh) {
                this._sh = sh;
            }
        }

        const vertexCount = uBuffer.length / GaussianSplattingMesh._RowOutputLength;
        if (vertexCount != this._vertexCount) {
            this._updateSplatIndexBuffer(vertexCount);
        }
        this._vertexCount = vertexCount;
        // degree == 1 for 1 texture (3 terms), 2 for 2 textures(8 terms) and 3 for 3 textures (15 terms)
        this._shDegree = sh ? sh.length : 0;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;
        const lineCountUpdate = GaussianSplattingMesh.ProgressiveUpdateAmount ?? textureSize.y;
        const textureLengthPerUpdate = textureSize.x * lineCountUpdate;

        this._splatPositions = new Float32Array(4 * textureLength);
        const covA = new Uint16Array(textureLength * 4);
        const covB = new Uint16Array((this._useRGBACovariants ? 4 : 2) * textureLength);
        const colorArray = new Uint8Array(textureLength * 4);

        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        if (GaussianSplattingMesh.ProgressiveUpdateAmount) {
            // create textures with not filled-yet array, then update directly portions of it
            this._updateTextures(covA, covB, colorArray, sh);
            this.setEnabled(true);

            const partCount = Math.ceil(textureSize.y / lineCountUpdate);
            for (let partIndex = 0; partIndex < partCount; partIndex++) {
                const updateLine = partIndex * lineCountUpdate;
                const splatIndexBase = updateLine * textureSize.x;
                for (let i = 0; i < textureLengthPerUpdate; i++) {
                    this._makeSplat(splatIndexBase + i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum);
                }
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, updateLine, Math.min(lineCountUpdate, textureSize.y - updateLine));
                // Update the binfo
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                if (isAsync) {
                    yield;
                }
            }

            // sort will be dirty here as just finished filled positions will not be sorted
            const positions = Float32Array.from(this._splatPositions!);
            const vertexCount = this._vertexCount;
            this._worker!.postMessage({ positions, vertexCount }, [positions.buffer]);
            this._sortIsDirty = true;
        } else {
            for (let i = 0; i < vertexCount; i++) {
                this._makeSplat(i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum);
                if (isAsync && i % GaussianSplattingMesh._SplatBatchSize === 0) {
                    yield;
                }
            }
            // textures
            this._updateTextures(covA, covB, colorArray, sh);
            // Update the binfo
            this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
            this.setEnabled(true);
        }
        this._postToWorker(true);
    }

    /**
     * Update asynchronously the buffer
     * @param data array buffer containing center, color, orientation and scale of splats
     * @param sh optional array of uint8 array for SH data
     * @returns a promise
     */
    public async updateDataAsync(data: ArrayBuffer, sh?: Uint8Array[]): Promise<void> {
        return runCoroutineAsync(this._updateData(data, true, sh), createYieldingScheduler());
    }

    /**
     * @experimental
     * Update data from GS (position, orientation, color, scaling)
     * @param data array that contain all the datas
     * @param sh optional array of uint8 array for SH data
     */
    public updateData(data: ArrayBuffer, sh?: Uint8Array[]): void {
        runCoroutineSync(this._updateData(data, false, sh));
    }

    /**
     * Refreshes the bounding info, taking into account all the thin instances defined
     * @returns the current Gaussian Splatting
     */
    public override refreshBoundingInfo(): Mesh {
        this.thinInstanceRefreshBoundingInfo(false);
        return this;
    }

    // in case size is different
    private _updateSplatIndexBuffer(vertexCount: number): void {
        if (!this._splatIndex || vertexCount > this._splatIndex.length) {
            this._splatIndex = new Float32Array(vertexCount);

            this.thinInstanceSetBuffer("splatIndex", this._splatIndex, 1, false);
        }
        this.forcedInstanceCount = vertexCount;
    }

    private _updateSubTextures(centers: Float32Array, covA: Uint16Array, covB: Uint16Array, colors: Uint8Array, lineStart: number, lineCount: number, sh?: Uint8Array[]): void {
        const updateTextureFromData = (texture: BaseTexture, data: ArrayBufferView, width: number, lineStart: number, lineCount: number) => {
            (this.getEngine() as ThinEngine).updateTextureData(texture.getInternalTexture()!, data, 0, lineStart, width, lineCount, 0, 0, false);
        };

        const textureSize = this._getTextureSize(this._vertexCount);
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        const texelStart = lineStart * textureSize.x;
        const texelCount = lineCount * textureSize.x;
        const covAView = new Uint16Array(covA.buffer, texelStart * 4 * Uint16Array.BYTES_PER_ELEMENT, texelCount * 4);
        const covBView = new Uint16Array(covB.buffer, texelStart * covBSItemSize * Uint16Array.BYTES_PER_ELEMENT, texelCount * covBSItemSize);
        const colorsView = new Uint8Array(colors.buffer, texelStart * 4, texelCount * 4);
        const centersView = new Float32Array(centers.buffer, texelStart * 4 * Float32Array.BYTES_PER_ELEMENT, texelCount * 4);
        updateTextureFromData(this._covariancesATexture!, covAView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._covariancesBTexture!, covBView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._centersTexture!, centersView, textureSize.x, lineStart, lineCount);
        updateTextureFromData(this._colorsTexture!, colorsView, textureSize.x, lineStart, lineCount);
        if (sh) {
            for (let i = 0; i < sh.length; i++) {
                const componentCount = 4;
                const shView = new Uint8Array(this._sh![i].buffer, texelStart * componentCount, texelCount * componentCount);
                updateTextureFromData(this._shTextures![i], shView, textureSize.x, lineStart, lineCount);
            }
        }
    }
    private _instanciateWorker(): void {
        if (!this._vertexCount) {
            return;
        }
        this._updateSplatIndexBuffer(this._vertexCount);

        // Start the worker thread
        this._worker?.terminate();
        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplattingMesh._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        this._depthMix = new BigInt64Array(this._vertexCount);
        const positions = Float32Array.from(this._splatPositions!);
        const vertexCount = this._vertexCount;

        this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);

        this._worker.onmessage = (e) => {
            this._depthMix = e.data.depthMix;
            const indexMix = new Uint32Array(e.data.depthMix.buffer);
            if (this._splatIndex) {
                for (let j = 0; j < this._vertexCount; j++) {
                    this._splatIndex[j] = indexMix[2 * j];
                }
            }
            if (this._delayedTextureUpdate) {
                const textureSize = this._getTextureSize(vertexCount);
                this._updateSubTextures(
                    this._delayedTextureUpdate.centers,
                    this._delayedTextureUpdate.covA,
                    this._delayedTextureUpdate.covB,
                    this._delayedTextureUpdate.colors,
                    0,
                    textureSize.y,
                    this._delayedTextureUpdate.sh
                );
                this._delayedTextureUpdate = null;
            }
            this.thinInstanceBufferUpdated("splatIndex");
            this._canPostToWorker = true;
            this._readyToDisplay = true;
            // sort is dirty when GS is visible for progressive update with a this message arriving but positions were partially filled
            // another update needs to be kicked. The kick can't happen just when the position buffer is ready because _canPostToWorker might be false.
            if (this._sortIsDirty) {
                this._postToWorker(true);
                this._sortIsDirty = false;
            }
        };
    }

    private _getTextureSize(length: number): Vector2 {
        const engine = this._scene.getEngine();
        const width = engine.getCaps().maxTextureSize;

        let height = 1;

        if (engine.version === 1 && !engine.isWebGPU) {
            while (width * height < length) {
                height *= 2;
            }
        } else {
            height = Math.ceil(length / width);
        }

        if (height > width) {
            Logger.Error("GaussianSplatting texture size: (" + width + ", " + height + "), maxTextureSize: " + width);
            height = width;
        }

        return new Vector2(width, height);
    }
}
