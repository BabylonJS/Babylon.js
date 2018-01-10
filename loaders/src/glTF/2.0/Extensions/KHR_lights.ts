/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    interface IGLTFLight {
        type: "directional" | "point" | "spot" | "hemisphere";
        color: [number, number, number];
        intensity: number;
        // Runtime values
        index: number;
        babylonLight: Light;
    }

    interface IKHRLights {
        lights: IGLTFLight[];
        // diffuseFactor: number[];
        // diffuseTexture: IGLTFTextureInfo;
        // specularFactor: number[];
        // glossinessFactor: number;
        // specularGlossinessTexture: IGLTFTextureInfo;
    }

    interface IGLTFLightReference {
        light: number;
        babylonLight: Light;
    }

    export class KHRLights extends GLTFLoaderExtension {
        public get name(): string {
            return "KHR_lights";
        }

        private applyCommonProperties(light: Light, lightInfo: IGLTFLight): void {
            if (lightInfo.color) {
                light.diffuse.copyFromFloats(lightInfo.color[0], lightInfo.color[1], lightInfo.color[2]);
            } else {
                light.diffuse.copyFromFloats(1, 1, 1);
            }

            if (lightInfo.intensity !== undefined) {
                light.intensity = lightInfo.intensity;
            } else {
                light.intensity = 1;
            }
        }

        protected _loadScene(loader: GLTFLoader, context: string, scene: IGLTFScene): boolean { 
            return this._loadExtension<IGLTFLightReference>(context, scene, (context, extension, onComplete) => {
                if (extension.light >= 0 && loader._gltf.extensions) {
                    const lightInfo = loader._gltf.extensions.KHR_lights.lights[extension.light];
                    if (lightInfo.type !== 'ambient' && lightInfo.type !== 'hemisphere') {
                        return;
                    }

                    const direction = new Vector3(0, 1, 0);
                    extension.babylonLight = new BABYLON.HemisphericLight("light", direction, loader._babylonScene);

                    this.applyCommonProperties(extension.babylonLight, lightInfo);
                    
                    if (lightInfo.type == 'hemisphere') {
                        const groundColor = lightInfo.hemisphere && lightInfo.hemisphere.groundColor ? lightInfo.hemisphere.groundColor : [1, 1, 1];
                        (extension.babylonLight as HemisphericLight).groundColor.copyFromFloats(groundColor[0], groundColor[1], groundColor[2]);
                    } else {
                        const groundColor = lightInfo.color ? lightInfo.color : [1, 1, 1];
                        (extension.babylonLight as HemisphericLight).groundColor.copyFromFloats(groundColor[0], groundColor[1], groundColor[2]);
                    }
                }
                
                onComplete();
            });
        }

        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean { 
            return this._loadExtension<IGLTFLightReference>(context, node, (context, extension, onComplete) => {
                if (extension.light >= 0 && loader._gltf.extensions) {
                    const lightInfo = loader._gltf.extensions.KHR_lights.lights[extension.light];
                    const name = node.name || 'Light';
                    let position: Vector3 = Vector3.Zero();
                    let rotation: Quaternion = Quaternion.Identity();
                    let scaling: Vector3 = Vector3.One();

                    let matrix;
                    if (node.matrix) {
                        matrix = Matrix.FromArray(node.matrix);
                        matrix.decompose(scaling, rotation, position);
                    } else {
                        matrix = Matrix.Identity();
                    }

                    let direction = new Vector3(1, 0, 0);
                    if (lightInfo.type == 'directional' || lightInfo.type == 'spot') {
                        const rotationMatrix = new Matrix();
                        rotation.toRotationMatrix(rotationMatrix);
                        direction = Vector3.TransformCoordinates(direction, rotationMatrix);
                    }

                    let light: Light;
                    if (lightInfo.type == 'directional') {
                        light = new DirectionalLight(name, direction, loader._babylonScene);
                    } else if (lightInfo.type == 'spot') {
                        // TODO - translate glTF values for spotlight
                        const angle = 90;
                        const exponent = 1;
                        light = new SpotLight(name, position, direction, angle, exponent, loader._babylonScene);
                    } else {
                        light = new PointLight(name, position, loader._babylonScene);
                    }

                    this.applyCommonProperties(light, lightInfo);
                    
                    extension.babylonLight = light;
                    extension.babylonLight.parent = node.parent ? node.parent.babylonMesh : null;
                    
                    if (node.children) {
                        for (const index of node.children) {
                            const childNode = GLTFLoader._GetProperty(loader._gltf.nodes, index);
                            if (!childNode) {
                                throw new Error(context + ": Failed to find child node " + index);
                            }
        
                            loader._loadNode("#/nodes/" + index, childNode);
                        }
                    }
        
                    // this.onMeshLoadedObservable.notifyObservers(node.babylonMesh);
                }
                onComplete();
            });
        }

        protected _loadRoot(loader: GLTFLoader, context: string, root: IGLTF): boolean {
            return this._loadExtension<IKHRLights>(context, root, (context, extension, onComplete) => {
                // GLTFLoader._AssignIndices(loader._gltf.accessors);
                // for (const light of extension.lights) {
                //     this._loadLight(context, light);
                // }
                extension.lights.forEach((light: IGLTFLight, idx: number) => {
                    light.index = idx;
                });
                onComplete();
            });
        }

        // protected _loadExtension<T>(context: string, property: IGLTFProperty, action: (context: string, extension: T, onComplete: () => void) => void): boolean {
        //     return super._loadExtension(context, property, action);
        // }
        
        // protected _loadNode(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
        //     return this._loadExtension<IKHRLights>(context, material, (context, extension, onComplete) => {
        //         loader._createPbrMaterial(material);
        //         loader._loadMaterialBaseProperties(context, material);
        //         // this._loadSpecularGlossinessProperties(loader, context, material, extension);
        //         assign(material.babylonMaterial, true);
        //         onComplete();
        //     });
        // }

        // private _loadLight(context: string, light: IGLTFLight) {
        //     // Create appropriate Babylon.js light
        //     light.babylonLight = undefined;//new DirectionalLight("stuff", new Vector3(0, 1, 0), null);
        // }

    }

    GLTFLoader.RegisterExtension(new KHRLights());
}