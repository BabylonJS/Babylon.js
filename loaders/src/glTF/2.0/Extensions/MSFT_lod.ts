import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Deferred } from "babylonjs/Misc/deferred";
import { Material } from "babylonjs/Materials/material";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Mesh } from "babylonjs/Meshes/mesh";

import { INode, IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

const NAME = "MSFT_lod";

interface IMSFTLOD {
    ids: number[];
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
 */
export class MSFT_lod implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled = true;

    /**
     * Maximum number of LODs to load, starting from the lowest LOD.
     */
    public maxLODsToLoad = Number.MAX_VALUE;

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

    private _nodeIndexLOD: Nullable<number> = null;
    private _nodeSignalLODs = new Array<Deferred<void>>();
    private _nodePromiseLODs = new Array<Array<Promise<any>>>();

    private _materialIndexLOD: Nullable<number> = null;
    private _materialSignalLODs = new Array<Deferred<void>>();
    private _materialPromiseLODs = new Array<Array<Promise<any>>>();

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
    }

    /** @hidden */
    public dispose() {
        delete this._loader;

        this._nodeIndexLOD = null;
        this._nodeSignalLODs.length = 0;
        this._nodePromiseLODs.length = 0;

        this._materialIndexLOD = null;
        this._materialSignalLODs.length = 0;
        this._materialPromiseLODs.length = 0;

        this.onMaterialLODsLoadedObservable.clear();
        this.onNodeLODsLoadedObservable.clear();
    }

    /** @hidden */
    public onReady(): void {
        for (let indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
            const promise = Promise.all(this._nodePromiseLODs[indexLOD]).then(() => {
                if (indexLOD !== 0) {
                    this._loader.endPerformanceCounter(`Node LOD ${indexLOD}`);
                }

                this._loader.log(`Loaded node LOD ${indexLOD}`);
                this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);

                if (indexLOD !== this._nodePromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Node LOD ${indexLOD + 1}`);
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
                }

                this._loader.log(`Loaded material LOD ${indexLOD}`);
                this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);

                if (indexLOD !== this._materialPromiseLODs.length - 1) {
                    this._loader.startPerformanceCounter(`Material LOD ${indexLOD + 1}`);
                    if (this._materialSignalLODs[indexLOD]) {
                        this._materialSignalLODs[indexLOD].resolve();
                    }
                }
            });

            this._loader._completePromises.push(promise);
        }
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
                        // TODO: should not rely on _babylonMesh
                        const previousNodeLOD = nodeLODs[indexLOD - 1];
                        if (previousNodeLOD._babylonTransformNode) {
                            previousNodeLOD._babylonTransformNode.dispose();
                            delete previousNodeLOD._babylonTransformNode;
                            this._disposeUnusedMaterials();
                        }
                    }

                    babylonMesh.setEnabled(true);
                    return babylonMesh;
                });

                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._nodeIndexLOD = null;
                }

                this._nodePromiseLODs[indexLOD] = this._nodePromiseLODs[indexLOD] || [];
                this._nodePromiseLODs[indexLOD].push(promise);
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
                            previousDataLOD[babylonDrawMode].babylonMaterial.dispose();
                            delete previousDataLOD[babylonDrawMode];
                        }
                    }

                    return babylonMaterial;
                });

                if (indexLOD === 0) {
                    firstPromise = promise;
                }
                else {
                    this._materialIndexLOD = null;
                }

                this._materialPromiseLODs[indexLOD] = this._materialPromiseLODs[indexLOD] || [];
                this._materialPromiseLODs[indexLOD].push(promise);
            }

            this._loader.logClose();
            return firstPromise!;
        });
    }

    /** @hidden */
    public _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> {
        // Defer the loading of uris if loading a material or node LOD.
        if (this._materialIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._materialIndexLOD - 1;
            this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new Deferred<void>();
            return this._materialSignalLODs[previousIndexLOD].promise.then(() => {
                return this._loader.loadUriAsync(context, uri);
            });
        }
        else if (this._nodeIndexLOD !== null) {
            this._loader.log(`deferred`);
            const previousIndexLOD = this._nodeIndexLOD - 1;
            this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new Deferred<void>();
            return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(() => {
                return this._loader.loadUriAsync(context, uri);
            });
        }

        return null;
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

    private _disposeUnusedMaterials(): void {
        // TODO: should not rely on _data
        const materials = this._loader.gltf.materials;
        if (materials) {
            for (const material of materials) {
                if (material._data) {
                    for (const drawMode in material._data) {
                        const data = material._data[drawMode];
                        if (data.babylonMeshes.length === 0) {
                            data.babylonMaterial.dispose(false, true);
                            delete material._data[drawMode];
                        }
                    }
                }
            }
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new MSFT_lod(loader));