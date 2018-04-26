/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_sRGBFactors";

    /** @hidden */
    export class MSFT_sRGBFactors extends GLTFLoaderExtension {
        public readonly name = NAME;

        constructor(loader: GLTFLoader) {
            super(loader);

            const materials = loader._gltf.materials;
            if (materials && materials.length) {
                for (const material of materials) {
                    if (material && material.extras && material.extras.MSFT_sRGBFactors) {
                        this._loader.onMaterialLoadedObservable.add(this._onMaterialLoaded);
                        break;
                    }
                }
            }
        }

        private _onMaterialLoaded = (material: PBRMaterial): void => {
            if (!material.albedoTexture) {
                material.albedoColor.toLinearSpaceToRef(material.albedoColor);
            }

            if (!material.reflectivityTexture) {
                material.reflectivityColor.toLinearSpaceToRef(material.reflectivityColor);
            }
        };
    }

    GLTFLoader._Register(NAME, loader => new MSFT_sRGBFactors(loader));
}