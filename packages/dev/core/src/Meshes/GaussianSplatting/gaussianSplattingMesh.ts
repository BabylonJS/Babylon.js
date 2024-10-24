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

interface DelayedTextureUpdate {
    covA: Uint16Array;
    covB: Uint16Array;
    colors: Uint8Array;
    centers: Float32Array;
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
}

const enum PLYType {
    FLOAT,
    INT,
    UINT,
    DOUBLE,
    UCHAR,
    UNDEFINED,
}

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

    UNDEFINED,
}

// @internal
type PlyProperty = {
    value: PLYValue;
    type: PLYType;
    offset: number;
};

// @internal
interface PLYHeader {
    vertexCount: number;
    chunkCount: number;
    rowVertexLength: number;
    rowChunkLength: number;
    vertexProperties: PlyProperty[];
    chunkProperties: PlyProperty[];
    dataView: DataView;
    buffer: ArrayBuffer;
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
    //@ts-expect-error
    private _covariancesA: Nullable<Uint16Array> = null;
    //@ts-expect-error
    private _covariancesB: Nullable<Uint16Array> = null;
    //@ts-expect-error
    private _colors: Nullable<Uint8Array> = null;
    private readonly _keepInRam: boolean = false;

    private _delayedTextureUpdate: Nullable<DelayedTextureUpdate> = null;
    private _oldDirection = new Vector3();
    private _useRGBACovariants = false;
    private _material: Nullable<Material> = null;

    private static _RowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
    private static _SH_C0 = 0.28209479177387814;
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
     * set rendering material
     */
    public override set material(value: Material) {
        this._material = value;
        this._material.backFaceCulling = true;
        this._material.cullBackFaces = false;
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

        vertexData.positions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        vertexData.indices = [0, 1, 2, 0, 2, 3];
        vertexData.applyToMesh(this);

        this.subMeshes = [];
        new SubMesh(0, 0, 4, 0, 6, this);

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

    protected _postToWorker(forced = false): void {
        const frameId = this.getScene().getFrameId();
        if (frameId !== this._frameIdLastUpdate && this._worker && this._scene.activeCamera && this._canPostToWorker) {
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
        }

        return PLYValue.UNDEFINED;
    }
    private static _GetHeader(data: ArrayBuffer): PLYHeader | null {
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
        }
        let chunkMode = ElementMode.Chunk;
        const vertexProperties: PlyProperty[] = [];
        const chunkProperties: PlyProperty[] = [];
        const filtered = header.slice(0, headerEndIndex).split("\n");
        for (const prop of filtered) {
            if (prop.startsWith("property ")) {
                const [, typeName, name] = prop.split(" ");

                const value = GaussianSplattingMesh._ValueNameToEnum(name);
                const type = GaussianSplattingMesh._TypeNameToEnum(typeName);
                if (chunkMode == ElementMode.Chunk) {
                    chunkProperties.push({ value, type, offset: rowChunkOffset });
                    rowChunkOffset += offsets[typeName];
                } else if (chunkMode == ElementMode.Vertex) {
                    vertexProperties.push({ value, type, offset: rowVertexOffset });
                    rowVertexOffset += offsets[typeName];
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
                }
            }
        }

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(GaussianSplattingMesh._RowOutputLength * vertexCount);

        return {
            vertexCount: vertexCount,
            chunkCount: chunkCount,
            rowVertexLength: rowVertexOffset,
            rowChunkLength: rowChunkOffset,
            vertexProperties: vertexProperties,
            chunkProperties: chunkProperties,
            dataView: dataView,
            buffer: buffer,
        };
    }
    private static _GetCompressedChunks(header: PLYHeader, offset: { value: number }): Array<CompressedPLYChunk> | null {
        if (!header.chunkCount) {
            return null;
        }
        const dataView = header.dataView;
        const compressedChunks = new Array<CompressedPLYChunk>(header.chunkCount);
        for (let i = 0; i < header.chunkCount; i++) {
            const currentChunk = { min: new Vector3(), max: new Vector3(), minScale: new Vector3(), maxScale: new Vector3() };
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
        const chunkIndex = index >> 8;
        let r0: number = 255;
        let r1: number = 0;
        let r2: number = 0;
        let r3: number = 0;

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
                        position[2] = Scalar.Lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                    }
                    break;
                case PLYValue.PACKED_ROTATION:
                    {
                        unpackRot(value, q);
                        r0 = q.w;
                        r1 = q.z;
                        r2 = q.y;
                        r3 = q.x;
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
                    unpack8888(value, rgba);
                    break;
                case PLYValue.X:
                    position[0] = value;
                    break;
                case PLYValue.Y:
                    position[1] = value;
                    break;
                case PLYValue.Z:
                    position[2] = value;
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
                    r2 = value;
                    break;
                case PLYValue.ROT_3:
                    r3 = value;
                    break;
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
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    public static ConvertPLYToSplat(data: ArrayBuffer): ArrayBuffer {
        const header = GaussianSplattingMesh._GetHeader(data);
        if (!header) {
            return data;
        }

        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);
        }

        return header.buffer;
    }

    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    public static async ConvertPLYToSplatAsync(data: ArrayBuffer): Promise<ArrayBuffer> {
        return new Promise(async (resolve) => {
            const header = GaussianSplattingMesh._GetHeader(data);
            if (!header) {
                resolve(data);
                return;
            }

            const offset = { value: 0 };
            const compressedChunks = GaussianSplattingMesh._GetCompressedChunks(header, offset);

            for (let i = 0; i < header.vertexCount; i++) {
                GaussianSplattingMesh._GetSplat(header, i, compressedChunks, offset);

                // todo: this number should be part of the loading options
                if (i % 30000 === 0) {
                    Logger.Log("time it");
                    await new Promise((resolve) => setTimeout(resolve, 1));
                }
            }

            resolve(header.buffer);
        });
    }

    /**
     * Loads a .splat Gaussian Splatting array buffer asynchronously
     * @param data arraybuffer containing splat file
     * @returns a promise that resolves when the operation is complete
     */

    public loadDataAsync(data: ArrayBuffer): Promise<void> {
        return Promise.resolve(this._loadData(data));
    }

    /**
     * Loads a .splat Gaussian or .ply Splatting file asynchronously
     * @param url path to the splat file to load
     * @returns a promise that resolves when the operation is complete
     * @deprecated Please use SceneLoader.ImportMeshAsync instead
     */
    public loadFileAsync(url: string): Promise<void> {
        return Tools.LoadFileAsync(url, true).then((data) => {
            this._loadData(GaussianSplattingMesh.ConvertPLYToSplat(data));
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

        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;

        this._worker?.terminate();
        this._worker = null;

        super.dispose(doNotRecurse, true);
    }

    private _copyTextures(source: GaussianSplattingMesh): void {
        this._covariancesATexture = source.covariancesATexture?.clone()!;
        this._covariancesBTexture = source.covariancesBTexture?.clone()!;
        this._centersTexture = source.centersTexture?.clone()!;
        this._colorsTexture = source.colorsTexture?.clone()!;
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

    /**
     * @experimental
     * Update data from GS (position, orientation, color, scaling)
     * @param data array that contain all the datas
     */
    public updateData(data: ArrayBuffer): void {
        if (!data.byteLength) {
            return;
        }

        // if a covariance texture is present, then it's not a creation but an update
        if (!this._covariancesATexture) {
            this._readyToDisplay = false;
        }

        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const vertexCount = uBuffer.length / rowLength;
        if (vertexCount != this._vertexCount) {
            this._updateSplatIndexBuffer(vertexCount);
        }
        this._vertexCount = vertexCount;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;

        this._splatPositions = new Float32Array(4 * textureLength);
        const covA = new Uint16Array(4 * textureLength);
        const covB = new Uint16Array((this._useRGBACovariants ? 4 : 2) * textureLength);

        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];

        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        const covariances = [0, 0, 0, 0, 0, 0];
        const covBSplatSize = this._useRGBACovariants ? 4 : 2;
        for (let i = 0; i < vertexCount; i++) {
            const x = fBuffer[8 * i + 0];
            const y = -fBuffer[8 * i + 1];
            const z = fBuffer[8 * i + 2];

            this._splatPositions[4 * i + 0] = x;
            this._splatPositions[4 * i + 1] = y;
            this._splatPositions[4 * i + 2] = z;

            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);

            quaternion.set(
                (uBuffer[32 * i + 28 + 1] - 128) / 128,
                (uBuffer[32 * i + 28 + 2] - 128) / 128,
                (uBuffer[32 * i + 28 + 3] - 128) / 128,
                -(uBuffer[32 * i + 28 + 0] - 128) / 128
            );
            quaternion.toRotationMatrix(matrixRotation);

            Matrix.ScalingToRef(fBuffer[8 * i + 3 + 0] * 2, fBuffer[8 * i + 3 + 1] * 2, fBuffer[8 * i + 3 + 2] * 2, matrixScale);

            const M = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;

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

            this._splatPositions[4 * i + 3] = factor;
            const transform = factor;

            covA[i * 4 + 0] = ToHalfFloat(covariances[0] / transform);
            covA[i * 4 + 1] = ToHalfFloat(covariances[1] / transform);
            covA[i * 4 + 2] = ToHalfFloat(covariances[2] / transform);
            covA[i * 4 + 3] = ToHalfFloat(covariances[3] / transform);
            covB[i * covBSplatSize + 0] = ToHalfFloat(covariances[4] / transform);
            covB[i * covBSplatSize + 1] = ToHalfFloat(covariances[5] / transform);
        }

        // Update the mesh
        const binfo = this.getBoundingInfo();
        binfo.reConstruct(minimum, maximum, this.getWorldMatrix());

        this.setEnabled(true);

        // Update the material
        const createTextureFromData = (data: Float32Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT);
        };

        const createTextureFromDataU8 = (data: Uint8Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE);
        };

        const createTextureFromDataF16 = (data: Uint16Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_HALF_FLOAT);
        };

        const colorArray = new Uint8Array(textureSize.x * textureSize.y * 4);
        for (let i = 0; i < this._vertexCount; ++i) {
            colorArray[i * 4 + 0] = uBuffer[32 * i + 24 + 0];
            colorArray[i * 4 + 1] = uBuffer[32 * i + 24 + 1];
            colorArray[i * 4 + 2] = uBuffer[32 * i + 24 + 2];
            colorArray[i * 4 + 3] = uBuffer[32 * i + 24 + 3];
        }

        if (this._keepInRam) {
            this._covariancesA = covA;
            this._covariancesB = covB;
            this._colors = colorArray;
        }
        if (this._covariancesATexture) {
            this._delayedTextureUpdate = { covA: covA, covB: covB, colors: colorArray, centers: this._splatPositions };
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
            this._centersTexture = createTextureFromData(this._splatPositions, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            this._colorsTexture = createTextureFromDataU8(colorArray, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA);
            this._instanciateWorker();
        }
    }

    private _loadData(data: ArrayBuffer): void {
        if (!data.byteLength) {
            return;
        }
        this.updateData(data);
    }

    // in case size is different
    private _updateSplatIndexBuffer(vertexCount: number): void {
        if (!this._splatIndex || vertexCount > this._splatIndex.length) {
            this._splatIndex = new Float32Array(vertexCount);

            this.thinInstanceSetBuffer("splatIndex", this._splatIndex, 1, false);
        }
        this.forcedInstanceCount = vertexCount;
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
                const updateTextureFromData = (texture: BaseTexture, data: Float32Array, width: number, height: number) => {
                    (this.getEngine() as ThinEngine).updateTextureData(texture.getInternalTexture()!, data, 0, 0, width, height, 0, 0, false);
                };
                const updateTextureFromDataU8 = (texture: BaseTexture, data: Uint8Array, width: number, height: number) => {
                    (this.getEngine() as ThinEngine).updateTextureData(texture.getInternalTexture()!, data, 0, 0, width, height, 0, 0, false);
                };

                const updateTextureFromDataF16 = (texture: BaseTexture, data: Uint16Array, width: number, height: number) => {
                    (this.getEngine() as ThinEngine).updateTextureData(texture.getInternalTexture()!, data, 0, 0, width, height, 0, 0, false);
                };
                const textureSize = this._getTextureSize(vertexCount);
                updateTextureFromDataF16(this._covariancesATexture!, this._delayedTextureUpdate.covA, textureSize.x, textureSize.y);
                updateTextureFromDataF16(this._covariancesBTexture!, this._delayedTextureUpdate.covB, textureSize.x, textureSize.y);
                updateTextureFromData(this._centersTexture!, this._delayedTextureUpdate.centers, textureSize.x, textureSize.y);
                updateTextureFromDataU8(this._colorsTexture!, this._delayedTextureUpdate.colors, textureSize.x, textureSize.y);
                this._delayedTextureUpdate = null;
            }
            this.thinInstanceBufferUpdated("splatIndex");
            this._canPostToWorker = true;
            this._readyToDisplay = true;
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
