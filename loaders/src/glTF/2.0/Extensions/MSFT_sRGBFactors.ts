/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "MSFT_sRGBFactors";

    /** @hidden */
    export class MSFT_sRGBFactors extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, mesh: _ILoaderMesh, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return this._loadExtrasValueAsync<boolean>(context, material, (extensionContext, value) => {
                if (value) {
                    return this._loader._loadMaterialAsync(context, material, mesh, babylonMesh, babylonDrawMode, (babylonMaterial: PBRMaterial) => {
                        if (!babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor);
                        }

                        if (!babylonMaterial.reflectivityTexture) {
                            babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor);
                        }

                        assign(babylonMaterial);
                    });
                }

                return null;
            });
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_sRGBFactors(loader));
}