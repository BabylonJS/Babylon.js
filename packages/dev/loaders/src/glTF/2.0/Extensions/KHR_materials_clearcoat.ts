import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsClearcoat } from "babylonjs-gltf2interface";
import { registeredGLTFExtensions, registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { KHR_materials_clearcoat_darkening } from "./KHR_materials_clearcoat_darkening";
import type { KHR_materials_clearcoat_color } from "./KHR_materials_clearcoat_color";
import type { KHR_materials_clearcoat_anisotropy } from "./KHR_materials_clearcoat_anisotropy";

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
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_darkening) {
                let darkeningExtension = await registeredGLTFExtensions.get("KHR_materials_clearcoat_darkening")?.factory(this._loader);
                darkeningExtension = darkeningExtension as KHR_materials_clearcoat_darkening;
                if (darkeningExtension && darkeningExtension.enabled && darkeningExtension.loadMaterialPropertiesAsync) {
                    const promise = darkeningExtension.loadMaterialPropertiesAsync(extensionContext, extension as any, babylonMaterial);
                    if (promise) {
                        promises.push(promise);
                    }
                }
            }
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_anisotropy) {
                let anisotropyExtension = await registeredGLTFExtensions.get("KHR_materials_clearcoat_anisotropy")?.factory(this._loader);
                anisotropyExtension = anisotropyExtension as KHR_materials_clearcoat_anisotropy;
                if (anisotropyExtension && anisotropyExtension.enabled && anisotropyExtension.loadMaterialPropertiesAsync) {
                    const promise = anisotropyExtension.loadMaterialPropertiesAsync(extensionContext, extension as any, babylonMaterial);
                    if (promise) {
                        promises.push(promise);
                    }
                }
            }
            if (extension.extensions && extension.extensions.KHR_materials_clearcoat_color) {
                let colorExtension = await registeredGLTFExtensions.get("KHR_materials_clearcoat_color")?.factory(this._loader);
                colorExtension = colorExtension as KHR_materials_clearcoat_color;
                if (colorExtension && colorExtension.enabled && colorExtension.loadMaterialPropertiesAsync) {
                    const promise = colorExtension.loadMaterialPropertiesAsync(extensionContext, extension as any, babylonMaterial);
                    if (promise) {
                        promises.push(promise);
                    }
                }
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
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_clearcoat(loader));
