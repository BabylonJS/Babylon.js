import { IProperty } from "babylonjs-gltf2interface";
import { AssetContainer } from "core/assetContainer";
import { ISceneLoaderAsyncResult, ISceneLoaderProgressEvent, SceneLoader } from "core/Loading/sceneLoader";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";
import { Nullable } from "core/types";

import { BehaviorManager } from "core/Actions/VSM/behaviorManager";
import { AbstractFileLoader, ILoader, ILoaderData, LoaderState } from "../abstractFileLoader";
import type { GLEFFileLoader } from "../glEFFileLoader";
import { GLTFFileLoader } from "../glTFFileLoader";
import { ArrayItem, ILoaderProperty, registeredExtensions } from "./BaseLoader";
import { IBaseLoaderExtension } from "./Extensions/BaseLoaderExtension";
import { IGLEFLoaderExtension } from "./glEFLoaderExtension";
import { GLTFLoader } from "./glTFLoader";
import { INode, IScene } from "./glTFLoaderInterfaces";

export class GLEFLoader implements ILoader {
    /** @hidden */
    public _assetContainer: Nullable<AssetContainer> = null;
    public _completePromises: Array<Promise<any>> = [];
    public _behaviorManager: BehaviorManager;
    private readonly _extensions: Array<IBaseLoaderExtension> = [];
    private _jsonData: Nullable<any> = null; // TODO - should not be any
    private _scene: Scene;
    // private _bin: Nullable<IDataBuffer> = null;
    private _disposed = false;
    private _rootUrl: Nullable<string> = null;
    // private _fileName: Nullable<string> = null;
    // private _uniqueRootUrl: Nullable<string> = null;
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
        // this._bin = null;

        this._parent.dispose();

        // TODO remove. Only here to "use" some of those vars
        // console.log(this._scene, this._bin, this._rootUrl, this._fileName, this._uniqueRootUrl, this._rootBabylonMesh);
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
        // this._uniqueRootUrl = !StringTools.StartsWith(rootUrl, "file:") && fileName ? rootUrl : `${rootUrl}${Date.now()}/`;
        // this._fileName = fileName;

        this._behaviorManager = new BehaviorManager(this._scene);

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
        if (this._jsonData.scene !== undefined || (this._jsonData.scenes && this._jsonData.scenes[0])) {
            const scene = ArrayItem.Get(`/scene`, this._jsonData.scenes as IScene[], this._jsonData.scene || 0);
            promises.push(this.loadSceneAsync(`/scenes/${scene.index}`, scene));
        } else if (this._jsonData.nodes) {
            // generate nodes list
            const nodesArray: number[] = [];
            const childrenList: number[] = [];
            this._jsonData.nodes.forEach((node: any) => {
                if (node.children) {
                    childrenList.push(...node.children);
                }
                if (childrenList.indexOf(node.index) === -1) {
                    nodesArray.push(node.index);
                }
            });
            const nodesToUse = nodesArray.filter((idx: number) => childrenList.indexOf(idx) === -1);
            promises.push(this.loadSceneAsync("/nodes", { nodes: nodesToUse, index: -1 }));
        }

        await Promise.all(promises);

        if (this._rootBabylonMesh) {
            this._rootBabylonMesh.setEnabled(true);
        }

        this._extensionsOnReady();
        this._parent._setState(LoaderState.READY);

        this._behaviorManager.customEventManager.raiseEvent({
            name: "sceneStart",
        });

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

    /**
     * Loads a glTF scene.
     * @param context The context when loading the asset
     * @param scene The glTF scene property
     * @returns A promise that resolves when the load is complete
     */
    public async loadSceneAsync(context: string, scene: IScene): Promise<void> {
        const extensionPromise = this._extensionsLoadSceneAsync(context, scene);
        if (extensionPromise) {
            return extensionPromise;
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${scene.name || ""}`);

        if (scene.nodes) {
            for (const index of scene.nodes) {
                const node = ArrayItem.Get(`${context}/nodes/${index}`, this._jsonData.nodes as INode[], index);
                promises.push(
                    this.loadNodeAsync(`/nodes/${node.index}`, node, (babylonMesh) => {
                        babylonMesh.parent = this._rootBabylonMesh;
                    })
                );
            }
        }

        // for (const action of this._postSceneLoadActions) {
        //     action();
        // }

        this.logClose();

        await Promise.all(promises);
    }

    /**
     * Loads a glTF node.
     * @param context The context when loading the asset
     * @param node The glTF node property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon mesh when the load is complete
     */
    public async loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void = () => {}): Promise<TransformNode> {
        const extensionPromise = this._extensionsLoadNodeAsync(context, node, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        if (node._babylonTransformNode) {
            throw new Error(`${context}: Invalid recursive node hierarchy`);
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${node.name || ""}`);

        const loadNode = (babylonTransformNode: TransformNode) => {
            GLEFLoader.AddPointerMetadata(babylonTransformNode, context);
            GLEFLoader._LoadTransform(node, babylonTransformNode);

            if (node.children) {
                for (const index of node.children) {
                    const childNode = ArrayItem.Get(`${context}/children/${index}`, this._jsonData.nodes as INode[], index);
                    promises.push(
                        this.loadNodeAsync(`/nodes/${childNode.index}`, childNode, (childBabylonMesh) => {
                            childBabylonMesh.parent = babylonTransformNode;
                        })
                    );
                }
            } else if (typeof (node as any).asset === "number") {
                const assets = this._jsonData.assets;
                const asset: any = ArrayItem.Get("assets", assets, (node as any).asset);
                if (asset.uri) {
                    // get the filename
                    const filename = Tools.GetFilename(asset.uri);
                    const url = Tools.GetFolderPath(asset.uri);
                    SceneLoader.OnPluginActivatedObservable.addOnce((plugin) => {
                        (plugin as GLTFFileLoader).onCompleteObservable.addOnce(() => {
                            asset.gltf = ((plugin as GLTFFileLoader)._loader as GLTFLoader).gltf;
                        });
                    });
                    promises.push(
                        SceneLoader.ImportMeshAsync(asset.nodes || "", this._rootUrl + url, filename, this._scene).then((result) => {
                            result.meshes[0].parent = babylonTransformNode;
                        })
                    );
                }
            }

            assign(babylonTransformNode);
        };

        const nodeName = node.name || `node${node.index}`;
        this._scene._blockEntityCollection = !!this._assetContainer;
        const transformNode = new TransformNode(nodeName, this._scene);
        transformNode._parentContainer = this._assetContainer;
        this._scene._blockEntityCollection = false;
        if (node.mesh == undefined) {
            node._babylonTransformNode = transformNode;
        } else {
            node._babylonTransformNodeForSkin = transformNode;
        }
        loadNode(transformNode);

        this.logClose();

        await Promise.all(promises);
        console.log("json data", this._jsonData);
        return node._babylonTransformNode!;
    }


    private _setupData(): void {
        ArrayItem.Assign(this._jsonData.assets);
        ArrayItem.Assign(this._jsonData.nodes);

        if (this._jsonData.nodes) {
            const nodeParents: { [index: number]: number } = {};
            for (const node of this._jsonData.nodes) {
                if (node.children) {
                    // simple validation
                    if (node.asset) {
                        // invalid
                        throw new Error("a node has both children and asset. Node is not valid.");
                    }
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
    }

    protected _loadExtensions(): void {
        console.log(registeredExtensions);
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

        // TODO - not yet supported in glEF
        // if (data.bin) {
        //     const buffers = this._jsonData.buffers;
        //     if (buffers && buffers[0] && !buffers[0].uri) {
        //         const binaryBuffer = buffers[0];
        //         if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
        //             Logger.Warn(`Binary buffer length (${binaryBuffer.byteLength}) from JSON does not match chunk length (${data.bin.byteLength})`);
        //         }

        //         this._bin = data.bin;
        //     } else {
        //         Logger.Warn("Unexpected BIN chunk");
        //     }
        // }
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

    private _applyExtensions<T>(property: IProperty, functionName: string, actionAsync: (extension: IGLEFLoaderExtension) => Nullable<T> | undefined): Nullable<T> {
        for (const extension of this._extensions) {
            if (extension.enabled) {
                const id = `${extension.name}.${functionName}`;
                const loaderProperty = property as ILoaderProperty;
                loaderProperty._activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions || {};
                const activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions;
                if (!activeLoaderExtensionFunctions[id]) {
                    activeLoaderExtensionFunctions[id] = true;

                    try {
                        const result = actionAsync(extension);
                        if (result) {
                            return result;
                        }
                    } finally {
                        delete activeLoaderExtensionFunctions[id];
                    }
                }
            }
        }

        return null;
    }

    private _extensionsOnLoading(): void {
        this._forEachExtensions((extension) => extension.onLoading && extension.onLoading());
    }

    private _extensionsOnReady(): void {
        this._forEachExtensions((extension) => extension.onReady && extension.onReady());
    }

    // private static _ValidateUri(uri: string): boolean {
    //     return IsBase64DataUrl(uri) || uri.indexOf("..") === -1;
    // }

    private _extensionsLoadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        return this._applyExtensions(scene, "loadScene", (extension) => extension.loadSceneAsync && extension.loadSceneAsync(context, scene));
    }

    private _extensionsLoadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return this._applyExtensions(node, "loadNode", (extension) => extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign));
    }

    // // TODO - return type here?
    // private _extensionsLoadInteractivityAsync(context: string, interactivity: IInteractivity): Nullable<Promise<void>> {
    //     return this._applyExtensions(
    //         interactivity,
    //         "loadInteractivity",
    //         (extension) => extension.loadInteractivityAsync && extension.loadInteractivityAsync(context, interactivity)
    //     );
    // }
    private _forEachExtensions(action: (extension: IBaseLoaderExtension) => void): void {
        for (const extension of this._extensions) {
            if (extension.enabled) {
                action(extension);
            }
        }
    }

    /**
     * Checks for presence of an extension.
     * @param name The name of the extension to check
     * @returns A boolean indicating the presence of the given extension name in `extensionsUsed`
     */
    public isExtensionUsed(name: string): boolean {
        return !!this._jsonData.extensionsUsed && this._jsonData.extensionsUsed.indexOf(name) !== -1;
    }

    /**
     * Increments the indentation level and logs a message.
     * @param message The message to log
     */
    public logOpen(message: string): void {
        this._parent._logOpen(message);
    }

    /**
     * Decrements the indentation level.
     */
    public logClose(): void {
        this._parent._logClose();
    }

    /**
     * Logs a message
     * @param message The message to log
     */
    public log(message: string): void {
        this._parent._log(message);
    }

    /**
     * Starts a performance counter.
     * @param counterName The name of the performance counter
     */
    public startPerformanceCounter(counterName: string): void {
        this._parent._startPerformanceCounter(counterName);
    }

    /**
     * Ends a performance counter.
     * @param counterName The name of the performance counter
     */
    public endPerformanceCounter(counterName: string): void {
        this._parent._endPerformanceCounter(counterName);
    }

    /**
     * Adds a JSON pointer to the metadata of the Babylon object at `<object>.metadata.gltf.pointers`.
     * @param babylonObject the Babylon object with metadata
     * @param babylonObject.metadata
     * @param pointer the JSON pointer
     */
    public static AddPointerMetadata(babylonObject: { metadata: any }, pointer: string): void {
        const metadata = (babylonObject.metadata = babylonObject.metadata || {});
        const gltf = (metadata.gltf = metadata.gltf || {});
        const pointers = (gltf.pointers = gltf.pointers || []);
        pointers.push(pointer);
    }

    private static _LoadTransform(node: INode, babylonNode: TransformNode): void {
        babylonNode.rotationQuaternion = babylonNode.rotationQuaternion || Quaternion.Identity();

        const position = babylonNode.position;
        const rotation = babylonNode.rotationQuaternion;
        const scaling = babylonNode.scaling;

        if (node.matrix) {
            const matrix = Matrix.FromArray(node.matrix);
            matrix.decompose(scaling, rotation, position);
        } else {
            if (node.translation) {
                Vector3.FromArrayToRef(node.translation, 0, position);
            }
            if (node.rotation) {
                Quaternion.FromArrayToRef(node.rotation, 0, rotation);
            }
            if (node.scale) {
                Vector3.FromArrayToRef(node.scale, 0, scaling);
            }
        }
    }
}
