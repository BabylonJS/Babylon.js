import type { Scene } from "core/scene";
import type { DeepImmutable, Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { SubMesh } from "../subMesh";
import type { AbstractMesh } from "../abstractMesh";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Matrix, TmpVectors, Vector2, Vector3 } from "core/Maths/math.vector";
import { Quaternion } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { GaussianSplattingMaterial, GaussianSplattingMaxPartCount } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import "core/Meshes/thinInstanceMesh";
import type { ThinEngine } from "core/Engines/thinEngine";
import { ToHalfFloat } from "core/Misc/textureTools";
import type { Material } from "core/Materials/material";
import { Scalar } from "core/Maths/math.scalar";
import { runCoroutineSync, runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { EngineStore } from "core/Engines/engineStore";
import { Camera } from "core/Cameras/camera";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import type { INative } from "core/Engines/Native/nativeInterfaces";
import { GaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const _native: INative;

const IsNative = typeof _native !== "undefined";
const Native = IsNative ? _native : null;
interface IDelayedTextureUpdate {
    covA: Uint16Array;
    covB: Uint16Array;
    colors: Uint8Array;
    centers: Float32Array;
    sh?: Uint8Array[];
    partIndices?: Uint8Array;
}
interface IUpdateOptions {
    flipY?: boolean;
}

// @internal
const UnpackUnorm = (value: number, bits: number) => {
    const t = (1 << bits) - 1;
    return (value & t) / t;
};

// @internal
const Unpack111011 = (value: number, result: Vector3) => {
    result.x = UnpackUnorm(value >>> 21, 11);
    result.y = UnpackUnorm(value >>> 11, 10);
    result.z = UnpackUnorm(value, 11);
};

// @internal
const Unpack8888 = (value: number, result: Uint8ClampedArray) => {
    result[0] = UnpackUnorm(value >>> 24, 8) * 255;
    result[1] = UnpackUnorm(value >>> 16, 8) * 255;
    result[2] = UnpackUnorm(value >>> 8, 8) * 255;
    result[3] = UnpackUnorm(value, 8) * 255;
};

// @internal
// unpack quaternion with 2,10,10,10 format (largest element, 3x10bit element)
const UnpackRot = (value: number, result: Quaternion) => {
    const norm = 1.0 / (Math.sqrt(2) * 0.5);
    const a = (UnpackUnorm(value >>> 20, 10) - 0.5) * norm;
    const b = (UnpackUnorm(value >>> 10, 10) - 0.5) * norm;
    const c = (UnpackUnorm(value, 10) - 0.5) * norm;
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

interface ICompressedPLYChunk {
    min: Vector3;
    max: Vector3;
    minScale: Vector3;
    maxScale: Vector3;
    minColor: Vector3;
    maxColor: Vector3;
}

/**
 * To support multiple camera rendering, rendered mesh is separated from the GaussianSplattingMesh itself.
 * The GS mesh serves as a proxy and a different mesh is rendered for each camera. This hot switch is done
 * in the render() function. Each camera has a corresponding ICameraViewInfo object. The key is the camera unique id.
 * ICameraViewInfo and the rendered mesh are created in method `_postToWorker`
 * Mesh are disabled to not let the scene render them directly.
 * ICameraViewInfo are sorted per last frame id update to prioritize the less recently updated ones.
 * There is 1 web worker per GaussianSplattingMesh to avoid too many copies between main thread and workers.
 * So, only one sort is being done at a time per GaussianSplattingMesh. If multiple cameras need an update,
 * they will be processed one by one in subsequent frames.
 */
interface ICameraViewInfo {
    camera: Camera;
    cameraDirection: Vector3;
    mesh: Mesh;
    frameIdLastUpdate: number;
    splatIndexBufferSet: boolean;
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
// eslint-disable-next-line @typescript-eslint/naming-convention
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
    private _modelViewProjectionMatrix = Matrix.Identity();
    private _viewProjectionMatrix = Matrix.Identity();
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
    private _shData: Nullable<Uint8Array[]> = null;
    private _partIndicesTexture: Nullable<BaseTexture> = null;
    private _partIndices: Nullable<Uint8Array> = null;
    private _partMatrices: Matrix[] = [];
    private _partVisibility: number[] = [];
    private _partProxies: Map<number, GaussianSplattingPartProxyMesh> = new Map();
    private _textureSize: Vector2 = new Vector2(0, 0);
    private readonly _keepInRam: boolean = false;

    private _delayedTextureUpdate: Nullable<IDelayedTextureUpdate> = null;
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

    private static readonly _BatchSize = 16; // 16 splats per instance
    private _cameraViewInfos = new Map<number, ICameraViewInfo>();

    private static readonly _DefaultViewUpdateThreshold = 1e-4;

    /**
     * Cosine value of the angle threshold to update view dependent splat sorting. Default is 0.0001.
     */
    public viewUpdateThreshold: number = GaussianSplattingMesh._DefaultViewUpdateThreshold;

    protected _disableDepthSort = false;
    /**
     * If true, disables depth sorting of the splats (default: false)
     */
    public get disableDepthSort() {
        return this._disableDepthSort;
    }
    public set disableDepthSort(value: boolean) {
        if (!this._disableDepthSort && value) {
            this._worker?.terminate();
            this._worker = null;
            this._disableDepthSort = true;
        } else if (this._disableDepthSort && !value) {
            this._disableDepthSort = false;
            this._sortIsDirty = true;
            this._instanciateWorker();
        }
    }

    /**
     * View direction factor used to compute the SH view direction in the shader.
     * @deprecated Not used anymore for SH rendering
     */
    public get viewDirectionFactor() {
        return Vector3.OneReadOnly;
    }

    /**
     * SH degree. 0 = no sh (default). 1 = 3 parameters. 2 = 8 parameters. 3 = 15 parameters.
     */
    public get shDegree() {
        return this._shDegree;
    }

    /**
     * Number of splats in the mesh
     */
    public get splatCount() {
        return this._splatIndex?.length;
    }

    /**
     * returns the splats data array buffer that contains in order : postions (3 floats), size (3 floats), color (4 bytes), orientation quaternion (4 bytes)
     */
    public get splatsData() {
        return this._splatsData;
    }

    /**
     * returns the SH data arrays
     */
    public get shData() {
        return this._shData;
    }

    /**
     * True when this mesh is a compound that regroups multiple Gaussian splatting parts.
     */
    public get isCompound() {
        return this._partMatrices.length > 0;
    }

    /**
     * returns the part indices array
     */
    public get partIndices() {
        return this._partIndices;
    }

    /**
     * Gets the part indices texture, if the mesh is a compound
     */
    public get partIndicesTexture() {
        return this._partIndicesTexture;
    }

    /**
     * Gets the part visibility array, if the mesh is a compound
     */
    public get partVisibility() {
        return this._partVisibility;
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
     * Gets the kernel size
     * Documentation and mathematical explanations here:
     * https://github.com/graphdeco-inria/gaussian-splatting/issues/294#issuecomment-1772688093
     * https://github.com/autonomousvision/mip-splatting/issues/18#issuecomment-1929388931
     */
    public get kernelSize() {
        return this._material instanceof GaussianSplattingMaterial ? this._material.kernelSize : 0;
    }

    /**
     * Get the compensation state
     */
    public get compensation() {
        return this._material instanceof GaussianSplattingMaterial ? this._material.compensation : false;
    }

    private _loadingPromise: Promise<void> | null = null;

    /**
     * set rendering material
     */
    public override set material(value: Material) {
        this._material = value;
        this._material.backFaceCulling = false;
        this._material.cullBackFaces = false;
        value.resetDrawCache();
    }

    /**
     * get rendering material
     */
    public override get material(): Nullable<Material> {
        return this._material;
    }

    private static _MakeSplatGeometryForMesh(mesh: Mesh): void {
        const vertexData = new VertexData();
        const originPositions = [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0];
        const originIndices = [0, 1, 2, 0, 2, 3];
        const positions = [];
        const indices = [];
        for (let i = 0; i < GaussianSplattingMesh._BatchSize; i++) {
            for (let j = 0; j < 12; j++) {
                if (j == 2 || j == 5 || j == 8 || j == 11) {
                    positions.push(i); // local splat index
                } else {
                    positions.push(originPositions[j]);
                }
            }
            indices.push(originIndices.map((v) => v + i * 4));
        }

        vertexData.positions = positions;
        vertexData.indices = indices.flat();

        vertexData.applyToMesh(mesh);
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

        this.subMeshes = [];
        new SubMesh(0, 0, 4 * GaussianSplattingMesh._BatchSize, 0, 6 * GaussianSplattingMesh._BatchSize, this);

        this.setEnabled(false);
        // webGL2 and webGPU support for RG texture with float16 is fine. not webGL1
        this._useRGBACovariants = !this.getEngine().isWebGPU && this.getEngine().version === 1.0;

        this._keepInRam = keepInRam;
        if (url) {
            this._loadingPromise = this.loadFileAsync(url);
        }
        const gaussianSplattingMaterial = new GaussianSplattingMaterial(this.name + "_material", this._scene);
        gaussianSplattingMaterial.setSourceMesh(this);
        this._material = gaussianSplattingMaterial;

        // delete meshes created for cameras on camera removal
        this._scene.onCameraRemovedObservable.add((camera: Camera) => {
            const cameraId = camera.uniqueId;
            // delete mesh for this camera
            if (this._cameraViewInfos.has(cameraId)) {
                const cameraViewInfos = this._cameraViewInfos.get(cameraId);
                cameraViewInfos?.mesh.dispose();
                this._cameraViewInfos.delete(cameraId);
            }
        });
    }

    /**
     * Get the loading promise when loading the mesh from a URL in the constructor
     * @returns constructor loading promise or null if no URL was provided
     */
    public getLoadingPromise(): Promise<void> | null {
        return this._loadingPromise;
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

    public _getCameraDirection(camera: Camera): Vector3 {
        const cameraViewMatrix = camera.getViewMatrix();
        const cameraProjectionMatrix = camera.getProjectionMatrix();
        const cameraViewProjectionMatrix = TmpVectors.Matrix[0];
        cameraViewMatrix.multiplyToRef(cameraProjectionMatrix, cameraViewProjectionMatrix);
        this._viewProjectionMatrix.copyFrom(cameraViewProjectionMatrix);

        const modelViewMatrix = TmpVectors.Matrix[1];
        this.getWorldMatrix().multiplyToRef(cameraViewMatrix, modelViewMatrix);
        modelViewMatrix.multiplyToRef(cameraProjectionMatrix, this._modelViewProjectionMatrix);

        // return vector used to compute distance to camera
        const localDirection = TmpVectors.Vector3[1];
        localDirection.set(modelViewMatrix.m[2], modelViewMatrix.m[6], modelViewMatrix.m[10]);
        localDirection.normalize();

        return localDirection;
    }

    /** @internal */
    public _postToWorker(forced = false): void {
        const scene = this._scene;
        const frameId = scene.getFrameId();
        // force update or at least frame update for camera is outdated
        let outdated = false;
        this._cameraViewInfos.forEach((cameraViewInfos) => {
            if (cameraViewInfos.frameIdLastUpdate !== frameId) {
                outdated = true;
            }
        });

        // array of cameras used for rendering
        const cameras = this._scene.activeCameras?.length ? this._scene.activeCameras : [this._scene.activeCamera!];
        // list view infos for active cameras
        const activeViewInfos: ICameraViewInfo[] = [];
        cameras.forEach((camera) => {
            if (!camera) {
                return;
            }
            const cameraId = camera.uniqueId;

            const cameraViewInfos = this._cameraViewInfos.get(cameraId);
            if (cameraViewInfos) {
                activeViewInfos.push(cameraViewInfos);
            } else {
                // mesh doesn't exist yet for this camera
                const cameraMesh = new Mesh(this.name + "_cameraMesh_" + cameraId, this._scene);
                // not visible with inspector or the scene graph
                cameraMesh.reservedDataStore = { hidden: true };
                cameraMesh.setEnabled(false);
                cameraMesh.material = this.material;
                GaussianSplattingMesh._MakeSplatGeometryForMesh(cameraMesh);

                const newViewInfos: ICameraViewInfo = {
                    camera: camera,
                    cameraDirection: new Vector3(0, 0, 0),
                    mesh: cameraMesh,
                    frameIdLastUpdate: frameId,
                    splatIndexBufferSet: false,
                };
                activeViewInfos.push(newViewInfos);
                this._cameraViewInfos.set(cameraId, newViewInfos);
            }
        });
        // sort view infos by last updated frame id: first item is the least recently updated
        activeViewInfos.sort((a, b) => a.frameIdLastUpdate - b.frameIdLastUpdate);

        const hasSortFunction = this._worker || Native?.sortSplats || this._disableDepthSort;
        if ((forced || outdated) && hasSortFunction && (this._scene.activeCameras?.length || this._scene.activeCamera) && this._canPostToWorker) {
            // view infos sorted by least recent updated frame id
            activeViewInfos.forEach((cameraViewInfos) => {
                const camera = cameraViewInfos.camera;
                const cameraDirection = this._getCameraDirection(camera);

                const previousCameraDirection = cameraViewInfos.cameraDirection;
                const dot = Vector3.Dot(cameraDirection, previousCameraDirection);
                if ((forced || Math.abs(dot - 1) >= this.viewUpdateThreshold) && this._canPostToWorker) {
                    cameraViewInfos.cameraDirection.copyFrom(cameraDirection);
                    cameraViewInfos.frameIdLastUpdate = frameId;
                    this._canPostToWorker = false;
                    if (this._worker) {
                        this._worker.postMessage(
                            {
                                modelViewProjection: this._modelViewProjectionMatrix.m,
                                viewProjection: this._viewProjectionMatrix.m,
                                depthMix: this._depthMix,
                                cameraId: camera.uniqueId,
                                depthScale: camera.mode === Camera.ORTHOGRAPHIC_CAMERA ? (camera.maxZ - camera.minZ) / 2.0 : 1.0,
                            },
                            [this._depthMix.buffer]
                        );
                    } else if (Native?.sortSplats) {
                        Native.sortSplats(this._modelViewProjectionMatrix, this._splatPositions!, this._splatIndex!, this._scene.useRightHandedSystem);
                        if (cameraViewInfos.splatIndexBufferSet) {
                            cameraViewInfos.mesh.thinInstanceBufferUpdated("splatIndex");
                        } else {
                            cameraViewInfos.mesh.thinInstanceSetBuffer("splatIndex", this._splatIndex, 16, false);
                            cameraViewInfos.splatIndexBufferSet = true;
                        }
                        this._canPostToWorker = true;
                        this._readyToDisplay = true;
                    }
                }
            });
        } else if (this._disableDepthSort) {
            activeViewInfos.forEach((cameraViewInfos) => {
                if (!cameraViewInfos.splatIndexBufferSet) {
                    cameraViewInfos.mesh.thinInstanceSetBuffer("splatIndex", this._splatIndex, 16, false);
                    cameraViewInfos.splatIndexBufferSet = true;
                }
            });
            this._canPostToWorker = true;
            this._readyToDisplay = true;
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

        // geometry used for shadows, bind the first found in the camera view infos
        if (!this._geometry && this._cameraViewInfos.size) {
            this._geometry = this._cameraViewInfos.values().next().value.mesh.geometry;
        }

        const cameraId = this._scene.activeCamera!.uniqueId;
        const cameraViewInfos = this._cameraViewInfos.get(cameraId);
        if (!cameraViewInfos || !cameraViewInfos.splatIndexBufferSet) {
            return this;
        }

        if (this.onBeforeRenderObservable) {
            this.onBeforeRenderObservable.notifyObservers(this);
        }
        const mesh = cameraViewInfos.mesh;
        mesh.getWorldMatrix().copyFrom(this.getWorldMatrix());
        const ret = mesh.render(subMesh, enableAlphaMode, effectiveMeshReplacement);

        if (this.onAfterRenderObservable) {
            this.onAfterRenderObservable.notifyObservers(this);
        }
        return ret;
    }

    private static _TypeNameToEnum(name: string): PLYType {
        switch (name) {
            case "float":
                return PLYType.FLOAT;
            case "int":
                return PLYType.INT;
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
            Unused = 3,
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
                if (value != PLYValue.UNDEFINED) {
                    // SH degree 1,2 or 3 for 9, 24 or 45 values
                    if (value >= PLYValue.SH_44) {
                        shDegree = 3;
                    } else if (value >= PLYValue.SH_24) {
                        shDegree = Math.max(shDegree, 2);
                    } else if (value >= PLYValue.SH_8) {
                        shDegree = Math.max(shDegree, 1);
                    }
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
                } else {
                    chunkMode = ElementMode.Unused;
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
    private static _GetCompressedChunks(header: PLYHeader, offset: { value: number }): Array<ICompressedPLYChunk> | null {
        if (!header.chunkCount) {
            return null;
        }
        const dataView = header.dataView;
        const compressedChunks = new Array<ICompressedPLYChunk>(header.chunkCount);
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

    private static _GetSplat(header: PLYHeader, index: number, compressedChunks: Array<ICompressedPLYChunk> | null, offset: { value: number }): void {
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
                        Unpack111011(value, temp3);
                        position[0] = Scalar.Lerp(compressedChunk.min.x, compressedChunk.max.x, temp3.x);
                        position[1] = Scalar.Lerp(compressedChunk.min.y, compressedChunk.max.y, temp3.y);
                        position[2] = Scalar.Lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                    }
                    break;
                case PLYValue.PACKED_ROTATION:
                    {
                        UnpackRot(value, q);

                        r0 = q.x;
                        r1 = q.y;
                        r2 = q.z;
                        r3 = q.w;
                    }
                    break;
                case PLYValue.PACKED_SCALE:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        Unpack111011(value, temp3);
                        scale[0] = Math.exp(Scalar.Lerp(compressedChunk.minScale.x, compressedChunk.maxScale.x, temp3.x));
                        scale[1] = Math.exp(Scalar.Lerp(compressedChunk.minScale.y, compressedChunk.maxScale.y, temp3.y));
                        scale[2] = Math.exp(Scalar.Lerp(compressedChunk.minScale.z, compressedChunk.maxScale.z, temp3.z));
                    }
                    break;
                case PLYValue.PACKED_COLOR:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        Unpack8888(value, rgba);
                        rgba[0] = Scalar.Lerp(compressedChunk.minColor.x, compressedChunk.maxColor.x, rgba[0] / 255) * 255;
                        rgba[1] = Scalar.Lerp(compressedChunk.minColor.y, compressedChunk.maxColor.y, rgba[1] / 255) * 255;
                        rgba[2] = Scalar.Lerp(compressedChunk.minColor.z, compressedChunk.maxColor.z, rgba[2] / 255) * 255;
                    }
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
        rot[0] = q.w * 127.5 + 127.5;
        rot[1] = q.x * 127.5 + 127.5;
        rot[2] = q.y * 127.5 + 127.5;
        rot[3] = q.z * 127.5 + 127.5;
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
        return await runCoroutineAsync(GaussianSplattingMesh.ConvertPLYToSplat(data, true), createYieldingScheduler());
    }

    /**
     * Converts a .ply with SH data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer with SH
     */
    public static async ConvertPLYWithSHToSplatAsync(data: ArrayBuffer) {
        return await runCoroutineAsync(GaussianSplattingMesh.ConvertPLYWithSHToSplat(data, true), createYieldingScheduler());
    }
    /**
     * Loads a .splat Gaussian Splatting array buffer asynchronously
     * @param data arraybuffer containing splat file
     * @returns a promise that resolves when the operation is complete
     */

    public async loadDataAsync(data: ArrayBuffer): Promise<void> {
        return await this.updateDataAsync(data);
    }

    /**
     * Loads a Gaussian or Splatting file asynchronously
     * @param url path to the splat file to load
     * @param scene optional scene it belongs to
     * @returns a promise that resolves when the operation is complete
     * @deprecated Please use SceneLoader.ImportMeshAsync instead
     */
    public async loadFileAsync(url: string, scene?: Scene): Promise<void> {
        await ImportMeshAsync(url, (scene || EngineStore.LastCreatedScene)!, { pluginOptions: { splat: { gaussianSplattingMesh: this } } });
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
        if (this._partIndicesTexture) {
            this._partIndicesTexture.dispose();
        }

        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        this._shTextures = null;
        this._partIndicesTexture = null;
        this._partMatrices = [];

        this._worker?.terminate();
        this._worker = null;

        // delete meshes created for each camera
        this._cameraViewInfos.forEach((cameraViewInfo) => {
            cameraViewInfo.mesh.dispose();
        });

        // dispose all proxy meshes
        this._partProxies.forEach((proxy) => {
            proxy.dispose();
        });
        this._partProxies.clear();

        super.dispose(doNotRecurse, true);
    }

    private _copyTextures(source: GaussianSplattingMesh): void {
        this._covariancesATexture = source.covariancesATexture?.clone()!;
        this._covariancesBTexture = source.covariancesBTexture?.clone()!;
        this._centersTexture = source.centersTexture?.clone()!;
        this._colorsTexture = source.colorsTexture?.clone()!;
        this._partIndicesTexture = source._partIndicesTexture?.clone()!;
        if (source._shTextures) {
            this._shTextures = [];
            for (const shTexture of source._shTextures) {
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
        newGS._modelViewProjectionMatrix = Matrix.Identity();
        newGS._viewProjectionMatrix = Matrix.Identity();
        newGS._splatPositions = this._splatPositions;
        newGS._readyToDisplay = false;
        newGS._disableDepthSort = this._disableDepthSort;
        newGS._partMatrices = this._partMatrices.map((m) => m.clone());
        newGS._instanciateWorker();

        const binfo = this.getBoundingInfo();
        newGS.getBoundingInfo().reConstruct(binfo.minimum, binfo.maximum, this.getWorldMatrix());

        newGS.forcedInstanceCount = this.forcedInstanceCount;
        newGS.setEnabled(true);
        return newGS;
    }

    private static _CreateWorker = function (self: Worker) {
        let positions: Float32Array;
        let depthMix: BigInt64Array;
        let indices: Uint32Array;
        let floatMix: Float32Array;
        let partIndices: Uint8Array;
        let partMatrices: Float32Array[];

        function multiplyMatrices(matrix1: Float32Array, matrix2: Float32Array): Float32Array {
            const result = new Float32Array(16);
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    for (let k = 0; k < 4; k++) {
                        result[j * 4 + i] += matrix1[k * 4 + i] * matrix2[j * 4 + k];
                    }
                }
            }
            return result;
        }

        self.onmessage = (e: any) => {
            // updated on init
            if (e.data.positions) {
                positions = e.data.positions;
            }
            // update on rig node changed
            else if (e.data.partMatrices) {
                partMatrices = e.data.partMatrices;
            }
            // update on rig node indices changed
            else if (e.data.partIndices !== undefined) {
                partIndices = e.data.partIndices;
            }
            // update on view changed
            else {
                const cameraId = e.data.cameraId;
                const globalModelViewProjection = e.data.modelViewProjection;
                const viewProjection = e.data.viewProjection;

                const vertexCountPadded = (positions.length / 4 + 15) & ~0xf;
                if (!positions || !globalModelViewProjection) {
                    // Sanity check, it shouldn't happen!
                    throw new Error("positions or modelViewProjection matrix is not defined!");
                }

                depthMix = e.data.depthMix;
                indices = new Uint32Array(depthMix.buffer);
                floatMix = new Float32Array(depthMix.buffer);

                // Sort
                for (let j = 0; j < vertexCountPadded; j++) {
                    indices[2 * j] = j;
                }

                const depthScale = e.data.depthScale;

                if (partMatrices && partIndices) {
                    // If there are rig node matrices, we use them instead of the global model view proj

                    // Precompute modelViewProj for each rig node
                    const modelViewProjs = partMatrices.map((model) => multiplyMatrices(viewProjection, model));

                    // NB: For performance reasons, we assume that part indices are valid
                    const length = partIndices.length;
                    for (let j = 0; j < vertexCountPadded; j++) {
                        // NB: We need this 'min' because vertex array is padded, not partIndices
                        const partIndex = partIndices[Math.min(j, length - 1)];
                        const mvp = modelViewProjs[partIndex];
                        floatMix[2 * j + 1] = 10000 - (mvp[2] * positions[4 * j + 0] + mvp[6] * positions[4 * j + 1] + mvp[10] * positions[4 * j + 2] + mvp[14]) * depthScale;
                    }
                } else {
                    // If there are no rig node matrices, we use the global model view proj
                    const mvp = globalModelViewProjection;
                    for (let j = 0; j < vertexCountPadded; j++) {
                        floatMix[2 * j + 1] = 10000 - (mvp[2] * positions[4 * j + 0] + mvp[6] * positions[4 * j + 1] + mvp[10] * positions[4 * j + 2] + mvp[14]) * depthScale;
                    }
                }

                depthMix.sort();

                self.postMessage({ depthMix, cameraId }, [depthMix.buffer]);
            }
        };
    };

    private _makeEmptySplat(index: number, covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array): void {
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        this._splatPositions![4 * index + 0] = 0;
        this._splatPositions![4 * index + 1] = 0;
        this._splatPositions![4 * index + 2] = 0;

        covA[index * 4 + 0] = ToHalfFloat(0);
        covA[index * 4 + 1] = ToHalfFloat(0);
        covA[index * 4 + 2] = ToHalfFloat(0);
        covA[index * 4 + 3] = ToHalfFloat(0);
        covB[index * covBSItemSize + 0] = ToHalfFloat(0);
        covB[index * covBSItemSize + 1] = ToHalfFloat(0);
        colorArray[index * 4 + 3] = 0;
    }

    private _makeSplat(
        index: number,
        fBuffer: Float32Array,
        uBuffer: Uint8Array,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        minimum: Vector3,
        maximum: Vector3,
        options: IUpdateOptions
    ): void {
        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;

        const x = fBuffer[8 * index + 0];
        const y = fBuffer[8 * index + 1] * (options.flipY ? -1 : 1);
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
        quaternion.normalize();
        quaternion.toRotationMatrix(matrixRotation);

        Matrix.ScalingToRef(fBuffer[8 * index + 3 + 0] * 2, fBuffer[8 * index + 3 + 1] * 2, fBuffer[8 * index + 3 + 2] * 2, matrixScale);

        const m = matrixRotation.multiplyToRef(matrixScale, TmpVectors.Matrix[0]).m;

        const covariances = this._tmpCovariances;
        covariances[0] = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
        covariances[1] = m[0] * m[4] + m[1] * m[5] + m[2] * m[6];
        covariances[2] = m[0] * m[8] + m[1] * m[9] + m[2] * m[10];
        covariances[3] = m[4] * m[4] + m[5] * m[5] + m[6] * m[6];
        covariances[4] = m[4] * m[8] + m[5] * m[9] + m[6] * m[10];
        covariances[5] = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];

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

    // NB: partIndices is assumed to be padded to a round texture size
    private _updateTextures(covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array, sh?: Uint8Array[], partIndices?: Uint8Array): void {
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

        const firstTime = this._covariancesATexture === null;
        const textureSizeChanged = this._textureSize.y != textureSize.y;

        if (!firstTime && !textureSizeChanged) {
            this._delayedTextureUpdate = { covA, covB, colors: colorArray, centers: this._splatPositions!, sh, partIndices };
            const positions = Float32Array.from(this._splatPositions!);
            const vertexCount = this._vertexCount;
            if (this._worker) {
                this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
            }

            // Handle SH textures in update path - create if they don't exist
            if (sh && !this._shTextures) {
                this._shTextures = [];
                for (const shData of sh) {
                    const buffer = new Uint32Array(shData.buffer);
                    const shTexture = createTextureFromDataU32(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RGBA_INTEGER);
                    shTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                    shTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                    this._shTextures!.push(shTexture);
                }
            }

            // Handle compound data, if any
            if (partIndices && !this._partIndicesTexture) {
                const buffer = new Uint8Array(partIndices);
                this._partIndicesTexture = createTextureFromDataU8(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RED);
                this._partIndicesTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                this._partIndicesTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            }
            if (this._worker) {
                this._worker.postMessage({ partIndices: partIndices ?? null });
            }

            this._postToWorker(true);
        } else {
            this._textureSize = textureSize;
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

            if (partIndices) {
                const buffer = new Uint8Array(partIndices);
                this._partIndicesTexture = createTextureFromDataU8(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RED);
                this._partIndicesTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                this._partIndicesTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            }

            if (firstTime) {
                this._instanciateWorker();
            } else {
                if (this._worker) {
                    const positions = Float32Array.from(this._splatPositions!);
                    const vertexCount = this._vertexCount;
                    this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
                    this._worker.postMessage({ partIndices: partIndices ?? null });
                }
                this._postToWorker(true);
            }
        }
    }

    private *_updateData(data: ArrayBuffer, isAsync: boolean, sh?: Uint8Array[], partIndices?: Uint8Array, options: IUpdateOptions = { flipY: false }): Coroutine<void> {
        // if a covariance texture is present, then it's not a creation but an update
        if (!this._covariancesATexture) {
            this._readyToDisplay = false;
        }

        // Parse the data
        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        if (this._keepInRam) {
            this._splatsData = data;
            this._shData = sh ? sh.map((arr) => new Uint8Array(arr)) : null;
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

        // Ensure that partMatrices.length is at least the maximum part index + 1
        if (partIndices) {
            // We always keep part indices in RAM because they are needed for sorting
            this._partIndices = new Uint8Array(textureLength);
            this._partIndices.set(partIndices);

            let maxPartIndex = -1;
            for (let i = 0; i < partIndices.length; i++) {
                maxPartIndex = Math.max(maxPartIndex, partIndices[i]);
            }
            this._ensureMinimumPartMatricesLength(maxPartIndex + 1);
        }

        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        if (GaussianSplattingMesh.ProgressiveUpdateAmount) {
            // create textures with not filled-yet array, then update directly portions of it
            this._updateTextures(covA, covB, colorArray, sh, this._partIndices ? this._partIndices : undefined);
            this.setEnabled(true);

            const partCount = Math.ceil(textureSize.y / lineCountUpdate);
            for (let partIndex = 0; partIndex < partCount; partIndex++) {
                const updateLine = partIndex * lineCountUpdate;
                const splatIndexBase = updateLine * textureSize.x;
                for (let i = 0; i < textureLengthPerUpdate; i++) {
                    this._makeSplat(splatIndexBase + i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum, options);
                }
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, updateLine, Math.min(lineCountUpdate, textureSize.y - updateLine));
                // Update the binfo
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                if (isAsync) {
                    yield;
                }
            }

            // sort will be dirty here as just finished filled positions will not be sorted
            const positions = Float32Array.from(this._splatPositions);
            const vertexCount = this._vertexCount;
            if (this._worker) {
                this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
                this._worker.postMessage({ partIndices });
            }
            this._sortIsDirty = true;
        } else {
            const paddedVertexCount = (vertexCount + 15) & ~0xf;
            for (let i = 0; i < vertexCount; i++) {
                this._makeSplat(i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum, options);
                if (isAsync && i % GaussianSplattingMesh._SplatBatchSize === 0) {
                    yield;
                }
            }
            // pad the rest
            for (let i = vertexCount; i < paddedVertexCount; i++) {
                this._makeEmptySplat(i, covA, covB, colorArray);
            }
            // textures
            this._updateTextures(covA, covB, colorArray, sh, this._partIndices ? this._partIndices : undefined);
            // Update the binfo
            this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
            this.setEnabled(true);
            this._sortIsDirty = true;
        }
        this._postToWorker(true);
    }

    /**
     * Update asynchronously the buffer
     * @param data array buffer containing center, color, orientation and scale of splats
     * @param sh optional array of uint8 array for SH data
     * @param partIndices optional array of uint8 for rig node indices
     * @returns a promise
     */
    public async updateDataAsync(data: ArrayBuffer, sh?: Uint8Array[], partIndices?: Uint8Array): Promise<void> {
        return await runCoroutineAsync(this._updateData(data, true, sh, partIndices), createYieldingScheduler());
    }

    /**
     * @experimental
     * Update data from GS (position, orientation, color, scaling)
     * @param data array that contain all the datas
     * @param sh optional array of uint8 array for SH data
     * @param options optional informations on how to treat data (needs to be 3rd for backward compatibility)
     * @param partIndices optional array of uint8 for rig node indices
     */
    public updateData(data: ArrayBuffer, sh?: Uint8Array[], options: IUpdateOptions = { flipY: true }, partIndices?: Uint8Array): void {
        runCoroutineSync(this._updateData(data, false, sh, partIndices, options));
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
        const paddedVertexCount = (vertexCount + 15) & ~0xf;
        if (!this._splatIndex || vertexCount != this._splatIndex.length) {
            this._splatIndex = new Float32Array(paddedVertexCount);
            for (let i = 0; i < paddedVertexCount; i++) {
                this._splatIndex[i] = i;
            }

            // update meshes for knowns cameras
            this._cameraViewInfos.forEach((cameraViewInfos) => {
                cameraViewInfos.mesh.thinInstanceSetBuffer("splatIndex", this._splatIndex, 16, false);
            });
        }

        // Update depthMix
        if ((!this._depthMix || vertexCount != this._depthMix.length) && !IsNative) {
            this._depthMix = new BigInt64Array(paddedVertexCount);
        }

        this.forcedInstanceCount = Math.max(paddedVertexCount >> 4, 1);
    }

    private _updateSubTextures(
        centers: Float32Array,
        covA: Uint16Array,
        covB: Uint16Array,
        colors: Uint8Array,
        lineStart: number,
        lineCount: number,
        sh?: Uint8Array[],
        partIndices?: Uint8Array
    ): void {
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
                const shView = new Uint32Array(sh[i].buffer, texelStart * componentCount * 4, texelCount * componentCount);
                updateTextureFromData(this._shTextures![i], shView, textureSize.x, lineStart, lineCount);
            }
        }
        if (partIndices && this._partIndicesTexture) {
            const partIndicesView = new Uint8Array(partIndices.buffer, texelStart, texelCount);
            updateTextureFromData(this._partIndicesTexture, partIndicesView, textureSize.x, lineStart, lineCount);
        }
    }
    private _instanciateWorker(): void {
        if (!this._vertexCount) {
            return;
        }
        if (this._disableDepthSort) {
            return;
        }
        this._updateSplatIndexBuffer(this._vertexCount);

        // no worker in native
        if (IsNative) {
            return;
        }

        // Start the worker thread
        this._worker?.terminate();
        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplattingMesh._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        const positions = Float32Array.from(this._splatPositions!);
        const partIndices = this._partIndices ? new Uint8Array(this._partIndices) : null;
        const partMatrices = this._partMatrices.map((matrix) => new Float32Array(matrix.m));

        this._worker.postMessage({ positions }, [positions.buffer]);
        this._worker.postMessage({ partIndices });
        this._worker.postMessage({ partMatrices });

        this._worker.onmessage = (e) => {
            // Recompute vertexCountPadded in case _vertexCount has changed since the last update
            const vertexCountPadded = (this._vertexCount + 15) & ~0xf;

            // If the vertex count changed, we discard this result and trigger a new sort
            if (e.data.depthMix.length != vertexCountPadded) {
                this._canPostToWorker = true;
                this._postToWorker(true);
                this._sortIsDirty = false;
                return;
            }

            this._depthMix = e.data.depthMix;
            const cameraId = e.data.cameraId;

            const indexMix = new Uint32Array(e.data.depthMix.buffer);
            if (this._splatIndex) {
                for (let j = 0; j < vertexCountPadded; j++) {
                    this._splatIndex[j] = indexMix[2 * j];
                }
            }
            if (this._delayedTextureUpdate) {
                const textureSize = this._getTextureSize(vertexCountPadded);
                this._updateSubTextures(
                    this._delayedTextureUpdate.centers,
                    this._delayedTextureUpdate.covA,
                    this._delayedTextureUpdate.covB,
                    this._delayedTextureUpdate.colors,
                    0,
                    textureSize.y,
                    this._delayedTextureUpdate.sh,
                    this._delayedTextureUpdate.partIndices
                );
                this._delayedTextureUpdate = null;
            }

            // get mesh for camera and update its instance buffer
            const cameraViewInfos = this._cameraViewInfos.get(cameraId);
            if (cameraViewInfos) {
                if (cameraViewInfos.splatIndexBufferSet) {
                    cameraViewInfos.mesh.thinInstanceBufferUpdated("splatIndex");
                } else {
                    cameraViewInfos.mesh.thinInstanceSetBuffer("splatIndex", this._splatIndex, 16, false);
                    cameraViewInfos.splatIndexBufferSet = true;
                }
            }
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

    /**
     * Gets the number of parts in the compound
     * @returns the number of parts in the compound, or 0 if the mesh is not a compound
     */
    public get partCount(): number {
        return this._partMatrices.length;
    }

    /**
     * Sets the world matrix for a specific part of the compound (if this mesh is a compound).
     * This will trigger a re-sort of the mesh.
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @param worldMatrix the world matrix to set
     */
    public setWorldMatrixForPart(partIndex: number, worldMatrix: Matrix): void {
        this._partMatrices[partIndex].copyFrom(worldMatrix);
        if (this._worker) {
            this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        }
        this._postToWorker(true);
    }

    /**
     * Gets the world matrix for a specific part of the compound (if this mesh is a compound).
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @returns the world matrix for the part, or the current world matrix of the mesh if the mesh is not a compound
     */
    public getWorldMatrixForPart(partIndex: number): Matrix {
        return this._partMatrices[partIndex] ?? this.getWorldMatrix();
    }

    /**
     * Gets the visibility for a specific part of the compound (if this mesh is a compound).
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @returns the visibility value (0.0 to 1.0) for the part
     */
    public getPartVisibility(partIndex: number): number {
        return this._partVisibility[partIndex] ?? 1.0;
    }

    /**
     * Sets the visibility for a specific part of the compound (if this mesh is a compound).
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @param value the visibility value (0.0 to 1.0) to set
     */
    public setPartVisibility(partIndex: number, value: number): void {
        this._partVisibility[partIndex] = Math.max(0.0, Math.min(1.0, value));
    }

    /**
     * Ensure that the part world matrix array is at least the given length.
     * NB: This length is used as reference for the number of parts in the compound.
     * Newly inserted parts are initialized with the current world matrix of the mesh.
     * @param length - The minimum length to ensure
     */
    private _ensureMinimumPartMatricesLength(length: number): void {
        if (this._partMatrices.length < length) {
            this._resizePartMatrices(length);
        }
    }

    /**
     * This sets the number of parts in the compound.
     * Warning: This must be consistent with the indices used in the partIndices texture.
     * Newly inserted parts are initialized with the current world matrix of the mesh.
     * @param length - The length to resize to
     */
    private _resizePartMatrices(length: number): void {
        if (this._partMatrices.length == length) {
            return;
        } else if (this._partMatrices.length > length) {
            this._partMatrices = this._partMatrices.slice(0, length);
            this._partVisibility = this._partVisibility.slice(0, length);
        } else {
            this.computeWorldMatrix(true);
            const defaultMatrix = this.getWorldMatrix();
            while (this._partMatrices.length < length) {
                this._partMatrices.push(defaultMatrix.clone());
                this._partVisibility.push(1.0);
            }
        }

        if (this._worker) {
            this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        }
        this._postToWorker(true);
    }

    /**
     * Add another mesh to this mesh, as a new part. This makes the current mesh a compound, if not already.
     * NB: The current mesh needs to be loaded with keepInRam: true.
     * @param other - The other mesh to add. This must be loaded with keepInRam: true.
     * @param disposeOther - Whether to dispose the other mesh after adding it to the current mesh.
     * @returns a placeholder mesh that can be used to manipulate the part transform
     */
    public addPart(other: GaussianSplattingMesh, disposeOther: boolean = true): Mesh {
        if (this.partCount >= GaussianSplattingMaxPartCount) {
            throw new Error(`Cannot add part, as the maximum part count (${GaussianSplattingMaxPartCount}) has been reached`);
        }

        const splatCountA = this._vertexCount;
        const splatsDataA = splatCountA == 0 ? new ArrayBuffer(0) : this.splatsData;
        const shDataA = this.shData;

        const splatCountB = other._vertexCount;
        const splatsDataB = other.splatsData;
        const shDataB = other.shData;

        const mergedShDataLength = Math.max(shDataA?.length || 0, shDataB?.length || 0);
        const hasMergedShData = shDataA !== null && shDataB !== null;

        // Sanity checks
        if (!splatsDataA) {
            throw new Error(`To call addPart(), the current mesh must be loaded with keepInRam: true`);
        }
        const expectedSplatsDataSizeA = splatCountA * GaussianSplattingMesh._RowOutputLength;
        if (splatsDataA.byteLength !== expectedSplatsDataSizeA) {
            throw new Error(`splatsDataA size (${splatsDataA.byteLength}) does not match expected size (${expectedSplatsDataSizeA})`);
        }
        if (!splatsDataB) {
            throw new Error(`To call addPart(), the other mesh must be loaded with keepInRam: true`);
        }
        const expectedSplatsDataSizeB = splatCountB * GaussianSplattingMesh._RowOutputLength;
        if (splatsDataB.byteLength !== expectedSplatsDataSizeB) {
            throw new Error(`splatsDataB size (${splatsDataB.byteLength}) does not match expected size (${expectedSplatsDataSizeB})`);
        }
        if (other.partIndices) {
            throw new Error(`To call addPart(), the other mesh must not be a compound`);
        }

        // Concatenate splatsData (ArrayBuffer)
        const mergedSplatsData = new Uint8Array(splatsDataA.byteLength + splatsDataB.byteLength);
        mergedSplatsData.set(new Uint8Array(splatsDataA), 0);
        mergedSplatsData.set(new Uint8Array(splatsDataB), splatsDataA.byteLength);

        let mergedShData: Uint8Array[] | undefined = undefined;
        if (hasMergedShData) {
            // Note: We need to calculate the texture size and pad accordingly
            // Each SH texture texel stores 16 bytes (4 RGBA uint32 components)
            const bytesPerTexel = 16;
            const totalSplatCount = splatCountA + splatCountB;

            mergedShData = [];
            for (let i = 0; i < mergedShDataLength; i++) {
                const mergedShDataItem = new Uint8Array(totalSplatCount * bytesPerTexel);
                if (i < (shDataA?.length ?? 0)) {
                    mergedShDataItem.set(shDataA![i], 0);
                }
                if (i < (shDataB?.length ?? 0)) {
                    const byteOffset = bytesPerTexel * splatCountA;
                    mergedShDataItem.set(shDataB![i], byteOffset);
                }
                mergedShData.push(mergedShDataItem);
            }
        }

        // Concatenate partIndices (Uint8Array)
        let newPartIndex = this.partCount;
        let partIndicesA = this.partIndices;
        if (!partIndicesA) {
            partIndicesA = new Uint8Array(splatCountA);
            newPartIndex = splatCountA > 0 ? 1 : 0;
            //newPartIndex = 1;
        }
        if (partIndicesA.length < splatCountA) {
            throw new Error(`partIndices length (${partIndicesA.length}) should be at least vertexCount (${splatCountA}) in the current mesh`);
        }
        const partIndicesB = new Uint8Array(splatCountB).fill(newPartIndex);
        const mergedPartIndices = new Uint8Array(splatCountA + splatCountB);
        mergedPartIndices.set(partIndicesA.slice(0, splatCountA), 0);
        mergedPartIndices.set(partIndicesB, splatCountA);

        this.updateData(mergedSplatsData.buffer, mergedShData, { flipY: false }, mergedPartIndices);

        // Merge part matrices (TODO)
        const partWorldMatrix = other.getWorldMatrix();
        this.setWorldMatrixForPart(newPartIndex, partWorldMatrix);

        // Create a proxy mesh to manipulate the part transform
        const proxyMesh = new GaussianSplattingPartProxyMesh(other.name, this.getScene(), this, other, newPartIndex);

        if (disposeOther) {
            other.dispose();
        }

        // Set the initial world matrix
        const quaternion = new Quaternion();
        partWorldMatrix.decompose(proxyMesh.scaling, quaternion, proxyMesh.position);
        proxyMesh.rotationQuaternion = quaternion;
        proxyMesh.computeWorldMatrix(true);

        // Store the proxy in the map
        this._partProxies.set(newPartIndex, proxyMesh);

        return proxyMesh;
    }

    /**
     * Remove a part from this compound mesh.
     * @param index - The index of the part to remove
     */
    public removePart(index: number): void {
        if (index < 0 || index >= this.partCount) {
            throw new Error(`Part index ${index} is out of range [0, ${this.partCount})`);
        }

        // Get the current data
        const splatsData = this.splatsData;
        const shData = this.shData;
        const partIndices = this.partIndices;

        if (!splatsData || !partIndices) {
            throw new Error("Cannot remove part from a non-compound mesh or mesh without keepInRam");
        }

        const splatCount = this._vertexCount;
        const rowLength = GaussianSplattingMesh._RowOutputLength;

        // Count splats that will remain (not in the removed part)
        let newSplatCount = 0;
        for (let i = 0; i < splatCount; i++) {
            if (partIndices[i] !== index) {
                newSplatCount++;
            }
        }

        // Build new splats data excluding the removed part
        const newSplatsData = new Uint8Array(newSplatCount * rowLength);
        const newPartIndices = new Uint8Array(newSplatCount);
        let newShData: Uint8Array[] | undefined = undefined;

        if (shData) {
            const bytesPerTexel = 16;
            newShData = [];
            for (let i = 0; i < shData.length; i++) {
                newShData.push(new Uint8Array(newSplatCount * bytesPerTexel));
            }
        }

        let writeIndex = 0;
        for (let readIndex = 0; readIndex < splatCount; readIndex++) {
            const currentPartIndex = partIndices[readIndex];
            if (currentPartIndex === index) {
                // Skip splats from the removed part
                continue;
            }

            // Copy splat data
            const srcOffset = readIndex * rowLength;
            const dstOffset = writeIndex * rowLength;
            newSplatsData.set(new Uint8Array(splatsData, srcOffset, rowLength), dstOffset);

            // Renumber part indices: indices > removed index get decremented
            newPartIndices[writeIndex] = currentPartIndex > index ? currentPartIndex - 1 : currentPartIndex;

            // Copy SH data if present
            if (shData && newShData) {
                const bytesPerTexel = 16;
                for (let shIndex = 0; shIndex < shData.length; shIndex++) {
                    const srcShOffset = readIndex * bytesPerTexel;
                    const dstShOffset = writeIndex * bytesPerTexel;
                    newShData[shIndex].set(new Uint8Array(shData[shIndex].buffer, srcShOffset, bytesPerTexel), dstShOffset);
                }
            }

            writeIndex++;
        }

        // Remove the part matrix and visibility
        this._partMatrices.splice(index, 1);
        this._partVisibility.splice(index, 1);

        // Update worker with new part matrices
        if (this._worker) {
            this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        }

        // Update the mesh with the new data
        this.updateData(newSplatsData.buffer, newShData, { flipY: false }, newPartIndices);

        // Dispose and remove the proxy for the removed part
        const proxyToRemove = this._partProxies.get(index);
        if (proxyToRemove) {
            proxyToRemove.dispose();
            this._partProxies.delete(index);
        }

        // Update the proxy map: renumber proxies with index > removed index
        const proxiesToUpdate: Array<[number, GaussianSplattingPartProxyMesh]> = [];
        this._partProxies.forEach((proxy, proxyIndex) => {
            if (proxyIndex > index) {
                proxiesToUpdate.push([proxyIndex, proxy]);
            }
        });

        // Remove and re-add with updated indices
        for (const [oldIndex, proxy] of proxiesToUpdate) {
            this._partProxies.delete(oldIndex);
            // Update the proxy's internal partIndex
            proxy.updatePartIndex(oldIndex - 1);
            this._partProxies.set(oldIndex - 1, proxy);
        }
    }

    /**
     * Modifies the splats according to the passed transformation matrix.
     * @param transform defines the transform matrix to use
     * @returns the current mesh
     */
    public override bakeTransformIntoVertices(transform: DeepImmutable<Matrix>): Mesh {
        const arrayBuffer = this.splatsData;
        if (!arrayBuffer) {
            Logger.Error("Cannot bake transform into vertices if splatsData is not kept in RAM");
            return this;
        }

        // Check for uniform scaling
        const m = transform.m;
        const scaleX = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
        const scaleY = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
        const scaleZ = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);
        const epsilon = 0.001;
        if (Math.abs(scaleX - scaleY) > epsilon || Math.abs(scaleX - scaleZ) > epsilon) {
            Logger.Error("Gaussian Splatting bakeTransformIntoVertices does not support non-uniform scaling");
            return this;
        }

        const uBuffer = new Uint8Array(arrayBuffer);
        const fBuffer = new Float32Array(arrayBuffer);

        const temp = TmpVectors.Vector3[0];
        let index: number;
        const quaternion = TmpVectors.Quaternion[0];
        const transformedQuaternion = TmpVectors.Quaternion[1];
        transform.decompose(temp, transformedQuaternion, temp);
        for (index = 0; index < this._vertexCount; index++) {
            const floatIndex = index * 8; // 8 floats per splat (center.x, center.y, center.z, scale.x, scale.y, scale.z, ...)
            Vector3.TransformCoordinatesFromFloatsToRef(fBuffer[floatIndex], fBuffer[floatIndex + 1], fBuffer[floatIndex + 2], transform, temp);
            fBuffer[floatIndex] = temp.x;
            fBuffer[floatIndex + 1] = temp.y;
            fBuffer[floatIndex + 2] = temp.z;

            // Apply uniform scaling to splat scales
            fBuffer[floatIndex + 3] *= scaleX;
            fBuffer[floatIndex + 4] *= scaleX;
            fBuffer[floatIndex + 5] *= scaleX;

            // Unpack quaternion from uint8array (matching _GetSplat packing convention)
            quaternion.set(
                (uBuffer[32 * index + 28 + 1] - 127.5) / 127.5,
                (uBuffer[32 * index + 28 + 2] - 127.5) / 127.5,
                (uBuffer[32 * index + 28 + 3] - 127.5) / 127.5,
                (uBuffer[32 * index + 28 + 0] - 127.5) / 127.5
            );
            quaternion.normalize();

            // If there is a negative scaling, we need to flip the quaternion to keep the correct handedness
            if (this.scaling.x < 0) {
                quaternion.x = -quaternion.x;
                quaternion.w = -quaternion.w;
            }
            if (this.scaling.y < 0) {
                quaternion.y = -quaternion.y;
                quaternion.w = -quaternion.w;
            }
            if (this.scaling.z < 0) {
                quaternion.z = -quaternion.z;
                quaternion.w = -quaternion.w;
            }

            // Transform the quaternion
            transformedQuaternion.multiplyToRef(quaternion, quaternion);
            quaternion.normalize();

            // Pack quaternion back to uint8array (matching _GetSplat packing convention)
            uBuffer[32 * index + 28 + 0] = Math.round(quaternion.w * 127.5 + 127.5);
            uBuffer[32 * index + 28 + 1] = Math.round(quaternion.x * 127.5 + 127.5);
            uBuffer[32 * index + 28 + 2] = Math.round(quaternion.y * 127.5 + 127.5);
            uBuffer[32 * index + 28 + 3] = Math.round(quaternion.z * 127.5 + 127.5);
        }

        this.updateData(arrayBuffer, this.shData ?? undefined, { flipY: false });

        return this;
    }
}
