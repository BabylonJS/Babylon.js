import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IEXTMaterialsDiffuseRoughness } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Constants } from "core/Engines/constants";

const NAME = "EXT_materials_diffuse_roughness";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_materials_diffuse_roughness extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_materials_diffuse_roughness"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/fdee35425ae560ea378092e38977216d63a094ec/extensions/2.0/Khronos/EXT_materials_diffuse_roughness/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_materials_diffuse_roughness implements IGLTFLoaderExtension {
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
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IEXTMaterialsDiffuseRoughness>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadDiffuseRoughnessPropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => {});
        });
    }

    private _loadDiffuseRoughnessPropertiesAsync(context: string, properties: IEXTMaterialsDiffuseRoughness, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.baseDiffuseRoughnessModel = Constants.MATERIAL_DIFFUSE_ROUGHNESS_E_OREN_NAYAR;

        if (properties.diffuseRoughnessFactor != undefined) {
            babylonMaterial.baseDiffuseRoughness = properties.diffuseRoughnessFactor;
        } else {
            babylonMaterial.baseDiffuseRoughness = 0;
        }

        if (properties.diffuseRoughnessTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseRoughnessTexture`, properties.diffuseRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Diffuse Roughness)`;
                    babylonMaterial.baseDiffuseRoughnessTexture = texture;
                })
            );
        }

        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_materials_diffuse_roughness(loader));
