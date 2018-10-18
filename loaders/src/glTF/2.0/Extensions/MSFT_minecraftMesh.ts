/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "MSFT_minecraftMesh";

    /** @hidden */
    export class MSFT_minecraftMesh implements IGLTFLoaderExtension {
        public readonly name = NAME;
        public enabled = true;

        private _loader: GLTFLoader;

        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        public dispose() {
            delete this._loader;
        }

        public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return GLTFLoader.LoadExtraAsync<boolean>(context, material, this.name, (extraContext, extra) => {
                if (extra) {
                    if (!(babylonMaterial instanceof PBRMaterial)) {
                        throw new Error(`${extraContext}: Material type not supported`);
                    }

                    const promise = this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);

                    if (babylonMaterial.needAlphaBlending()) {
                        babylonMaterial.forceDepthWrite = true;
                        babylonMaterial.separateCullingPass = true;
                    }

                    babylonMaterial.backFaceCulling = babylonMaterial.forceDepthWrite;
                    babylonMaterial.twoSidedLighting = true;

                    return promise;
                }

                return null;
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new MSFT_minecraftMesh(loader));
}