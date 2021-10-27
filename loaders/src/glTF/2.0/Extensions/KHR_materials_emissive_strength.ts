import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IKHRMaterialsEmissiveStrength } from 'babylonjs-gltf2interface';

const NAME = "KHR_materials_emissive_strength";

/**
 * [Experimental Spec](https://github.com/KhronosGroup/glTF/pull/1994)
 */
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

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
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