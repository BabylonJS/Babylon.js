﻿/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
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
         * JSON that represents the glTF.
         */
        json: Object;

        /**
         * The BIN chunk of a binary glTF
         */
        bin: Nullable<ArrayBufferView>;
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
        COMPLETE
    }

    /** @hidden */
    export interface IGLTFLoader extends IDisposable {
        readonly state: Nullable<GLTFLoaderState>;
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }>;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<void>;
    }

    /**
     * File loader for loading glTF files into a scene.
     */
    export class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        /** @hidden */
        public static _CreateGLTFLoaderV1: (parent: GLTFFileLoader) => IGLTFLoader;

        /** @hidden */
        public static _CreateGLTFLoaderV2: (parent: GLTFFileLoader) => IGLTFLoader;

        // #region Common options

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

        // #endregion

        // #region V1 options

        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
         * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
         * Defaults to true.
         * @hidden
         */
        public static IncrementalLoading = true;

        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
         * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
         * @hidden
         */
        public static HomogeneousCoordinates = false;

        // #endregion

        // #region V2 options

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

        /** @hidden */
        public _normalizeAnimationGroupsToBeginAtZero = true;

        /**
         * Function called before loading a url referenced by the asset.
         */
        public preprocessUrlAsync = (url: string) => Promise.resolve(url);

        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        public readonly onMeshLoadedObservable = new Observable<AbstractMesh>();

        private _onMeshLoadedObserver: Nullable<Observer<AbstractMesh>>;

        /**
         * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        public set onMeshLoaded(callback: (mesh: AbstractMesh) => void) {
            if (this._onMeshLoadedObserver) {
                this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
            }
            this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
        }

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
         */
        public set onComplete(callback: () => void) {
            if (this._onCompleteObserver) {
                this.onCompleteObservable.remove(this._onCompleteObserver);
            }
            this._onCompleteObserver = this.onCompleteObservable.add(callback);
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
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns a promise that resolves when the asset is completely loaded.
         */
        public whenCompleteAsync(): Promise<void> {
            return new Promise(resolve => {
                this.onCompleteObservable.addOnce(() => {
                    resolve();
                });
            });
        }

        /**
         * The loader state or null if the loader is not active.
         */
        public get loaderState(): Nullable<GLTFLoaderState> {
            return this._loader ? this._loader.state : null;
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
            }
            else {
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
            }
            else {
                this._startPerformanceCounter = this._startPerformanceCounterDisabled;
                this._endPerformanceCounter = this._endPerformanceCounterDisabled;
            }
        }

        // #endregion

        private _loader: Nullable<IGLTFLoader> = null;

        /**
         * Name of the loader ("gltf")
         */
        public name = "gltf";

        /**
         * Supported file extensions of the loader (.gltf, .glb)
         */
        public extensions: ISceneLoaderPluginExtensions = {
            ".gltf": { isBinary: false },
            ".glb": { isBinary: true }
        };

        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        public dispose(): void {
            if (this._loader) {
                this._loader.dispose();
                this._loader = null;
            }

            this._clear();

            this.onDisposeObservable.notifyObservers(undefined);
            this.onDisposeObservable.clear();
        }

        /** @hidden */
        public _clear(): void {
            this.preprocessUrlAsync = url => Promise.resolve(url);

            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
            this.onCameraLoadedObservable.clear();
            this.onCompleteObservable.clear();
            this.onExtensionLoadedObservable.clear();
        }

        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        public importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }> {
            return Promise.resolve().then(() => {
                const loaderData = this._parse(data);
                this._loader = this._getLoader(loaderData);
                return this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onProgress);
            });
        }

        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        public loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void> {
            return Promise.resolve().then(() => {
                const loaderData = this._parse(data);
                this._loader = this._getLoader(loaderData);
                return this._loader.loadAsync(scene, loaderData, rootUrl, onProgress);
            });
        }

        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded asset container
         */
        public loadAssetContainerAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<AssetContainer> {
            return Promise.resolve().then(() => {
                const loaderData = this._parse(data);
                this._loader = this._getLoader(loaderData);
                return this._loader.importMeshAsync(null, scene, loaderData, rootUrl, onProgress).then(result => {
                    const container = new AssetContainer(scene);
                    Array.prototype.push.apply(container.meshes, result.meshes);
                    Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                    Array.prototype.push.apply(container.skeletons, result.skeletons);
                    Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                    container.removeAllFromScene();
                    return container;
                });
            });
        }

        /**
         * If the data string can be loaded directly.
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        public canDirectLoad(data: string): boolean {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        }

        /**
         * Rewrites a url by combining a root url and response url.
         */
        public rewriteRootURL: (rootUrl: string, responseURL?: string) => string;

        /**
         * Instantiates a glTF file loader plugin.
         * @returns the created plugin
         */
        public createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
            return new GLTFFileLoader();
        }

        private _parse(data: string | ArrayBuffer): IGLTFLoaderData {
            this._startPerformanceCounter("Parse");

            let parsedData: IGLTFLoaderData;
            if (data instanceof ArrayBuffer) {
                this._log(`Parsing binary`);
                parsedData = this._parseBinary(data);
            }
            else {
                this._log(`Parsing JSON`);
                this._log(`JSON length: ${data.length}`);

                parsedData = {
                    json: JSON.parse(data),
                    bin: null
                };
            }

            this.onParsedObservable.notifyObservers(parsedData);
            this.onParsedObservable.clear();

            this._endPerformanceCounter("Parse");
            return parsedData;
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
                1: GLTFFileLoader._CreateGLTFLoaderV1,
                2: GLTFFileLoader._CreateGLTFLoaderV2
            };

            const createLoader = createLoaders[version.major];
            if (!createLoader) {
                throw new Error("Unsupported version: " + asset.version);
            }

            return createLoader(this);
        }

        private _parseBinary(data: ArrayBuffer): IGLTFLoaderData {
            const Binary = {
                Magic: 0x46546C67
            };

            this._log(`Binary length: ${data.byteLength}`);

            const binaryReader = new BinaryReader(data);

            const magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }

            const version = binaryReader.readUint32();

            if (this.loggingEnabled) {
                this._log(`Binary version: ${version}`);
            }

            switch (version) {
                case 1: return this._parseV1(binaryReader);
                case 2: return this._parseV2(binaryReader);
            }

            throw new Error("Unsupported version: " + version);
        }

        private _parseV1(binaryReader: BinaryReader): IGLTFLoaderData {
            const ContentFormat = {
                JSON: 0
            };

            const length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }

            const contentLength = binaryReader.readUint32();
            const contentFormat = binaryReader.readUint32();

            let content: Object;
            switch (contentFormat) {
                case ContentFormat.JSON: {
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                }
                default: {
                    throw new Error("Unexpected content format: " + contentFormat);
                }
            }

            const bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            const body = binaryReader.readUint8Array(bytesRemaining);

            return {
                json: content,
                bin: body
            };
        }

        private _parseV2(binaryReader: BinaryReader): IGLTFLoaderData {
            const ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };

            const length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }

            // JSON chunk
            const chunkLength = binaryReader.readUint32();
            const chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                throw new Error("First chunk format is not JSON");
            }
            const json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));

            // Look for BIN chunk
            let bin: Nullable<Uint8Array> = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                const chunkLength = binaryReader.readUint32();
                const chunkFormat = binaryReader.readUint32();
                switch (chunkFormat) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        bin = binaryReader.readUint8Array(chunkLength);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength);
                        break;
                    }
                }
            }

            return {
                json: json,
                bin: bin
            };
        }

        private static _parseVersion(version: string): Nullable<{ major: number, minor: number }> {
            if (version === "1.0" || version === "1.0.1") {
                return {
                    major: 1,
                    minor: 0
                };
            }

            const match = (version + "").match(/^(\d+)\.(\d+)/);
            if (!match) {
                return null;
            }

            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2])
            };
        }

        private static _compareVersion(a: { major: number, minor: number }, b: { major: number, minor: number }) {
            if (a.major > b.major) return 1;
            if (a.major < b.major) return -1;
            if (a.minor > b.minor) return 1;
            if (a.minor < b.minor) return -1;
            return 0;
        }

        private static _decodeBufferToText(buffer: Uint8Array): string {
            let result = "";
            const length = buffer.byteLength;

            for (let i = 0; i < length; i++) {
                result += String.fromCharCode(buffer[i]);
            }

            return result;
        }

        private static readonly _logSpaces = "                                ";
        private _logIndentLevel = 0;
        private _loggingEnabled = false;

        /** @hidden */
        public _log = this._logDisabled;

        /** @hidden */
        public _logOpen(message: string): void {
            this._log(message);
            this._logIndentLevel++;
        }

        /** @hidden */
        public _logClose(): void {
            --this._logIndentLevel;
        }

        private _logEnabled(message: string): void {
            const spaces = GLTFFileLoader._logSpaces.substr(0, this._logIndentLevel * 2);
            Tools.Log(`${spaces}${message}`);
        }

        private _logDisabled(message: string): void {
        }

        private _capturePerformanceCounters = false;

        /** @hidden */
        public _startPerformanceCounter = this._startPerformanceCounterDisabled;

        /** @hidden */
        public _endPerformanceCounter = this._endPerformanceCounterDisabled;

        private _startPerformanceCounterEnabled(counterName: string): void {
            Tools.StartPerformanceCounter(counterName);
        }

        private _startPerformanceCounterDisabled(counterName: string): void {
        }

        private _endPerformanceCounterEnabled(counterName: string): void {
            Tools.EndPerformanceCounter(counterName);
        }

        private _endPerformanceCounterDisabled(counterName: string): void {
        }
    }

    class BinaryReader {
        private _arrayBuffer: ArrayBuffer;
        private _dataView: DataView;
        private _byteOffset: number;

        constructor(arrayBuffer: ArrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }

        public getPosition(): number {
            return this._byteOffset;
        }

        public getLength(): number {
            return this._arrayBuffer.byteLength;
        }

        public readUint32(): number {
            const value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        }

        public readUint8Array(length: number): Uint8Array {
            const value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        }

        public skipBytes(length: number): void {
            this._byteOffset += length;
        }
    }

    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
}
