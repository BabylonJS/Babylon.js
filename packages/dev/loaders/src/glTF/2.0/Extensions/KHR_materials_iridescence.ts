import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsIridescence } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { IMaterialLoadingAdapter } from "../materialLoadingAdapter";

const NAME = "KHR_materials_iridescence";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_iridescence extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_iridescence"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_iridescence implements IGLTFLoaderExtension {
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
    public order = 195;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsIridescence>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadIridescencePropertiesAsync(extensionContext, extension, babylonMaterial));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadIridescencePropertiesAsync(context: string, properties: IKHRMaterialsIridescence, babylonMaterial: Material): Promise<void> {
        const adapter: IMaterialLoadingAdapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        // Set non-texture properties immediately
        const iridescenceWeight = properties.iridescenceFactor ?? 0;
        const iridescenceIor = properties.iridescenceIor ?? (properties as any).iridescenceIOR ?? 1.3;
        const iridescenceThicknessMinimum = properties.iridescenceThicknessMinimum ?? 100;
        const iridescenceThicknessMaximum = properties.iridescenceThicknessMaximum ?? 400;

        adapter.iridescenceWeight = iridescenceWeight;
        adapter.iridescenceIor = iridescenceIor;
        adapter.iridescenceThicknessMinimum = iridescenceThicknessMinimum;
        adapter.iridescenceThicknessMaximum = iridescenceThicknessMaximum;

        // Load textures
        if (properties.iridescenceTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/iridescenceTexture`, properties.iridescenceTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Iridescence)`;
                    adapter.iridescenceTexture = texture;
                })
            );
        }

        if (properties.iridescenceThicknessTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/iridescenceThicknessTexture`, properties.iridescenceThicknessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Iridescence Thickness)`;
                    adapter.iridescenceThicknessTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_iridescence(loader));
