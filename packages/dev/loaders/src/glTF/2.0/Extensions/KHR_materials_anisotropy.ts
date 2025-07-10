import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsAnisotropy } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_anisotropy";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_anisotropy extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_anisotropy"]: {};
    }
}

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_anisotropy implements IGLTFLoaderExtension {
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
    public order = 195;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsAnisotropy>(context, material, this.name, async (extensionContext, extension) => {
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadIridescencePropertiesAsync(extensionContext, extension, babylonMaterial));
            await Promise.all(promises);
        });
    }

    private async _loadIridescencePropertiesAsync(context: string, properties: IKHRMaterialsAnisotropy, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        (babylonMaterial as PBRMaterial).anisotropy.isEnabled = true;

        (babylonMaterial as PBRMaterial).anisotropy.intensity = properties.anisotropyStrength ?? 0;
        (babylonMaterial as PBRMaterial).anisotropy.angle = properties.anisotropyRotation ?? 0;

        if (properties.anisotropyTexture) {
            (properties.anisotropyTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/anisotropyTexture`, properties.anisotropyTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Anisotropy Intensity)`;
                    (babylonMaterial as PBRMaterial).anisotropy.texture = texture;
                })
            );
        }

        await Promise.all(promises);
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_anisotropy(loader));
