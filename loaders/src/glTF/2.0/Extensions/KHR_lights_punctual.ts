import { Nullable } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Color3 } from 'babylonjs/Maths/math.color';
import { DirectionalLight } from "babylonjs/Lights/directionalLight";
import { PointLight } from "babylonjs/Lights/pointLight";
import { SpotLight } from "babylonjs/Lights/spotLight";
import { Light } from "babylonjs/Lights/light";
import { TransformNode } from "babylonjs/Meshes/transformNode";

import { LightType, ILightReference, ILight, ILights } from "babylonjs-gltf2interface";
import { INode } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

const NAME = "KHR_lights_punctual";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual)
 */
export class KHR_lights implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;
    private _lights?: ILight[];

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
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
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<ILightReference, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            return this._loader.loadNodeAsync(context, node, (babylonMesh) => {
                let babylonLight: Light;

                const light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                const name = light.name || babylonMesh.name;

                this._loader.babylonScene._blockEntityCollection = this._loader._forAssetContainer;

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
                        this._loader.babylonScene._blockEntityCollection = false;
                        throw new Error(`${extensionContext}: Invalid light type (${light.type})`);
                    }
                }

                this._loader.babylonScene._blockEntityCollection = false;
                babylonLight.falloffType = Light.FALLOFF_GLTF;
                babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                babylonLight.range = light.range == undefined ? Number.MAX_VALUE : light.range;
                babylonLight.parent = babylonMesh;

                this._loader._babylonLights.push(babylonLight);

                GLTFLoader.AddPointerMetadata(babylonLight, extensionContext);

                assign(babylonMesh);
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_lights(loader));