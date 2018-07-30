/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "KHR_lights";

    enum LightType {
        AMBIENT = "ambient",
        DIRECTIONAL = "directional",
        POINT = "point",
        SPOT = "spot"
    }

    interface ILightReference {
        light: number;
    }

    interface ILight {
        type: LightType;
        color?: number[];
        intensity?: number;
        spot?: {
            innerConeAngle?: number;
            outerConeAngle?: number;
        };
    }

    interface ILights {
        lights: ILight[];
    }

    /**
     * [Specification](https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights) (Experimental)
     */
    export class KHR_lights implements IGLTFLoaderExtension {
        /** The name of this extension. */
        public readonly name = NAME;

        /** Defines whether this extension is enabled. */
        public enabled = true;

        private _loader: GLTFLoader;
        private _lights?: ILight[];

        /** @hidden */
        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        /** @hidden */
        public dispose() {
            delete this._loader;
            delete this._lights;
        }

        /** @hidden */
        public onLoading(): void {
            const extensions = this._loader.gltf.extensions;
            if (extensions && extensions[this.name]) {
                const extension = extensions[this.name] as ILights;
                this._lights = extension.lights;
            }
        }

        /** @hidden */
        public loadSceneAsync(context: string, scene: ILoaderScene): Nullable<Promise<void>> { 
            return GLTFLoader.LoadExtensionAsync<ILightReference>(context, scene, this.name, (extensionContext, extension) => {
                const promise = this._loader.loadSceneAsync(context, scene);

                const light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                if (light.type !== LightType.AMBIENT) {
                    throw new Error(`${extensionContext}: Only ambient lights are allowed on a scene`);
                }

                this._loader.babylonScene.ambientColor = light.color ? Color3.FromArray(light.color) : Color3.Black();

                return promise;
            });
        }

        /** @hidden */
        public loadNodeAsync(context: string, node: ILoaderNode, assign: (babylonMesh: Mesh) => void): Nullable<Promise<Mesh>> { 
            return GLTFLoader.LoadExtensionAsync<ILightReference, Mesh>(context, node, this.name, (extensionContext, extension) => {
                return this._loader.loadNodeAsync(context, node, babylonMesh => {
                    let babylonLight: Light;

                    const name = babylonMesh.name;
                    const light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                    switch (light.type) {
                        case LightType.AMBIENT: {
                            throw new Error(`${extensionContext}: Ambient lights are not allowed on a node`);
                        }
                        case LightType.DIRECTIONAL: {
                            babylonLight = new DirectionalLight(name, Vector3.Forward(), this._loader.babylonScene);
                            break;
                        }
                        case LightType.POINT: {
                            babylonLight = new PointLight(name, Vector3.Zero(), this._loader.babylonScene);
                            break;
                        }
                        case LightType.SPOT: {
                            // TODO: support inner and outer cone angles
                            //const innerConeAngle = spotLight.innerConeAngle || 0;
                            const outerConeAngle = light.spot && light.spot.outerConeAngle || Math.PI / 4;
                            babylonLight = new SpotLight(name, Vector3.Zero(), Vector3.Forward(), outerConeAngle, 2, this._loader.babylonScene);
                            break;
                        }
                        default: {
                            throw new Error(`${extensionContext}: Invalid light type (${light.type})`);
                        }
                    }

                    babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                    babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                    babylonLight.parent = babylonMesh;

                    assign(babylonMesh);
                });
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, loader => new KHR_lights(loader));
}