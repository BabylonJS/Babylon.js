import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type {
    IKHRMaterialsClearcoat,
    IKHRMaterialsClearcoatDarkening,
    IKHRMaterialsClearcoatIor,
    IKHRMaterialsClearcoatColor,
    IKHRMaterialsClearcoatAnisotropy,
} from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Color3 } from "core/Maths";

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

            const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_darkening) {
                const darkeningExtension = extension.extensions.KHR_materials_clearcoat_darkening as IKHRMaterialsClearcoatDarkening;
                promises.push(this._loadClearCoatDarkeningPropertiesAsync(extensionContext, darkeningExtension, babylonMaterial));
            }
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_ior) {
                const iorExtension = extension.extensions.KHR_materials_clearcoat_ior as IKHRMaterialsClearcoatIor;
                let ior = 1.5;
                if (iorExtension.clearcoatIor !== undefined) {
                    ior = iorExtension.clearcoatIor;
                }
                adapter.coatIor = ior;
            }
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_anisotropy) {
                const anisotropyExtension = extension.extensions.KHR_materials_clearcoat_anisotropy as IKHRMaterialsClearcoatAnisotropy;
                promises.push(this._loadClearCoatAnisotropyPropertiesAsync(extensionContext, anisotropyExtension, babylonMaterial));
            }
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_color) {
                const colorExtension = extension.extensions.KHR_materials_clearcoat_color as IKHRMaterialsClearcoatColor;
                promises.push(this._loadClearCoatColorPropertiesAsync(extensionContext, colorExtension, babylonMaterial));
            }

            await Promise.all(promises);
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatPropertiesAsync(context: string, properties: IKHRMaterialsClearcoat, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        // Set non-texture properties immediately
        adapter.configureCoat();
        adapter.coatWeight = properties.clearcoatFactor !== undefined ? properties.clearcoatFactor : 0;
        adapter.coatRoughness = properties.clearcoatRoughnessFactor !== undefined ? properties.clearcoatRoughnessFactor : 0;

        // Load textures
        if (properties.clearcoatTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatTexture`, properties.clearcoatTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat)`;
                    adapter.coatWeightTexture = texture;
                })
            );
        }

        if (properties.clearcoatRoughnessTexture) {
            (properties.clearcoatRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatRoughnessTexture`, properties.clearcoatRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Roughness)`;
                    adapter.coatRoughnessTexture = texture;
                })
            );
        }

        if (properties.clearcoatNormalTexture) {
            (properties.clearcoatNormalTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatNormalTexture`, properties.clearcoatNormalTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Normal)`;
                    adapter.geometryCoatNormalTexture = texture;
                    if (properties.clearcoatNormalTexture?.scale != undefined) {
                        adapter.geometryCoatNormalTextureScale = properties.clearcoatNormalTexture.scale;
                    }
                })
            );
            adapter.setNormalMapInversions(!babylonMaterial.getScene().useRightHandedSystem, babylonMaterial.getScene().useRightHandedSystem);
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatDarkeningPropertiesAsync(context: string, properties: IKHRMaterialsClearcoatDarkening, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        adapter.coatDarkening = properties.clearcoatDarkeningFactor !== undefined ? properties.clearcoatDarkeningFactor : 1;

        if (properties.clearcoatDarkeningTexture) {
            (properties.clearcoatDarkeningTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatDarkeningTexture`, properties.clearcoatDarkeningTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Darkening)`;
                    adapter.coatDarkeningTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatColorPropertiesAsync(context: string, properties: IKHRMaterialsClearcoatColor, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();
        const colorFactor = Color3.White();
        if (properties.clearcoatColorFactor !== undefined) {
            colorFactor.fromArray(properties.clearcoatColorFactor);
        }

        adapter.coatColor = colorFactor;

        if (properties.clearcoatColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatColorTexture`, properties.clearcoatColorTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (ClearCoat Color)`;
                    adapter.coatColorTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadClearCoatAnisotropyPropertiesAsync(context: string, properties: IKHRMaterialsClearcoatAnisotropy, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        // Set non-texture properties immediately
        const clearcoatAnisotropyWeight = properties.clearcoatAnisotropyStrength ?? 0;
        const clearcoatAnisotropyAngle = properties.clearcoatAnisotropyRotation ?? 0;

        adapter.coatRoughnessAnisotropy = clearcoatAnisotropyWeight;
        adapter.geometryCoatTangentAngle = clearcoatAnisotropyAngle;

        // Check if this is glTF-style anisotropy
        const extensions = properties.extensions ?? {};
        if (!extensions.EXT_materials_anisotropy_openpbr || !extensions.EXT_materials_anisotropy_openpbr.openPbrAnisotropyEnabled) {
            adapter.configureGltfStyleAnisotropy(true);
        }

        // Load texture if present
        if (properties.clearcoatAnisotropyTexture) {
            (properties.clearcoatAnisotropyTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/clearcoatAnisotropyTexture`, properties.clearcoatAnisotropyTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Clearcoat Anisotropy)`;
                    adapter.geometryCoatTangentTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_clearcoat(loader));
