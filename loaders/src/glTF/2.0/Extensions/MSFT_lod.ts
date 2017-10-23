/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    interface IMSFTLOD {
        ids: number[];
    }

    // See https://github.com/sbtron/glTF/tree/MSFT_lod/extensions/Vendor/MSFT_lod for more information about this extension.
    export class MSFTLOD extends GLTFLoaderExtension {
        /**
         * Specify the minimal delay between LODs in ms (default = 250)
         */
        public static MinimalLODDelay = 250;

        public get name() {
            return "MSFT_lod";
        }

        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean {
            return this._loadExtension<IMSFTLOD>(node, (extension, onComplete) => {
                for (let i = extension.ids.length - 1; i >= 0; i--) {
                    const lodNode = GLTFUtils.GetArrayItem(loader._gltf.nodes, extension.ids[i]);
                    if (!lodNode) {
                        throw new Error(context + ": Failed to find node " + extension.ids[i]);
                    }

                    loader._traverseNode(context, lodNode, action, parentNode);
                }

                loader._traverseNode(context, node, action, parentNode);
                onComplete();
            });
        }

        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean {
            return this._loadExtension<IMSFTLOD>(node, (extension, onComplete) => {
                const nodes = [node.index, ...extension.ids].map(index => loader._gltf.nodes[index]);

                loader._addLoaderPendingData(node);
                this._loadNodeLOD(loader, context, nodes, nodes.length - 1, () => {
                    loader._removeLoaderPendingData(node);
                    onComplete();
                });
            });
        }

        private _loadNodeLOD(loader: GLTFLoader, context: string, nodes: IGLTFNode[], index: number, onComplete: () => void): void {
            loader._whenAction(() => {
                loader._loadNode(context, nodes[index]);
            }, () => {
                if (index !== nodes.length - 1) {
                    const previousNode = nodes[index + 1];
                    previousNode.babylonMesh.setEnabled(false);
                }

                if (index === 0) {
                    onComplete();
                    return;
                }

                setTimeout(() => {
                    loader._tryCatchOnError(() => {
                        this._loadNodeLOD(loader, context, nodes, index - 1, onComplete);
                    });
                }, MSFTLOD.MinimalLODDelay);
            });
        }

        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._loadExtension<IMSFTLOD>(material, (extension, onComplete) => {
                const materials = [material.index, ...extension.ids].map(index => loader._gltf.materials[index]);

                loader._addLoaderPendingData(material);
                this._loadMaterialLOD(loader, context, materials, materials.length - 1, assign, () => {
                    material.extensions[this.name] = extension;
                    loader._removeLoaderPendingData(material);
                    onComplete();
                });
            });
        }

        private _loadMaterialLOD(loader: GLTFLoader, context: string, materials: IGLTFMaterial[], index: number, assign: (babylonMaterial: Material, isNew: boolean) => void, onComplete: () => void): void {
            loader._loadMaterial(context, materials[index], (babylonMaterial, isNew) => {
                assign(babylonMaterial, isNew);

                if (index === 0) {
                    onComplete();
                    return;
                }

                // Load the next LOD when the loader is ready to render and
                // all active material textures of the current LOD are loaded.
                loader._executeWhenRenderReady(() => {
                    BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), () => {
                        setTimeout(() => {
                            loader._tryCatchOnError(() => {
                                this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                            });
                        }, MSFTLOD.MinimalLODDelay);
                    });
                });
            });
        }
    }

    GLTFLoader.RegisterExtension(new MSFTLOD());
}