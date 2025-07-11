import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

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

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

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
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, useOpenPBR: boolean = false): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtraAsync<boolean>(context, material, this.name, async (extraContext, extra) => {
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            if (extra) {
                if (!(babylonMaterial instanceof PBRMaterialClass)) {
                    throw new Error(`${extraContext}: Material type not supported`);
                }

                const promise = this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);

                const useExactSrgbConversions = babylonMaterial.getScene().getEngine().useExactSrgbConversions;
                if (useOpenPBR) {
                    if (!(babylonMaterial as OpenPBRMaterial).baseColorTexture) {
                        (babylonMaterial as OpenPBRMaterial).baseColor.toLinearSpaceToRef((babylonMaterial as OpenPBRMaterial).baseColor, useExactSrgbConversions);
                    }
                } else {
                    if (!(babylonMaterial as PBRMaterial).albedoTexture) {
                        (babylonMaterial as PBRMaterial).albedoColor.toLinearSpaceToRef((babylonMaterial as PBRMaterial).albedoColor, useExactSrgbConversions);
                    }
                    if (!babylonMaterial.reflectivityTexture) {
                        babylonMaterial.reflectivityColor.toLinearSpaceToRef(babylonMaterial.reflectivityColor, useExactSrgbConversions);
                    }
                }

                return await promise;
            }
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new MSFT_sRGBFactors(loader));
