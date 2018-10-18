/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "MSFT_sRGBFactors";

    /** @hidden */
    export class MSFT_sRGBFactors implements IGLTFLoaderExtension {
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

                    if (!babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor);
                    }

                    if (!babylonMaterial.reflectivityTexture) {
                        babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor);
                    }

                    return promise;
                }

                return null;
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new MSFT_sRGBFactors(loader));
}