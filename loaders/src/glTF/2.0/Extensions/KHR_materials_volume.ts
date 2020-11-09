import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from 'babylonjs/Maths/math.color';

const NAME = "KHR_materials_volume";

interface IMaterialsTransmission {
    attenuationColor?: number[];
    attenuationDistance?: number;
    subsurfaceColor?: number[];
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
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
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

        // If transparency isn't enabled already, this extension shouldn't do anything.
        // i.e. it requires either the KHR_materials_transmission or KHR_materials_translucency extensions.
        if (!pbrMaterial.subSurface.isRefractionEnabled && !pbrMaterial.subSurface.isTranslucencyEnabled || !extension.thicknessFactor) {
            return Promise.resolve();
        }

        // Since this extension models thin-surface transmission only, we must make IOR = 1.0
        pbrMaterial.subSurface.volumeIndexOfRefraction = pbrMaterial.indexOfRefraction;
        const attenuationDistance = extension.attenuationDistance !== undefined ? extension.attenuationDistance : Number.MAX_VALUE;
        pbrMaterial.subSurface.tintColorAtDistance = attenuationDistance;
        if (extension.attenuationColor !== undefined && extension.attenuationColor.length == 3) {
            pbrMaterial.subSurface.tintColor = new Color3(1.0, 1.0, 1.0);
            pbrMaterial.subSurface.tintColor.copyFromFloats(extension.attenuationColor[0], extension.attenuationColor[1], extension.attenuationColor[2]);
        } else {
            pbrMaterial.subSurface.tintColor = new Color3(1.0, 1.0, 1.0);
        }
        if (extension.subsurfaceColor !== undefined && extension.subsurfaceColor.length == 3) {
            const sssColour = new Color3(0.0, 0.0, 0.0);
            sssColour.copyFromFloats(extension.subsurfaceColor[0], extension.subsurfaceColor[1], extension.subsurfaceColor[2]);
            if (sssColour != Color3.Black()) {
                // This logic may be hard to follow here:
                // If the KHR_materials_translucency extension is used and we are using scattering,
                // the assumption is that the amount of scattering is high-enough to use the
                // diffusion approximation of SSS. That's not compatible with translucency so we turn
                // off translucency.
                if (pbrMaterial.subSurface.isTranslucencyEnabled) {
                    pbrMaterial.subSurface.isScatteringEnabled = true;
                    pbrMaterial.subSurface.isTranslucencyEnabled = false;
                    pbrMaterial.subSurface.isRefractionEnabled = false;
                    pbrMaterial.subSurface.scatteringDiffusionProfile = sssColour;
                    const scene = pbrMaterial.getScene();
                    if (scene.subSurfaceConfiguration != null) {
                        scene.subSurfaceConfiguration.metersPerUnit = 0.04; // Should be scaled with the loaded glTF scene.
                    }
                // If we need scattering with the KHR_materials_transmission extension, the
                // assumption is that this is a lower amount of scattering and we'll implement
                // it by turning on translucency in the renderer...
                } else {
                    pbrMaterial.subSurface.isTranslucencyEnabled = true;
                    pbrMaterial.subSurface.useAlbedoToTintTranslucency = true;
                    pbrMaterial.subSurface.isRefractionEnabled = false;
                }
            }
        }
        
        if (extension.thicknessTexture) {
            return this._loader.loadTextureInfoAsync(context, extension.thicknessTexture)
                .then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.thicknessTexture = texture;
                    pbrMaterial.subSurface.useMaskFromThicknessTextureGltf = true;
                    pbrMaterial.subSurface.useMaskFromThicknessTexture = false;
                    pbrMaterial.subSurface.minimumThickness = 0.0;
                    pbrMaterial.subSurface.maximumThickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 1;
                });
        } else {
            return Promise.resolve();
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_volume(loader));