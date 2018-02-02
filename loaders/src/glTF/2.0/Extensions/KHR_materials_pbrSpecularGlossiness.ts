/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness

    const NAME = "KHR_materials_pbrSpecularGlossiness";

    interface IKHRMaterialsPbrSpecularGlossiness {
        diffuseFactor: number[];
        diffuseTexture: ITextureInfo;
        specularFactor: number[];
        glossinessFactor: number;
        specularGlossinessTexture: ITextureInfo;
    }

    export class KHR_materials_pbrSpecularGlossiness extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>> {
            return this._loadExtensionAsync<IKHRMaterialsPbrSpecularGlossiness>(context, material, (context, extension) => {
                material._babylonMeshes = material._babylonMeshes || [];
                material._babylonMeshes.push(babylonMesh);

                if (material._loaded) {
                    babylonMesh.material = material._babylonMaterial!;
                    return material._loaded;
                }

                const promises = new Array<Promise<void>>();

                const babylonMaterial = this._loader._createMaterial(material);
                material._babylonMaterial = babylonMaterial;

                promises.push(this._loader._loadMaterialBasePropertiesAsync(context, material));
                promises.push(this._loadSpecularGlossinessPropertiesAsync(this._loader, context, material, extension));

                this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                babylonMesh.material = babylonMaterial;

                return (material._loaded = Promise.all(promises).then(() => {}));
            });
        }

        private _loadSpecularGlossinessPropertiesAsync(loader: GLTFLoader, context: string, material: ILoaderMaterial, properties: IKHRMaterialsPbrSpecularGlossiness): Promise<void> {
            const promises = new Array<Promise<void>>();

            const babylonMaterial = material._babylonMaterial as PBRMaterial;

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
                promises.push(loader._loadTextureAsync(context + "/diffuseTexture", properties.diffuseTexture, texture => {
                    babylonMaterial.albedoTexture = texture;
                }));
            }

            if (properties.specularGlossinessTexture) {
                promises.push(loader._loadTextureAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, texture => {
                    babylonMaterial.reflectivityTexture = texture;
                }));

                babylonMaterial.reflectivityTexture.hasAlpha = true;
                babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            loader._loadMaterialAlphaProperties(context, material);

            return Promise.all(promises).then(() => {});
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_materials_pbrSpecularGlossiness(loader));
}