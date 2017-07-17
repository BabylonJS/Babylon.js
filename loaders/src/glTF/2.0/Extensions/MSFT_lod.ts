/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    interface IMSFTLOD {
        ids: number[];
    }

    export class MSFTLOD extends GLTFLoaderExtension {
        public get name() {
            return "MSFT_lod";
        }

        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (material: Material) => void): boolean {
            if (!material.extensions) {
                return false;
            }

            var properties = material.extensions[this.name] as IMSFTLOD;
            if (!properties) {
                return false;
            }

            // Clear out the extension so that it won't get loaded again.
            material.extensions[this.name] = undefined;

            // Tell the loader not to clear its state until the highest LOD is loaded.
            loader.addLoaderPendingData(material);

            // Start with the lowest quality LOD.
            var materialLODs = [material.index, ...properties.ids];
            this.loadMaterialLOD(loader, material, materialLODs, materialLODs.length - 1, assign);

            return true;
        }

        private loadMaterialLOD(loader: GLTFLoader, material: IGLTFMaterial, materialLODs: number[], lod: number, assign: (material: Material) => void): void {
            loader.loadMaterial(materialLODs[lod], babylonMaterial => {
                assign(babylonMaterial);

                // Loading is complete if this is the highest quality LOD.
                if (lod === 0) {
                    loader.removeLoaderPendingData(material);
                    return;
                }

                // Load the next LOD when the loader is ready to render and
                // all active material textures of the current LOD are loaded.
                loader.executeWhenRenderReady(() => {
                    BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), () => {
                        this.loadMaterialLOD(loader, material, materialLODs, lod - 1, assign);
                    });
                });
            });

        }
    }

    GLTFLoader.RegisterExtension(new MSFTLOD());
}
