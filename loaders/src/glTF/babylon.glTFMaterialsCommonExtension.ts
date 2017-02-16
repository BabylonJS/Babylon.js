/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
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
        lights: Object;
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

    export class GLTFMaterialsCommonExtension extends GLTFFileLoaderExtension {

        constructor() {
            super("KHR_materials_common");
        }

        protected postCreateRuntime(runtime: IGLTFRuntime): void {
            if (!runtime.gltf.extensions) return;

            var extension = runtime.gltf.extensions[this.name];
            if (!extension) return;

            // Create lights
            var lights: IGLTFRuntimeCommonExtension = extension.lights;
            if (lights) {
                for (var thing in lights) {
                    var light: IGLTFLightCommonExtension = lights[thing];

                    switch (light.type) {
                        case "ambient":
                            var ambientLight = new HemisphericLight(light.name, new Vector3(0, 1, 0), runtime.babylonScene);
                            var ambient = light.ambient;
                            ambientLight.diffuse = Color3.FromArray(ambient.color || [1, 1, 1]);
                            break;
                        case "point":
                            var pointLight = new PointLight(light.name, new Vector3(10, 10, 10), runtime.babylonScene);
                            var point = light.point;
                            pointLight.diffuse = Color3.FromArray(point.color || [1, 1, 1]);
                            break;
                        case "directional":
                            var dirLight = new DirectionalLight(light.name, new Vector3(0, -1, 0), runtime.babylonScene);
                            var directional = light.directional;
                            dirLight.diffuse = Color3.FromArray(directional.color || [1, 1, 1]);
                            break;
                        case "spot":
                            var spot = light.spot;
                            var spotLight = new SpotLight(light.name, new Vector3(0, 10, 0), new Vector3(0, -1, 0),
                                                          light.spot.fallOffAngle || Math.PI,
                                                          light.spot.fallOffExponent || 0.0,
                                                          runtime.babylonScene);
                            spotLight.diffuse = Color3.FromArray(spot.color || [1, 1, 1]);
                            break;
                        default: Tools.Warn("GLTF Materials Common extension: light type \"" + light.type + "\” not supported"); break;
                    }
                }
            }
        }

        protected loadMaterial(runtime: IGLTFRuntime, index: number): boolean {
            var material = runtime.gltf.materials[index];
            if (!material || !material.extensions) return false;

            var extension: IGLTFMaterialsCommonExtension = material.extensions[this.name];
            if (!extension) return false;

            var standardMaterial = new StandardMaterial(material.name || "mat" + index, runtime.babylonScene);
            standardMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;

            if (extension.technique === "CONSTANT") {
                standardMaterial.disableLighting = true;
            }

            standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
            standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
            standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;

            /*
            // Ambient
            if (typeof extension.values.ambient === "string") {
                this._loadTexture(runtime, extension.values.ambient, standardMaterial, "ambientTexture", onError);
            }
            else {
                standardMaterial.ambientColor = Color3.FromArray(extension.values.ambient || [0, 0, 0]);
            }

            // Diffuse
            if (typeof extension.values.diffuse === "string") {
                this._loadTexture(runtime, extension.values.diffuse, standardMaterial, "diffuseTexture", onError);
            }
            else {
                standardMaterial.diffuseColor = Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
            }

            // Emission
            if (typeof extension.values.emission === "string") {
                this._loadTexture(runtime, extension.values.emission, standardMaterial, "emissiveTexture", onError);
            }
            else {
                standardMaterial.emissiveColor = Color3.FromArray(extension.values.emission || [0, 0, 0]);
            }

            // Specular
            if (typeof extension.values.specular === "string") {
                this._loadTexture(runtime, extension.values.specular, standardMaterial, "specularTexture", onError);
            }
            else {
                standardMaterial.specularColor = Color3.FromArray(extension.values.specular || [0, 0, 0]);
            }
            */

            return true;
        }

        /*
        private _loadTexture(runtime: IGLTFRuntime, id: string, material: StandardMaterial, propertyPath: string, onError: () => void): void {
            // Create buffer from texture url
            GLTFFileLoaderBase.LoadTextureBufferAsync(runtime, id, (buffer) => {
                // Create texture from buffer
                GLTFFileLoaderBase.CreateTextureAsync(runtime, id, buffer, (texture) => material[propertyPath] = texture, onError);
            }, onError);
        }
        */
    }

    GLTFFileLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
}
