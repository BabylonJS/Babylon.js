import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Color3 } from "core/Maths/math.color";
import type { IKHRMaterialsFuzz } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_fuzz";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_fuzz extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_fuzz"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/9734e44accd0dfb986ec5f376117aa00192745fe/extensions/2.0/Khronos/KHR_materials_fuzz/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_fuzz implements IGLTFLoaderExtension {
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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsFuzz>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadFuzzPropertiesAsync(extensionContext, extension, babylonMaterial));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadFuzzPropertiesAsync(context: string, properties: IKHRMaterialsFuzz, babylonMaterial: Material): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const promises = new Array<Promise<any>>();

        adapter.configureFuzz();

        // Set non-texture properties immediately
        adapter.fuzzWeight = properties.fuzzFactor !== undefined ? properties.fuzzFactor : 0.0;
        adapter.fuzzColor = properties.fuzzColorFactor !== undefined ? Color3.FromArray(properties.fuzzColorFactor) : Color3.White();
        adapter.fuzzRoughness = properties.fuzzRoughnessFactor !== undefined ? properties.fuzzRoughnessFactor : 0.5;

        // Load textures
        if (properties.fuzzTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/fuzzTexture`, properties.fuzzTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Fuzz)`;
                    adapter.fuzzWeightTexture = texture;
                })
            );
        }

        if (properties.fuzzColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/fuzzColorTexture`, properties.fuzzColorTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Fuzz Color)`;
                    adapter.fuzzColorTexture = texture;
                })
            );
        }

        if (properties.fuzzRoughnessTexture) {
            (properties.fuzzRoughnessTexture as ITextureInfo).nonColorData = true;
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/fuzzRoughnessTexture`, properties.fuzzRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Fuzz Roughness)`;
                    adapter.fuzzRoughnessTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_fuzz(loader));
