module BABYLON {
    /**
    * GLTF PBR Material extension
    */

    // Extension interface
    export interface IGLTFPBRMaterial {
        technique: string;
        values?: Object;
    }

    // Extension class
    export class GLTFPBRMaterial implements IGLTFLoaderExtension<IGLTFPBRMaterial, PBRMaterial> {
        public extensionName: string = "KHR_materials_pbr";

        // If the extension needs the loader to skip its default behavior
        public needToSkipDefaultLoaderBehavior(id: string, extension: IGLTFPBRMaterial): boolean {
            return true;
        }

        // Apply extension (called by GLTF loader)
        public apply(gltfRuntime: IGLTFRuntime, id: string, name: string, extension: IGLTFPBRMaterial, object: PBRMaterial): PBRMaterial {
            var material = this.loadPBRMaterial(gltfRuntime, extension, id, name);

            return material;
        }

        // Load PBR Material
        private loadPBRMaterial(gltfRuntime: IGLTFRuntime, pbrMaterial: IGLTFPBRMaterial, id: string, name: string): PBRMaterial {
            switch (pbrMaterial.technique) {
                case "PBR_specular_glossiness":
                    var specGlossMaterial = new PBRMaterial(name, gltfRuntime.scene);
                    specGlossMaterial.id = id;

                    for (var val in pbrMaterial.values) {
                        var value = pbrMaterial.values[val];
                        switch (val) {
                            case "diffuseFactor":
                                specGlossMaterial.albedoColor = new Color3(value[0], value[1], value[2]);
                                specGlossMaterial.alpha = value[3];
                                break;
                            case "specularFactor":
                                specGlossMaterial.reflectivityColor = new Color3(value[0], value[1], value[2]);
                                break;
                            case "glossinessFactor":
                                specGlossMaterial.microSurface = value;
                                break;
                            case "diffuseTexture":
                                specGlossMaterial.albedoTexture = GLTFUtils.LoadTexture(gltfRuntime, <string>value);
                                specGlossMaterial.useAlphaFromAlbedoTexture = true;
                                break;
                            case "specularGlossinessTexture":
                                specGlossMaterial.reflectivityTexture = GLTFUtils.LoadTexture(gltfRuntime, <string>value);
                                specGlossMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                                break;
                        }
                    }

                    return specGlossMaterial;

                case "PBR_metal_roughness":
                    var metRoughMaterial = new PBRMaterial(name, gltfRuntime.scene);
                    metRoughMaterial.id = id;

                    for (var val in pbrMaterial.values) {
                        var value = pbrMaterial.values[val];
                        switch (val) {
                            case "baseColorFactor":
                                // TODO
                                break;
                            case "metallicFactor":
                                // TODO
                                break;
                            case "roughnessFactor":
                                // TODO
                                break;
                            case "baseColorTexture":
                                // TODO
                                break;
                            case "metallicRoughnessTexture":
                                // TODO
                                break;
                        }
                    }

                    return metRoughMaterial;

                default:
                    // TODO: error handling
                    return null;
            }
        }
    }

    GLTFFileLoader.RegisterExtension(new GLTFPBRMaterial());
}