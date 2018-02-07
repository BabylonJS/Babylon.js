/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/sbtron/glTF/tree/MSFT_lod/extensions/Vendor/MSFT_lod

    const NAME = "MSFT_lod";

    interface IMSFTLOD {
        ids: number[];
    }

    export class MSFT_lod extends GLTFLoaderExtension {
        public readonly name = NAME;

        /**
         * Maximum number of LODs to load, starting from the lowest LOD.
         */
        public maxLODsToLoad = Number.MAX_VALUE;

        private _loadingNodeLOD: Nullable<ILoaderNode> = null;
        private _loadNodeSignals: { [nodeIndex: number]: Deferred<void> } = {};

        private _loadingMaterialLOD: Nullable<ILoaderMaterial> = null;
        private _loadMaterialSignals: { [materialIndex: number]: Deferred<void> } = {};

        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>> {
            return this._loadExtensionAsync<IMSFTLOD>(context, node, (context, extension) => {
                let firstPromise: Promise<void>;

                const nodeLODs = this._getLODs(context, node, this._loader._gltf.nodes, extension.ids);
                for (let indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                    const nodeLOD = nodeLODs[indexLOD];

                    if (indexLOD !== 0) {
                        this._loadingNodeLOD = nodeLOD;
                        this._loadNodeSignals[nodeLOD._index] = new Deferred<void>();
                    }

                    const promise = this._loader._loadNodeAsync("#/nodes/" + nodeLOD._index, nodeLOD).then(() => {
                        if (indexLOD !== 0) {
                            const previousNodeLOD = nodeLODs[indexLOD - 1];
                            previousNodeLOD._babylonMesh!.setEnabled(false);
                        }

                        if (indexLOD !== nodeLODs.length - 1) {
                            const nodeIndex = nodeLODs[indexLOD + 1]._index;
                            this._loadNodeSignals[nodeIndex].resolve();
                            delete this._loadNodeSignals[nodeIndex];
                        }
                    });

                    if (indexLOD === 0) {
                        firstPromise = promise;
                    }
                    else {
                        this._loader._completePromises.push(promise);
                        this._loadingNodeLOD = null;
                    }
                }

                return firstPromise!;
            });
        }

        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>> {
            // Don't load material LODs if already loading a node LOD.
            if (this._loadingNodeLOD) {
                return null;
            }

            return this._loadExtensionAsync<IMSFTLOD>(context, material, (context, extension) => {
                let firstPromise: Promise<void>;

                const materialLODs = this._getLODs(context, material, this._loader._gltf.materials, extension.ids);
                for (let indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                    const materialLOD = materialLODs[indexLOD];

                    if (indexLOD !== 0) {
                        this._loadingMaterialLOD = materialLOD;
                        this._loadMaterialSignals[materialLOD._index] = new Deferred<void>();
                    }

                    const promise = this._loader._loadMaterialAsync("#/materials/" + materialLOD._index, materialLOD, babylonMesh).then(() => {
                        if (indexLOD !== materialLODs.length - 1) {
                            const materialIndex = materialLODs[indexLOD + 1]._index;
                            this._loadMaterialSignals[materialIndex].resolve();
                            delete this._loadMaterialSignals[materialIndex];
                        }
                    });

                    if (indexLOD === 0) {
                        firstPromise = promise;
                    }
                    else {
                        this._loader._completePromises.push(promise);
                        this._loadingMaterialLOD = null;
                    }
                }

                return firstPromise!;
            });
        }

        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> {
            // Defer the loading of uris if loading a material or node LOD.
            if (this._loadingMaterialLOD) {
                const index = this._loadingMaterialLOD._index;
                return this._loadMaterialSignals[index].promise.then(() => {
                    return this._loader._loadUriAsync(context, uri);
                });
            }
            else if (this._loadingNodeLOD) {
                const index = this._loadingNodeLOD._index;
                return this._loadNodeSignals[index].promise.then(() => {
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
                properties.push(GLTFLoader._GetProperty(context + "/ids/" + ids[i], array, ids[i]));
                if (properties.length === this.maxLODsToLoad) {
                    return properties;
                }
            }

            properties.push(property);
            return properties;
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_lod(loader));
}
