import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from 'babylonjs/Maths/math.color';
import { IKHRMaterialsSpecular } from 'babylonjs-gltf2interface';

const NAME = "KHR_materials_specular";

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
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsSpecular>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSpecularPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadSpecularPropertiesAsync(context: string, properties: IKHRMaterialsSpecular, babylonMaterial: Material): Promise<void> {
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
            (properties.specularTexture as ITextureInfo).nonColorData = true;
            promises.push(this._loader.loadTextureInfoAsync(`${context}/specularTexture`, properties.specularTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Specular F0 Strength)`;
                babylonMaterial.metallicReflectanceTexture = texture;
                babylonMaterial.useOnlyMetallicFromMetallicReflectanceTexture = true;
            }));
        }

        if (properties.specularColorTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/specularColorTexture`, properties.specularColorTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Specular F0 Color)`;
                babylonMaterial.reflectanceTexture = texture;
            }));
        }

        return Promise.all(promises).then(() => { });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_specular(loader));