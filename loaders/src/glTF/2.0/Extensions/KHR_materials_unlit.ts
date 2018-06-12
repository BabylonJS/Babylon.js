/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "KHR_materials_unlit";

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
     */
    export class KHR_materials_unlit extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return this._loadExtensionAsync<{}>(context, material, () => {
                return this._loadUnlitPropertiesAsync(context, material, babylonMaterial as PBRMaterial);
            });
        }

        private _loadUnlitPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

            babylonMaterial.unlit = true;

            // Ensure metallic workflow
            babylonMaterial.metallic = 1;
            babylonMaterial.roughness = 1;

            const properties = material.pbrMetallicRoughness;
            if (properties) {
                if (properties.baseColorFactor) {
                    babylonMaterial.albedoColor = Color3.FromArray(properties.baseColorFactor);
                    babylonMaterial.alpha = properties.baseColorFactor[3];
                }
                else {
                    babylonMaterial.albedoColor = Color3.White();
                }

                if (properties.baseColorTexture) {
                    promises.push(this._loader._loadTextureAsync(`${context}/baseColorTexture`, properties.baseColorTexture, texture => {
                        babylonMaterial.albedoTexture = texture;
                    }));
                }
            }

            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);

            return Promise.all(promises).then(() => {});
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_materials_unlit(loader));
}