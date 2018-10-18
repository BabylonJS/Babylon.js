/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "KHR_lights_punctual";

    enum LightType {
        DIRECTIONAL = "directional",
        POINT = "point",
        SPOT = "spot"
    }

    interface ILightReference {
        light: number;
    }

    interface ILight extends IChildRootProperty {
        type: LightType;
        color?: number[];
        intensity?: number;
        range?: number;
        spot?: {
            innerConeAngle?: number;
            outerConeAngle?: number;
        };
    }

    interface ILights {
        lights: ILight[];
    }

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/blob/1048d162a44dbcb05aefc1874bfd423cf60135a6/extensions/2.0/Khronos/KHR_lights_punctual/README.md) (Experimental)
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
        public loadNodeAsync(context: string, node: INode, assign: (babylonMesh: Mesh) => void): Nullable<Promise<Mesh>> {
            return GLTFLoader.LoadExtensionAsync<ILightReference, Mesh>(context, node, this.name, (extensionContext, extension) => {
                return this._loader.loadNodeAsync(context, node, (babylonMesh) => {
                    let babylonLight: Light;

                    const light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                    const name = light.name || babylonMesh.name;

                    switch (light.type) {
                        case LightType.DIRECTIONAL: {
                            babylonLight = new DirectionalLight(name, Vector3.Backward(), this._loader.babylonScene);
                            break;
                        }
                        case LightType.POINT: {
                            babylonLight = new PointLight(name, Vector3.Zero(), this._loader.babylonScene);
                            break;
                        }
                        case LightType.SPOT: {
                            const babylonSpotLight = new SpotLight(name, Vector3.Zero(), Vector3.Backward(), 0, 1, this._loader.babylonScene);
                            babylonSpotLight.angle = ((light.spot && light.spot.outerConeAngle) || Math.PI / 4) * 2;
                            babylonSpotLight.innerAngle = ((light.spot && light.spot.innerConeAngle) || 0) * 2;
                            babylonLight = babylonSpotLight;
                            break;
                        }
                        default: {
                            throw new Error(`${extensionContext}: Invalid light type (${light.type})`);
                        }
                    }

                    babylonLight.falloffType = Light.FALLOFF_GLTF;
                    babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                    babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                    babylonLight.range = light.range == undefined ? Number.MAX_VALUE : light.range;
                    babylonLight.parent = babylonMesh;

                    assign(babylonMesh);
                });
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_lights(loader));
}