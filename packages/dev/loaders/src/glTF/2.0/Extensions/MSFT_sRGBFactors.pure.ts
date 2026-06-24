import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { type IMaterial } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "MSFT_sRGBFactors";

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
                const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial)!;
                const promise = this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial);

                const useExactSrgbConversions = babylonMaterial.getScene().getEngine().useExactSrgbConversions;
                if (!adapter.baseColorTexture) {
                    adapter.baseColor.toLinearSpaceToRef(adapter.baseColor, useExactSrgbConversions);
                }
                if (!adapter.specularColorTexture) {
                    adapter.specularColor.toLinearSpaceToRef(adapter.specularColor, useExactSrgbConversions);
                }

                return await promise;
            }
        });
    }
}

let _Registered = false;
/**
 * Registers the MSFT_sRGBFactors glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterMSFT_sRGBFactors(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new MSFT_sRGBFactors(loader));
}
