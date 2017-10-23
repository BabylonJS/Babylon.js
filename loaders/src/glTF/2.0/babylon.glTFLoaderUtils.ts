/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /**
    * Utils functions for GLTF
    */
    export class GLTFUtils {
        /**
        * If the uri is a base64 string
        * @param uri: the uri to test
        */
        public static IsBase64(uri: string): boolean {
            return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
        }

        /**
        * Decode the base64 uri
        * @param uri: the uri to decode
        */
        public static DecodeBase64(uri: string): ArrayBuffer {
            const decodedString = atob(uri.split(",")[1]);
            const bufferLength = decodedString.length;
            const bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

            for (let i = 0; i < bufferLength; i++) {
                bufferView[i] = decodedString.charCodeAt(i);
            }

            return bufferView.buffer;
        }

        public static ValidateUri(uri: string): boolean {
            return (uri.indexOf("..") === -1);
        }

        public static AssignIndices(array: Array<{index?: number}>): void {
            if (array) {
                for (let index = 0; index < array.length; index++) {
                    array[index].index = index;
                }
            }
        }

        public static GetArrayItem<T>(array: ArrayLike<T>, index: number): T {
            if (!array || !array[index]) {
                return null;
            }

            return array[index];
        }

        public static GetTextureWrapMode(mode: ETextureWrapMode): number {
            // Set defaults if undefined
            mode = mode === undefined ? ETextureWrapMode.REPEAT : mode;

            switch (mode) {
                case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default:
                    Tools.Warn("Invalid texture wrap mode (" + mode + ")");
                    return Texture.WRAP_ADDRESSMODE;
            }
        }

        public static GetTextureSamplingMode(magFilter: ETextureMagFilter, minFilter: ETextureMinFilter): number {
            // Set defaults if undefined
            magFilter = magFilter === undefined ? ETextureMagFilter.LINEAR : magFilter;
            minFilter = minFilter === undefined ? ETextureMinFilter.LINEAR_MIPMAP_LINEAR : minFilter;

            if (magFilter === ETextureMagFilter.LINEAR) {
                switch (minFilter) {
                    case ETextureMinFilter.NEAREST: return Texture.LINEAR_NEAREST;
                    case ETextureMinFilter.LINEAR: return Texture.LINEAR_LINEAR;
                    case ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.LINEAR_NEAREST_MIPNEAREST;
                    case ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.LINEAR_LINEAR_MIPNEAREST;
                    case ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.LINEAR_NEAREST_MIPLINEAR;
                    case ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.LINEAR_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                        return Texture.LINEAR_LINEAR_MIPLINEAR;
                }
            }
            else {
                if (magFilter !== ETextureMagFilter.NEAREST) {
                    Tools.Warn("Invalid texture magnification filter (" + magFilter + ")");
                }

                switch (minFilter) {
                    case ETextureMinFilter.NEAREST: return Texture.NEAREST_NEAREST;
                    case ETextureMinFilter.LINEAR: return Texture.NEAREST_LINEAR;
                    case ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_NEAREST_MIPNEAREST;
                    case ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.NEAREST_LINEAR_MIPNEAREST;
                    case ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.NEAREST_NEAREST_MIPLINEAR;
                    case ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.NEAREST_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                        return Texture.NEAREST_NEAREST_MIPNEAREST;
                }
            }
        }
    }
}
