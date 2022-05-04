import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { Tools } from "core/Misc/tools";
import type {
    ISceneLoaderPluginFactory,
    ISceneLoaderPlugin,
    ISceneLoaderPluginAsync,
    ISceneLoaderProgressEvent,
    ISceneLoaderPluginExtensions,
    ISceneLoaderAsyncResult,
} from "core/Loading/sceneLoader";
import { AssetContainer } from "core/assetContainer";
import type { Scene, IDisposable } from "core/scene";
import type { WebRequest } from "core/Misc/webRequest";
import type { IFileRequest } from "core/Misc/fileRequest";
import { Logger } from "core/Misc/logger";
import type { IDataBuffer } from "core/Misc/dataReader";
import { DataReader } from "core/Misc/dataReader";
import type { LoadFileError } from "core/Misc/fileTools";
import { DecodeBase64UrlToBinary } from "core/Misc/fileTools";

declare type ValidationResult = any;

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

/**
 * Interface that contains the data for the glTF asset.
 */
export interface ILoaderData {
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
export interface ILoaderExtension {
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
export enum LoaderState {
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

/** @hidden */
export interface ILoader extends IDisposable {
    importMeshAsync: (
        meshesNames: any,
        scene: Scene,
        container: Nullable<AssetContainer>,
        data: ILoaderData,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ) => Promise<ISceneLoaderAsyncResult>;
    loadAsync: (scene: Scene, data: ILoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string) => Promise<void>;
}

/**
 * File loader for loading glTF files into a scene.
 */
export abstract class AbstractFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    protected _observers: { [key: string]: Nullable<Observer<any>> } = {};

    // --------------
    // Common options
    // --------------

    /**
     * Defines if the loader should use range requests when load binary glTF files from HTTP.
     * Enabling will disable offline support and glTF validator.
     * Defaults to false.
     */
    public useRangeRequests = false;

    /**
     * Raised when the asset has been parsed
     */
    public onParsedObservable = new Observable<ILoaderData>();

    /**
     * Raised when the asset has been parsed
     */
    public set onParsed(callback: (loaderData: ILoaderData) => void) {
        this.onParsedObservable.remove(this._observers["onParsed"]);
        this._observers["onParsed"] = this.onParsedObservable.add(callback);
    }

    /**
     * Function called before loading a url referenced by the asset.
     * @param url
     */
    public preprocessUrlAsync = (url: string) => Promise.resolve(url);

    /**
     * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
     * For assets with LODs, raised when all of the LODs are complete.
     * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
     */
    public readonly onCompleteObservable = new Observable<void>();

    /**
     * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
     * For assets with LODs, raised when all of the LODs are complete.
     * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
     */
    public set onComplete(callback: () => void) {
        this.onCompleteObservable.remove(this._observers["onComplete"]);
        this._observers["onComplete"] = this.onCompleteObservable.add(callback);
    }

    /**
     * Observable raised when an error occurs.
     */
    public readonly onErrorObservable = new Observable<any>();

    /**
     * Callback raised when an error occurs.
     */
    public set onError(callback: (reason: any) => void) {
        this.onErrorObservable.remove(this._observers["onError"]);
        this._observers["onError"] = this.onErrorObservable.add(callback);
    }

    /**
     * Observable raised after the loader is disposed.
     */
    public readonly onDisposeObservable = new Observable<void>();

    /**
     * Callback raised after the loader is disposed.
     */
    public set onDispose(callback: () => void) {
        this.onDisposeObservable.remove(this._observers["onDispose"]);
        this._observers["onDispose"] = this.onDisposeObservable.add(callback);
    }

    /**
     * Observable raised after a loader extension is created.
     * Set additional options for a loader extension in this event.
     */
    public readonly onExtensionLoadedObservable = new Observable<ILoaderExtension>();

    /**
     * Callback raised after a loader extension is created.
     */
    public set onExtensionLoaded(callback: (extension: ILoaderExtension) => void) {
        this.onExtensionLoadedObservable.remove(this._observers["onExtensionLoaded"]);
        this._observers["onExtensionLoaded"] = this.onExtensionLoadedObservable.add(callback);
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
    public readonly onValidatedObservable = new Observable<ValidationResult>();

    /**
     * Callback raised after an asset was validated.
     */
    public set onValidated(callback: (results: ValidationResult) => void) {
        this.onValidatedObservable.remove(this._observers["onValidated"]);
        this._observers["onValidated"] = this.onValidatedObservable.add(callback);
    }

    private _loader: Nullable<ILoader> = null;
    private _state: Nullable<LoaderState> = null;
    private _progressCallback?: (event: ISceneLoaderProgressEvent) => void;
    private _requests = new Array<IFileRequestInfo>();

    /**
     * Name of the loader
     */
    public abstract name: string;

    /** @hidden */
    public abstract extensions: ISceneLoaderPluginExtensions;

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

        this.onErrorObservable.clear();
        this.onValidatedObservable.clear();
        this.onCompleteObservable.clear();
        this.onExtensionLoadedObservable.clear();
        this.onDisposeObservable.notifyObservers();
        this.onDisposeObservable.clear();
    }

    /**
     * @param scene
     * @param fileOrUrl
     * @param onSuccess
     * @param onProgress
     * @param useArrayBuffer
     * @param onError
     * @hidden
     */
    public loadFile(
        scene: Scene,
        fileOrUrl: File | string,
        onSuccess: (data: any, responseURL?: string) => void,
        onProgress?: (ev: ISceneLoaderProgressEvent) => void,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ): IFileRequest {
        this._progressCallback = onProgress;

        const rootUrl = (fileOrUrl as File).name ? "file:" : Tools.GetFolderPath(fileOrUrl as string);
        const fileName = (fileOrUrl as File).name || Tools.GetFilename(fileOrUrl as string);

        if (useArrayBuffer) {
            // TODO - this is a glTF property, isn't it?
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
                                fileOrUrl,
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
                fileOrUrl,
                (data) => {
                    this._validate(scene, data as ArrayBuffer, rootUrl, fileName);
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
        }

        return this._loadFile(
            scene,
            fileOrUrl,
            (data) => {
                this._validate(scene, data, rootUrl, fileName);
                onSuccess({ json: this._parseJson(data as string) });
            },
            useArrayBuffer,
            onError
        );
    }

    /**
     * @param meshesNames
     * @param scene
     * @param data
     * @param rootUrl
     * @param onProgress
     * @param fileName
     * @hidden
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
     * @param scene
     * @param data
     * @param rootUrl
     * @param onProgress
     * @param fileName
     * @hidden
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

    protected abstract _loadAssetContainer(container: AssetContainer): void;

    protected abstract _importMeshAsyncDone(result: ISceneLoaderAsyncResult, container: AssetContainer): void;

    /**
     * @param scene
     * @param data
     * @param rootUrl
     * @param onProgress
     * @param fileName
     * @hidden
     */
    public async loadAssetContainerAsync(
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<AssetContainer> {
        this.onParsedObservable.notifyObservers(data);
        this.onParsedObservable.clear();

        this._log(`Loading ${fileName || ""}`);
        this._loader = this._getLoader(data);

        // Prepare the asset container.
        const container = new AssetContainer(scene);

        this._loadAssetContainer(container);

        const result = await this._loader.importMeshAsync(null, scene, container, data, rootUrl, onProgress, fileName);
        Array.prototype.push.apply(container.geometries, result.geometries);
        Array.prototype.push.apply(container.meshes, result.meshes);
        Array.prototype.push.apply(container.particleSystems, result.particleSystems);
        Array.prototype.push.apply(container.skeletons, result.skeletons);
        Array.prototype.push.apply(container.animationGroups, result.animationGroups);
        Array.prototype.push.apply(container.lights, result.lights);
        Array.prototype.push.apply(container.transformNodes, result.transformNodes);
        this._importMeshAsyncDone(result, container);
        return container;
    }

    /**
     * @param data
     * @hidden
     */
    public abstract canDirectLoad(data: string): boolean;

    /**
     * @param scene
     * @param data
     * @hidden
     */
    public directLoad(scene: Scene, data: string): Promise<any> {
        if (this.canDirectLoad(data)) {
            const arrayBuffer = DecodeBase64UrlToBinary(data);

            this._validate(scene, arrayBuffer);
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

    /** @hidden */
    public abstract createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    /**
     * The loader state or null if the loader is not active.
     */
    public get loaderState(): Nullable<LoaderState> {
        return this._state;
    }

    /**
     * Observable raised when the loader state changes.
     */
    public onLoaderStateChangedObservable = new Observable<Nullable<LoaderState>>();

    private _completePromise: Nullable<Promise<void>> = null;

    /**
     * Returns a promise that resolves when the asset is completely loaded.
     * @returns a promise that resolves when the asset is completely loaded.
     */
    public whenCompleteAsync(): Promise<void> {
        if (!this._completePromise) {
            this._completePromise = new Promise((resolve, reject) => {
                this.onCompleteObservable.addOnce(() => {
                    resolve();
                });
                this.onErrorObservable.addOnce((reason) => {
                    reject(reason);
                });
            });
        }
        return this._completePromise;
    }

    /**
     * @param state
     * @hidden
     */
    public _setState(state: LoaderState): void {
        if (this._state === state) {
            return;
        }

        this._state = state;
        this.onLoaderStateChangedObservable.notifyObservers(this._state);
        this._log(LoaderState[this._state]);
    }

    /**
     * @param scene
     * @param fileOrUrl
     * @param onSuccess
     * @param useArrayBuffer
     * @param onError
     * @param onOpened
     * @hidden
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

    protected abstract _runValidationAsync(
        data: string | ArrayBuffer,
        rootUrl: string,
        fileName: string,
        getExternalResource: (uri: string) => Promise<ArrayBuffer>
    ): Promise<ValidationResult>;

    protected async _validate(scene: Scene, data: string | ArrayBuffer, rootUrl = "", fileName = ""): Promise<void> {
        if (!this.validate) {
            return;
        }

        this._startPerformanceCounter("Validate JSON");
        try {
            const result = await this._runValidationAsync(data, rootUrl, fileName, (uri) => {
                return this.preprocessUrlAsync(rootUrl + uri).then((url) => scene._loadFileAsync(url, undefined, true, true) as Promise<ArrayBuffer>);
            });
            this.onValidatedObservable.notifyObservers(result);
        } catch (e) {
            Tools.Warn(`Failed to validate: ${e.message}`);
        }
        this._endPerformanceCounter("Validate JSON");
        this.onValidatedObservable.clear();
    }

    protected abstract _getLoaders(): { [key: number]: (parent: AbstractFileLoader) => ILoader };

    private _getLoader(loaderData: ILoaderData): ILoader {
        const asset = (<any>loaderData.json).asset || {};

        this._log(`Asset version: ${asset.version}`);
        asset.minVersion && this._log(`Asset minimum version: ${asset.minVersion}`);
        asset.generator && this._log(`Asset generator: ${asset.generator}`);

        const version = AbstractFileLoader._ParseVersion(asset.version);
        if (!version) {
            throw new Error("Invalid version: " + asset.version);
        }

        if (asset.minVersion !== undefined) {
            const minVersion = AbstractFileLoader._ParseVersion(asset.minVersion);
            if (!minVersion) {
                throw new Error("Invalid minimum version: " + asset.minVersion);
            }

            if (AbstractFileLoader._CompareVersion(minVersion, { major: 2, minor: 0 }) > 0) {
                throw new Error("Incompatible minimum version: " + asset.minVersion);
            }
        }

        const createLoader = this._getLoaders()[version.major];
        if (!createLoader) {
            throw new Error("Unsupported version: " + asset.version);
        }

        return createLoader(this);
    }

    protected _parseJson(json: string): Object {
        this._startPerformanceCounter("Parse JSON");
        this._log(`JSON length: ${json.length}`);
        const parsed = JSON.parse(json);
        this._endPerformanceCounter("Parse JSON");
        return parsed;
    }

    protected abstract _onBinaryDataUnpacked(dataReader: DataReader): Promise<ILoaderData>;

    protected async _unpackBinaryAsync(dataReader: DataReader): Promise<ILoaderData> {
        this._startPerformanceCounter("Unpack Binary");

        // Read magic + version + length + json length + json format
        await dataReader.loadAsync(20);
        const unpacked = await this._onBinaryDataUnpacked(dataReader);

        this._endPerformanceCounter("Unpack Binary");

        return unpacked;
    }

    private static _ParseVersion(version: string): Nullable<{ major: number; minor: number }> {
        // TODO is that needed? they are parsed correctly with the regexp
        // if (version === "1.0" || version === "1.0.1") {
        //     return {
        //         major: 1,
        //         minor: 0,
        //     };
        // }

        const match = (version + "").match(/^(\d+)\.(\d+)/);
        if (!match) {
            return null;
        }

        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
        };
    }

    private static _CompareVersion(a: { major: number; minor: number }, b: { major: number; minor: number }): number {
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

    private static readonly _LogSpaces = "                                ";
    private _logIndentLevel = 0;
    private _loggingEnabled = false;

    /** @hidden */
    public _log = this._logDisabled;

    /**
     * @param message
     * @hidden
     */
    public _logOpen(message: string): void {
        this._log(message);
        this._logIndentLevel++;
    }

    /** @hidden */
    public _logClose(): void {
        --this._logIndentLevel;
    }

    private _logEnabled(message: string): void {
        const spaces = AbstractFileLoader._LogSpaces.substr(0, this._logIndentLevel * 2);
        Logger.Log(`${spaces}${message}`);
    }

    private _logDisabled(message: string): void {}

    private _capturePerformanceCounters = false;

    /** @hidden */
    public _startPerformanceCounter = this._startPerformanceCounterDisabled;

    /** @hidden */
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

// TODO Make sure to register the new file loader
// if (SceneLoader) {
//     SceneLoader.RegisterPlugin(new AbstractFileLoader());
// }
