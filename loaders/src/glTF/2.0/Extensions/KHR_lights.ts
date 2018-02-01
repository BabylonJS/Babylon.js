/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights

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
    }

    interface ISpotLight extends ILight {
        innerConeAngle?: number;
        outerConeAngle?: number;
    }

    interface ILights {
        lights: ILight[];
    }

    export class KHRLights extends GLTFLoaderExtension {
        protected get _name(): string {
            return NAME;
        }

        protected _loadSceneAsync(context: string, scene: ILoaderScene): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILightReference>(context, scene, (context, extension) => {
                const promise = this._loader._loadSceneAsync(context, scene);

                const light = GLTFLoader._GetProperty(context, this._lights, extension.light);
                if (light.type !== LightType.AMBIENT) {
                    throw new Error(context + ": Only ambient lights are allowed on a scene");
                }

                this._loader._babylonScene.ambientColor = light.color ? Color3.FromArray(light.color) : Color3.Black();

                return promise;
            });
        }

        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILightReference>(context, node, (context, extension) => {
                const promise = this._loader._loadNodeAsync(context, node);

                let babylonLight: Light;

                const light = GLTFLoader._GetProperty(context, this._lights, extension.light);
                const name = node._babylonMesh!.name;
                switch (light.type) {
                    case LightType.AMBIENT: {
                        throw new Error(context + ": Ambient lights are not allowed on a node");
                    }
                    case LightType.DIRECTIONAL: {
                        babylonLight = new DirectionalLight(name, Vector3.Forward(), this._loader._babylonScene);
                        break;
                    }
                    case LightType.POINT: {
                        babylonLight = new PointLight(name, Vector3.Zero(), this._loader._babylonScene);
                        break;
                    }
                    case LightType.SPOT: {
                        const spotLight = light as ISpotLight;
                        // TODO: support inner and outer cone angles
                        //const innerConeAngle = spotLight.innerConeAngle || 0;
                        const outerConeAngle = spotLight.outerConeAngle || Math.PI / 4;
                        babylonLight = new SpotLight(name, Vector3.Zero(), Vector3.Forward(), outerConeAngle, 2, this._loader._babylonScene);
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid light type " + light.type);
                    }
                }

                babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                babylonLight.parent = node._babylonMesh!;

                return promise;
            });
        }

        private get _lights(): Array<ILight> {
            const extensions = this._loader._gltf.extensions;
            if (!extensions || !extensions[this._name]) {
                throw new Error("#/extensions: " + this._name + " not found");
            }

            const extension = extensions[this._name] as ILights;
            return extension.lights;
        }
    }

    GLTFLoader._Register(NAME, loader => new KHRLights(loader));
}