import type { IProperty } from "babylonjs-gltf2interface";
import type { IArrayItem as IArrItem } from "./glTFLoaderInterfaces";

import { ILoader } from "../abstractFileLoader";
import { IBaseLoaderExtension } from "./Extensions/BaseLoaderExtension";

export interface TypedArrayLike extends ArrayBufferView {
    readonly length: number;
    [n: number]: number;
}

export interface TypedArrayConstructor {
    new (length: number): TypedArrayLike;
    new (buffer: ArrayBufferLike, byteOffset: number, length?: number): TypedArrayLike;
}

export interface ILoaderProperty extends IProperty {
    _activeLoaderExtensionFunctions: {
        [id: string]: boolean;
    };
}

export interface IRegisteredExtension {
    factory: (loader: ILoader) => IBaseLoaderExtension;
}

/**
 * Helper class for working with arrays when loading the glTF asset
 */
export class ArrayItem {
    /**
     * Gets an item from the given array.
     * @param context The context when loading the asset
     * @param array The array to get the item from
     * @param index The index to the array
     * @returns The array item
     */
    public static Get<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T {
        if (!array || index == undefined || !array[index]) {
            throw new Error(`${context}: Failed to find index (${index})`);
        }

        return array[index];
    }

    /**
     * Assign an `index` field to each item of the given array.
     * @param array The array of items
     */
    public static Assign(array?: IArrItem[]): void {
        if (array) {
            for (let index = 0; index < array.length; index++) {
                array[index].index = index;
            }
        }
    }
}

export const registeredExtensions: { [loaderName: string]: { [extensionName: string]: IRegisteredExtension } } = {};

export function RegisterExtension<T extends IBaseLoaderExtension>(loaderName: string, extensionName: string, factory: (loader: ILoader) => T): void {
    if (!registeredExtensions[loaderName]) {
        registeredExtensions[loaderName] = {};
    }

    registeredExtensions[loaderName][extensionName] = {
        factory,
    };
}

export function UnregisterExtension(loaderName: string, extensionName: string): boolean {
    if (!registeredExtensions[loaderName] || !registeredExtensions[loaderName][extensionName]) {
        return false;
    }

    if (registeredExtensions[loaderName] && registeredExtensions[loaderName][extensionName]) {
        delete registeredExtensions[loaderName][extensionName];
    }
    return true;
}

/**
 * Base loader implementation
 */
// export abstract class BaseLoader implements ILoader {
//     /** @hidden */
//     public _completePromises = new Array<Promise<any>>();

//     /** @hidden */
//     public _assetContainer: Nullable<AssetContainer> = null;

//     /** @hidden */
//     public _disableInstancedMesh = 0;

//     protected readonly _parent: AbstractFileLoader;
//     protected _scene: Scene;
//     private _jsonData: Nullable<any> = null; // TODO - should not be any
//     private _bin: Nullable<IDataBuffer> = null;
//     private readonly _extensions = new Array<IBaseLoaderExtension>();
//     private _disposed = false;
//     private _rootUrl: Nullable<string> = null;
//     private _fileName: Nullable<string> = null;
//     private _uniqueRootUrl: Nullable<string> = null;

//     /**
//      * The default glTF sampler.
//      */
//     public static readonly DefaultSampler: ISampler = { index: -1 };

//     /**
//      * The object that represents the glTF JSON.
//      */
//     public get json(): any {
//         // TODO should not be any)
//         if (!this._jsonData) {
//             throw new Error("glTF JSON is not available");
//         }

//         return this._jsonData;
//     }

//     /**
//      * The parent file loader.
//      */
//     public get parent(): AbstractFileLoader {
//         return this._parent;
//     }

//     /**
//      * @param parent
//      * @hidden
//      */
//     constructor(parent: GLTFFileLoader) {
//         this._parent = parent;
//     }

//     /** @hidden */
//     public dispose(): void {
//         if (this._disposed) {
//             return;
//         }

//         this._disposed = true;

//         this._completePromises.length = 0;

//         this._extensions.forEach((extension) => extension.dispose && extension.dispose());
//         this._extensions.length = 0;

//         this._jsonData = null; // TODO
//         this._bin = null;

//         this._parent.dispose();
//     }

//     /**
//      * @param scene
//      * @param data
//      * @param rootUrl
//      * @param onProgress
//      * @param fileName
//      * @hidden
//      */
//     public async loadAsync(scene: Scene, data: ILoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName = ""): Promise<void> {
//         this._scene = scene;
//         this._loadData(data);
//         this._rootUrl = rootUrl;
//         this._uniqueRootUrl = !StringTools.StartsWith(rootUrl, "file:") && fileName ? rootUrl : `${rootUrl}${Date.now()}/`;
//         this._fileName = fileName;

//         this._loadExtensions();
//         this._checkExtensions();

//         const loadingToReadyCounterName = `${LoaderState[LoaderState.LOADING]} => ${LoaderState[LoaderState.READY]}`;
//         const loadingToCompleteCounterName = `${LoaderState[LoaderState.LOADING]} => ${LoaderState[LoaderState.COMPLETE]}`;

//         this._parent._startPerformanceCounter(loadingToReadyCounterName);
//         this._parent._startPerformanceCounter(loadingToCompleteCounterName);

//         this._parent._setState(LoaderState.LOADING);
//         this._extensionsOnLoading();

//         const promises: Array<Promise<any>> = [];
//         this._prepareLoadAsync(promises, rootUrl, fileName, null, () => undefined);
        

//        await Promise.all(promises);
//             // if (this._rootBabylonMesh) {
//             //     this._rootBabylonMesh.setEnabled(true);
//             // }

//             this._extensionsOnReady();
//             this._parent._setState(LoaderState.READY);

//             // this._startAnimations();

//             const result = resultFunc();

//             this._parent._endPerformanceCounter(loadingToReadyCounterName);

//             Tools.SetImmediate(() => {
//                 if (!this._disposed) {
//                     Promise.all(this._completePromises).then(
//                         () => {
//                             this._parent._endPerformanceCounter(loadingToCompleteCounterName);

//                             this._parent._setState(LoaderState.COMPLETE);

//                             this._parent.onCompleteObservable.notifyObservers(undefined);
//                             this._parent.onCompleteObservable.clear();

//                             this.dispose();
//                         },
//                         (error) => {
//                             this._parent.onErrorObservable.notifyObservers(error);
//                             this._parent.onErrorObservable.clear();

//                             this.dispose();
//                         }
//                     );
//                 }
//             });

//             return result;

//     }

//     protected abstract _prepareLoadAsync<T>(promises: Array<Promise<any>>, rootUrl: string, fileName: string, nodes: Nullable<Array<number>>, resultFunc: () => T): Promise<T>;
//     protected abstract _setupData(): void;

//     private _loadData(data: ILoaderData): void {
//         this._jsonData = data.json;
//         this._setupData();

//         if (data.bin) {
//             const buffers = this._jsonData.buffers;
//             if (buffers && buffers[0] && !buffers[0].uri) {
//                 const binaryBuffer = buffers[0];
//                 if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
//                     Logger.Warn(`Binary buffer length (${binaryBuffer.byteLength}) from JSON does not match chunk length (${data.bin.byteLength})`);
//                 }

//                 this._bin = data.bin;
//             } else {
//                 Logger.Warn("Unexpected BIN chunk");
//             }
//         }
//     }

//     protected _loadExtensions(): void {
//         for (const name in registeredExtensions[this._parent.name] || {}) {
//             const extension = registeredExtensions[this._parent.name][name].factory(this);
//             if (extension.name !== name) {
//                 Logger.Warn(`The name of the loader extension instance does not match the registered name: ${extension.name} !== ${name}`);
//             }

//             this._extensions.push(extension);
//             this._parent.onExtensionLoadedObservable.notifyObservers(extension);
//         }

//         this._extensions.sort((a, b) => (a.order || Number.MAX_VALUE) - (b.order || Number.MAX_VALUE));
//         this._parent.onExtensionLoadedObservable.clear();
//     }

//     private _checkExtensions(): void {
//         if (this._jsonData.extensionsRequired) {
//             for (const name of this._jsonData.extensionsRequired) {
//                 const available = this._extensions.some((extension) => extension.name === name && extension.enabled);
//                 if (!available) {
//                     throw new Error(`Require extension ${name} is not available`);
//                 }
//             }
//         }
//     }

//     /**
//      * Loads a glTF uri.
//      * @param context The context when loading the asset
//      * @param property The glTF property associated with the uri
//      * @param uri The base64 or relative uri
//      * @returns A promise that resolves with the loaded data when the load is complete
//      */
//     public loadUriAsync(context: string, property: IProperty, uri: string): Promise<ArrayBufferView> {
//         const extensionPromise = this._extensionsLoadUriAsync(context, property, uri);
//         if (extensionPromise) {
//             return extensionPromise;
//         }

//         if (!BaseLoader._ValidateUri(uri)) {
//             throw new Error(`${context}: '${uri}' is invalid`);
//         }

//         if (IsBase64DataUrl(uri)) {
//             const data = new Uint8Array(DecodeBase64UrlToBinary(uri));
//             this.log(`${context}: Decoded ${uri.substr(0, 64)}... (${data.length} bytes)`);
//             return Promise.resolve(data);
//         }

//         this.log(`${context}: Loading ${uri}`);

//         return this._parent.preprocessUrlAsync(this._rootUrl + uri).then((url) => {
//             return new Promise((resolve, reject) => {
//                 this._parent._loadFile(
//                     this._scene,
//                     url,
//                     (data) => {
//                         if (!this._disposed) {
//                             this.log(`${context}: Loaded ${uri} (${(data as ArrayBuffer).byteLength} bytes)`);
//                             resolve(new Uint8Array(data as ArrayBuffer));
//                         }
//                     },
//                     true,
//                     (request) => {
//                         reject(new LoadFileError(`${context}: Failed to load '${uri}'${request ? ": " + request.status + " " + request.statusText : ""}`, request));
//                     }
//                 );
//             });
//         });
//     }

//     /**
//      * Adds a JSON pointer to the metadata of the Babylon object at `<object>.metadata.gltf.pointers`.
//      * @param babylonObject the Babylon object with metadata
//      * @param babylonObject.metadata
//      * @param pointer the JSON pointer
//      */
//     public static AddPointerMetadata(babylonObject: { metadata: any }, pointer: string): void {
//         const metadata = (babylonObject.metadata = babylonObject.metadata || {});
//         const gltf = (metadata.gltf = metadata.gltf || {});
//         const pointers = (gltf.pointers = gltf.pointers || []);
//         pointers.push(pointer);
//     }

//     private static _GetTypedArray(
//         context: string,
//         componentType: AccessorComponentType,
//         bufferView: ArrayBufferView,
//         byteOffset: number | undefined,
//         length: number
//     ): TypedArrayLike {
//         const buffer = bufferView.buffer;
//         byteOffset = bufferView.byteOffset + (byteOffset || 0);

//         const constructor = GLTFLoader._GetTypedArrayConstructor(`${context}/componentType`, componentType);

//         const componentTypeLength = VertexBuffer.GetTypeByteLength(componentType);
//         if (byteOffset % componentTypeLength !== 0) {
//             // HACK: Copy the buffer if byte offset is not a multiple of component type byte length.
//             Logger.Warn(`${context}: Copying buffer as byte offset (${byteOffset}) is not a multiple of component type byte length (${componentTypeLength})`);
//             return new constructor(buffer.slice(byteOffset, byteOffset + length * componentTypeLength), 0);
//         }

//         return new constructor(buffer, byteOffset, length);
//     }

//     private static _ValidateUri(uri: string): boolean {
//         return IsBase64DataUrl(uri) || uri.indexOf("..") === -1;
//     }

//     private _forEachExtensions(action: (extension: IBaseLoaderExtension) => void): void {
//         for (const extension of this._extensions) {
//             if (extension.enabled) {
//                 action(extension);
//             }
//         }
//     }

//     private _applyExtensions<T>(property: IProperty, functionName: string, actionAsync: (extension: IBaseLoaderExtension) => Nullable<T> | undefined): Nullable<T> {
//         for (const extension of this._extensions) {
//             if (extension.enabled) {
//                 const id = `${extension.name}.${functionName}`;
//                 const loaderProperty = property as ILoaderProperty;
//                 loaderProperty._activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions || {};
//                 const activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions;
//                 if (!activeLoaderExtensionFunctions[id]) {
//                     activeLoaderExtensionFunctions[id] = true;

//                     try {
//                         const result = actionAsync(extension);
//                         if (result) {
//                             return result;
//                         }
//                     } finally {
//                         delete activeLoaderExtensionFunctions[id];
//                     }
//                 }
//             }
//         }

//         return null;
//     }

//     private _extensionsOnLoading(): void {
//         this._forEachExtensions((extension) => extension.onLoading && extension.onLoading());
//     }

//     private _extensionsOnReady(): void {
//         this._forEachExtensions((extension) => extension.onReady && extension.onReady());
//     }

//     private _extensionsLoadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
//         return this._applyExtensions(node, "loadNode", (extension) => extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign));
//     }

//     /**
//      * Checks for presence of an extension.
//      * @param name The name of the extension to check
//      * @returns A boolean indicating the presence of the given extension name in `extensionsUsed`
//      */
//     public isExtensionUsed(name: string): boolean {
//         return !!this._jsonData.extensionsUsed && this._jsonData.extensionsUsed.indexOf(name) !== -1;
//     }

//     /**
//      * Increments the indentation level and logs a message.
//      * @param message The message to log
//      */
//     public logOpen(message: string): void {
//         this._parent._logOpen(message);
//     }

//     /**
//      * Decrements the indentation level.
//      */
//     public logClose(): void {
//         this._parent._logClose();
//     }

//     /**
//      * Logs a message
//      * @param message The message to log
//      */
//     public log(message: string): void {
//         this._parent._log(message);
//     }

//     /**
//      * Starts a performance counter.
//      * @param counterName The name of the performance counter
//      */
//     public startPerformanceCounter(counterName: string): void {
//         this._parent._startPerformanceCounter(counterName);
//     }

//     /**
//      * Ends a performance counter.
//      * @param counterName The name of the performance counter
//      */
//     public endPerformanceCounter(counterName: string): void {
//         this._parent._endPerformanceCounter(counterName);
//     }
// }
