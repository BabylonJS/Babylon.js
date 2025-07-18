/* eslint-disable github/no-then */
import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsDiffuseTransmission } from "babylonjs-gltf2interface";
import { Color3 } from "core/Maths/math.color";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_diffuse_transmission";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_diffuse_transmission extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_diffuse_transmission"]: {};
    }
}

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

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
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, useOpenPBR: boolean = false): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsDiffuseTransmission>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            promises.push(this._loadTranslucentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadTranslucentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsDiffuseTransmission): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        let translucencyWeight = 0.0;
        let translucencyWeightTexture: Nullable<BaseTexture>;
        let translucencyColor = Color3.White();
        let translucencyColorTexture: Nullable<BaseTexture>;

        if (extension.diffuseTransmissionFactor !== undefined) {
            translucencyWeight = extension.diffuseTransmissionFactor;
        }

        const promises = new Array<Promise<any>>();

        if (extension.diffuseTransmissionTexture) {
            (extension.diffuseTransmissionTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionTexture`, extension.diffuseTransmissionTexture).then((texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Diffuse Transmission)`;
                    translucencyWeightTexture = texture;
                })
            );
        }

        if (extension.diffuseTransmissionColorFactor !== undefined) {
            translucencyColor = Color3.FromArray(extension.diffuseTransmissionColorFactor);
        }

        if (extension.diffuseTransmissionColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionColorTexture`, extension.diffuseTransmissionColorTexture).then((texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Diffuse Transmission Color)`;
                    translucencyColorTexture = texture;
                })
            );
        }

        return Promise.all(promises).then(() => {
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

            pbrMaterial.subSurface.translucencyIntensity = translucencyWeight;
            if (translucencyWeight === 0.0) {
                pbrMaterial.subSurface.isTranslucencyEnabled = false;
                return;
            }

            pbrMaterial.subSurface.useGltfStyleTextures = true;
            pbrMaterial.subSurface.translucencyIntensityTexture = translucencyWeightTexture;

            pbrMaterial.subSurface.translucencyColor = translucencyColor;
            pbrMaterial.subSurface.translucencyColorTexture = translucencyColorTexture;
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_diffuse_transmission(loader));
