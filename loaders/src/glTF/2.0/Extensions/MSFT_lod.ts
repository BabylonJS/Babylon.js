import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Deferred } from "babylonjs/Misc/deferred";
import { Material } from "babylonjs/Materials/material";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Mesh } from "babylonjs/Meshes/mesh";
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { INode, IMaterial, IBuffer, IScene } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { IProperty } from 'babylonjs-gltf2interface';

const NAME = "MSFT_lod";

interface IMSFTLOD {
    ids: number[];
}

interface IBufferInfo {
    start: number;
    end: number;
    loaded: Deferred<ArrayBufferView>;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
 */
export class MSFT_lod implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * Defines a number that determines the order the extensions are applied.
     */
    public order = 100;

    /**
     * Maximum number of LODs to load, starting from the lowest LOD.
     */
    public maxLODsToLoad = 10;

    /**
     * Observable raised when all node LODs of one level are loaded.
     * The event data is the index of the loaded LOD starting from zero.
     * Dispose the loader to cancel the loading of the next level of LODs.
     */
    public onNodeLODsLoadedObservable = new Observable<number>();

    /**
     * Observable raised when all material LODs of one level are loaded.
     * The event data is the index of the loaded LOD starting from zero.
     * Dispose the loader to cancel the loading of the next level of LODs.
     */
    public onMaterialLODsLoadedObservable = new Observable<number>();

    private _loader: GLTFLoader;

    private _bufferLODs = new Array<IBufferInfo>();

    private _nodeIndexLOD: Nullable<number> = null;
    private _nodeSignalLODs = new Array<Deferred<void>>();
    private _nodePromiseLODs = new Array<Array<Promise<any>>>();
    private _nodeBufferLODs = new Array<IBufferInfo>();

    private _materialIndexLOD: Nullable<number> = null;
    private _materialSignalLODs = new Array<Deferred<void>>();
    private _materialPromiseLODs = new Array<Array<Promise<any>>>();
    private _materialBufferLODs = new Array<IBufferInfo>();

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;

        this._nodeIndexLOD = null;
        this._nodeSignalLODs.length = 0;
        this._nodePromiseLODs.length = 0;
        this._nodeBufferLODs.length = 0;

        this._materialIndexLOD = null;
        this._materialSignalLODs.length = 0;
        this._materialPromiseLODs.length = 0;
        this._materialBufferLODs.length = 0;

        this.onMaterialLODsLoadedObservable.clear();
        this.onNodeLODsLoadedObservable.clear();
    }

    /** @hidden */
    public onReady(): void {
        for (let indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
            const promise = Promise.all(this._nodePromiseLODs[indexLOD]).then(() => {
                if (indexLOD !== 0) {
                    this._loader.endPerformanceCounter(`Node LOD ${indexLOD}`);
                    this._loader.log(`Loaded node LOD ${indexLOD}`);
                }

                this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);

                if (indexLOD !== this._nodePromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Node LOD ${indexLOD + 1}`);
                    this._loadBufferLOD(this._nodeBufferLODs, indexLOD + 1);
                    if (this._nodeSignalLODs[indexLOD]) {
                        this._nodeSignalLODs[indexLOD].resolve();
                    }
                }
            });

            this._loader._completePromises.push(promise);
        }

        for (let indexLOD = 0; indexLOD < this._materialPromiseLODs.length; indexLOD++) {
            const promise = Promise.all(this._materialPromiseLODs[indexLOD]).then(() => {
                if (indexLOD !== 0) {
                    this._loader.endPerformanceCounter(`Material LOD ${indexLOD}`);
                    this._loader.log(`Loaded material LOD ${indexLOD}`);
                }

                this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);

                if (indexLOD !== this._materialPromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Material LOD ${indexLOD + 1}`);
                    this._loadBufferLOD(this._materialBufferLODs, indexLOD + 1);
                    if (this._materialSignalLODs[indexLOD]) {
                        this._materialSignalLODs[indexLOD].resolve();
                    }
                }
            });

            this._loader._completePromises.push(promise);
        }
    }

    /** @hidden */
    public loadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        const promise = this._loader.loadSceneAsync(context, scene);
        this._loadBufferLOD(this._bufferLODs, 0);
        return promise;
    }

    /** @hidden */
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IMSFTLOD, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            let firstPromise: Promise<TransformNode>;

            const nodeLODs = this._getLODs(extensionContext, node, this._loader.gltf.nodes, extension.ids);
            this._loader.logOpen(`${extensionContext}`);

            for (let indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                const nodeLOD = nodeLODs[indexLOD];

                if (indexLOD !== 0) {
                    this._nodeIndexLOD = indexLOD;
                    this._nodeSignalLODs[indexLOD] = this._nodeSignalLODs[indexLOD] || new Deferred();
                }

                const assign = (babylonTransformNode: TransformNode) => { babylonTransformNode.setEnabled(false); };
                const promise = this._loader.loadNodeAsync(`#/nodes/${nodeLOD.index}`, nodeLOD, assign).then((babylonMesh) => {
                    if (indexLOD !== 0) {
                        // TODO: should not rely on _babylonTransformNode
                        const previousNodeLOD = nodeLODs[indexLOD - 1];
                        if (previousNodeLOD._babylonTransformNode) {
                            this._disposeTransformNode(previousNodeLOD._babylonTransformNode);
                            delete previousNodeLOD._babylonTransformNode;
                        }
                    }

                    babylonMesh.setEnabled(true);
                    return babylonMesh;
                });

                this._nodePromiseLODs[indexLOD] = this._nodePromiseLODs[indexLOD] || [];

                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._nodeIndexLOD = null;
                    this._nodePromiseLODs[indexLOD].push(promise);
                }
            }

            this._loader.logClose();
            return firstPromise!;
        });
    }

    /** @hidden */
    public _loadMaterialAsync(context: string, material: IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<Material>> {
        // Don't load material LODs if already loading a node LOD.
        if (this._nodeIndexLOD) {
            return null;
        }

        return GLTFLoader.LoadExtensionAsync<IMSFTLOD, Material>(context, material, this.name, (extensionContext, extension) => {
            let firstPromise: Promise<Material>;

            const materialLODs = this._getLODs(extensionContext, material, this._loader.gltf.materials, extension.ids);
            this._loader.logOpen(`${extensionContext}`);

            for (let indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                const materialLOD = materialLODs[indexLOD];

                if (indexLOD !== 0) {
                    this._materialIndexLOD = indexLOD;
                }

                const promise = this._loader._loadMaterialAsync(`#/materials/${materialLOD.index}`, materialLOD, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                    if (indexLOD === 0) {
                        assign(babylonMaterial);
                    }
                }).then((babylonMaterial) => {
                    if (indexLOD !== 0) {
                        assign(babylonMaterial);

                        // TODO: should not rely on _data
                        const previousDataLOD = materialLODs[indexLOD - 1]._data!;
                        if (previousDataLOD[babylonDrawMode]) {
                            this._disposeMaterials([previousDataLOD[babylonDrawMode].babylonMaterial]);
                            delete previousDataLOD[babylonDrawMode];
                        }
                    }

                    return babylonMaterial;
                });

                this._materialPromiseLODs[indexLOD] = this._materialPromiseLODs[indexLOD] || [];

                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._materialIndexLOD = null;
                    this._materialPromiseLODs[indexLOD].push(promise);
                }
            }

            this._loader.logClose();
            return firstPromise!;
        });
    }

    /** @hidden */
    public _loadUriAsync(context: string, property: IProperty, uri: string): Nullable<Promise<ArrayBufferView>> {
        // Defer the loading of uris if loading a node or material LOD.
        if (this._nodeIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._nodeIndexLOD - 1;
            this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new Deferred<void>();
            return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(() => {
                return this._loader.loadUriAsync(context, property, uri);
            });
        }
        else if (this._materialIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._materialIndexLOD - 1;
            this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new Deferred<void>();
            return this._materialSignalLODs[previousIndexLOD].promise.then(() => {
                return this._loader.loadUriAsync(context, property, uri);
            });
        }

        return null;
    }

    /** @hidden */
    public loadBufferAsync(context: string, buffer: IBuffer, byteOffset: number, byteLength: number): Nullable<Promise<ArrayBufferView>> {
        if (this._loader.parent.useRangeRequests && !buffer.uri) {
            if (!this._loader.bin) {
                throw new Error(`${context}: Uri is missing or the binary glTF is missing its binary chunk`);
            }

            const loadAsync = (bufferLODs: Array<IBufferInfo>, indexLOD: number) => {
                const start = byteOffset;
                const end = start + byteLength - 1;
                let bufferLOD = bufferLODs[indexLOD];
                if (bufferLOD) {
                    bufferLOD.start = Math.min(bufferLOD.start, start);
                    bufferLOD.end = Math.max(bufferLOD.end, end);
                }
                else {
                    bufferLOD = { start: start, end: end, loaded: new Deferred() };
                    bufferLODs[indexLOD] = bufferLOD;
                }

                return bufferLOD.loaded.promise.then((data) => {
                    return new Uint8Array(data.buffer, data.byteOffset + byteOffset - bufferLOD.start, byteLength);
                });
            };

            this._loader.log(`deferred`);

            if (this._nodeIndexLOD !== null) {
                return loadAsync(this._nodeBufferLODs, this._nodeIndexLOD);
            }
            else if (this._materialIndexLOD !== null) {
                return loadAsync(this._materialBufferLODs, this._materialIndexLOD);
            }
            else {
                return loadAsync(this._bufferLODs, 0);
            }
        }

        return null;
    }

    private _loadBufferLOD(bufferLODs: Array<IBufferInfo>, indexLOD: number): void {
        const bufferLOD = bufferLODs[indexLOD];
        if (bufferLOD) {
            this._loader.log(`Loading buffer range [${bufferLOD.start}-${bufferLOD.end}]`);
            this._loader.bin!.readAsync(bufferLOD.start, bufferLOD.end - bufferLOD.start + 1).then((data) => {
                bufferLOD.loaded.resolve(data);
            }, (error) => {
                bufferLOD.loaded.reject(error);
            });
        }
    }

    /**
     * Gets an array of LOD properties from lowest to highest.
     */
    private _getLODs<T>(context: string, property: T, array: ArrayLike<T> | undefined, ids: number[]): T[] {
        if (this.maxLODsToLoad <= 0) {
            throw new Error("maxLODsToLoad must be greater than zero");
        }

        const properties = new Array<T>();

        for (let i = ids.length - 1; i >= 0; i--) {
            properties.push(ArrayItem.Get(`${context}/ids/${ids[i]}`, array, ids[i]));
            if (properties.length === this.maxLODsToLoad) {
                return properties;
            }
        }

        properties.push(property);
        return properties;
    }

    private _disposeTransformNode(babylonTransformNode: TransformNode): void {
        const babylonMaterials = new Array<Material>();
        const babylonMaterial = (babylonTransformNode as Mesh).material;
        if (babylonMaterial) {
            babylonMaterials.push(babylonMaterial);
        }
        for (const babylonMesh of babylonTransformNode.getChildMeshes()) {
            if (babylonMesh.material) {
                babylonMaterials.push(babylonMesh.material);
            }
        }

        babylonTransformNode.dispose();

        const babylonMaterialsToDispose = babylonMaterials.filter((babylonMaterial) => this._loader.babylonScene.meshes.every((mesh) => mesh.material != babylonMaterial));
        this._disposeMaterials(babylonMaterialsToDispose);
    }

    private _disposeMaterials(babylonMaterials: Material[]): void {
        const babylonTextures: { [uniqueId: number]: BaseTexture } = {};

        for (const babylonMaterial of babylonMaterials) {
            for (const babylonTexture of babylonMaterial.getActiveTextures()) {
                babylonTextures[babylonTexture.uniqueId] = babylonTexture;
            }

            babylonMaterial.dispose();
        }

        for (const uniqueId in babylonTextures) {
            for (const babylonMaterial of this._loader.babylonScene.materials) {
                if (babylonMaterial.hasTexture(babylonTextures[uniqueId])) {
                    delete babylonTextures[uniqueId];
                }
            }
        }

        for (const uniqueId in babylonTextures) {
            babylonTextures[uniqueId].dispose();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new MSFT_lod(loader));