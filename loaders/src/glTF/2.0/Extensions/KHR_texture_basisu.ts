import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { ITexture, ITextureInfo } from "../glTFLoaderInterfaces";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Nullable } from "babylonjs/types";
import { IKHRTextureBasisU } from 'babylonjs-gltf2interface';

const NAME = "KHR_texture_basisu";

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1751)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_texture_basisu implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled: boolean;

    private _loader: GLTFLoader;
    private _textureInfo: ITextureInfo;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadTextureInfoAsync(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        this._textureInfo = textureInfo; // need to save this for use in _loadTextureAsync below
        return this._loader.loadTextureInfoAsync(context, textureInfo, assign);
    }

    /** @hidden */
    public _loadTextureAsync(context: string, texture: ITexture, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return GLTFLoader.LoadExtensionAsync<IKHRTextureBasisU, BaseTexture>(context, texture, this.name, (extensionContext, extension) => {
            const sampler = (texture.sampler == undefined ? GLTFLoader.DefaultSampler : ArrayItem.Get(`${context}/sampler`, this._loader.gltf.samplers, texture.sampler));
            const image = ArrayItem.Get(`${extensionContext}/source`, this._loader.gltf.images, extension.source);
            return this._loader._createTextureAsync(context, sampler, image, (babylonTexture) => {
                assign(babylonTexture);
            }, this._textureInfo.isNotColorData ? { useRGBAIfASTCBC7NotAvailableWhenUASTC: true } : undefined);
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_texture_basisu(loader));