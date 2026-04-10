import { type Scene } from "core/scene";
import { type DeepImmutable, type Nullable } from "core/types";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { SubMesh } from "../subMesh";
import { type AbstractMesh } from "../abstractMesh";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Matrix, TmpVectors, Vector2, Vector3, type Quaternion } from "core/Maths/math.vector";

import { Logger } from "core/Misc/logger";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import "core/Meshes/thinInstanceMesh";
import { type ThinEngine } from "core/Engines/thinEngine";
import { ToHalfFloat } from "core/Misc/textureTools";
import { type Material } from "core/Materials/material";
import { type Effect } from "core/Materials/effect";
import { Scalar } from "core/Maths/math.scalar";
import { runCoroutineSync, runCoroutineAsync, createYieldingScheduler, type Coroutine } from "core/Misc/coroutine";
import { EngineStore } from "core/Engines/engineStore";
import { type Camera } from "core/Cameras/camera";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import { type INative } from "core/Engines/Native/nativeInterfaces";

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
}
interface IUpdateOptions {
    flipY?: boolean;
    /** @internal When set, skips reprocessing splats [0, previousVertexCount) and copies from cached arrays instead. */
    previousVertexCount?: number;
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
 * So, only one sort is being done at a time per GaussianSplattingMeshBase. If multiple cameras need an update,
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
 * Base class for Gaussian Splatting meshes. Contains all single-cloud rendering logic.
 * @internal Use GaussianSplattingMesh instead; this class is an internal implementation detail.
 */
export class GaussianSplattingMeshBase extends Mesh {
    /** @internal */
    public _vertexCount = 0;
    protected _worker: Nullable<Worker> = null;
    private _modelViewProjectionMatrix = Matrix.Identity();
    private _depthMix: BigInt64Array;
    protected _canPostToWorker = true;
    private _readyToDisplay = false;
    protected _covariancesATexture: Nullable<BaseTexture> = null;
    protected _covariancesBTexture: Nullable<BaseTexture> = null;
    protected _centersTexture: Nullable<BaseTexture> = null;
    protected _colorsTexture: Nullable<BaseTexture> = null;
    protected _splatPositions: Nullable<Float32Array> = null;
    private _splatIndex: Nullable<Float32Array> = null;
    protected _shTextures: Nullable<BaseTexture[]> = null;
    /** @internal */
    public _splatsData: Nullable<ArrayBuffer> = null;
    /** @internal */
    public _shData: Nullable<Uint8Array[]> = null;
    private _textureSize: Vector2 = new Vector2(0, 0);
    protected readonly _keepInRam: boolean = false;
    protected _alwaysRetainSplatsData: boolean = false;

    private _delayedTextureUpdate: Nullable<IDelayedTextureUpdate> = null;
    protected _useRGBACovariants = false;
    private _material: Nullable<Material> = null;

    private _tmpCovariances = [0, 0, 0, 0, 0, 0];
    private _sortIsDirty = false;

    // Cached bounding box for incremental addPart updates (O(1) vs O(N) scan of positions)
    protected _cachedBoundingMin: Nullable<Vector3> = null;
    protected _cachedBoundingMax: Nullable<Vector3> = null;

    private static _RowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
    private static _SH_C0 = 0.28209479177387814;
    // batch size between 2 yield calls. This value is a tradeoff between updates overhead and framerate hiccups
    // This step is faster the PLY conversion. So batch size can be bigger
    private static _SplatBatchSize = 327680;
    // batch size between 2 yield calls during the PLY to splat conversion.
    private static _PlyConversionBatchSize = 32768;
    /** @internal */
    public _shDegree = 0;

    private static readonly _BatchSize = 16; // 16 splats per instance
    private _cameraViewInfos = new Map<number, ICameraViewInfo>();

    private static readonly _DefaultViewUpdateThreshold = 1e-4;

    /**
     * Cosine value of the angle threshold to update view dependent splat sorting. Default is 0.0001.
     */
    public viewUpdateThreshold: number = GaussianSplattingMeshBase._DefaultViewUpdateThreshold;

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
            this._instantiateWorker();
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
     * Value is clamped between 0 and the maximum degree available from loaded data.
     */
    public get shDegree() {
        return this._shDegree;
    }

    public set shDegree(value: number) {
        const maxDegree = this._shTextures?.length ?? 0;
        const clamped = Math.max(0, Math.min(Math.round(value), maxDegree));
        if (this._shDegree === clamped) {
            return;
        }
        this._shDegree = clamped;
        this.material?.resetDrawCache();
    }

    /**
     * Maximum SH degree available from the loaded data.
     */
    public get maxShDegree() {
        return this._shTextures?.length ?? 0;
    }

    /**
     * Number of splats in the mesh
     */
    public get splatCount() {
        return this._splatIndex?.length;
    }

    /**
     * returns the splats data array buffer that contains in order : postions (3 floats), size (3 floats), color (4 bytes), orientation quaternion (4 bytes)
     * Only available if the mesh was created with keepInRam: true
     */
    public get splatsData() {
        return this._keepInRam ? this._splatsData : null;
    }

    /**
     * returns the SH data arrays
     * Only available if the mesh was created with keepInRam: true
     */
    public get shData() {
        return this._keepInRam ? this._shData : null;
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
        for (let i = 0; i < GaussianSplattingMeshBase._BatchSize; i++) {
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
        new SubMesh(0, 0, 4 * GaussianSplattingMeshBase._BatchSize, 0, 6 * GaussianSplattingMeshBase._BatchSize, this);

        this.setEnabled(false);
        // webGL2 and webGPU support for RG texture with float16 is fine. not webGL1
        this._useRGBACovariants = !this.getEngine().isWebGPU && this.getEngine().version === 1.0;

        this._keepInRam = keepInRam;
        if (url) {
            this._loadingPromise = this.loadFileAsync(url);
        }
        const gaussianSplattingMaterial = new GaussianSplattingMaterial(this.name + "_material", this._scene);
        // Cast is safe: GaussianSplattingMeshBase is @internal; all concrete instances are GaussianSplattingMesh.
        gaussianSplattingMaterial.setSourceMesh(this as any);
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
     * @returns "GaussianSplattingMeshBase"
     */
    public override getClassName(): string {
        return "GaussianSplattingMeshBase";
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

        const modelMatrix = this.getWorldMatrix();
        const modelViewMatrix = TmpVectors.Matrix[1];
        modelMatrix.multiplyToRef(cameraViewMatrix, modelViewMatrix);
        modelMatrix.multiplyToRef(cameraViewProjectionMatrix, this._modelViewProjectionMatrix);

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
                if (cameraMesh.material && cameraMesh.material instanceof GaussianSplattingMaterial) {
                    const gsMaterial = cameraMesh.material as GaussianSplattingMaterial;
                    // GaussianSplattingMaterial source mesh may not have been set yet.
                    // This happens for cloned resources from asset containers for instance,
                    // where material is cloned before mesh.
                    if (!gsMaterial.getSourceMesh()) {
                        // Cast is safe: see constructor comment above.
                        gsMaterial.setSourceMesh(this as any);
                    }
                }
                GaussianSplattingMeshBase._MakeSplatGeometryForMesh(cameraMesh);

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
                        const cameraViewMatrix = camera.getViewMatrix();
                        this._worker.postMessage(
                            {
                                worldMatrix: this.getWorldMatrix().m,
                                cameraForward: [cameraViewMatrix.m[2], cameraViewMatrix.m[6], cameraViewMatrix.m[10]],
                                cameraPosition: [camera.globalPosition.x, camera.globalPosition.y, camera.globalPosition.z],
                                depthMix: this._depthMix,
                                cameraId: camera.uniqueId,
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
            this._geometry = this._cameraViewInfos.values().next().value!.mesh.geometry;
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

        // Propagate render pass material overrides (e.g., GPU picking) to the inner camera mesh.
        // When this mesh is rendered into a RenderTargetTexture with a material override (via setMaterialForRendering),
        // the override is set on this proxy mesh but needs to be applied to the actual camera mesh that does the rendering.
        const engine = this._scene.getEngine();
        const renderPassId = engine.currentRenderPassId;
        const renderPassMaterial = this.getMaterialForRenderPass(renderPassId);
        if (renderPassMaterial) {
            mesh.setMaterialForRenderPass(renderPassId, renderPassMaterial);
        }

        const ret = mesh.render(subMesh, enableAlphaMode, effectiveMeshReplacement);

        // Clean up the temporary override to avoid affecting other render passes
        if (renderPassMaterial) {
            mesh.setMaterialForRenderPass(renderPassId, undefined);
        }

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

                const value = GaussianSplattingMeshBase._ValueNameToEnum(name);
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
                const type = GaussianSplattingMeshBase._TypeNameToEnum(typeName);
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
        const buffer = new ArrayBuffer(GaussianSplattingMeshBase._RowOutputLength * vertexCount);

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

        const rowOutputLength = GaussianSplattingMeshBase._RowOutputLength;
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
                    rgba[0] = (0.5 + GaussianSplattingMeshBase._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_1:
                    rgba[1] = (0.5 + GaussianSplattingMeshBase._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_2:
                    rgba[2] = (0.5 + GaussianSplattingMeshBase._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_3:
                    rgba[3] = (0.5 + GaussianSplattingMeshBase._SH_C0 * value) * 255;
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
        const header = GaussianSplattingMeshBase.ParseHeader(data);
        if (!header) {
            return { buffer: data };
        }

        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMeshBase._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMeshBase._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMeshBase._PlyConversionBatchSize === 0 && useCoroutine) {
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
        const header = GaussianSplattingMeshBase.ParseHeader(data);
        if (!header) {
            return data;
        }

        const offset = { value: 0 };
        const compressedChunks = GaussianSplattingMeshBase._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            GaussianSplattingMeshBase._GetSplat(header, i, compressedChunks, offset);
            if (i % GaussianSplattingMeshBase._PlyConversionBatchSize === 0 && useCoroutine) {
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
        return await runCoroutineAsync(GaussianSplattingMeshBase.ConvertPLYToSplat(data, true), createYieldingScheduler());
    }

    /**
     * Converts a .ply with SH data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer with SH
     */
    public static async ConvertPLYWithSHToSplatAsync(data: ArrayBuffer) {
        return await runCoroutineAsync(GaussianSplattingMeshBase.ConvertPLYWithSHToSplat(data, true), createYieldingScheduler());
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

        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        this._shTextures = null;
        this._cachedBoundingMin = null;
        this._cachedBoundingMax = null;
        // Note: _splatsData and _shData are intentionally kept alive after dispose.
        // They serve as the source reference for the compound API (addPart/removePart)
        // when this mesh is held by a GaussianSplattingPartProxyMesh.compoundSplatMesh.

        this._worker?.terminate();
        this._worker = null;

        // delete meshes created for each camera
        this._cameraViewInfos.forEach((cameraViewInfo) => {
            cameraViewInfo.mesh.dispose();
        });

        super.dispose(doNotRecurse, true);
    }

    protected _copyTextures(source: GaussianSplattingMeshBase): void {
        this._covariancesATexture = source.covariancesATexture?.clone()!;
        this._covariancesBTexture = source.covariancesBTexture?.clone()!;
        this._centersTexture = source.centersTexture?.clone()!;
        this._colorsTexture = source.colorsTexture?.clone()!;
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
    public override clone(name: string = ""): GaussianSplattingMeshBase {
        const newGS = new GaussianSplattingMeshBase(name, undefined, this.getScene());
        newGS._copySource(this);
        newGS.makeGeometryUnique();
        newGS._vertexCount = this._vertexCount;
        newGS._copyTextures(this);
        newGS._modelViewProjectionMatrix = Matrix.Identity();
        newGS._splatPositions = this._splatPositions;
        newGS._readyToDisplay = false;
        newGS._disableDepthSort = this._disableDepthSort;
        newGS._instantiateWorker();

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
                const globalWorldMatrix = e.data.worldMatrix;
                const cameraForward = e.data.cameraForward;
                const cameraPosition = e.data.cameraPosition;

                depthMix = e.data.depthMix;

                if (!positions || !cameraForward) {
                    // Sort request arrived before positions were initialized — return the buffer unchanged so the main thread can unlock _canPostToWorker.
                    self.postMessage({ depthMix, cameraId }, [depthMix.buffer]);
                    return;
                }

                const vertexCountPadded = (positions.length / 4 + 15) & ~0xf;

                indices = new Uint32Array(depthMix.buffer);
                floatMix = new Float32Array(depthMix.buffer);

                // Sort
                for (let j = 0; j < vertexCountPadded; j++) {
                    indices[2 * j] = j;
                }

                // depth = dot(cameraForward, worldPos - cameraPos)
                const camDot = cameraForward[0] * cameraPosition[0] + cameraForward[1] * cameraPosition[1] + cameraForward[2] * cameraPosition[2];

                const computeDepthCoeffs = (m: Float32Array): number[] => {
                    return [
                        cameraForward[0] * m[0] + cameraForward[1] * m[1] + cameraForward[2] * m[2],
                        cameraForward[0] * m[4] + cameraForward[1] * m[5] + cameraForward[2] * m[6],
                        cameraForward[0] * m[8] + cameraForward[1] * m[9] + cameraForward[2] * m[10],
                        cameraForward[0] * m[12] + cameraForward[1] * m[13] + cameraForward[2] * m[14] - camDot,
                    ];
                };

                try {
                    if (partMatrices && partIndices) {
                        // Precompute depth coefficients for each rig node
                        const depthCoeffs = partMatrices.map((m) => computeDepthCoeffs(m));

                        // NB: For performance reasons, we assume that part indices are valid
                        const length = partIndices.length;
                        for (let j = 0; j < vertexCountPadded; j++) {
                            // NB: We need this 'min' because vertex array is padded, not partIndices
                            const partIndex = partIndices[Math.min(j, length - 1)];
                            const coeff = depthCoeffs[partIndex];
                            floatMix[2 * j + 1] = coeff[0] * positions[4 * j + 0] + coeff[1] * positions[4 * j + 1] + coeff[2] * positions[4 * j + 2] + coeff[3];
                            // instead of using minus to sort back to front, we use bitwise not operator to invert the order of indices
                            // might not be faster but a minus sign implies a reference value that may not be enough and will decrease floatting precision
                            indices[2 * j + 1] = ~indices[2 * j + 1];
                        }
                    } else {
                        // Compute depth coefficients from global world matrix
                        const [a, b, c, d] = computeDepthCoeffs(globalWorldMatrix);
                        for (let j = 0; j < vertexCountPadded; j++) {
                            floatMix[2 * j + 1] = a * positions[4 * j + 0] + b * positions[4 * j + 1] + c * positions[4 * j + 2] + d;
                            indices[2 * j + 1] = ~indices[2 * j + 1];
                        }
                    }

                    depthMix.sort();
                } catch (sortError) {
                    // Transient data inconsistency (e.g. partIndices/partMatrices mismatch during addPart/removePart rebuild).
                    // Return the buffer unsorted so the main thread can unlock _canPostToWorker and retry next frame.
                    // Logger is unavailable inside the worker — console is the only option.
                    // eslint-disable-next-line no-console
                    console.error("Gaussian splat sort worker encountered an error (will retry next frame):", sortError);
                }

                self.postMessage({ depthMix, cameraId }, [depthMix.buffer]);
            }
        };
    };

    protected _makeEmptySplat(index: number, covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array): void {
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

    /**
     * Processes a single splat from the source buffer (at srcIndex) and writes the result into
     * the destination texture arrays at dstIndex. This decoupling allows addPart to feed multiple
     * independent source buffers into a single set of destination arrays without merging them first.
     * @param dstIndex - destination splat index (into _splatPositions, covA, covB, colorArray)
     * @param fBuffer - float32 view of the source .splat buffer
     * @param uBuffer - uint8 view of the source .splat buffer
     * @param covA - destination covariancesA array
     * @param covB - destination covariancesB array
     * @param colorArray - destination color array
     * @param minimum - accumulated bounding minimum (updated in-place)
     * @param maximum - accumulated bounding maximum (updated in-place)
     * @param flipY - whether to negate the Y position
     * @param srcIndex - source splat index (defaults to dstIndex when omitted)
     */
    protected _makeSplat(
        dstIndex: number,
        fBuffer: Float32Array,
        uBuffer: Uint8Array,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        minimum: Vector3,
        maximum: Vector3,
        flipY: boolean,
        srcIndex: number = dstIndex
    ): void {
        const matrixRotation = TmpVectors.Matrix[0];
        const matrixScale = TmpVectors.Matrix[1];
        const quaternion = TmpVectors.Quaternion[0];
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;

        const x = fBuffer[8 * srcIndex + 0];
        const y = fBuffer[8 * srcIndex + 1] * (flipY ? -1 : 1);
        const z = fBuffer[8 * srcIndex + 2];

        this._splatPositions![4 * dstIndex + 0] = x;
        this._splatPositions![4 * dstIndex + 1] = y;
        this._splatPositions![4 * dstIndex + 2] = z;

        minimum.minimizeInPlaceFromFloats(x, y, z);
        maximum.maximizeInPlaceFromFloats(x, y, z);

        quaternion.set(
            (uBuffer[32 * srcIndex + 28 + 1] - 127.5) / 127.5,
            (uBuffer[32 * srcIndex + 28 + 2] - 127.5) / 127.5,
            (uBuffer[32 * srcIndex + 28 + 3] - 127.5) / 127.5,
            -(uBuffer[32 * srcIndex + 28 + 0] - 127.5) / 127.5
        );
        quaternion.normalize();
        quaternion.toRotationMatrix(matrixRotation);

        Matrix.ScalingToRef(fBuffer[8 * srcIndex + 3 + 0] * 2, fBuffer[8 * srcIndex + 3 + 1] * 2, fBuffer[8 * srcIndex + 3 + 2] * 2, matrixScale);

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

        this._splatPositions![4 * dstIndex + 3] = factor;
        const transform = factor;

        covA[dstIndex * 4 + 0] = ToHalfFloat(covariances[0] / transform);
        covA[dstIndex * 4 + 1] = ToHalfFloat(covariances[1] / transform);
        covA[dstIndex * 4 + 2] = ToHalfFloat(covariances[2] / transform);
        covA[dstIndex * 4 + 3] = ToHalfFloat(covariances[3] / transform);
        covB[dstIndex * covBSItemSize + 0] = ToHalfFloat(covariances[4] / transform);
        covB[dstIndex * covBSItemSize + 1] = ToHalfFloat(covariances[5] / transform);

        // colors
        colorArray[dstIndex * 4 + 0] = uBuffer[32 * srcIndex + 24 + 0];
        colorArray[dstIndex * 4 + 1] = uBuffer[32 * srcIndex + 24 + 1];
        colorArray[dstIndex * 4 + 2] = uBuffer[32 * srcIndex + 24 + 2];
        colorArray[dstIndex * 4 + 3] = uBuffer[32 * srcIndex + 24 + 3];
    }

    protected _onUpdateTextures(_textureSize: Vector2) {}

    /**
     * Called when part index data is received during a data load. Override to store and manage
     * part index state (e.g. allocating the padded Uint8Array).
     * No-op in the base class.
     * @param _partIndices - the raw part indices passed in by the caller
     * @param _textureLength - the padded texture length (width × height) to allocate into
     */
    protected _onIndexDataReceived(_partIndices: Uint8Array, _textureLength: number): void {}

    /**
     * Called at the start of an incremental texture update, before any splats are processed.
     * Override to perform incremental-specific setup, such as ensuring the part-index GPU texture
     * exists before the sub-texture upload begins.
     * No-op in the base class.
     * @param _textureSize - current texture dimensions
     */
    protected _onIncrementalUpdateStart(_textureSize: Vector2): void {}

    /**
     * Whether this mesh is in compound mode (has at least one part added via addPart).
     * Returns `false` in the base class; overridden to return `true` in the compound subclass.
     * Consumed by the material and depth renderer to toggle compound-specific shader paths.
     * @internal
     */
    public get isCompound(): boolean {
        return false;
    }

    protected _setDelayedTextureUpdate(covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array, sh?: Uint8Array[]): void {
        this._delayedTextureUpdate = { covA, covB, colors: colorArray, centers: this._splatPositions!, sh };
    }

    // NB: partIndices is assumed to be padded to a round texture size
    protected _updateTextures(covA: Uint16Array, covB: Uint16Array, colorArray: Uint8Array, sh?: Uint8Array[]): void {
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
            this._setDelayedTextureUpdate(covA, covB, colorArray, sh);
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

            this._onUpdateTextures(textureSize);

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

            this._onUpdateTextures(textureSize);

            if (firstTime) {
                this._instantiateWorker();
            } else {
                if (this._worker) {
                    const positions = Float32Array.from(this._splatPositions!);
                    const vertexCount = this._vertexCount;
                    this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
                }
                this._postToWorker(true);
            }
        }
    }

    /**
     * Checks whether the GPU textures can be incrementally updated for a new addPart operation,
     * avoiding a full texture re-upload for existing splats.
     * Requires that the GPU textures already exist and the texture height won't change.
     * @param previousVertexCount - The number of splats previously committed to GPU
     * @param vertexCount - The new total number of splats
     * @returns true when only the new splat region needs to be uploaded
     */
    protected _canReuseCachedData(previousVertexCount: number, vertexCount: number): boolean {
        if (previousVertexCount <= 0 || previousVertexCount > vertexCount) {
            return false;
        }
        if (this._splatPositions === null || this._cachedBoundingMin === null || this._cachedBoundingMax === null) {
            return false;
        }
        if (this._covariancesATexture === null) {
            return false;
        }
        // Can only do an incremental GPU update if texture height doesn't need to grow
        const newTextureSize = this._getTextureSize(vertexCount);
        return newTextureSize.y === this._textureSize.y;
    }

    /**
     * Posts updated positions to the sort worker and marks the sort as dirty.
     * Called after processing new splats so the worker can re-sort with the complete position set.
     * Subclasses (e.g. compound) may override to additionally post part-index data.
     */
    protected _notifyWorkerNewData(): void {
        if (this._worker) {
            const positions = Float32Array.from(this._splatPositions!);
            const vertexCount = this._vertexCount;
            this._worker.postMessage({ positions, vertexCount }, [positions.buffer]);
        }
        this._sortIsDirty = true;
    }

    private *_updateData(
        data: ArrayBuffer,
        isAsync: boolean,
        sh?: Uint8Array[],
        partIndices?: Uint8Array,
        { flipY = false, previousVertexCount = 0 }: IUpdateOptions = {}
    ): Coroutine<void> {
        if (!this._covariancesATexture) {
            this._readyToDisplay = false;
        }

        const uBuffer = new Uint8Array(data);
        const fBuffer = new Float32Array(uBuffer.buffer);

        // Optionally store the raw splat buffer as an ArrayBuffer. This is the source reference
        // used by _addPartsInternal when a full texture rebuild is needed. Use uBuffer.buffer as
        // the canonical backing store — it is always a tightly packed ArrayBuffer containing
        // exactly the bytes we processed, avoiding issues with ArrayBufferView.byteOffset.
        if (this._keepInRam || this._alwaysRetainSplatsData) {
            this._splatsData = uBuffer.buffer;
            this._shData = sh ? sh.map((arr) => new Uint8Array(arr)) : null;
        } else {
            this._splatsData = null;
            this._shData = null;
        }

        const vertexCount = uBuffer.length / GaussianSplattingMeshBase._RowOutputLength;
        if (vertexCount != this._vertexCount) {
            this._updateSplatIndexBuffer(vertexCount);
        }
        this._vertexCount = vertexCount;
        // degree == 1 for 1 texture (3 terms), 2 for 2 textures (8 terms) and 3 for 3 textures (15 terms)
        this._shDegree = sh ? sh.length : 0;

        const textureSize = this._getTextureSize(vertexCount);
        const textureLength = textureSize.x * textureSize.y;
        const lineCountUpdate = GaussianSplattingMeshBase.ProgressiveUpdateAmount ?? textureSize.y;

        // Delegate part index storage to subclasses (e.g. GaussianSplattingMesh compound mode).
        if (partIndices) {
            this._onIndexDataReceived(partIndices, textureLength);
        }

        const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        const covA = new Uint16Array(textureLength * 4);
        const covB = new Uint16Array(covBSItemSize * textureLength);
        const colorArray = new Uint8Array(textureLength * 4);

        // Incremental path: only upload the rows that contain new splats, leaving the already-committed
        // GPU region untouched. Falls through to the full-rebuild path when textures don't exist yet
        // or the texture height needs to grow.
        const incremental = this._canReuseCachedData(previousVertexCount, vertexCount);

        // The first texture line/texel that must be (re-)processed and uploaded.
        // For a full rebuild this is 0. For an incremental update it is the row boundary just before
        // previousVertexCount so that any partial old row is re-processed as a complete row.
        const firstNewLine = incremental ? Math.floor(previousVertexCount / textureSize.x) : 0;
        const firstNewTexel = firstNewLine * textureSize.x;

        // Preserve old positions before replacing the array (incremental only)
        const oldPositions = this._splatPositions;
        this._splatPositions = new Float32Array(4 * textureLength);

        if (incremental) {
            this._splatPositions.set(oldPositions!.subarray(0, previousVertexCount * 4));
            minimum.copyFrom(this._cachedBoundingMin!);
            maximum.copyFrom(this._cachedBoundingMax!);
            // Let subclasses handle any incremental-specific setup (e.g. ensuring part-index textures)
            this._onIncrementalUpdateStart(textureSize);
        }

        if (GaussianSplattingMeshBase.ProgressiveUpdateAmount) {
            // Full rebuild: create GPU textures upfront with empty data; the loop fills them in batches via _updateSubTextures
            if (!incremental) {
                this._updateTextures(covA, covB, colorArray, sh);
            }
            this.setEnabled(true);

            const partCount = Math.ceil(textureSize.y / lineCountUpdate);
            for (let partIndex = 0; partIndex < partCount; partIndex++) {
                const updateLine = partIndex * lineCountUpdate;
                const batchEndLine = Math.min(updateLine + lineCountUpdate, textureSize.y);

                // Skip batches that lie entirely within the already-committed GPU region
                if (batchEndLine <= firstNewLine) {
                    continue;
                }

                // Clip upload start to firstNewLine to avoid overwriting committed data with zeros
                const uploadStartLine = Math.max(updateLine, firstNewLine);
                const uploadStartTexel = uploadStartLine * textureSize.x;
                const batchEndTexel = batchEndLine * textureSize.x;

                for (let splatIdx = uploadStartTexel; splatIdx < batchEndTexel; splatIdx++) {
                    if (splatIdx < vertexCount) {
                        this._makeSplat(splatIdx, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum, flipY);
                    } else {
                        this._makeEmptySplat(splatIdx, covA, covB, colorArray);
                    }
                }

                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, uploadStartLine, batchEndLine - uploadStartLine, sh);
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                if (isAsync) {
                    yield;
                }
            }

            this._notifyWorkerNewData();
        } else {
            // Process splats from firstNewTexel: re-processes the partial old row (incremental) or processes everything from 0 (full rebuild)
            for (let i = firstNewTexel; i < vertexCount; i++) {
                this._makeSplat(i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum, flipY);
                if (isAsync && i % GaussianSplattingMeshBase._SplatBatchSize === 0) {
                    yield;
                }
            }

            // Incremental pads the full texture; full rebuild pads only to the next 16-splat boundary
            const paddedEnd = incremental ? textureLength : (vertexCount + 15) & ~0xf;
            for (let i = vertexCount; i < paddedEnd; i++) {
                this._makeEmptySplat(i, covA, covB, colorArray);
            }

            if (incremental) {
                // Partial upload: only rows from firstNewLine onwards; existing rows stay on GPU
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, firstNewLine, textureSize.y - firstNewLine, sh);
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                this.setEnabled(true);
                this._notifyWorkerNewData();
            } else {
                // Full upload: create or replace all GPU textures
                this._updateTextures(covA, covB, colorArray, sh);
                this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
                this.setEnabled(true);
                this._sortIsDirty = true;
            }
        }

        // Cache bounding box for the next incremental addPart call
        this._cachedBoundingMin = minimum.clone();
        this._cachedBoundingMax = maximum.clone();

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
    protected _updateSplatIndexBuffer(vertexCount: number): void {
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

    protected _updateTextureFromData = (texture: BaseTexture, data: ArrayBufferView, width: number, lineStart: number, lineCount: number) => {
        (this.getEngine() as ThinEngine).updateTextureData(texture.getInternalTexture()!, data, 0, lineStart, width, lineCount, 0, 0, false);
    };

    protected _updateSubTextures(centers: Float32Array, covA: Uint16Array, covB: Uint16Array, colors: Uint8Array, lineStart: number, lineCount: number, sh?: Uint8Array[]): void {
        const textureSize = this._getTextureSize(this._vertexCount);
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;
        const texelStart = lineStart * textureSize.x;
        const texelCount = lineCount * textureSize.x;
        const covAView = new Uint16Array(covA.buffer, texelStart * 4 * Uint16Array.BYTES_PER_ELEMENT, texelCount * 4);
        const covBView = new Uint16Array(covB.buffer, texelStart * covBSItemSize * Uint16Array.BYTES_PER_ELEMENT, texelCount * covBSItemSize);
        const colorsView = new Uint8Array(colors.buffer, texelStart * 4, texelCount * 4);
        const centersView = new Float32Array(centers.buffer, texelStart * 4 * Float32Array.BYTES_PER_ELEMENT, texelCount * 4);
        this._updateTextureFromData(this._covariancesATexture!, covAView, textureSize.x, lineStart, lineCount);
        this._updateTextureFromData(this._covariancesBTexture!, covBView, textureSize.x, lineStart, lineCount);
        this._updateTextureFromData(this._centersTexture!, centersView, textureSize.x, lineStart, lineCount);
        this._updateTextureFromData(this._colorsTexture!, colorsView, textureSize.x, lineStart, lineCount);
        if (sh) {
            for (let i = 0; i < sh.length; i++) {
                const componentCount = 4;
                const shView = new Uint32Array(sh[i].buffer, texelStart * componentCount * 4, texelCount * componentCount);
                this._updateTextureFromData(this._shTextures![i], shView, textureSize.x, lineStart, lineCount);
            }
        }
    }

    protected _instantiateWorker(): void {
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
        // Reset the posting gate so the new worker can immediately receive sort requests.
        // If the previous worker was terminated mid-sort it would never have set _canPostToWorker
        // back to true, leaving the sort permanently frozen on the new worker.
        this._canPostToWorker = true;
        this._worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", GaussianSplattingMeshBase._CreateWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        const positions = Float32Array.from(this._splatPositions!);

        this._worker.postMessage({ positions }, [positions.buffer]);
        this._onWorkerCreated(this._worker!);

        this._worker.onerror = () => {
            // If the worker throws an unhandled error, unlock the posting gate so the next frame can retry the sort.
            this._canPostToWorker = true;
        };

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
                    this._delayedTextureUpdate.sh
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

    protected _getTextureSize(length: number): Vector2 {
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
     * Called after the sort worker has been created and the initial positions message has been sent.
     * Override in subclasses to post any additional setup messages the worker needs (e.g. group
     * indices, per-part matrices, etc.).
     * @param _worker the newly created worker
     */
    protected _onWorkerCreated(_worker: Worker): void {}

    /**
     * Called by the material to bind any extra shader uniforms that are specific to this mesh type.
     * The base implementation is a no-op; override in subclasses to bind additional data.
     * @param _effect the shader effect that is being bound
     * @internal
     */
    public bindExtraEffectUniforms(_effect: Effect): void {}

    /**
     * Processes all splats from a source GaussianSplattingMesh directly into the destination
     * texture arrays starting at dstOffset. This is the core of the texture-direct compound API:
     * no merged CPU buffer is ever created; each source mesh is written straight into its region.
     *
     * @param source - The source mesh whose splats are appended
     * @param dstOffset - The destination splat index at which writing starts
     * @param covA - Destination covA array (full texture size)
     * @param covB - Destination covB array (full texture size)
     * @param colorArray - Destination color array (full texture size)
     * @param sh - Destination SH arrays (full texture size), or undefined
     * @param minimum - Accumulated bounding min (updated in-place)
     * @param maximum - Accumulated bounding max (updated in-place)
     * @internal Use GaussianSplattingMesh.addPart instead
     */
    protected _appendSourceToArrays(
        source: GaussianSplattingMeshBase,
        dstOffset: number,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        sh: Uint8Array[] | undefined,
        minimum: Vector3,
        maximum: Vector3
    ): void {
        const srcCount = source._vertexCount;
        const bytesPerTexel = 16;
        const srcRaw = source._splatsData;
        if (!srcRaw || srcCount === 0) {
            return;
        }
        // _splatsData is typed as ArrayBuffer but callers may have stored a TypedArray before this
        // guard was added. Extract the underlying ArrayBuffer so Float32Array reinterprets bytes
        // correctly instead of value-converting each element.
        const srcBuffer: ArrayBuffer = srcRaw instanceof ArrayBuffer ? srcRaw : ((srcRaw as unknown as ArrayBufferView).buffer as ArrayBuffer);
        const uBuffer = new Uint8Array(srcBuffer);
        const fBuffer = new Float32Array(srcBuffer);

        for (let i = 0; i < srcCount; i++) {
            this._makeSplat(dstOffset + i, fBuffer, uBuffer, covA, covB, colorArray, minimum, maximum, false, i);
        }

        // Copy SH data if both source and destination have it
        if (sh && source._shData) {
            for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                if (texIdx < source._shData.length) {
                    sh[texIdx].set(source._shData[texIdx].subarray(0, srcCount * bytesPerTexel), dstOffset * bytesPerTexel);
                }
            }
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
