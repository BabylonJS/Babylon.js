import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { ITextureInfo, IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IMaterialNormalTextureInfo } from 'babylonjs-gltf2interface';

const NAME = "KHR_materials_clearcoat";

export interface IKHR_materials_clearcoat {
    clearcoatFactor: number;
    clearcoatTexture: ITextureInfo;
    clearcoatRoughnessFactor: number;
    clearcoatRoughnessTexture: ITextureInfo;
    clearcoatNormalTexture: IMaterialNormalTextureInfo;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1677)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#7F7PN6#8)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_materials_clearcoat implements IGLTFLoaderExtension {
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
        return GLTFLoader.LoadExtensionAsync<IKHR_materials_clearcoat>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadClearCoatPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadClearCoatPropertiesAsync(context: string, properties: IKHR_materials_clearcoat, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.clearCoat.isEnabled = true;

        if (properties.clearcoatFactor != undefined) {
            babylonMaterial.clearCoat.intensity = properties.clearcoatFactor;
        }
        else {
            babylonMaterial.clearCoat.intensity = 0;
        }

        if (properties.clearcoatTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/clearcoatTexture`, properties.clearcoatTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (ClearCoat Intensity)`;
                babylonMaterial.clearCoat.texture = texture;
            }));
        }

        if (properties.clearcoatRoughnessFactor != undefined) {
            babylonMaterial.clearCoat.roughness = properties.clearcoatRoughnessFactor;
        }
        else {
            babylonMaterial.clearCoat.roughness = 0;
        }

        if (properties.clearcoatRoughnessTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/clearcoatRoughnessTexture`, properties.clearcoatRoughnessTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (ClearCoat Roughness)`;
                babylonMaterial.clearCoat.texture = texture;
            }));
        }

        if (properties.clearcoatNormalTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/clearcoatNormalTexture`, properties.clearcoatNormalTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (ClearCoat Normal)`;
                babylonMaterial.clearCoat.bumpTexture = texture;
            }));

            babylonMaterial.invertNormalMapX = !babylonMaterial.getScene().useRightHandedSystem;
            babylonMaterial.invertNormalMapY = babylonMaterial.getScene().useRightHandedSystem;
            if (properties.clearcoatNormalTexture.scale != undefined) {
                babylonMaterial.clearCoat.bumpTexture!.level = properties.clearcoatNormalTexture.scale;
            }
        }

        return Promise.all(promises).then(() => { });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_clearcoat(loader));