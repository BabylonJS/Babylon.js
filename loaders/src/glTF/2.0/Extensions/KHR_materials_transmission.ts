import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_materials_transmission";

interface IMaterialsTransmission {
    transmissionFactor?: number;
    transmissionTexture?: ITextureInfo;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1698)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_materials_transmission implements IGLTFLoaderExtension {
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
    public order = 175;

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            (loader as any)._parent.transparencyAsCoverage = true;
        }
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /** @hidden */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IMaterialsTransmission>(context, material, this.name, (extensionContext, extension) => {
            console.log(extensionContext);
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadTransparentPropertiesAsync(context, material, babylonMaterial, extension));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadTransparentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IMaterialsTransmission): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }
        let pbrMaterial = babylonMaterial as PBRMaterial;

        // Enables "refraction" texture which represents transmitted light.
        pbrMaterial.subSurface.isRefractionEnabled = true;

        // Since this extension models thin-surface transmission only, we must make IOR = 1.0
        pbrMaterial.subSurface.volumeIndexOfRefraction = 1.0;

        // Albedo colour will tint transmission.
        pbrMaterial.subSurface.useAlbedoToTintRefraction = true;

        if (extension.transmissionFactor !== undefined) {
            pbrMaterial.subSurface.refractionIntensity = extension.transmissionFactor;
        } else {
            pbrMaterial.subSurface.refractionIntensity = 1.0;
        }

        if (extension.transmissionTexture) {
            return this._loader.loadTextureInfoAsync(context, extension.transmissionTexture)
                .then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.thicknessTexture = texture;
                    pbrMaterial.subSurface.useMaskFromThicknessTexture = true;
                });
        } else {
            return Promise.resolve();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_transmission(loader));