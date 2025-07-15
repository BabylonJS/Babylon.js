import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "MSFT_sRGBFactors";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the MSFT_sRGBFactors extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["MSFT_sRGBFactors"]: {};
    }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class MSFT_sRGBFactors implements IGLTFLoaderExtension {
    /** @internal */
    public readonly name = NAME;

    /** @internal */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /** @internal */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @internal*/
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtraAsync<boolean>(context, material, this.name, async (extraContext, extra) => {
            if (extra) {
                if (!(babylonMaterial instanceof PBRMaterial) && !(babylonMaterial instanceof OpenPBRMaterial)) {
                    throw new Error(`${extraContext}: Material type not supported`);
                }

                const promise = this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);

                const useExactSrgbConversions = babylonMaterial.getScene().getEngine().useExactSrgbConversions;
                if (babylonMaterial instanceof OpenPBRMaterial) {
                    if (!babylonMaterial.baseColorTexture) {
                        babylonMaterial.baseColor.toLinearSpaceToRef(babylonMaterial.baseColor, useExactSrgbConversions);
                    }
                } else {
                    if (!babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoColor.toLinearSpaceToRef(babylonMaterial.albedoColor, useExactSrgbConversions);
                    }
                }

                if (!babylonMaterial.reflectivityTexture) {
                    babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor, useExactSrgbConversions);
                }

                return await promise;
            }
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new MSFT_sRGBFactors(loader));
