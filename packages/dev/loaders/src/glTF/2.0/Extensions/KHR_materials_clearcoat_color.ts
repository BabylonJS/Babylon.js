/* eslint-disable github/no-then */
import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsClearcoatColor } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { IMaterialLoadingAdapter } from "../iMaterialLoadingAdapter";

const NAME = "KHR_materials_clearcoat_color";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_clearcoat_color extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_clearcoat_color"]: {};
    }
}

/**
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_clearcoat_color implements IGLTFLoaderExtension {
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
    public order = 191;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsClearcoatColor>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadColorPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadColorPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsClearcoatColor): Promise<void> {
        if (!this._loader._pbrMaterialClass) {
            throw new Error(`${context}: Material type not supported`);
        }

        const adapter: IMaterialLoadingAdapter = this._loader._getMaterialAdapter(babylonMaterial)!;

        const colorFactor = Color3.White();

        if (extension.clearcoatColorFactor !== undefined) {
            colorFactor.fromArray(extension.clearcoatColorFactor);
        }

        adapter.coatColor = colorFactor;

        let texturePromise = Promise.resolve();

        if (extension.clearcoatColorTexture) {
            (extension.clearcoatColorTexture as ITextureInfo).nonColorData = true;
            texturePromise = this._loader.loadTextureInfoAsync(`${context}/clearcoatColorTexture`, extension.clearcoatColorTexture).then((texture: BaseTexture) => {
                texture.name = `${babylonMaterial.name} (Clearcoat Color)`;
                adapter.coatColorTexture = texture;
            });
        }

        return texturePromise.then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_clearcoat_color(loader));
