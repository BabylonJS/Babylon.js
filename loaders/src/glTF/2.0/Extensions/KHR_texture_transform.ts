/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "KHR_texture_transform";

    interface IKHRTextureTransform {
        offset?: number[];
        rotation?: number;
        scale?: number[];
        texCoord?: number;
    }

    /**
     * [Specification](https://github.com/AltspaceVR/glTF/blob/avr-sampler-offset-tile/extensions/2.0/Khronos/KHR_texture_transform/README.md) (Experimental)
     */
    export class KHR_texture_transform extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadTextureAsync(context: string, textureInfo: ITextureInfo, assign: (texture: Texture) => void): Nullable<Promise<void>> {
            return this._loadExtensionAsync<IKHRTextureTransform>(context, textureInfo, (extensionContext, extension) => {
                return this._loader._loadTextureAsync(context, textureInfo, babylonTexture => {
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

    GLTFLoader._Register(NAME, loader => new KHR_texture_transform(loader));
}