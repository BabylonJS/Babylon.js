import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from 'babylonjs/Maths/math.color';

const NAME = "KHR_materials_specular";

export interface IKHR_materials_specular {
    specularFactor: number;
    specularColorFactor: number[];
    specularTexture: ITextureInfo;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1719)
 * !!! Experimental Extension Subject to Changes !!!
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
    public order = 190;

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
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSpecularPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadSpecularPropertiesAsync(context: string, properties: IKHR_materials_specular, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        if (properties.specularFactor !== undefined) {
            babylonMaterial.metallicF0Factor = properties.specularFactor;
        }

        if (properties.specularColorFactor !== undefined) {
            babylonMaterial.metallicReflectanceColor = Color3.FromArray(properties.specularColorFactor);
        }

        if (properties.specularTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/specularTexture`, properties.specularTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Specular F0 Color)`;
                babylonMaterial.metallicReflectanceTexture = texture;
            }));
        }

        return Promise.all(promises).then(() => { });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_specular(loader));