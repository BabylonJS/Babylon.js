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

        protected loadMaterial(runtime: IGLTFRuntime, index: number): boolean {
            var material = GLTFLoader.LoadMaterial(runtime, index);
            if (!material || !material.extensions) return false;

            var properties: IGLTFMaterialsPbrSpecularGlossiness = material.extensions[this.name];
            if (!properties) return false;

            material.babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;

            if (properties.diffuseTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.diffuseTexture,
                    texture => {
                        material.babylonMaterial.albedoTexture = texture;
                        GLTFLoader.LoadAlphaProperties(runtime, material);
                    },
                    () => {
                        Tools.Warn("Failed to load diffuse texture");
                    });
            }

            if (properties.specularGlossinessTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.specularGlossinessTexture,
                    texture => {
                        material.babylonMaterial.reflectivityTexture = texture;
                        material.babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    },
                    () => {
                        Tools.Warn("Failed to load metallic roughness texture");
                    });
            }

            GLTFLoader.LoadCommonMaterialProperties(runtime, material);
            return true;
        }
    }

    GLTFLoader.RegisterExtension(new GLTFMaterialsPbrSpecularGlossinessExtension());
}
