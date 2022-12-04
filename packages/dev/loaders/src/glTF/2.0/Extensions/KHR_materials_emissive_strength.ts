import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsEmissiveStrength } from "babylonjs-gltf2interface";

const NAME = "KHR_materials_emissive_strength";

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
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsEmissiveStrength>(context, material, this.name, (extensionContext, extension) => {
            return this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial).then(() => {
                this._loadEmissiveProperties(extensionContext, extension, babylonMaterial);
            });
        });
    }

    private _loadEmissiveProperties(context: string, properties: IKHRMaterialsEmissiveStrength, babylonMaterial: Material): void {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        if (properties.emissiveStrength !== undefined) {
            babylonMaterial.emissiveColor.scaleToRef(properties.emissiveStrength, babylonMaterial.emissiveColor);
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_emissive_strength(loader));
