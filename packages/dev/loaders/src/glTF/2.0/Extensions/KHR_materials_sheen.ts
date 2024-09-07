import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from "core/Maths/math.color";
import type { IKHRMaterialsSheen } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_sheen";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_sheen extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_sheen"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_sheen/README.md)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#BNIZX6#4)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_sheen implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * Defines a number that determines the order the extensions are applied.
     */
    public order = 190;

    private _loader: GLTFLoader;

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
    }

    /**
     * @internal
     */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsSheen>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSheenPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => {});
        });
    }

    private _loadSheenPropertiesAsync(context: string, properties: IKHRMaterialsSheen, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.sheen.isEnabled = true;
        babylonMaterial.sheen.intensity = 1;

        if (properties.sheenColorFactor != undefined) {
            babylonMaterial.sheen.color = Color3.FromArray(properties.sheenColorFactor);
        } else {
            babylonMaterial.sheen.color = Color3.Black();
        }

        if (properties.sheenColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/sheenColorTexture`, properties.sheenColorTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Sheen Color)`;
                    babylonMaterial.sheen.texture = texture;
                })
            );
        }

        if (properties.sheenRoughnessFactor !== undefined) {
            babylonMaterial.sheen.roughness = properties.sheenRoughnessFactor;
        } else {
            babylonMaterial.sheen.roughness = 0;
        }

        if (properties.sheenRoughnessTexture) {
            (properties.sheenRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/sheenRoughnessTexture`, properties.sheenRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Sheen Roughness)`;
                    babylonMaterial.sheen.textureRoughness = texture;
                })
            );
        }

        babylonMaterial.sheen.albedoScaling = true;
        babylonMaterial.sheen.useRoughnessFromMainTexture = false;

        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_sheen(loader));
