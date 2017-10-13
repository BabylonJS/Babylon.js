/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF1 {
    interface IGLTFMaterialsCommonExtensionValues {
        ambient?: number[] | string;
        diffuse?: number[] | string;
        emission?: number[] | string;
        specular?: number[] | string;
        shininess?: number;
        transparency?: number;
    };

    interface IGLTFMaterialsCommonExtension {
        technique: string;
        transparent?: number;
        doubleSided?: boolean;
        values: IGLTFMaterialsCommonExtensionValues;
    };

    interface IGLTFRuntimeCommonExtension {
        lights: {[key: string]: IGLTFLightCommonExtension};
    }

    interface IGLTFLightCommonExtension {
        name: string;
        type: string;

        ambient?: IGLTFAmbientLightCommonExtension;
        point?: IGLTFPointLightCommonExtension;
        directional?: IGLTFDirectionalLightCommonExtension;
        spot?: IGLTFSpotLightCommonExtension;
    };

    interface IGLTFPointLightCommonExtension {
        color: number[];
        constantAttenuation: number;
        linearAttenuation: number;
        quadraticAttenuation: number;
    }

    interface IGLTFAmbientLightCommonExtension {
        color: number[];
    }

    interface IGLTFDirectionalLightCommonExtension {
        color: number[];
    }

    interface IGLTFSpotLightCommonExtension {
        color: number[];
        constantAttenuation: number;
        fallOffAngle: number;
        fallOffExponent: number;
        linearAttenuation: number;
        quadraticAttenuation: number;
    }

    export class GLTFMaterialsCommonExtension extends GLTFLoaderExtension {

        constructor() {
            super("KHR_materials_common");
        }

        public loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): boolean {
            if (!gltfRuntime.extensions) return false;

            var extension: IGLTFRuntimeCommonExtension = gltfRuntime.extensions[this.name];
            if (!extension) return false;

            // Create lights
            var lights = extension.lights;
            if (lights) {
                for (var thing in lights) {
                    var light: IGLTFLightCommonExtension = lights[thing];

                    switch (light.type) {
                        case "ambient":
                            var ambientLight = new HemisphericLight(light.name, new Vector3(0, 1, 0), gltfRuntime.scene);
                            var ambient = light.ambient;
                            ambientLight.diffuse = Color3.FromArray(ambient.color || [1, 1, 1]);
                            break;
                        case "point":
                            var pointLight = new PointLight(light.name, new Vector3(10, 10, 10), gltfRuntime.scene);
                            var point = light.point;
                            pointLight.diffuse = Color3.FromArray(point.color || [1, 1, 1]);
                            break;
                        case "directional":
                            var dirLight = new DirectionalLight(light.name, new Vector3(0, -1, 0), gltfRuntime.scene);
                            var directional = light.directional;
                            dirLight.diffuse = Color3.FromArray(directional.color || [1, 1, 1]);
                            break;
                        case "spot":
                            var spot = light.spot;
                            var spotLight = new SpotLight(light.name, new Vector3(0, 10, 0), new Vector3(0, -1, 0),
                                                          light.spot.fallOffAngle || Math.PI,
                                                          light.spot.fallOffExponent || 0.0,
                                                          gltfRuntime.scene);
                            spotLight.diffuse = Color3.FromArray(spot.color || [1, 1, 1]);
                            break;
                        default: Tools.Warn("GLTF Material Common extension: light type \"" + light.type + "\” not supported"); break;
                    }
                }
            }

            return false;
        }

        public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): boolean {
            var material: IGLTFMaterial = gltfRuntime.materials[id];
            if (!material || !material.extensions) return false;

            var extension: IGLTFMaterialsCommonExtension = material.extensions[this.name];
            if (!extension) return false;

            var standardMaterial = new StandardMaterial(id, gltfRuntime.scene);
            standardMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;

            if (extension.technique === "CONSTANT") {
                standardMaterial.disableLighting = true;
            }

            standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
            standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
            standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;
            
            // Ambient
            if (typeof extension.values.ambient === "string") {
                this._loadTexture(gltfRuntime, extension.values.ambient, standardMaterial, "ambientTexture", onError);
            }
            else {
                standardMaterial.ambientColor = Color3.FromArray(extension.values.ambient || [0, 0, 0]);
            }

            // Diffuse
            if (typeof extension.values.diffuse === "string") {
                this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onError);
            }
            else {
                standardMaterial.diffuseColor = Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
            }

            // Emission
            if (typeof extension.values.emission === "string") {
                this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onError);
            }
            else {
                standardMaterial.emissiveColor = Color3.FromArray(extension.values.emission || [0, 0, 0]);
            }

            // Specular
            if (typeof extension.values.specular === "string") {
                this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onError);
            }
            else {
                standardMaterial.specularColor = Color3.FromArray(extension.values.specular || [0, 0, 0]);
            }

            return true;
        }

        private _loadTexture(gltfRuntime: IGLTFRuntime, id: string, material: StandardMaterial, propertyPath: string, onError: (message: string) => void): void {
            // Create buffer from texture url
            GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, (buffer) => {
                // Create texture from buffer
                GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, (texture) => (<any>material)[propertyPath] = texture, onError);
            }, onError);
        }
    }

    GLTFLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
}
