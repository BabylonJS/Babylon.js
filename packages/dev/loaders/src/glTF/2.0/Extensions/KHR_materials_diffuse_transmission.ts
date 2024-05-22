import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsDiffuseTransmission } from "babylonjs-gltf2interface";
import { Color3 } from "core/Maths/math.color";

const NAME = "KHR_materials_diffuse_transmission";

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1825)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_diffuse_transmission implements IGLTFLoaderExtension {
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
    public order = 174;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader.parent.transparencyAsCoverage = true;
        }
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsDiffuseTransmission>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadTranslucentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return Promise.all(promises).then(() => {});
        });
    }

    private _loadTranslucentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsDiffuseTransmission): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const pbrMaterial = babylonMaterial as PBRMaterial;

        // Enables "translucency" texture which represents diffusely-transmitted light.
        pbrMaterial.subSurface.isTranslucencyEnabled = true;

        // Since this extension models thin-surface transmission only, we must make the
        // internal IOR == 1.0 and set the thickness to 0.
        pbrMaterial.subSurface.volumeIndexOfRefraction = 1.0;
        pbrMaterial.subSurface.minimumThickness = 0.0;
        pbrMaterial.subSurface.maximumThickness = 0.0;

        // Tint color will be used for transmission.
        pbrMaterial.subSurface.useAlbedoToTintTranslucency = false;

        if (extension.diffuseTransmissionFactor !== undefined) {
            pbrMaterial.subSurface.translucencyIntensity = extension.diffuseTransmissionFactor;
        } else {
            pbrMaterial.subSurface.translucencyIntensity = 0.0;
            pbrMaterial.subSurface.isTranslucencyEnabled = false;
            return Promise.resolve();
        }

        const promises = new Array<Promise<any>>();

        pbrMaterial.subSurface.useGltfStyleTextures = true;

        if (extension.diffuseTransmissionTexture) {
            (extension.diffuseTransmissionTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionTexture`, extension.diffuseTransmissionTexture).then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.translucencyIntensityTexture = texture;
                })
            );
        }

        if (extension.diffuseTransmissionColorFactor !== undefined) {
            pbrMaterial.subSurface.translucencyColor = Color3.FromArray(extension.diffuseTransmissionColorFactor);
        } else {
            pbrMaterial.subSurface.translucencyColor = Color3.White();
        }

        if (extension.diffuseTransmissionColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionColorTexture`, extension.diffuseTransmissionColorTexture).then((texture: BaseTexture) => {
                    pbrMaterial.subSurface.translucencyColorTexture = texture;
                })
            );
        }

        return Promise.all(promises).then(() => {});
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_diffuse_transmission(loader));
