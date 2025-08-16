import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsClearcoat } from "babylonjs-gltf2interface";
import { registeredGLTFExtensions, registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { EXT_materials_clearcoat_darkening } from "./EXT_materials_clearcoat_darkening";

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

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

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
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, useOpenPBR: boolean = false): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsClearcoat>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            if (!(babylonMaterial instanceof PBRMaterialClass)) {
                throw new Error(`${context}: Material type not supported`);
            }
            promises.push(this._loadClearCoatPropertiesAsync(extensionContext, extension, babylonMaterial, useOpenPBR));
            if (useOpenPBR && extension.extensions && extension.extensions.EXT_materials_clearcoat_darkening) {
                let darkeningExtension = await registeredGLTFExtensions.get("EXT_materials_clearcoat_darkening")?.factory(this._loader);
                darkeningExtension = darkeningExtension as EXT_materials_clearcoat_darkening;
                if (darkeningExtension && darkeningExtension.enabled && darkeningExtension.loadMaterialPropertiesAsync) {
                    const promise = darkeningExtension.loadMaterialPropertiesAsync(extensionContext, extension as any, babylonMaterial, useOpenPBR);
                    if (promise) {
                        promises.push(promise);
                    }
                }
            }
            await Promise.all(promises);
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatPropertiesAsync(context: string, properties: IKHRMaterialsClearcoat, babylonMaterial: Material, useOpenPBR: boolean = false): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();
        let coatRoughness = 0;
        let coatWeight = 0;
        let coatWeightTexture: Nullable<BaseTexture> = null;
        let coatRoughnessTexture: Nullable<BaseTexture> = null;
        let coatNormalTexture: Nullable<BaseTexture> = null;
        let coatNormalTextureScale = 1;

        if (properties.clearcoatFactor != undefined) {
            coatWeight = properties.clearcoatFactor;
        } else {
            coatWeight = 0;
        }

        if (properties.clearcoatTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatTexture`, properties.clearcoatTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat)`;
                    coatWeightTexture = texture;
                })
            );
        }

        if (properties.clearcoatRoughnessFactor != undefined) {
            coatRoughness = properties.clearcoatRoughnessFactor;
        } else {
            coatRoughness = 0;
        }

        if (properties.clearcoatRoughnessTexture) {
            (properties.clearcoatRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatRoughnessTexture`, properties.clearcoatRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Roughness)`;
                    coatRoughnessTexture = texture;
                })
            );
        }

        if (properties.clearcoatNormalTexture) {
            (properties.clearcoatNormalTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatNormalTexture`, properties.clearcoatNormalTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Normal)`;
                    coatNormalTexture = texture;
                })
            );

            babylonMaterial.invertNormalMapX = !babylonMaterial.getScene().useRightHandedSystem;
            babylonMaterial.invertNormalMapY = babylonMaterial.getScene().useRightHandedSystem;
            if (properties.clearcoatNormalTexture.scale != undefined) {
                coatNormalTextureScale = properties.clearcoatNormalTexture.scale;
            }
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {
            if (useOpenPBR) {
                const material = babylonMaterial as OpenPBRMaterial;
                material.coatWeight = coatWeight;
                material.coatWeightTexture = coatWeightTexture;
                material.coatRoughness = coatRoughness;
                material.coatRoughnessTexture = coatRoughnessTexture;
                // material.coatNormalTexture = coatNormalTexture;
                // material.coatNormalTextureScale = coatNormalTextureScale;
                return;
            }
            const material = babylonMaterial as PBRMaterial;
            material.clearCoat.isEnabled = true;
            material.clearCoat.useRoughnessFromMainTexture = false;
            material.clearCoat.remapF0OnInterfaceChange = false;
            material.clearCoat.intensity = coatWeight;
            material.clearCoat.texture = coatWeightTexture;
            material.clearCoat.roughness = coatRoughness;
            material.clearCoat.textureRoughness = coatRoughnessTexture;

            material.clearCoat.bumpTexture = coatNormalTexture;
            if (coatNormalTexture) {
                material.clearCoat.bumpTexture!.level = coatNormalTextureScale;
            }
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_clearcoat(loader));
