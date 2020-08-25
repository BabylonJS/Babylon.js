import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { ITexture } from "../glTFLoaderInterfaces";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Nullable } from "babylonjs/types";
import { IEXTTextureWebP } from 'babylonjs-gltf2interface';

const NAME = "EXT_texture_webp";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Vendor/EXT_texture_webp/)
 */
export class EXT_texture_webp implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled: boolean;

    private _loader: GLTFLoader;

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
    public _loadTextureAsync(context: string, texture: ITexture, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return GLTFLoader.LoadExtensionAsync<IEXTTextureWebP, BaseTexture>(context, texture, this.name, (extensionContext, extension) => {
            const sampler = (texture.sampler == undefined ? GLTFLoader.DefaultSampler : ArrayItem.Get(`${context}/sampler`, this._loader.gltf.samplers, texture.sampler));
            const image = ArrayItem.Get(`${extensionContext}/source`, this._loader.gltf.images, extension.source);
            return this._loader._createTextureAsync(context, sampler, image, (babylonTexture) => {
                assign(babylonTexture);
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_texture_webp(loader));
