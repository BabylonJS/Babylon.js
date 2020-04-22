import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";

import { ITextureInfo, IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from 'babylonjs/Maths/math.color';

const NAME = "KHR_materials_sheen";

interface IKHR_materials_sheen {
    intensityFactor: number;
    colorFactor: number[];
    colorIntensityTexture: ITextureInfo;
    roughnessFactor: number;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1688)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#BNIZX6#4)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_materials_sheen implements IGLTFLoaderExtension {
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
        return GLTFLoader.LoadExtensionAsync<IKHR_materials_sheen>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSheenPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadSheenPropertiesAsync(context: string, properties: IKHR_materials_sheen, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.sheen.isEnabled = true;

        if (properties.intensityFactor != undefined) {
            babylonMaterial.sheen.intensity = properties.intensityFactor;
        }
        else {
            babylonMaterial.sheen.intensity = 0;
        }

        if (properties.colorFactor != undefined) {
            babylonMaterial.sheen.color = Color3.FromArray(properties.colorFactor);
        }

        if (properties.colorIntensityTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/sheenTexture`, properties.colorIntensityTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Sheen Intensity)`;
                babylonMaterial.sheen.texture = texture;
            }));
        }

        if (properties.roughnessFactor !== undefined) {
            babylonMaterial.sheen.roughness = properties.roughnessFactor;
        } else {
            babylonMaterial.sheen.roughness = 0;
        }

        babylonMaterial.sheen.albedoScaling = true;

        return Promise.all(promises).then(() => { });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_sheen(loader));