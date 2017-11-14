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
        public Delay = 250;

        public get name() {
            return "MSFT_lod";
        }

        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean {
            return this._loadExtension<IMSFTLOD>(context, node, (context, extension, onComplete) => {
                for (let i = extension.ids.length - 1; i >= 0; i--) {
                    const lodNode = GLTFLoader._GetProperty(loader._gltf.nodes, extension.ids[i]);
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
            return this._loadExtension<IMSFTLOD>(context, node, (context, extension, onComplete) => {
                const nodes = [node];
                for (let index of extension.ids) {
                    const lodNode = GLTFLoader._GetProperty(loader._gltf.nodes, index);
                    if (!lodNode) {
                        throw new Error(context + ": Failed to find node " + index);
                    }

                    nodes.push(lodNode);
                }

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
                }, this.Delay);
            });
        }

        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._loadExtension<IMSFTLOD>(context, material, (context, extension, onComplete) => {
                const materials = [material];
                for (let index of extension.ids) {
                    const lodMaterial = GLTFLoader._GetProperty(loader._gltf.materials, index);
                    if (!lodMaterial) {
                        throw new Error(context + ": Failed to find material " + index);
                    }

                    materials.push(lodMaterial);
                }

                loader._addLoaderPendingData(material);
                this._loadMaterialLOD(loader, context, materials, materials.length - 1, assign, () => {
                    loader._removeLoaderPendingData(material);
                    onComplete();
                });
            });
        }

        private _loadMaterialLOD(loader: GLTFLoader, context: string, materials: IGLTFMaterial[], index: number, assign: (babylonMaterial: Material, isNew: boolean) => void, onComplete: () => void): void {
            loader._loadMaterial(context, materials[index], (babylonMaterial, isNew) => {
                if (index === materials.length - 1) {
                    assign(babylonMaterial, isNew);

                    // Load the next LOD when the loader is ready to render.
                    loader._executeWhenRenderReady(() => {
                        this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                    });
                }
                else {
                    BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), () => {
                        assign(babylonMaterial, isNew);

                        if (index === 0) {
                            onComplete();
                        }
                        else {
                            setTimeout(() => {
                                loader._tryCatchOnError(() => {
                                    this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                                });
                            }, this.Delay);
                        }
                    });
                }
            });
        }
    }

    GLTFLoader.RegisterExtension(new MSFTLOD());
}