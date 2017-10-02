/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    interface IKHRMaterialsPbrSpecularGlossiness {
        diffuseFactor: number[];
        diffuseTexture: IGLTFTextureInfo;
        specularFactor: number[];
        glossinessFactor: number;
        specularGlossinessTexture: IGLTFTextureInfo;
    }

    export class KHRMaterialsPbrSpecularGlossiness extends GLTFLoaderExtension {
        public get name(): string {
            return "KHR_materials_pbrSpecularGlossiness";
        }

        protected _loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._loadExtension<IKHRMaterialsPbrSpecularGlossiness>(material, (extension, onComplete) => {
                loader._createPbrMaterial(material);
                loader._loadMaterialBaseProperties(material);
                this._loadSpecularGlossinessProperties(loader, material, extension);
                assign(material.babylonMaterial, true);
            });
        }

        private _loadSpecularGlossinessProperties(loader: GLTFLoader, material: IGLTFMaterial, properties: IKHRMaterialsPbrSpecularGlossiness): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;

            if (properties.diffuseTexture) {
                babylonMaterial.albedoTexture = loader._loadTexture(properties.diffuseTexture);
            }

            if (properties.specularGlossinessTexture) {
                babylonMaterial.reflectivityTexture = loader._loadTexture(properties.specularGlossinessTexture);
                babylonMaterial.reflectivityTexture.hasAlpha = true;
                babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            loader._loadMaterialAlphaProperties(material, properties.diffuseFactor);
        }
    }

    GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
}