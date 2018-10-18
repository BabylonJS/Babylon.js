/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "KHR_materials_unlit";

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
     */
    export class KHR_materials_unlit implements IGLTFLoaderExtension {
        /** The name of this extension. */
        public readonly name = NAME;

        /** Defines whether this extension is enabled. */
        public enabled = true;

        private _loader: GLTFLoader;

        /** @hidden */
        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        /** @hidden */
        public dispose() {
            delete this._loader;
        }

        /** @hidden */
        public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return GLTFLoader.LoadExtensionAsync(context, material, this.name, () => {
                return this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
            });
        }

        private _loadUnlitPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Promise<void> {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                throw new Error(`${context}: Material type not supported`);
            }

            const promises = new Array<Promise<any>>();

            babylonMaterial.unlit = true;

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
                    promises.push(this._loader.loadTextureInfoAsync(`${context}/baseColorTexture`, properties.baseColorTexture, (texture) => {
                        babylonMaterial.albedoTexture = texture;
                        return Promise.resolve();
                    }));
                }
            }

            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);

            return Promise.all(promises).then(() => {});
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_unlit(loader));
}