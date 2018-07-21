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
    export class KHR_lights extends GLTFLoaderExtension {
        public readonly name = NAME;

        private _lights?: ILight[];

        protected _onLoading(): void {
            const extensions = this._loader._gltf.extensions;
            if (extensions && extensions[this.name]) {
                const extension = extensions[this.name] as ILights;
                this._lights = extension.lights;
            }
        }

        protected _loadSceneAsync(context: string, scene: _ILoaderScene): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILightReference>(context, scene, (extensionContext, extension) => {
                const promise = this._loader._loadSceneAsync(extensionContext, scene);

                const light = GLTFLoader._GetProperty(extensionContext, this._lights, extension.light);
                if (light.type !== LightType.AMBIENT) {
                    throw new Error(`${extensionContext}: Only ambient lights are allowed on a scene`);
                }

                this._loader._babylonScene.ambientColor = light.color ? Color3.FromArray(light.color) : Color3.Black();

                return promise;
            });
        }

        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILightReference>(context, node, (extensionContext, extension) => {
                const promise = this._loader._loadNodeAsync(extensionContext, node);

                let babylonLight: Light;

                const light = GLTFLoader._GetProperty(extensionContext, this._lights, extension.light);
                const name = node._babylonMesh!.name;
                switch (light.type) {
                    case LightType.AMBIENT: {
                        throw new Error(`${extensionContext}: Ambient lights are not allowed on a node`);
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
                        // TODO: support inner and outer cone angles
                        //const innerConeAngle = spotLight.innerConeAngle || 0;
                        const outerConeAngle = light.spot && light.spot.outerConeAngle || Math.PI / 4;
                        babylonLight = new SpotLight(name, Vector3.Zero(), Vector3.Forward(), outerConeAngle, 2, this._loader._babylonScene);
                        break;
                    }
                    default: {
                        throw new Error(`${extensionContext}: Invalid light type (${light.type})`);
                    }
                }

                babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                babylonLight.parent = node._babylonMesh!;

                return promise;
            });
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_lights(loader));
}