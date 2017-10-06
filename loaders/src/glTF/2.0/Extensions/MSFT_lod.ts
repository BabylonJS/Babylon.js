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

        protected _traverseNode(loader: GLTFLoader, index: number, action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean {
            var node = loader._getArrayItem(loader._gltf.nodes, index, "Node");
            if (!node) {
                return true;
            }

            return this._loadExtension<IMSFTLOD>(node, (extension, onComplete) => {
                for (var i = extension.ids.length - 1; i >= 0; i--) {
                    loader._traverseNode(extension.ids[i], action, parentNode);
                }

                loader._traverseNode(index, action, parentNode);
                onComplete();
            });
        }

        protected _loadNode(loader: GLTFLoader, node: IGLTFNode): boolean {
            return this._loadExtension<IMSFTLOD>(node, (extension, onComplete) => {
                var nodes = [node.index, ...extension.ids].map(index => loader._gltf.nodes[index]);

                loader._addLoaderPendingData(node);
                this._loadNodeLOD(loader, nodes, nodes.length - 1, () => {
                    loader._removeLoaderPendingData(node);
                    onComplete();
                });
            });
        }

        private _loadNodeLOD(loader: GLTFLoader, nodes: IGLTFNode[], index: number, onComplete: () => void): void {
            loader._whenAction(() => {
                loader._loadNode(nodes[index]);
            }, () => {
                if (index !== nodes.length - 1) {
                    var previousNode = nodes[index + 1];
                    previousNode.babylonMesh.setEnabled(false);
                }

                if (index === 0) {
                    onComplete();
                    return;
                }

                setTimeout(() => {
                    this._loadNodeLOD(loader, nodes, index - 1, onComplete);
                }, MSFTLOD.MinimalLODDelay);
            });
        }

        protected _loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._loadExtension<IMSFTLOD>(material, (extension, onComplete) => {
                var materials = [material.index, ...extension.ids].map(index => loader._gltf.materials[index]);

                loader._addLoaderPendingData(material);
                this._loadMaterialLOD(loader, materials, materials.length - 1, assign, () => {
                    material.extensions[this.name] = extension;
                    loader._removeLoaderPendingData(material);
                    onComplete();
                });
            });
        }

        private _loadMaterialLOD(loader: GLTFLoader, materials: IGLTFMaterial[], index: number, assign: (babylonMaterial: Material, isNew: boolean) => void, onComplete: () => void): void {
            loader._loadMaterial(materials[index], (babylonMaterial, isNew) => {
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
                            this._loadMaterialLOD(loader, materials, index - 1, assign, onComplete);
                        }, MSFTLOD.MinimalLODDelay);
                    });
                });
            });
        }
    }

    GLTFLoader.RegisterExtension(new MSFTLOD());
}