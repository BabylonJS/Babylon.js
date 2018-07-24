/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_lod";

    interface IMSFTLOD {
        ids: number[];
    }

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
     */
    export class MSFT_lod extends GLTFLoaderExtension {
        public readonly name = NAME;

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

        private _nodeIndexLOD: Nullable<number> = null;
        private _nodeSignalLODs = new Array<Deferred<void>>();
        private _nodePromiseLODs = new Array<Array<Promise<void>>>();

        private _materialIndexLOD: Nullable<number> = null;
        private _materialSignalLODs = new Array<Deferred<void>>();
        private _materialPromiseLODs = new Array<Array<Promise<void>>>();

        public dispose() {
            super.dispose();

            this._nodeIndexLOD = null;
            this._nodeSignalLODs.length = 0;
            this._nodePromiseLODs.length = 0;

            this._materialIndexLOD = null;
            this._materialSignalLODs.length = 0;
            this._materialPromiseLODs.length = 0;

            this.onMaterialLODsLoadedObservable.clear();
            this.onNodeLODsLoadedObservable.clear();
        }

        protected _onReady(): void {
            for (let indexLOD = 0; indexLOD < this._nodePromiseLODs.length; indexLOD++) {
                const promise = Promise.all(this._nodePromiseLODs[indexLOD]).then(() => {
                    if (indexLOD !== 0) {
                        this._loader._parent._endPerformanceCounter(`Node LOD ${indexLOD}`);
                    }

                    this._loader._parent._log(`Loaded node LOD ${indexLOD}`);
                    this.onNodeLODsLoadedObservable.notifyObservers(indexLOD);

                    if (indexLOD !== this._nodePromiseLODs.length - 1) {
                        this._loader._parent._startPerformanceCounter(`Node LOD ${indexLOD + 1}`);
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
                        this._loader._parent._endPerformanceCounter(`Material LOD ${indexLOD}`);
                    }

                    this._loader._parent._log(`Loaded material LOD ${indexLOD}`);
                    this.onMaterialLODsLoadedObservable.notifyObservers(indexLOD);

                    if (indexLOD !== this._materialPromiseLODs.length - 1) {
                        this._loader._parent._startPerformanceCounter(`Material LOD ${indexLOD + 1}`);
                        if (this._materialSignalLODs[indexLOD]) {
                            this._materialSignalLODs[indexLOD].resolve();
                        }
                    }
                });

                this._loader._completePromises.push(promise);
            }
        }

        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>> {
            return this._loadExtensionAsync<IMSFTLOD>(context, node, (extensionContext, extension) => {
                let firstPromise: Promise<void>;

                const nodeLODs = this._getLODs(extensionContext, node, this._loader._gltf.nodes, extension.ids);
                this._loader._parent._logOpen(`${extensionContext}`);

                for (let indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                    const nodeLOD = nodeLODs[indexLOD];

                    if (indexLOD !== 0) {
                        this._nodeIndexLOD = indexLOD;
                        this._nodeSignalLODs[indexLOD] = this._nodeSignalLODs[indexLOD] || new Deferred();
                    }

                    const promise = this._loader._loadNodeAsync(`#/nodes/${nodeLOD._index}`, nodeLOD).then(() => {
                        if (indexLOD !== 0) {
                            const previousNodeLOD = nodeLODs[indexLOD - 1];
                            if (previousNodeLOD._babylonMesh) {
                                previousNodeLOD._babylonMesh.dispose();
                                delete previousNodeLOD._babylonMesh;
                                this._disposeUnusedMaterials();
                            }
                        }
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

                this._loader._parent._logClose();
                return firstPromise!;
            });
        }

        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, mesh: _ILoaderMesh, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            // Don't load material LODs if already loading a node LOD.
            if (this._nodeIndexLOD) {
                return null;
            }

            return this._loadExtensionAsync<IMSFTLOD>(context, material, (extensionContext, extension) => {
                let firstPromise: Promise<void>;

                const materialLODs = this._getLODs(extensionContext, material, this._loader._gltf.materials, extension.ids);
                this._loader._parent._logOpen(`${extensionContext}`);

                for (let indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                    const materialLOD = materialLODs[indexLOD];

                    if (indexLOD !== 0) {
                        this._materialIndexLOD = indexLOD;
                    }

                    const promise = this._loader._loadMaterialAsync(`#/materials/${materialLOD._index}`, materialLOD, mesh, babylonMesh, babylonDrawMode, indexLOD === 0 ? assign : () => {}).then(() => {
                        if (indexLOD !== 0) {
                            const babylonDataLOD = materialLOD._babylonData!;
                            assign(babylonDataLOD[babylonDrawMode].material);

                            const previousBabylonDataLOD = materialLODs[indexLOD - 1]._babylonData!;
                            if (previousBabylonDataLOD[babylonDrawMode]) {
                                previousBabylonDataLOD[babylonDrawMode].material.dispose();
                                delete previousBabylonDataLOD[babylonDrawMode];
                            }
                        }
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

                this._loader._parent._logClose();
                return firstPromise!;
            });
        }

        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> {
            // Defer the loading of uris if loading a material or node LOD.
            if (this._materialIndexLOD !== null) {
                this._loader._parent._log(`deferred`);
                const previousIndexLOD = this._materialIndexLOD - 1;
                this._materialSignalLODs[previousIndexLOD] = this._materialSignalLODs[previousIndexLOD] || new Deferred<void>();
                return this._materialSignalLODs[previousIndexLOD].promise.then(() => {
                    return this._loader._loadUriAsync(context, uri);
                });
            }
            else if (this._nodeIndexLOD !== null) {
                this._loader._parent._log(`deferred`);
                const previousIndexLOD = this._nodeIndexLOD - 1;
                this._nodeSignalLODs[previousIndexLOD] = this._nodeSignalLODs[previousIndexLOD] || new Deferred<void>();
                return this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(() => {
                    return this._loader._loadUriAsync(context, uri);
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
                properties.push(GLTFLoader._GetProperty(`${context}/ids/${ids[i]}`, array, ids[i]));
                if (properties.length === this.maxLODsToLoad) {
                    return properties;
                }
            }

            properties.push(property);
            return properties;
        }

        private _disposeUnusedMaterials(): void {
            const materials = this._loader._gltf.materials;
            if (materials) {
                for (const material of materials) {
                    if (material._babylonData) {
                        for (const drawMode in material._babylonData) {
                            const babylonData = material._babylonData[drawMode];
                            if (babylonData.meshes.length === 0) {
                                babylonData.material.dispose(false, true);
                                delete material._babylonData[drawMode];
                            }
                        }
                    }
                }
            }
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_lod(loader));
}
