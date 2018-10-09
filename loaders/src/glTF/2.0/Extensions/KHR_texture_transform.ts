import { BaseTexture, Nullable, Texture } from "babylonjs";
import { ITextureInfoV2 } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtensionV2 } from "../glTFLoaderExtension";
import { GLTFLoaderV2 } from "../glTFLoader";

const NAME = "KHR_texture_transform";

interface IKHRTextureTransform {
    offset?: number[];
    rotation?: number;
    scale?: number[];
    texCoord?: number;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_texture_transform/README.md)
 */
export class KHR_texture_transform implements IGLTFLoaderExtensionV2 {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled = true;

    private _loader: GLTFLoaderV2;

    /** @hidden */
    constructor(loader: GLTFLoaderV2) {
        this._loader = loader;
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /** @hidden */
    public loadTextureInfoAsync(context: string, textureInfo: ITextureInfoV2, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return GLTFLoaderV2.LoadExtensionAsync<IKHRTextureTransform, BaseTexture>(context, textureInfo, this.name, (extensionContext, extension) => {
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

GLTFLoaderV2.RegisterExtension(NAME, (loader) => new KHR_texture_transform(loader));