import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import type { IEXTMaterialsSpecularEdgeColor, IKHRMaterialsSpecular } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_specular";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_specular extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_specular"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_specular/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
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

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsSpecular>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSpecularPropertiesAsync(extensionContext, extension, babylonMaterial));
            // Handle the EXT_materials_specular_edge_color sub-extension
            // https://github.com/KhronosGroup/glTF/blob/2a1111b88f052cbd3e2d82abb9faee56e7494904/extensions/2.0/Vendor/EXT_materials_specular_edge_color/README.md
            if (extension.extensions && extension.extensions.EXT_materials_specular_edge_color && babylonMaterial instanceof PBRMaterial) {
                const specularEdgeColorExtension = extension.extensions.EXT_materials_specular_edge_color as IEXTMaterialsSpecularEdgeColor;
                if (specularEdgeColorExtension.specularEdgeColorEnabled) {
                    babylonMaterial.brdf.dielectricSpecularModel = Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_OPENPBR;
                    babylonMaterial.brdf.conductorSpecularModel = Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_OPENPBR;
                }
            }
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadSpecularPropertiesAsync(context: string, properties: IKHRMaterialsSpecular, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial) && !(babylonMaterial instanceof OpenPBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        if (babylonMaterial instanceof OpenPBRMaterial) {
            if (properties.specularFactor !== undefined) {
                babylonMaterial.specularWeight = properties.specularFactor;
            }

            if (properties.specularColorFactor !== undefined) {
                babylonMaterial.specularColor = Color3.FromArray(properties.specularColorFactor);
            }

            if (properties.specularTexture) {
                (properties.specularTexture as ITextureInfo).nonColorData = true;
                promises.push(
                    this._loader.loadTextureInfoAsync(`${context}/specularTexture`, properties.specularTexture, (texture) => {
                        texture.name = `${babylonMaterial.name} (Specular)`;
                        babylonMaterial.specularWeightTexture = texture;
                        babylonMaterial.useSpecularWeightFromTextureAlpha = true;
                    })
                );
            }

            if (properties.specularColorTexture) {
                promises.push(
                    this._loader.loadTextureInfoAsync(`${context}/specularColorTexture`, properties.specularColorTexture, (texture) => {
                        texture.name = `${babylonMaterial.name} (Specular Color)`;
                        babylonMaterial.specularColorTexture = texture;
                    })
                );
            }
        } else {
            if (properties.specularFactor !== undefined) {
                babylonMaterial.metallicF0Factor = properties.specularFactor;
            }

            if (properties.specularColorFactor !== undefined) {
                babylonMaterial.metallicReflectanceColor = Color3.FromArray(properties.specularColorFactor);
            }

            if (properties.specularTexture) {
                (properties.specularTexture as ITextureInfo).nonColorData = true;
                promises.push(
                    this._loader.loadTextureInfoAsync(`${context}/specularTexture`, properties.specularTexture, (texture) => {
                        texture.name = `${babylonMaterial.name} (Specular)`;
                        babylonMaterial.metallicReflectanceTexture = texture;
                        babylonMaterial.useOnlyMetallicFromMetallicReflectanceTexture = true;
                    })
                );
            }

            if (properties.specularColorTexture) {
                promises.push(
                    this._loader.loadTextureInfoAsync(`${context}/specularColorTexture`, properties.specularColorTexture, (texture) => {
                        texture.name = `${babylonMaterial.name} (Specular Color)`;
                        babylonMaterial.reflectanceTexture = texture;
                    })
                );
            }
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_specular(loader));
