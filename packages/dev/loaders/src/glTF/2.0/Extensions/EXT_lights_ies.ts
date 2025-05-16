/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { SpotLight } from "core/Lights/spotLight";
import { Light } from "core/Lights/light";
import type { TransformNode } from "core/Meshes/transformNode";

import type { IEXTLightsIES_LightReference } from "babylonjs-gltf2interface";
import type { IEXTLightsIES_Light, INode } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Texture } from "core/Materials/Textures/texture";

const NAME = "EXT_lights_ies";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_lights_ies extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_lights_ies"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_lights_ies)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_lights_ies implements IGLTFLoaderExtension {
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
    private _lights?: IEXTLightsIES_Light[];

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
    // eslint-disable-next-line no-restricted-syntax
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IEXTLightsIES_LightReference, TransformNode>(context, node, this.name, async (extensionContext, extension) => {
            this._loader._allMaterialsDirtyRequired = true;

            let babylonSpotLight: SpotLight;
            let light: IEXTLightsIES_Light;

            const transformNode = await this._loader.loadNodeAsync(context, node, (babylonMesh) => {
                light = ArrayItem.Get(extensionContext, this._lights, extension.light);
                const name = light.name || babylonMesh.name;

                this._loader.babylonScene._blockEntityCollection = !!this._loader._assetContainer;

                babylonSpotLight = new SpotLight(name, Vector3.Zero(), Vector3.Backward(), 0, 1, this._loader.babylonScene);
                babylonSpotLight.angle = Math.PI / 2;
                babylonSpotLight.innerAngle = 0;

                babylonSpotLight._parentContainer = this._loader._assetContainer;
                this._loader.babylonScene._blockEntityCollection = false;
                light._babylonLight = babylonSpotLight;

                babylonSpotLight.falloffType = Light.FALLOFF_GLTF;
                babylonSpotLight.diffuse = extension.color ? Color3.FromArray(extension.color) : Color3.White();
                babylonSpotLight.intensity = extension.multiplier || 1;
                babylonSpotLight.range = Number.MAX_VALUE;
                babylonSpotLight.parent = babylonMesh;

                this._loader._babylonLights.push(babylonSpotLight);

                GLTFLoader.AddPointerMetadata(babylonSpotLight, extensionContext);

                assign(babylonMesh);
            });

            // Load the profile
            let bufferData: ArrayBufferView;
            if (light!.uri) {
                bufferData = await this._loader.loadUriAsync(context, light!, light!.uri);
            } else {
                const bufferView = ArrayItem.Get(`${context}/bufferView`, this._loader.gltf.bufferViews, light!.bufferView);
                bufferData = await this._loader.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView);
            }
            babylonSpotLight!.iesProfileTexture = new Texture(
                name + "_iesProfile",
                this._loader.babylonScene,
                true,
                false,
                undefined,
                null,
                null,
                bufferData,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                ".ies"
            );

            return transformNode;
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_lights_ies(loader));
