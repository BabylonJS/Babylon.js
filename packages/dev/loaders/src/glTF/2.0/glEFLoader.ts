import { AssetContainer } from "core/assetContainer";
import { ISceneLoaderAsyncResult, ISceneLoaderProgressEvent, SceneLoader } from "core/Loading/sceneLoader";
import { Mesh } from "core/Meshes/mesh";
import { IDataBuffer } from "core/Misc/dataReader";
import { Logger } from "core/Misc/logger";
import { StringTools } from "core/Misc/stringTools";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";
import { Nullable } from "core/types";
import { AbstractFileLoader, ILoader, ILoaderData, LoaderState } from "../abstractFileLoader";
import type { GLEFFileLoader } from "../glEFFileLoader";
import { ArrayItem, registeredExtensions } from "./BaseLoader";
import { IBaseLoaderExtension } from "./Extensions/BaseLoaderExtension";
import { INode } from "./glTFLoaderInterfaces";

export class GLEFLoader implements ILoader {
    /** @hidden */
    public _assetContainer: Nullable<AssetContainer> = null;
    public _completePromises: Array<Promise<any>> = [];
    private readonly _extensions: Array<IBaseLoaderExtension> = [];
    private _jsonData: Nullable<any> = null; // TODO - should not be any
    private _scene: Scene;
    private _bin: Nullable<IDataBuffer> = null;
    private _disposed = false;
    private _rootUrl: Nullable<string> = null;
    private _fileName: Nullable<string> = null;
    private _uniqueRootUrl: Nullable<string> = null;
    private _rootBabylonMesh: Nullable<Mesh> = null;

    /**
     * The object that represents the glTF JSON.
     */
    public get json(): any {
        // TODO should not be any)
        if (!this._jsonData) {
            throw new Error("glTF JSON is not available");
        }

        return this._jsonData;
    }

    /**
     * The parent file loader.
     */
    public get parent(): AbstractFileLoader {
        return this._parent;
    }

    /** @hidden */
    public dispose(): void {
        if (this._disposed) {
            return;
        }

        this._disposed = true;

        this._completePromises.length = 0;

        this._extensions.forEach((extension) => extension.dispose && extension.dispose());
        this._extensions.length = 0;

        this._jsonData = null; // TODO
        this._bin = null;

        this._parent.dispose();

        // TODO remove
        console.log(this._scene, this._bin, this._rootUrl, this._fileName, this._uniqueRootUrl, this._rootBabylonMesh);
    }
    /**
     * @param _parent
     * @hidden
     */
    constructor(private _parent: GLEFFileLoader) {}
    importMeshAsync(
        _meshesNames: any,
        _scene: Scene,
        _container: Nullable<AssetContainer>,
        _data: ILoaderData,
        _rootUrl: string,
        _onProgress?: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        _fileName?: string | undefined
    ): Promise<ISceneLoaderAsyncResult> {
        throw new Error("Method not used");
    }
    public async loadAsync(scene: Scene, data: ILoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName = ""): Promise<void> {
        this._scene = scene;
        this._loadData(data);
        this._rootUrl = rootUrl;
        this._uniqueRootUrl = !StringTools.StartsWith(rootUrl, "file:") && fileName ? rootUrl : `${rootUrl}${Date.now()}/`;
        this._fileName = fileName;

        this._loadExtensions();
        this._checkExtensions();

        const loadingToReadyCounterName = `${LoaderState[LoaderState.LOADING]} => ${LoaderState[LoaderState.READY]}`;
        const loadingToCompleteCounterName = `${LoaderState[LoaderState.LOADING]} => ${LoaderState[LoaderState.COMPLETE]}`;

        this._parent._startPerformanceCounter(loadingToReadyCounterName);
        this._parent._startPerformanceCounter(loadingToCompleteCounterName);

        this._parent._setState(LoaderState.LOADING);
        this._extensionsOnLoading();

        const promises: Array<Promise<any>> = [];
        // this._prepareLoadAsync(promises, rootUrl, fileName, null, () => undefined);

        // load the needed nodes
        // TODO move it away from here
        const nodes = this._jsonData.nodes;
        const assets = this._jsonData.assets;
        nodes.forEach((node: any) => {
            if (typeof node.asset === "number") {
                const asset: any = ArrayItem.Get("assets", assets, node.asset);
                if (asset.uri) {
                    // get the filename
                    const filename = Tools.GetFilename(asset.uri);
                    const url = Tools.GetFolderPath(asset.uri);
                    console.log(asset.nodes);
                    promises.push(
                        SceneLoader.ImportMeshAsync(asset.nodes || "", rootUrl + url, filename, scene).then((result) => {
                            console.log(result.meshes);
                            result.meshes[0].parent = this._rootBabylonMesh;
                            if (node.translation) {
                                result.meshes[0].position.fromArray(node.translation);
                            }
                        })
                    );
                }
            }
        });

        await Promise.all(promises);

        // TODO
        if (this._rootBabylonMesh) {
            this._rootBabylonMesh.setEnabled(true);
        }

        this._extensionsOnReady();
        this._parent._setState(LoaderState.READY);

        // this._startAnimations();

        // const result = resultFunc();

        this._parent._endPerformanceCounter(loadingToReadyCounterName);

        Tools.SetImmediate(() => {
            if (!this._disposed) {
                Promise.all(this._completePromises).then(
                    () => {
                        this._parent._endPerformanceCounter(loadingToCompleteCounterName);

                        this._parent._setState(LoaderState.COMPLETE);

                        this._parent.onCompleteObservable.notifyObservers(undefined);
                        this._parent.onCompleteObservable.clear();

                        this.dispose();
                    },
                    (error) => {
                        this._parent.onErrorObservable.notifyObservers(error);
                        this._parent.onErrorObservable.clear();

                        this.dispose();
                    }
                );
            }
        });

        return;
    }

    private _setupData(): void {
        ArrayItem.Assign(this._jsonData.assets);
        ArrayItem.Assign(this._jsonData.nodes);
        ArrayItem.Assign(this._jsonData.interactivity);

        if (this._jsonData.nodes) {
            const nodeParents: { [index: number]: number } = {};
            for (const node of this._jsonData.nodes) {
                if (node.children) {
                    for (const index of node.children) {
                        nodeParents[index] = node.index;
                    }
                }
            }

            const rootNode = this._createRootNode();
            for (const node of this._jsonData.nodes) {
                const parentIndex = nodeParents[node.index];
                node.parent = parentIndex === undefined ? rootNode : this._jsonData.nodes[parentIndex];
            }
        }

        console.log(this._jsonData.nodes);
    }

    protected _loadExtensions(): void {
        for (const name in registeredExtensions[this._parent.name] || {}) {
            const extension = registeredExtensions[this._parent.name][name].factory(this);
            if (extension.name !== name) {
                Logger.Warn(`The name of the loader extension instance does not match the registered name: ${extension.name} !== ${name}`);
            }

            this._extensions.push(extension);
            this._parent.onExtensionLoadedObservable.notifyObservers(extension);
        }

        this._extensions.sort((a, b) => (a.order || Number.MAX_VALUE) - (b.order || Number.MAX_VALUE));
        this._parent.onExtensionLoadedObservable.clear();
    }

    private _createRootNode(): INode {
        this._scene._blockEntityCollection = !!this._assetContainer;
        this._rootBabylonMesh = new Mesh("__root__", this._scene);
        this._rootBabylonMesh._parentContainer = this._assetContainer;
        this._scene._blockEntityCollection = false;
        this._rootBabylonMesh.setEnabled(false);

        const rootNode: INode = {
            _babylonTransformNode: this._rootBabylonMesh,
            index: -1,
        };

        // switch (this._parent.coordinateSystemMode) {
        //     case GLTFLoaderCoordinateSystemMode.AUTO: {
        //         if (!this._scene.useRightHandedSystem) {
        //             rootNode.rotation = [0, 1, 0, 0];
        //             rootNode.scale = [1, 1, -1];
        //             GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
        //         }
        //         break;
        //     }
        //     case GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
        //         this._scene.useRightHandedSystem = true;
        //         break;
        //     }
        //     default: {
        //         throw new Error(`Invalid coordinate system mode (${this._parent.coordinateSystemMode})`);
        //     }
        // }

        // TODO - notify when root mesh was created
        // this._parent.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
        return rootNode;
    }

    private _loadData(data: ILoaderData): void {
        this._jsonData = data.json;
        // TODO
        this._setupData();

        if (data.bin) {
            const buffers = this._jsonData.buffers;
            if (buffers && buffers[0] && !buffers[0].uri) {
                const binaryBuffer = buffers[0];
                if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                    Logger.Warn(`Binary buffer length (${binaryBuffer.byteLength}) from JSON does not match chunk length (${data.bin.byteLength})`);
                }

                this._bin = data.bin;
            } else {
                Logger.Warn("Unexpected BIN chunk");
            }
        }
    }

    private _checkExtensions(): void {
        if (this._jsonData.extensionsRequired) {
            for (const name of this._jsonData.extensionsRequired) {
                const available = this._extensions.some((extension) => extension.name === name && extension.enabled);
                if (!available) {
                    throw new Error(`Require extension ${name} is not available`);
                }
            }
        }
    }

    // private _applyExtensions<T>(property: IProperty, functionName: string, actionAsync: (extension: IBaseLoaderExtension) => Nullable<T> | undefined): Nullable<T> {
    //     for (const extension of this._extensions) {
    //         if (extension.enabled) {
    //             const id = `${extension.name}.${functionName}`;
    //             const loaderProperty = property as ILoaderProperty;
    //             loaderProperty._activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions || {};
    //             const activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions;
    //             if (!activeLoaderExtensionFunctions[id]) {
    //                 activeLoaderExtensionFunctions[id] = true;

    //                 try {
    //                     const result = actionAsync(extension);
    //                     if (result) {
    //                         return result;
    //                     }
    //                 } finally {
    //                     delete activeLoaderExtensionFunctions[id];
    //                 }
    //             }
    //         }
    //     }

    //     return null;
    // }

    private _extensionsOnLoading(): void {
        this._forEachExtensions((extension) => extension.onLoading && extension.onLoading());
    }

    private _extensionsOnReady(): void {
        this._forEachExtensions((extension) => extension.onReady && extension.onReady());
    }

    // private static _ValidateUri(uri: string): boolean {
    //     return IsBase64DataUrl(uri) || uri.indexOf("..") === -1;
    // }

    private _forEachExtensions(action: (extension: IBaseLoaderExtension) => void): void {
        for (const extension of this._extensions) {
            if (extension.enabled) {
                action(extension);
            }
        }
    }
}
