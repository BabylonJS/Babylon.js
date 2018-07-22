/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_sRGBFactors";

    /** @hidden */
    export class MSFT_sRGBFactors extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return this._loadExtrasValueAsync<boolean>(context, material, (extensionContext, value) => {
                if (value) {
                    const promise = this._loader._loadMaterialPropertiesAsync(context, material, babylonMaterial);
                    this._convertColorsToLinear(babylonMaterial as PBRMaterial);
                    return promise;
                }

                return null;
            });
        }

        private _convertColorsToLinear(babylonMaterial: PBRMaterial): void {
            if (!babylonMaterial.albedoTexture) {
                babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor);
            }

            if (!babylonMaterial.reflectivityTexture) {
                babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor);
            }
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_sRGBFactors(loader));
}