import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { PBR2Material } from "core/Materials/PBR/pbr2Material";
import type { Material } from "core/Materials/material";

import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsClearcoat } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_clearcoat";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_clearcoat extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_clearcoat"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#7F7PN6#8)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_clearcoat implements IGLTFLoaderExtension {
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
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsClearcoat>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadClearCoatPropertiesAsync(extensionContext, extension, babylonMaterial));
            await Promise.all(promises);
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatPropertiesAsync(context: string, properties: IKHRMaterialsClearcoat, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial) && !(babylonMaterial instanceof PBR2Material)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.clearCoat.isEnabled = true;
        babylonMaterial.clearCoat.useRoughnessFromMainTexture = false;
        babylonMaterial.clearCoat.remapF0OnInterfaceChange = false;

        if (properties.clearcoatFactor != undefined) {
            babylonMaterial.clearCoat.intensity = properties.clearcoatFactor;
        } else {
            babylonMaterial.clearCoat.intensity = 0;
        }

        if (properties.clearcoatTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatTexture`, properties.clearcoatTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat)`;
                    babylonMaterial.clearCoat.texture = texture;
                })
            );
        }

        if (properties.clearcoatRoughnessFactor != undefined) {
            babylonMaterial.clearCoat.roughness = properties.clearcoatRoughnessFactor;
        } else {
            babylonMaterial.clearCoat.roughness = 0;
        }

        if (properties.clearcoatRoughnessTexture) {
            (properties.clearcoatRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatRoughnessTexture`, properties.clearcoatRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Roughness)`;
                    babylonMaterial.clearCoat.textureRoughness = texture;
                })
            );
        }

        if (properties.clearcoatNormalTexture) {
            (properties.clearcoatNormalTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatNormalTexture`, properties.clearcoatNormalTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Normal)`;
                    babylonMaterial.clearCoat.bumpTexture = texture;
                })
            );

            babylonMaterial.invertNormalMapX = !babylonMaterial.getScene().useRightHandedSystem;
            babylonMaterial.invertNormalMapY = babylonMaterial.getScene().useRightHandedSystem;
            if (properties.clearcoatNormalTexture.scale != undefined) {
                babylonMaterial.clearCoat.bumpTexture!.level = properties.clearcoatNormalTexture.scale;
            }
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_clearcoat(loader));
