import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { PBR2Material } from "core/Materials/PBR/pbr2Material";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsEmissiveStrength } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_emissive_strength";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_emissive_strength extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_emissive_strength"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_emissive_strength implements IGLTFLoaderExtension {
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
    public order = 170;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsEmissiveStrength>(context, material, this.name, async (extensionContext, extension) => {
            // eslint-disable-next-line github/no-then
            return await this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial).then(() => {
                this._loadEmissiveProperties(extensionContext, extension, babylonMaterial);
            });
        });
    }

    private _loadEmissiveProperties(context: string, properties: IKHRMaterialsEmissiveStrength, babylonMaterial: Material): void {
        if (!(babylonMaterial instanceof PBRMaterial) && !(babylonMaterial instanceof PBR2Material)) {
            throw new Error(`${context}: Material type not supported`);
        }

        if (properties.emissiveStrength !== undefined) {
            babylonMaterial.emissiveIntensity = properties.emissiveStrength;
        }
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_emissive_strength(loader));
