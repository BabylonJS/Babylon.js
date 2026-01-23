import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsCoat } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Color3 } from "core/Maths/math.color";

const NAME = "KHR_materials_coat";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_coat extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_coat"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/6cb2cb84b504c245c49cf2e9a8ae16d26f72ac97/extensions/2.0/Khronos/KHR_materials_coat/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_coat implements IGLTFLoaderExtension {
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
    public order = 191;

    private _loader: GLTFLoader;

    /**
     * Defines whether the KHR_materials_openpbr extension is used, indicating that
     * the material should be interpreted as OpenPBR (for coat, this might be necessary
     * to interpret anisotropy correctly).
     */
    private useOpenPBR: boolean = false;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsCoat>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            if (material.extensions && material.extensions["KHR_materials_openpbr"]) {
                this.useOpenPBR = true;
            }
            promises.push(this._loadCoatPropertiesAsync(extensionContext, extension, babylonMaterial));
            await Promise.all(promises);
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadCoatPropertiesAsync(context: string, properties: IKHRMaterialsCoat, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        // Set non-texture properties immediately
        adapter.configureCoat();
        adapter.coatWeight = properties.coatFactor !== undefined ? properties.coatFactor : 0;
        adapter.coatRoughness = properties.coatRoughnessFactor !== undefined ? properties.coatRoughnessFactor : 0;

        // Load textures
        if (properties.coatTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/coatTexture`, properties.coatTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Coat)`;
                    adapter.coatWeightTexture = texture;
                })
            );
        }

        if (properties.coatRoughnessTexture) {
            (properties.coatRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/coatRoughnessTexture`, properties.coatRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Coat Roughness)`;
                    adapter.coatRoughnessTexture = texture;
                })
            );
        }

        if (properties.coatNormalTexture) {
            (properties.coatNormalTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/coatNormalTexture`, properties.coatNormalTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Coat Normal)`;
                    adapter.geometryCoatNormalTexture = texture;
                    if (properties.coatNormalTexture?.scale != undefined) {
                        adapter.geometryCoatNormalTextureScale = properties.coatNormalTexture.scale;
                    }
                })
            );
            adapter.setNormalMapInversions(!babylonMaterial.getScene().useRightHandedSystem, babylonMaterial.getScene().useRightHandedSystem);
        }

        adapter.coatDarkening = properties.coatDarkeningFactor !== undefined ? properties.coatDarkeningFactor : 1;
        adapter.coatIor = properties.coatIor !== undefined ? properties.coatIor : 1.5;

        const colorFactor = Color3.White();
        if (properties.coatColorFactor !== undefined) {
            colorFactor.fromArray(properties.coatColorFactor);
        }

        adapter.coatColor = colorFactor;

        if (properties.coatColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/coatColorTexture`, properties.coatColorTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Coat Color)`;
                    adapter.coatColorTexture = texture;
                })
            );
        }

        // Set non-texture properties immediately
        const coatAnisotropyWeight = properties.coatAnisotropyStrength ?? 0;
        const coatAnisotropyAngle = properties.coatAnisotropyRotation ?? 0;

        adapter.coatRoughnessAnisotropy = coatAnisotropyWeight;
        adapter.geometryCoatTangentAngle = coatAnisotropyAngle;

        // Check if this is glTF-style anisotropy
        if (!this.useOpenPBR) {
            adapter.configureGltfStyleAnisotropy(true);
        }

        // Load texture if present
        if (properties.coatAnisotropyTexture) {
            (properties.coatAnisotropyTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/coatAnisotropyTexture`, properties.coatAnisotropyTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Coat Anisotropy)`;
                    adapter.geometryCoatTangentTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_coat(loader));
