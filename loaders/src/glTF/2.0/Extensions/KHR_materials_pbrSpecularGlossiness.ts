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

        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._loadExtension<IKHRMaterialsPbrSpecularGlossiness>(context, material, (context, extension, onComplete) => {
                loader._createPbrMaterial(material);
                loader._loadMaterialBaseProperties(context, material);
                this._loadSpecularGlossinessProperties(loader, context, material, extension);
                assign(material.babylonMaterial, true);
                onComplete();
            });
        }

        private _loadSpecularGlossinessProperties(loader: GLTFLoader, context: string, material: IGLTFMaterial, properties: IKHRMaterialsPbrSpecularGlossiness): void {
            const babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.albedoColor = properties.diffuseFactor ? Color3.FromArray(properties.diffuseFactor) : new Color3(1, 1, 1);
            babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : new Color3(1, 1, 1);
            babylonMaterial.microSurface = properties.glossinessFactor == null ? 1 : properties.glossinessFactor;

            if (properties.diffuseTexture) {
                const texture = GLTFLoader._GetProperty(loader._gltf.textures, properties.diffuseTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find diffuse texture " + properties.diffuseTexture.index);
                }

                babylonMaterial.albedoTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.diffuseTexture.texCoord);
            }

            if (properties.specularGlossinessTexture) {
                const texture = GLTFLoader._GetProperty(loader._gltf.textures, properties.specularGlossinessTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find diffuse texture " + properties.specularGlossinessTexture.index);
                }

                babylonMaterial.reflectivityTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.specularGlossinessTexture.texCoord);
                babylonMaterial.reflectivityTexture.hasAlpha = true;
                babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            loader._loadMaterialAlphaProperties(context, material, properties.diffuseFactor);
        }
    }

    GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
}