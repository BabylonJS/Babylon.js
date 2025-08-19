/* eslint-disable github/no-then */
import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IEXTMaterialsClearcoatColor } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "EXT_materials_clearcoat_color";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_materials_clearcoat_color extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_materials_clearcoat_color"]: {};
    }
}

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

/**
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_materials_clearcoat_color implements IGLTFLoaderExtension {
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
        return GLTFLoader.LoadExtensionAsync<IEXTMaterialsClearcoatColor>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            promises.push(this._loadColorPropertiesAsync(extensionContext, material, babylonMaterial, extension, useOpenPBR));
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadColorPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IEXTMaterialsClearcoatColor, useOpenPBR: boolean): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const colorFactor = Color3.White();
        let colorFactorTexture: Nullable<BaseTexture>;

        if (extension.clearcoatColorFactor !== undefined) {
            colorFactor.fromArray(extension.clearcoatColorFactor);
        }

        let texturePromise = Promise.resolve();

        if (extension.clearcoatColorTexture) {
            (extension.clearcoatColorTexture as ITextureInfo).nonColorData = true;
            texturePromise = this._loader.loadTextureInfoAsync(`${context}/clearcoatColorTexture`, extension.clearcoatColorTexture).then((texture: BaseTexture) => {
                texture.name = `${babylonMaterial.name} (Clearcoat Color)`;
                colorFactorTexture = texture;
            });
        }

        return texturePromise.then(() => {
            if (useOpenPBR) {
                const openpbrMaterial = babylonMaterial as OpenPBRMaterial;
                openpbrMaterial.coatColor = colorFactor;
                if (colorFactorTexture) {
                    openpbrMaterial.coatColorTexture = colorFactorTexture;
                }
            } else {
                const pbrMaterial = babylonMaterial as PBRMaterial;
                pbrMaterial.clearCoat.tintColor = colorFactor;
                if (colorFactorTexture) {
                    pbrMaterial.clearCoat.tintTexture = colorFactorTexture;
                }
            }
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_materials_clearcoat_color(loader));
