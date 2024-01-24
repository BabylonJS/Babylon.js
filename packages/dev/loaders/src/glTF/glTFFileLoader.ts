/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type * as GLTF2 from "babylonjs-gltf2interface";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { Tools } from "core/Misc/tools";
import type { Camera } from "core/Cameras/camera";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type {
    ISceneLoaderPluginFactory,
    ISceneLoaderPlugin,
    ISceneLoaderPluginAsync,
    ISceneLoaderProgressEvent,
    ISceneLoaderPluginExtensions,
    ISceneLoaderAsyncResult,
} from "core/Loading/sceneLoader";
import { SceneLoader } from "core/Loading/sceneLoader";
import { AssetContainer } from "core/assetContainer";
import type { Scene, IDisposable } from "core/scene";
import type { WebRequest } from "core/Misc/webRequest";
import type { IFileRequest } from "core/Misc/fileRequest";
import { Logger } from "core/Misc/logger";
import type { IDataBuffer } from "core/Misc/dataReader";
import { DataReader } from "core/Misc/dataReader";
import { GLTFValidation } from "./glTFValidation";
import type { LoadFileError } from "core/Misc/fileTools";
import { DecodeBase64UrlToBinary } from "core/Misc/fileTools";
import { RuntimeError, ErrorCodes } from "core/Misc/error";
import type { TransformNode } from "core/Meshes/transformNode";
import type { MorphTargetManager } from "core/Morph/morphTargetManager";

interface IFileRequestInfo extends IFileRequest {
    _lengthComputable?: boolean;
    _loaded?: number;
    _total?: number;
}

function readAsync(arrayBuffer: ArrayBuffer, byteOffset: number, byteLength: number): Promise<Uint8Array> {
    try {
        return Promise.resolve(new Uint8Array(arrayBuffer, byteOffset, byteLength));
    } catch (e) {
        return Promise.reject(e);
    }
}

function readViewAsync(arrayBufferView: ArrayBufferView, byteOffset: number, byteLength: number): Promise<Uint8Array> {
    try {
        if (byteOffset < 0 || byteOffset >= arrayBufferView.byteLength) {
            throw new RangeError("Offset is out of range.");
        }

        if (byteOffset + byteLength > arrayBufferView.byteLength) {
            throw new RangeError("Length is out of range.");
        }

        return Promise.resolve(new Uint8Array(arrayBufferView.buffer, arrayBufferView.byteOffset + byteOffset, byteLength));
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * Mode that determines the coordinate system to use.
 */
export enum GLTFLoaderCoordinateSystemMode {
    /**
     * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
     */
    AUTO,

    /**
     * Sets the useRightHandedSystem flag on the scene.
     */
    FORCE_RIGHT_HANDED,
}

/**
 * Mode that determines what animations will start.
 */
export enum GLTFLoaderAnimationStartMode {
    /**
     * No animation will start.
     */
    NONE,

    /**
     * The first animation will start.
     */
    FIRST,

    /**
     * All animations will start.
     */
    ALL,
}

/**
 * Interface that contains the data for the glTF asset.
 */
export interface IGLTFLoaderData {
    /**
     * The object that represents the glTF JSON.
     */
    json: Object;

    /**
     * The BIN chunk of a binary glTF.
     */
    bin: Nullable<IDataBuffer>;
}

/**
 * Interface for extending the loader.
 */
export interface IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    readonly name: string;

    /**
     * Defines whether this extension is enabled.
     */
    enabled: boolean;

    /**
     * Defines the order of this extension.
     * The loader sorts the extensions using these values when loading.
     */
    order?: number;
}

/**
 * Loader state.
 */
export enum GLTFLoaderState {
    /**
     * The asset is loading.
     */
    LOADING,

    /**
     * The asset is ready for rendering.
     */
    READY,

    /**
     * The asset is completely loaded.
     */
    COMPLETE,
}

/** @internal */
export interface IGLTFLoader extends IDisposable {
    importMeshAsync: (
        meshesNames: any,
        scene: Scene,
        container: Nullable<AssetContainer>,
        data: IGLTFLoaderData,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ) => Promise<ISceneLoaderAsyncResult>;
    loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string) => Promise<void>;
}

/**
 * File loader for loading glTF files into a scene.
 */
export class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /** @internal */
    public static _CreateGLTF1Loader: (parent: GLTFFileLoader) => IGLTFLoader;

    /** @internal */
    public static _CreateGLTF2Loader: (parent: GLTFFileLoader) => IGLTFLoader;

    // --------------
    // Common options
    // --------------

    /**
     * Raised when the asset has been parsed
     */
    public onParsedObservable = new Observable<IGLTFLoaderData>();

    private _onParsedObserver: Nullable<Observer<IGLTFLoaderData>>;

    /**
     * Raised when the asset has been parsed
     */
    public set onParsed(callback: (loaderData: IGLTFLoaderData) => void) {
        if (this._onParsedObserver) {
            this.onParsedObservable.remove(this._onParsedObserver);
        }
        this._onParsedObserver = this.onParsedObservable.add(callback);
    }

    // ----------
    // V1 options
    // ----------

    /**
     * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
     * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
     * Defaults to true.
     * @internal
     */
    public static IncrementalLoading = true;

    /**
     * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
     * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
     * @internal
     */
    public static HomogeneousCoordinates = false;

    // ----------
    // V2 options
    // ----------

    /**
     * The coordinate system mode. Defaults to AUTO.
     */
    public coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;

    /**
     * The animation start mode. Defaults to FIRST.
     */
    public animationStartMode = GLTFLoaderAnimationStartMode.FIRST;

    /**
     * Defines if the loader should compile materials before raising the success callback. Defaults to false.
     */
    public compileMaterials = false;

    /**
     * Defines if the loader should also compile materials with clip planes. Defaults to false.
     */
    public useClipPlane = false;

    /**
     * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
     */
    public compileShadowGenerators = false;

    /**
     * Defines if the Alpha blended materials are only applied as coverage.
     * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
     * If true, no extra effects are applied to transparent pixels.
     */
    public transparencyAsCoverage = false;

    /**
     * Defines if the loader should use range requests when load binary glTF files from HTTP.
     * Enabling will disable offline support and glTF validator.
     * Defaults to false.
     */
    public useRangeRequests = false;

    /**
     * Defines if the loader should create instances when multiple glTF nodes point to the same glTF mesh. Defaults to true.
     */
    public createInstances = true;

    /**
     * Defines if the loader should always compute the bounding boxes of meshes and not use the min/max values from the position accessor. Defaults to false.
     */
    public alwaysComputeBoundingBox = false;

    /**
     * If true, load all materials defined in the file, even if not used by any mesh. Defaults to false.
     */
    public loadAllMaterials = false;

    /**
     * If true, load only the materials defined in the file. Defaults to false.
     */
    public loadOnlyMaterials = false;

    /**
     * If true, do not load any materials defined in the file. Defaults to false.
     */
    public skipMaterials = false;

    /**
     * If true, load the color (gamma encoded) textures into sRGB buffers (if supported by the GPU), which will yield more accurate results when sampling the texture. Defaults to true.
     */
    public useSRGBBuffers = true;

    /**
     * When loading glTF animations, which are defined in seconds, target them to this FPS. Defaults to 60.
     */
    public targetFps = 60;

    /**
     * Defines if the loader should always compute the nearest common ancestor of the skeleton joints instead of using `skin.skeleton`. Defaults to false.
     * Set this to true if loading assets with invalid `skin.skeleton` values.
     */
    public alwaysComputeSkeletonRootNode = false;

    /**
     * Function called before loading a url referenced by the asset.
     * @param url url referenced by the asset
     * @returns Async url to load
     */
    public preprocessUrlAsync = (url: string) => Promise.resolve(url);

    /**
     * Defines the node to use as the root of the hierarchy when loading the scene (default: undefined). If not defined, a root node will be automatically created.
     * You can also pass null if you don't want a root node to be created.
     */
    public customRootNode?: Nullable<TransformNode>;

    /**
     * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
     * Note that the observable is raised as soon as the mesh object is created, meaning some data may not have been setup yet for this mesh (vertex data, morph targets, material, ...)
     */
    public readonly onMeshLoadedObservable = new Observable<AbstractMesh>();

    private _onMeshLoadedObserver: Nullable<Observer<AbstractMesh>>;

    /**
     * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
     * Note that the callback is called as soon as the mesh object is created, meaning some data may not have been setup yet for this mesh (vertex data, morph targets, material, ...)
     */
    public set onMeshLoaded(callback: (mesh: AbstractMesh) => void) {
        if (this._onMeshLoadedObserver) {
            this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
        }
        this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
    }

    /**
     * Callback raised when the loader creates a skin after parsing the glTF properties of the skin node.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF/glTFSkinning#ignoring-the-transform-of-the-skinned-mesh
     * @param node - the transform node that corresponds to the original glTF skin node used for animations
     * @param skinnedNode - the transform node that is the skinned mesh itself or the parent of the skinned meshes
     */
    public readonly onSkinLoadedObservable = new Observable<{ node: TransformNode; skinnedNode: TransformNode }>();

    /**
     * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
     */
    public readonly onTextureLoadedObservable = new Observable<BaseTexture>();

    private _onTextureLoadedObserver: Nullable<Observer<BaseTexture>>;

    /**
     * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
     */
    public set onTextureLoaded(callback: (texture: BaseTexture) => void) {
        if (this._onTextureLoadedObserver) {
            this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver);
        }
        this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the loader creates a material after parsing the glTF properties of the material.
     */
    public readonly onMaterialLoadedObservable = new Observable<Material>();

    private _onMaterialLoadedObserver: Nullable<Observer<Material>>;

    /**
     * Callback raised when the loader creates a material after parsing the glTF properties of the material.
     */
    public set onMaterialLoaded(callback: (material: Material) => void) {
        if (this._onMaterialLoadedObserver) {
            this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
        }
        this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
     */
    public readonly onCameraLoadedObservable = new Observable<Camera>();

    private _onCameraLoadedObserver: Nullable<Observer<Camera>>;

    /**
     * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
     */
    public set onCameraLoaded(callback: (camera: Camera) => void) {
        if (this._onCameraLoadedObserver) {
            this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver);
        }
        this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
     * For assets with LODs, raised when all of the LODs are complete.
     * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
     */
    public readonly onCompleteObservable = new Observable<void>();

    private _onCompleteObserver: Nullable<Observer<void>>;

    /**
     * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
     * For assets with LODs, raised when all of the LODs are complete.
     * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
     */
    public set onComplete(callback: () => void) {
        if (this._onCompleteObserver) {
            this.onCompleteObservable.remove(this._onCompleteObserver);
        }
        this._onCompleteObserver = this.onCompleteObservable.add(callback);
    }

    /**
     * Observable raised when an error occurs.
     */
    public readonly onErrorObservable = new Observable<any>();

    private _onErrorObserver: Nullable<Observer<any>>;

    /**
     * Callback raised when an error occurs.
     */
    public set onError(callback: (reason: any) => void) {
        if (this._onErrorObserver) {
            this.onErrorObservable.remove(this._onErrorObserver);
        }
        this._onErrorObserver = this.onErrorObservable.add(callback);
    }

    /**
     * Observable raised after the loader is disposed.
     */
    public readonly onDisposeObservable = new Observable<void>();

    private _onDisposeObserver: Nullable<Observer<void>>;

    /**
     * Callback raised after the loader is disposed.
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    /**
     * Observable raised after a loader extension is created.
     * Set additional options for a loader extension in this event.
     */
    public readonly onExtensionLoadedObservable = new Observable<IGLTFLoaderExtension>();

    private _onExtensionLoadedObserver: Nullable<Observer<IGLTFLoaderExtension>>;

    /**
     * Callback raised after a loader extension is created.
     */
    public set onExtensionLoaded(callback: (extension: IGLTFLoaderExtension) => void) {
        if (this._onExtensionLoadedObserver) {
            this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver);
        }
        this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(callback);
    }

    /**
     * Defines if the loader logging is enabled.
     */
    public get loggingEnabled(): boolean {
        return this._loggingEnabled;
    }

    public set loggingEnabled(value: boolean) {
        if (this._loggingEnabled === value) {
            return;
        }

        this._loggingEnabled = value;

        if (this._loggingEnabled) {
            this._log = this._logEnabled;
        } else {
            this._log = this._logDisabled;
        }
    }

    /**
     * Defines if the loader should capture performance counters.
     */
    public get capturePerformanceCounters(): boolean {
        return this._capturePerformanceCounters;
    }

    public set capturePerformanceCounters(value: boolean) {
        if (this._capturePerformanceCounters === value) {
            return;
        }

        this._capturePerformanceCounters = value;

        if (this._capturePerformanceCounters) {
            this._startPerformanceCounter = this._startPerformanceCounterEnabled;
            this._endPerformanceCounter = this._endPerformanceCounterEnabled;
        } else {
            this._startPerformanceCounter = this._startPerformanceCounterDisabled;
            this._endPerformanceCounter = this._endPerformanceCounterDisabled;
        }
    }

    /**
     * Defines if the loader should validate the asset.
     */
    public validate = false;

    /**
     * Observable raised after validation when validate is set to true. The event data is the result of the validation.
     */
    public readonly onValidatedObservable = new Observable<GLTF2.IGLTFValidationResults>();

    private _onValidatedObserver: Nullable<Observer<GLTF2.IGLTFValidationResults>>;

    /**
     * Callback raised after a loader extension is created.
     */
    public set onValidated(callback: (results: GLTF2.IGLTFValidationResults) => void) {
        if (this._onValidatedObserver) {
            this.onValidatedObservable.remove(this._onValidatedObserver);
        }
        this._onValidatedObserver = this.onValidatedObservable.add(callback);
    }

    private _loader: Nullable<IGLTFLoader> = null;
    private _state: Nullable<GLTFLoaderState> = null;
    private _progressCallback?: (event: ISceneLoaderProgressEvent) => void;
    private _requests = new Array<IFileRequestInfo>();

    private static _MagicBase64Encoded = "Z2xURg"; // "glTF" base64 encoded (without the quotes!)

    /**
     * Name of the loader ("gltf")
     */
    public name = "gltf";

    /** @internal */
    public extensions: ISceneLoaderPluginExtensions = {
        ".gltf": { isBinary: false },
        ".glb": { isBinary: true },
    };

    /**
     * Disposes the loader, releases resources during load, and cancels any outstanding requests.
     */
    public dispose(): void {
        if (this._loader) {
            this._loader.dispose();
            this._loader = null;
        }

        for (const request of this._requests) {
            request.abort();
        }

        this._requests.length = 0;

        delete this._progressCallback;

        this.preprocessUrlAsync = (url) => Promise.resolve(url);

        this.onMeshLoadedObservable.clear();
        this.onSkinLoadedObservable.clear();
        this.onTextureLoadedObservable.clear();
        this.onMaterialLoadedObservable.clear();
        this.onCameraLoadedObservable.clear();
        this.onCompleteObservable.clear();
        this.onExtensionLoadedObservable.clear();

        this.onDisposeObservable.notifyObservers(undefined);
        this.onDisposeObservable.clear();
    }

    /**
     * @internal
     */
    public loadFile(
        scene: Scene,
        fileOrUrl: File | string | ArrayBufferView,
        rootUrl: string,
        onSuccess: (data: any, responseURL?: string) => void,
        onProgress?: (ev: ISceneLoaderProgressEvent) => void,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void,
        name?: string
    ): Nullable<IFileRequest> {
        if (ArrayBuffer.isView(fileOrUrl)) {
            this._loadBinary(scene, fileOrUrl as ArrayBufferView, rootUrl, onSuccess, onError, name);
            return null;
        }

        this._progressCallback = onProgress;

        const fileName = (fileOrUrl as File).name || Tools.GetFilename(fileOrUrl as string);

        if (useArrayBuffer) {
            if (this.useRangeRequests) {
                if (this.validate) {
                    Logger.Warn("glTF validation is not supported when range requests are enabled");
                }

                const fileRequest: IFileRequest = {
                    abort: () => {},
                    onCompleteObservable: new Observable<IFileRequest>(),
                };

                const dataBuffer = {
                    readAsync: (byteOffset: number, byteLength: number) => {
                        return new Promise<ArrayBufferView>((resolve, reject) => {
                            this._loadFile(
                                scene,
                                fileOrUrl as File | string,
                                (data) => {
                                    resolve(new Uint8Array(data as ArrayBuffer));
                                },
                                true,
                                (error) => {
                                    reject(error);
                                },
                                (webRequest) => {
                                    webRequest.setRequestHeader("Range", `bytes=${byteOffset}-${byteOffset + byteLength - 1}`);
                                }
                            );
                        });
                    },
                    byteLength: 0,
                };

                this._unpackBinaryAsync(new DataReader(dataBuffer)).then(
                    (loaderData) => {
                        fileRequest.onCompleteObservable.notifyObservers(fileRequest);
                        onSuccess(loaderData);
                    },
                    onError ? (error) => onError(undefined, error) : undefined
                );

                return fileRequest;
            }

            return this._loadFile(
                scene,
                fileOrUrl as File | string,
                (data) => {
                    this._validate(scene, new Uint8Array(data as ArrayBuffer, 0, (data as ArrayBuffer).byteLength), rootUrl, fileName);
                    this._unpackBinaryAsync(
                        new DataReader({
                            readAsync: (byteOffset, byteLength) => readAsync(data as ArrayBuffer, byteOffset, byteLength),
                            byteLength: (data as ArrayBuffer).byteLength,
                        })
                    ).then(
                        (loaderData) => {
                            onSuccess(loaderData);
                        },
                        onError ? (error) => onError(undefined, error) : undefined
                    );
                },
                true,
                onError
            );
        } else {
            return this._loadFile(
                scene,
                fileOrUrl,
                (data) => {
                    this._validate(scene, data as string, rootUrl, fileName);
                    onSuccess({ json: this._parseJson(data as string) });
                },
                false,
                onError
            );
        }
    }

    private _loadBinary(
        scene: Scene,
        data: ArrayBufferView,
        rootUrl: string,
        onSuccess: (data: any, responseURL?: string) => void,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void,
        fileName?: string
    ): void {
        this._validate(scene, new Uint8Array(data.buffer, data.byteOffset, data.byteLength), rootUrl, fileName);
        this._unpackBinaryAsync(
            new DataReader({
                readAsync: (byteOffset, byteLength) => readViewAsync(data, byteOffset, byteLength),
                byteLength: data.byteLength,
            })
        ).then(
            (loaderData) => {
                onSuccess(loaderData);
            },
            onError ? (error) => onError(undefined, error) : undefined
        );
    }

    /**
     * @internal
     */
    public importMeshAsync(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        return Promise.resolve().then(() => {
            this.onParsedObservable.notifyObservers(data);
            this.onParsedObservable.clear();

            this._log(`Loading ${fileName || ""}`);
            this._loader = this._getLoader(data);
            return this._loader.importMeshAsync(meshesNames, scene, null, data, rootUrl, onProgress, fileName);
        });
    }

    /**
     * @internal
     */
    public loadAsync(scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
        return Promise.resolve().then(() => {
            this.onParsedObservable.notifyObservers(data);
            this.onParsedObservable.clear();

            this._log(`Loading ${fileName || ""}`);
            this._loader = this._getLoader(data);
            return this._loader.loadAsync(scene, data, rootUrl, onProgress, fileName);
        });
    }

    /**
     * @internal
     */
    public loadAssetContainerAsync(scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer> {
        return Promise.resolve().then(() => {
            this.onParsedObservable.notifyObservers(data);
            this.onParsedObservable.clear();

            this._log(`Loading ${fileName || ""}`);
            this._loader = this._getLoader(data);

            // Prepare the asset container.
            const container = new AssetContainer(scene);

            // Get materials/textures when loading to add to container
            const materials: Array<Material> = [];
            this.onMaterialLoadedObservable.add((material) => {
                materials.push(material);
            });
            const textures: Array<BaseTexture> = [];
            this.onTextureLoadedObservable.add((texture) => {
                textures.push(texture);
            });
            const cameras: Array<Camera> = [];
            this.onCameraLoadedObservable.add((camera) => {
                cameras.push(camera);
            });

            const morphTargetManagers: Array<MorphTargetManager> = [];
            this.onMeshLoadedObservable.add((mesh) => {
                if (mesh.morphTargetManager) {
                    morphTargetManagers.push(mesh.morphTargetManager);
                }
            });

            return this._loader.importMeshAsync(null, scene, container, data, rootUrl, onProgress, fileName).then((result) => {
                Array.prototype.push.apply(container.geometries, result.geometries);
                Array.prototype.push.apply(container.meshes, result.meshes);
                Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                Array.prototype.push.apply(container.skeletons, result.skeletons);
                Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                Array.prototype.push.apply(container.materials, materials);
                Array.prototype.push.apply(container.textures, textures);
                Array.prototype.push.apply(container.lights, result.lights);
                Array.prototype.push.apply(container.transformNodes, result.transformNodes);
                Array.prototype.push.apply(container.cameras, cameras);
                Array.prototype.push.apply(container.morphTargetManagers, morphTargetManagers);
                return container;
            });
        });
    }

    /**
     * @internal
     */
    public canDirectLoad(data: string): boolean {
        return (
            (data.indexOf("asset") !== -1 && data.indexOf("version") !== -1) ||
            data.startsWith("data:base64," + GLTFFileLoader._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
            data.startsWith("data:;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("data:application/octet-stream;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("data:model/gltf-binary;base64," + GLTFFileLoader._MagicBase64Encoded)
        );
    }

    /**
     * @internal
     */
    public directLoad(scene: Scene, data: string): Promise<any> {
        if (
            data.startsWith("base64," + GLTFFileLoader._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
            data.startsWith(";base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("application/octet-stream;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("model/gltf-binary;base64," + GLTFFileLoader._MagicBase64Encoded)
        ) {
            const arrayBuffer = DecodeBase64UrlToBinary(data);

            this._validate(scene, new Uint8Array(arrayBuffer, 0, arrayBuffer.byteLength));
            return this._unpackBinaryAsync(
                new DataReader({
                    readAsync: (byteOffset, byteLength) => readAsync(arrayBuffer, byteOffset, byteLength),
                    byteLength: arrayBuffer.byteLength,
                })
            );
        }

        this._validate(scene, data);
        return Promise.resolve({ json: this._parseJson(data) });
    }

    /**
     * The callback that allows custom handling of the root url based on the response url.
     * @param rootUrl the original root url
     * @param responseURL the response url if available
     * @returns the new root url
     */
    public rewriteRootURL?(rootUrl: string, responseURL?: string): string;

    /** @internal */
    public createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
        return new GLTFFileLoader();
    }

    /**
     * The loader state or null if the loader is not active.
     */
    public get loaderState(): Nullable<GLTFLoaderState> {
        return this._state;
    }

    /**
     * Observable raised when the loader state changes.
     */
    public onLoaderStateChangedObservable = new Observable<Nullable<GLTFLoaderState>>();

    /**
     * Returns a promise that resolves when the asset is completely loaded.
     * @returns a promise that resolves when the asset is completely loaded.
     */
    public whenCompleteAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.onCompleteObservable.addOnce(() => {
                resolve();
            });
            this.onErrorObservable.addOnce((reason) => {
                reject(reason);
            });
        });
    }

    /**
     * @internal
     */
    public _setState(state: GLTFLoaderState): void {
        if (this._state === state) {
            return;
        }

        this._state = state;
        this.onLoaderStateChangedObservable.notifyObservers(this._state);
        this._log(GLTFLoaderState[this._state]);
    }

    /**
     * @internal
     */
    public _loadFile(
        scene: Scene,
        fileOrUrl: File | string,
        onSuccess: (data: string | ArrayBuffer) => void,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest) => void,
        onOpened?: (request: WebRequest) => void
    ): IFileRequest {
        const request = scene._loadFile(
            fileOrUrl,
            onSuccess,
            (event) => {
                this._onProgress(event, request);
            },
            true,
            useArrayBuffer,
            onError,
            onOpened
        ) as IFileRequestInfo;
        request.onCompleteObservable.add((request) => {
            this._requests.splice(this._requests.indexOf(request), 1);
        });
        this._requests.push(request);
        return request;
    }

    private _onProgress(event: ProgressEvent, request: IFileRequestInfo): void {
        if (!this._progressCallback) {
            return;
        }

        request._lengthComputable = event.lengthComputable;
        request._loaded = event.loaded;
        request._total = event.total;

        let lengthComputable = true;
        let loaded = 0;
        let total = 0;
        for (const request of this._requests) {
            if (request._lengthComputable === undefined || request._loaded === undefined || request._total === undefined) {
                return;
            }

            lengthComputable = lengthComputable && request._lengthComputable;
            loaded += request._loaded;
            total += request._total;
        }

        this._progressCallback({
            lengthComputable: lengthComputable,
            loaded: loaded,
            total: lengthComputable ? total : 0,
        });
    }

    private _validate(scene: Scene, data: string | Uint8Array, rootUrl = "", fileName = ""): void {
        if (!this.validate) {
            return;
        }

        this._startPerformanceCounter("Validate JSON");
        GLTFValidation.ValidateAsync(data, rootUrl, fileName, (uri) => {
            return this.preprocessUrlAsync(rootUrl + uri).then((url) => {
                return scene._loadFileAsync(url, undefined, true, true).then((data) => {
                    return new Uint8Array(data, 0, data.byteLength);
                });
            });
        }).then(
            (result) => {
                this._endPerformanceCounter("Validate JSON");
                this.onValidatedObservable.notifyObservers(result);
                this.onValidatedObservable.clear();
            },
            (reason) => {
                this._endPerformanceCounter("Validate JSON");
                Tools.Warn(`Failed to validate: ${reason.message}`);
                this.onValidatedObservable.clear();
            }
        );
    }

    private _getLoader(loaderData: IGLTFLoaderData): IGLTFLoader {
        const asset = (<any>loaderData.json).asset || {};

        this._log(`Asset version: ${asset.version}`);
        asset.minVersion && this._log(`Asset minimum version: ${asset.minVersion}`);
        asset.generator && this._log(`Asset generator: ${asset.generator}`);

        const version = GLTFFileLoader._parseVersion(asset.version);
        if (!version) {
            throw new Error("Invalid version: " + asset.version);
        }

        if (asset.minVersion !== undefined) {
            const minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
            if (!minVersion) {
                throw new Error("Invalid minimum version: " + asset.minVersion);
            }

            if (GLTFFileLoader._compareVersion(minVersion, { major: 2, minor: 0 }) > 0) {
                throw new Error("Incompatible minimum version: " + asset.minVersion);
            }
        }

        const createLoaders: { [key: number]: (parent: GLTFFileLoader) => IGLTFLoader } = {
            1: GLTFFileLoader._CreateGLTF1Loader,
            2: GLTFFileLoader._CreateGLTF2Loader,
        };

        const createLoader = createLoaders[version.major];
        if (!createLoader) {
            throw new Error("Unsupported version: " + asset.version);
        }

        return createLoader(this);
    }

    private _parseJson(json: string): Object {
        this._startPerformanceCounter("Parse JSON");
        this._log(`JSON length: ${json.length}`);
        const parsed = JSON.parse(json);
        this._endPerformanceCounter("Parse JSON");
        return parsed;
    }

    private _unpackBinaryAsync(dataReader: DataReader): Promise<IGLTFLoaderData> {
        this._startPerformanceCounter("Unpack Binary");

        // Read magic + version + length + json length + json format
        return dataReader.loadAsync(20).then(() => {
            const Binary = {
                Magic: 0x46546c67,
            };

            const magic = dataReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new RuntimeError("Unexpected magic: " + magic, ErrorCodes.GLTFLoaderUnexpectedMagicError);
            }

            const version = dataReader.readUint32();

            if (this.loggingEnabled) {
                this._log(`Binary version: ${version}`);
            }

            const length = dataReader.readUint32();
            if (!this.useRangeRequests && length !== dataReader.buffer.byteLength) {
                Logger.Warn(`Length in header does not match actual data length: ${length} != ${dataReader.buffer.byteLength}`);
            }

            let unpacked: Promise<IGLTFLoaderData>;
            switch (version) {
                case 1: {
                    unpacked = this._unpackBinaryV1Async(dataReader, length);
                    break;
                }
                case 2: {
                    unpacked = this._unpackBinaryV2Async(dataReader, length);
                    break;
                }
                default: {
                    throw new Error("Unsupported version: " + version);
                }
            }

            this._endPerformanceCounter("Unpack Binary");

            return unpacked;
        });
    }

    private _unpackBinaryV1Async(dataReader: DataReader, length: number): Promise<IGLTFLoaderData> {
        const ContentFormat = {
            JSON: 0,
        };

        const contentLength = dataReader.readUint32();
        const contentFormat = dataReader.readUint32();

        if (contentFormat !== ContentFormat.JSON) {
            throw new Error(`Unexpected content format: ${contentFormat}`);
        }

        const bodyLength = length - dataReader.byteOffset;

        const data: IGLTFLoaderData = { json: this._parseJson(dataReader.readString(contentLength)), bin: null };
        if (bodyLength !== 0) {
            const startByteOffset = dataReader.byteOffset;
            data.bin = {
                readAsync: (byteOffset, byteLength) => dataReader.buffer.readAsync(startByteOffset + byteOffset, byteLength),
                byteLength: bodyLength,
            };
        }

        return Promise.resolve(data);
    }

    private _unpackBinaryV2Async(dataReader: DataReader, length: number): Promise<IGLTFLoaderData> {
        const ChunkFormat = {
            JSON: 0x4e4f534a,
            BIN: 0x004e4942,
        };

        // Read the JSON chunk header.
        const chunkLength = dataReader.readUint32();
        const chunkFormat = dataReader.readUint32();
        if (chunkFormat !== ChunkFormat.JSON) {
            throw new Error("First chunk format is not JSON");
        }

        // Bail if there are no other chunks.
        if (dataReader.byteOffset + chunkLength === length) {
            return dataReader.loadAsync(chunkLength).then(() => {
                return { json: this._parseJson(dataReader.readString(chunkLength)), bin: null };
            });
        }

        // Read the JSON chunk and the length and type of the next chunk.
        return dataReader.loadAsync(chunkLength + 8).then(() => {
            const data: IGLTFLoaderData = { json: this._parseJson(dataReader.readString(chunkLength)), bin: null };

            const readAsync = (): Promise<IGLTFLoaderData> => {
                const chunkLength = dataReader.readUint32();
                const chunkFormat = dataReader.readUint32();

                switch (chunkFormat) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        const startByteOffset = dataReader.byteOffset;
                        data.bin = {
                            readAsync: (byteOffset, byteLength) => dataReader.buffer.readAsync(startByteOffset + byteOffset, byteLength),
                            byteLength: chunkLength,
                        };
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                }

                if (dataReader.byteOffset !== length) {
                    return dataReader.loadAsync(8).then(readAsync);
                }

                return Promise.resolve(data);
            };

            return readAsync();
        });
    }

    private static _parseVersion(version: string): Nullable<{ major: number; minor: number }> {
        if (version === "1.0" || version === "1.0.1") {
            return {
                major: 1,
                minor: 0,
            };
        }

        const match = (version + "").match(/^(\d+)\.(\d+)/);
        if (!match) {
            return null;
        }

        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
        };
    }

    private static _compareVersion(a: { major: number; minor: number }, b: { major: number; minor: number }): number {
        if (a.major > b.major) {
            return 1;
        }
        if (a.major < b.major) {
            return -1;
        }
        if (a.minor > b.minor) {
            return 1;
        }
        if (a.minor < b.minor) {
            return -1;
        }
        return 0;
    }

    private static readonly _logSpaces = "                                ";
    private _logIndentLevel = 0;
    private _loggingEnabled = false;

    /** @internal */
    public _log = this._logDisabled;

    /**
     * @internal
     */
    public _logOpen(message: string): void {
        this._log(message);
        this._logIndentLevel++;
    }

    /** @internal */
    public _logClose(): void {
        --this._logIndentLevel;
    }

    private _logEnabled(message: string): void {
        const spaces = GLTFFileLoader._logSpaces.substr(0, this._logIndentLevel * 2);
        Logger.Log(`${spaces}${message}`);
    }

    private _logDisabled(message: string): void {}

    private _capturePerformanceCounters = false;

    /** @internal */
    public _startPerformanceCounter = this._startPerformanceCounterDisabled;

    /** @internal */
    public _endPerformanceCounter = this._endPerformanceCounterDisabled;

    private _startPerformanceCounterEnabled(counterName: string): void {
        Tools.StartPerformanceCounter(counterName);
    }

    private _startPerformanceCounterDisabled(counterName: string): void {}

    private _endPerformanceCounterEnabled(counterName: string): void {
        Tools.EndPerformanceCounter(counterName);
    }

    private _endPerformanceCounterDisabled(counterName: string): void {}
}

if (SceneLoader) {
    SceneLoader.RegisterPlugin(new GLTFFileLoader());
}
