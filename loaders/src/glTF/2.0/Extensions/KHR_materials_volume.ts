import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_materials_volume";

interface IMaterialsTransmission {
    attenuationColor?: number[];
    attenuationDistance?: number;
    thicknessTexture?: ITextureInfo;
    thicknessFactor?: number;
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1726)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_materials_volume implements IGLTFLoaderExtension {
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
    public order = 173;

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            // We need to disable instance usage because the attenuation factor depends on the node scale of each individual mesh
            this._loader._disableInstancedMesh++;
        }
    }

    /** @hidden */
    public dispose() {
        if (this.enabled) {
            this._loader._disableInstancedMesh--;
        }
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IMaterialsTransmission>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadVolumePropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return Promise.all(promises).then(() => { });
        });
    }

    private _loadVolumePropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IMaterialsTransmission): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        // If transparency isn't enabled already, this extension shouldn't do anything.
        // i.e. it requires either the KHR_materials_transmission or KHR_materials_translucency extensions.
        if (!babylonMaterial.subSurface.isRefractionEnabled && !babylonMaterial.subSurface.isTranslucencyEnabled || !extension.thicknessFactor) {
            return Promise.resolve();
        }

        // IOR in this extension only affects interior.
        babylonMaterial.subSurface.volumeIndexOfRefraction = babylonMaterial.indexOfRefraction;
        const attenuationDistance = extension.attenuationDistance !== undefined ? extension.attenuationDistance : Number.MAX_VALUE;
        babylonMaterial.subSurface.tintColorAtDistance = attenuationDistance;
        if (extension.attenuationColor !== undefined && extension.attenuationColor.length == 3) {
            babylonMaterial.subSurface.tintColor.copyFromFloats(extension.attenuationColor[0], extension.attenuationColor[1], extension.attenuationColor[2]);
        }

        babylonMaterial.subSurface.minimumThickness = 0.0;
        babylonMaterial.subSurface.maximumThickness = extension.thicknessFactor;
        babylonMaterial.subSurface.useThicknessAsDepth = true;
        if (extension.thicknessTexture) {
            (extension.thicknessTexture as ITextureInfo).nonColorData = true;
            return this._loader.loadTextureInfoAsync(`${context}/thicknessTexture`, extension.thicknessTexture)
                .then((texture: BaseTexture) => {
                    babylonMaterial.subSurface.thicknessTexture = texture;
                    babylonMaterial.subSurface.useGltfStyleTextures = true;
                });
        } else {
            return Promise.resolve();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_volume(loader));