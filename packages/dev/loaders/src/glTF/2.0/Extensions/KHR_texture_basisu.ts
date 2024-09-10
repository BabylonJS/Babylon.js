import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import type { ITexture } from "../glTFLoaderInterfaces";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { IKHRTextureBasisU } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_texture_basisu";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_texture_basisu extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_texture_basisu"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_texture_basisu implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public _loadTextureAsync(context: string, texture: ITexture, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return GLTFLoader.LoadExtensionAsync<IKHRTextureBasisU, BaseTexture>(context, texture, this.name, (extensionContext, extension) => {
            const sampler = texture.sampler == undefined ? GLTFLoader.DefaultSampler : ArrayItem.Get(`${context}/sampler`, this._loader.gltf.samplers, texture.sampler);
            const image = ArrayItem.Get(`${extensionContext}/source`, this._loader.gltf.images, extension.source);
            return this._loader._createTextureAsync(
                context,
                sampler,
                image,
                (babylonTexture) => {
                    assign(babylonTexture);
                },
                texture._textureInfo.nonColorData ? { useRGBAIfASTCBC7NotAvailableWhenUASTC: true } : undefined,
                !texture._textureInfo.nonColorData
            );
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_texture_basisu(loader));
