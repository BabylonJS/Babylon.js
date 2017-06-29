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

        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (material: Material) => void): boolean {
            if (!material.extensions) {
                return false;
            }

            var properties = material.extensions[this.name] as IKHRMaterialsPbrSpecularGlossiness;
            if (!properties) {
                return false;
            }

            loader.createPbrMaterial(material);
            loader.loadMaterialBaseProperties(material);

            material.babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;

            if (properties.diffuseTexture) {
                material.babylonMaterial.albedoTexture = loader.loadTexture(properties.diffuseTexture);
                loader.loadMaterialAlphaProperties(material);
            }

            if (properties.specularGlossinessTexture) {
                material.babylonMaterial.reflectivityTexture = loader.loadTexture(properties.specularGlossinessTexture);
                material.babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            assign(material.babylonMaterial);
            return true;
        }
    }

    GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
}
