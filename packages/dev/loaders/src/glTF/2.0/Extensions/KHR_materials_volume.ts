/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";
import { Color3 } from "core/Maths/math.color";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsVolume } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_volume";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_volume extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_volume"]: {};
    }
}

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md)
 * @since 5.0.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
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

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            // We need to disable instance usage because the attenuation factor depends on the node scale of each individual mesh
            this._loader._disableInstancedMesh++;
        }
    }

    /** @internal */
    public dispose() {
        if (this.enabled) {
            this._loader._disableInstancedMesh--;
        }
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, useOpenPBR: boolean = false): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsVolume>(context, material, this.name, async (extensionContext, extension) => {
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadVolumePropertiesAsync(extensionContext, material, babylonMaterial, extension, useOpenPBR));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadVolumePropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsVolume, useOpenPBR: boolean): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        if (useOpenPBR) {
            return Promise.resolve();
        }
        // If transparency isn't enabled already, this extension shouldn't do anything.
        // i.e. it requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
        if (
            (!(babylonMaterial as PBRMaterial).subSurface.isRefractionEnabled && !(babylonMaterial as PBRMaterial).subSurface.isTranslucencyEnabled) ||
            !extension.thicknessFactor
        ) {
            return Promise.resolve();
        }

        let attenuationDistance = Number.MAX_VALUE;
        const attenuationColor: Color3 = Color3.White();
        let thicknessTexture: Nullable<BaseTexture> = null;
        let thicknessFactor = 0.0;

        const promises = new Array<Promise<any>>();

        attenuationDistance = extension.attenuationDistance !== undefined ? extension.attenuationDistance : Number.MAX_VALUE;
        if (extension.attenuationColor !== undefined && extension.attenuationColor.length == 3) {
            attenuationColor.copyFromFloats(extension.attenuationColor[0], extension.attenuationColor[1], extension.attenuationColor[2]);
        }

        thicknessFactor = extension.thicknessFactor;
        if (extension.thicknessTexture) {
            (extension.thicknessTexture as ITextureInfo).nonColorData = true;
            // eslint-disable-next-line github/no-then
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/thicknessTexture`, extension.thicknessTexture, (texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Thickness)`;
                    thicknessTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {
            if (useOpenPBR) {
                return;
            }

            const pbrMaterial = babylonMaterial as PBRMaterial;
            // IOR in this extension only affects interior.
            pbrMaterial.subSurface.volumeIndexOfRefraction = pbrMaterial.indexOfRefraction;
            pbrMaterial.subSurface.tintColorAtDistance = attenuationDistance;
            pbrMaterial.subSurface.tintColor = attenuationColor;

            pbrMaterial.subSurface.minimumThickness = 0.0;
            pbrMaterial.subSurface.maximumThickness = thicknessFactor;
            pbrMaterial.subSurface.useThicknessAsDepth = true;
            if (thicknessTexture) {
                pbrMaterial.subSurface.thicknessTexture = thicknessTexture;
                pbrMaterial.subSurface.useGltfStyleTextures = true;
            }
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_volume(loader));
