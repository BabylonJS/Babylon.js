/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { Vector3, Quaternion } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Light } from "core/Lights/light";
import { RectAreaLight } from "core/Lights/rectAreaLight";
import type { TransformNode } from "core/Meshes/transformNode";
import { TransformNode as BabylonTransformNode } from "core/Meshes/transformNode";

import type { IEXTLightsArea_LightReference } from "babylonjs-gltf2interface";
import { EXTLightsArea_LightType } from "babylonjs-gltf2interface";
import type { INode, IEXTLightsArea_Light } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "EXT_lights_area";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_lights_area extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_lights_area"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_lights_area/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_lights_area implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /** hidden */
    private _loader: GLTFLoader;
    private _lights?: IEXTLightsArea_Light[];

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
        delete this._lights;
    }

    /** @internal */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name];
            this._lights = extension.lights;
            ArrayItem.Assign(this._lights);
        }
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IEXTLightsArea_LightReference, TransformNode>(context, node, this.name, async (extensionContext, extension) => {
            this._loader._allMaterialsDirtyRequired = true;

            return await this._loader.loadNodeAsync(context, node, (babylonMesh) => {
                let babylonLight: Light;

                const light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                const name = light.name || babylonMesh.name;

                this._loader.babylonScene._blockEntityCollection = !!this._loader._assetContainer;
                const size = light.size !== undefined ? light.size : 1.0;

                switch (light.type) {
                    case EXTLightsArea_LightType.RECT: {
                        const width = light.rect?.aspect !== undefined ? light.rect.aspect * size : size;
                        const height = size;
                        const babylonRectAreaLight = new RectAreaLight(name, Vector3.Zero(), width, height, this._loader.babylonScene);
                        babylonLight = babylonRectAreaLight;
                        break;
                    }
                    case EXTLightsArea_LightType.DISK: {
                        // For disk lights, we'll use a rectangle light with the same area to approximate the disk light
                        // In the future, this could be extended to support actual disk area lights
                        const newSize = Math.sqrt(size * size * 0.25 * Math.PI); // Area of the disk
                        const babylonRectAreaLight = new RectAreaLight(name, Vector3.Zero(), newSize, newSize, this._loader.babylonScene);
                        babylonLight = babylonRectAreaLight;
                        break;
                    }
                    default: {
                        this._loader.babylonScene._blockEntityCollection = false;
                        throw new Error(`${extensionContext}: Invalid area light type (${light.type})`);
                    }
                }

                babylonLight._parentContainer = this._loader._assetContainer;
                this._loader.babylonScene._blockEntityCollection = false;
                light._babylonLight = babylonLight;

                babylonLight.falloffType = Light.FALLOFF_GLTF;
                babylonLight.diffuse = light.color ? Color3.FromArray(light.color) : Color3.White();
                babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;

                // glTF EXT_lights_area specifies lights face down -Z, but Babylon.js area lights face down +Z
                // Create a parent transform node with 180-degree rotation around Y axis to flip the direction
                const lightParentNode = new BabylonTransformNode(`${name}_orientation`, this._loader.babylonScene);
                lightParentNode.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI);
                lightParentNode.parent = babylonMesh;
                babylonLight.parent = lightParentNode;

                this._loader._babylonLights.push(babylonLight);

                GLTFLoader.AddPointerMetadata(babylonLight, extensionContext);

                assign(babylonMesh);
            });
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_lights_area(loader));
