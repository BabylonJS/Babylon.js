/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    interface IGLTFLight {
        type: "directional" | "point" | "spot";
        color: [number, number, number];
        intensity: number;
        // Runtime values
        index: number;
    }

    interface IKHRLights {
        lights: IGLTFLight[];
    }

    interface IGLTFLightReference {
        light: number;
        // Runtime values
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
                    if (lightInfo.type !== 'ambient') {
                        return;
                    }

                    const lightColor = lightInfo.color ? lightInfo.color : [1, 1, 1];
                    loader._babylonScene.ambientColor.copyFromFloats(lightColor[0], lightColor[1], lightColor[2]);
                }
                
                onComplete();
            });
        }

        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean { 
            return this._loadExtension<IGLTFLightReference>(context, node, (context, extension, onComplete) => {
                if (extension.light >= 0 && loader._gltf.extensions) {
                    const lightInfo = loader._gltf.extensions.KHR_lights.lights[extension.light];
                    const name = node.name || 'Light';
                    let matrix: Matrix;
                    if (node.matrix) {
                        matrix = Matrix.FromArray(node.matrix);
                    } else {
                        matrix = Matrix.Identity();
                    }

                    const direction = new Vector3(0, 0, 1);
                    if (lightInfo.type == 'directional' || lightInfo.type == 'spot') {
                        const rotationMatrix = matrix.getRotationMatrix();
                        Vector3.TransformCoordinatesToRef(direction, rotationMatrix, direction);
                    }

                    let light: Light;
                    if (lightInfo.type == 'directional') {
                        light = new DirectionalLight(name, direction, loader._babylonScene);
                    } else {
                        const position = matrix.getTranslation();
                        if (lightInfo.type == 'spot') {
                            const angle = lightInfo.spot && lightInfo.spot.outerConeAngle ? lightInfo.spot.outerConeAngle : Math.PI / 2;
                            light = new SpotLight(name, position, direction, angle, 2, loader._babylonScene);
                        } else {
                            light = new PointLight(name, position, loader._babylonScene);
                        }
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
                }
                onComplete();
            });
        }

        protected _loadRoot(loader: GLTFLoader, context: string, root: BABYLON.GLTF2._IGLTF): boolean {
            return this._loadExtension<IKHRLights>(context, root, (context, extension, onComplete) => {
                extension.lights.forEach((light: IGLTFLight, idx: number) => {
                    light.index = idx;
                });
                onComplete();
            });
        }
    }

    GLTFLoader.RegisterExtension(new KHRLights());
}