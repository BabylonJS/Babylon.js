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

        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean {
            var material = GLTFLoader.LoadMaterial(runtime, index);
            if (!material || !material.extensions) return false;

            var properties: IGLTFMaterialsPbrSpecularGlossiness = material.extensions[this.name];
            if (!properties) return false;

            //
            // Load Factors
            //

            material.babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;

            //
            // Load Textures
            //

            var commonMaterialPropertiesSuccess = false;

            var checkSuccess = () => {
                if ((!properties.diffuseTexture || material.babylonMaterial.albedoTexture) &&
                    (!properties.specularGlossinessTexture || material.babylonMaterial.reflectivityTexture) &&
                    commonMaterialPropertiesSuccess) {
                    onSuccess();
                }
            };

            if (properties.diffuseTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.diffuseTexture,
                    texture => {
                        material.babylonMaterial.albedoTexture = texture;
                        GLTFLoader.LoadAlphaProperties(runtime, material);
                        checkSuccess();
                    },
                    () => {
                        Tools.Warn("Failed to load diffuse texture");
                        onError();
                    });
            }

            if (properties.specularGlossinessTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.specularGlossinessTexture,
                    texture => {
                        material.babylonMaterial.reflectivityTexture = texture;
                        material.babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                        checkSuccess();
                    },
                    () => {
                        Tools.Warn("Failed to load metallic roughness texture");
                        onError();
                    });
            }

            GLTFLoader.LoadCommonMaterialPropertiesAsync(runtime, material,
                () => {
                    commonMaterialPropertiesSuccess = true;
                    checkSuccess();
                }, onError);

            return true;
        }
    }

    GLTFLoader.RegisterExtension(new GLTFMaterialsPbrSpecularGlossinessExtension());
}
