import { Nullable } from "babylonjs/types";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";

import { ITextureInfo } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IKHRTextureTransform } from 'babylonjs-gltf2interface';

const NAME = "KHR_texture_transform";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform)
 */
export class KHR_texture_transform implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /** @hidden */
    public loadTextureInfoAsync(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return GLTFLoader.LoadExtensionAsync<IKHRTextureTransform, BaseTexture>(context, textureInfo, this.name, (extensionContext, extension) => {
            return this._loader.loadTextureInfoAsync(context, textureInfo, (babylonTexture) => {
                if (!(babylonTexture instanceof Texture)) {
                    throw new Error(`${extensionContext}: Texture type not supported`);
                }

                if (extension.offset) {
                    babylonTexture.uOffset = extension.offset[0];
                    babylonTexture.vOffset = extension.offset[1];
                }

                // Always rotate around the origin.
                babylonTexture.uRotationCenter = 0;
                babylonTexture.vRotationCenter = 0;

                if (extension.rotation) {
                    babylonTexture.wAng = -extension.rotation;
                }

                if (extension.scale) {
                    babylonTexture.uScale = extension.scale[0];
                    babylonTexture.vScale = extension.scale[1];
                }

                if (extension.texCoord != undefined) {
                    babylonTexture.coordinatesIndex = extension.texCoord;
                }

                assign(babylonTexture);
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_texture_transform(loader));