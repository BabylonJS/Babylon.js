/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "KHR_materials_unlit";

    /**
     * [Specification](https://github.com/donmccurdy/glTF/tree/feat-khr-materials-cmnConstant/extensions/2.0/Khronos/KHR_materials_unlit) (Experimental)
     */
    export class KHR_materials_unlit extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return this._loadExtensionAsync<{}>(context, material, () => {
                material._babylonData = material._babylonData || {};
                let babylonData = material._babylonData[babylonDrawMode];
                if (!babylonData) {
                    const name = material.name || `materialUnlit_${material._index}`;
                    const babylonMaterial = this._loader._createMaterial(name, babylonDrawMode);
                    babylonMaterial.unlit = true;

                    const promise = this._loadUnlitPropertiesAsync(context, material, babylonMaterial);

                    this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                    babylonData = {
                        material: babylonMaterial,
                        meshes: [],
                        loaded: promise
                    };

                    material._babylonData[babylonDrawMode] = babylonData;
                }

                babylonData.meshes.push(babylonMesh);

                assign(babylonData.material);
                return babylonData.loaded;
            });
        }

        private _loadUnlitPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

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