import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_materials_specular";

interface IKHR_materials_specular {
    specularFactor: number;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1677)
 */
export class KHR_materials_specular implements IGLTFLoaderExtension {
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
    public order = 230;

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /** @hidden */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHR_materials_specular>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSpecularPropertiesAsync(extensionContext, material, extension, babylonMaterial));
            this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadSpecularPropertiesAsync(context: string, material: IMaterial, properties: IKHR_materials_clearcoat, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        if (properties.specularFactor) {
            babylonMaterial.metallicF0Factor = properties.specularFactor;
        }

        if (properties.specularTexture) {
            // This does not allow a separate sampler for it at the moment but is currently under discussion.
            babylonMaterial.useMetallicF0FactorFromMetallicTexture = true;
        }

        return Promise.resolve();
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_specular(loader));