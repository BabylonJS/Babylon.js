/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "KHR_materials_pbrSpecularGlossiness";

    interface IKHRMaterialsPbrSpecularGlossiness {
        diffuseFactor: number[];
        diffuseTexture: ITextureInfo;
        specularFactor: number[];
        glossinessFactor: number;
        specularGlossinessTexture: ITextureInfo;
    }

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
     */
    export class KHR_materials_pbrSpecularGlossiness extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return this._loadExtensionAsync<IKHRMaterialsPbrSpecularGlossiness>(context, material, (extensionContext, extension) => {
                material._babylonData = material._babylonData || {};
                let babylonData = material._babylonData[babylonDrawMode];
                if (!babylonData) {
                    const promises = new Array<Promise<void>>();

                    const name = material.name || `materialSG_${material._index}`;
                    const babylonMaterial = this._loader._createMaterial(PBRMaterial, name, babylonDrawMode);

                    promises.push(this._loader._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                    promises.push(this._loadSpecularGlossinessPropertiesAsync(extensionContext, material, extension, babylonMaterial));

                    this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                    babylonData = {
                        material: babylonMaterial,
                        meshes: [],
                        loaded: Promise.all(promises).then(() => {})
                    };

                    material._babylonData[babylonDrawMode] = babylonData;
                }

                babylonData.meshes.push(babylonMesh);

                assign(babylonData.material);
                return babylonData.loaded;
            });
        }

        private _loadSpecularGlossinessPropertiesAsync(context: string, material: _ILoaderMaterial, properties: IKHRMaterialsPbrSpecularGlossiness, babylonMaterial: PBRMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

            if (properties.diffuseFactor) {
                babylonMaterial.albedoColor = Color3.FromArray(properties.diffuseFactor);
                babylonMaterial.alpha = properties.diffuseFactor[3];
            }
            else {
                babylonMaterial.albedoColor = Color3.White();
            }

            babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : Color3.White();
            babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;

            if (properties.diffuseTexture) {
                promises.push(this._loader._loadTextureAsync(`${context}/diffuseTexture`, properties.diffuseTexture, texture => {
                    babylonMaterial.albedoTexture = texture;
                }));
            }

            if (properties.specularGlossinessTexture) {
                promises.push(this._loader._loadTextureAsync(`${context}/specularGlossinessTexture`, properties.specularGlossinessTexture, texture => {
                    babylonMaterial.reflectivityTexture = texture;
                }));

                babylonMaterial.reflectivityTexture.hasAlpha = true;
                babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);

            return Promise.all(promises).then(() => {});
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_materials_pbrSpecularGlossiness(loader));
}