import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsDiffuseRoughness } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_diffuse_roughness";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_diffuse_roughness extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_diffuse_roughness"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/b102d2d2b40d44a8776800bb2bf85e218853c17d/extensions/2.0/Khronos/KHR_materials_diffuse_roughness/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_diffuse_roughness implements IGLTFLoaderExtension {
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
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsDiffuseRoughness>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadDiffuseRoughnessPropertiesAsync(extensionContext, extension, babylonMaterial));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadDiffuseRoughnessPropertiesAsync(context: string, properties: IKHRMaterialsDiffuseRoughness, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        adapter.baseDiffuseRoughness = properties.diffuseRoughnessFactor ?? 0;

        if (properties.diffuseRoughnessTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseRoughnessTexture`, properties.diffuseRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Diffuse Roughness)`;
                    adapter.baseDiffuseRoughnessTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_diffuse_roughness(loader));
