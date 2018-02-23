/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../../dist/preview release/materialsLibrary/babylon.unlitMaterial.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/donmccurdy/glTF/blob/feat-khr-materials-cmnConstant/extensions/Khronos/KHR_materials_unlit

    const NAME = "KHR_materials_unlit";

    export class KHR_materials_unlit extends GLTFLoaderExtension {
        public readonly name = NAME;

        constructor(loader: GLTFLoader) {
            super(loader);

            // Disable extension if unlit material is not available.
            if (!UnlitMaterial) {
                this.enabled = false;
            }
        }

        protected _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh): Nullable<Promise<void>> {
            return this._loadExtensionAsync<{}>(context, material, context => {
                material._babylonMeshes = material._babylonMeshes || [];
                material._babylonMeshes.push(babylonMesh);

                if (material._loaded) {
                    babylonMesh.material = material._babylonMaterial!;
                    return material._loaded;
                }

                const babylonMaterial = new UnlitMaterial(material.name || "material" + material._index, this._loader._babylonScene);
                babylonMaterial.sideOrientation = this._loader._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;

                material._babylonMaterial = babylonMaterial;

                const promise = this._loadUnlitPropertiesAsync(context, material);

                this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                babylonMesh.material = babylonMaterial;

                return (material._loaded = promise);
            });
        }

        private _loadUnlitPropertiesAsync(context: string, material: ILoaderMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

            const babylonMaterial = material._babylonMaterial as UnlitMaterial;

            const properties = material.pbrMetallicRoughness;
            if (properties) {
                if (properties.baseColorFactor) {
                    babylonMaterial.diffuseColor = Color3.FromArray(properties.baseColorFactor);
                    babylonMaterial.alpha = properties.baseColorFactor[3];
                }
                else {
                    babylonMaterial.diffuseColor = Color3.White();
                }

                if (properties.baseColorTexture) {
                    promises.push(this._loader._loadTextureAsync(context + "/baseColorTexture", properties.baseColorTexture, texture => {
                        babylonMaterial.diffuseTexture = texture;
                    }));
                }
            }

            const alphaMode = material.alphaMode || MaterialAlphaMode.OPAQUE;
            switch (alphaMode) {
                case MaterialAlphaMode.OPAQUE: {
                    babylonMaterial.transparencyMode = Material.TRANSPARENCYMODE_OPAQUE;
                    break;
                }
                case MaterialAlphaMode.MASK: {
                    babylonMaterial.transparencyMode = Material.TRANSPARENCYMODE_ALPHATEST;
                    babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                    if (babylonMaterial.diffuseTexture) {
                        babylonMaterial.diffuseTexture.hasAlpha = true;
                    }
                    break;
                }
                case MaterialAlphaMode.BLEND: {
                    babylonMaterial.transparencyMode = Material.TRANSPARENCYMODE_ALPHABLEND;
                    if (babylonMaterial.diffuseTexture) {
                        babylonMaterial.diffuseTexture.hasAlpha = true;
                    }
                    break;
                }
                default: {
                    throw new Error(context + ": Invalid alpha mode " + material.alphaMode);
                }
            }

            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
            }

            return Promise.all(promises).then(() => {});
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_materials_unlit(loader));
}