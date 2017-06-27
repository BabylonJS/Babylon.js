/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    interface IGLTFMaterialsPbrSpecularGlossiness {
        diffuseFactor: number[];
        diffuseTexture: IGLTFTextureInfo;
        specularFactor: number[];
        glossinessFactor: number;
        specularGlossinessTexture: IGLTFTextureInfo;
    }

    export class GLTFMaterialsPbrSpecularGlossinessExtension extends GLTFLoaderExtension {
        constructor() {
            super("KHR_materials_pbrSpecularGlossiness");
        }

        protected loadMaterial(index: number): Material {
            var material = GLTFLoader.LoadMaterial(index);
            if (!material || !material.extensions) return null;

            var properties: IGLTFMaterialsPbrSpecularGlossiness = material.extensions[this.name];
            if (!properties) return null;

            GLTFLoader.LoadCommonMaterialProperties(material);

            //
            // Load Factors
            //

            material.babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;

            //
            // Load Textures
            //

            if (properties.diffuseTexture) {
                material.babylonMaterial.albedoTexture = GLTFLoader.LoadTexture(properties.diffuseTexture);
                GLTFLoader.LoadAlphaProperties(material);
            }

            if (properties.specularGlossinessTexture) {
                material.babylonMaterial.reflectivityTexture = GLTFLoader.LoadTexture(properties.specularGlossinessTexture);
                material.babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            return material.babylonMaterial;
        }
    }

    GLTFLoader.RegisterExtension(new GLTFMaterialsPbrSpecularGlossinessExtension());
}
