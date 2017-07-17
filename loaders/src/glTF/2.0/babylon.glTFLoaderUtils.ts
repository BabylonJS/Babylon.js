﻿/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

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
            var decodedString = atob(uri.split(",")[1]);
            var bufferLength = decodedString.length;
            var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

            for (var i = 0; i < bufferLength; i++) {
                bufferView[i] = decodedString.charCodeAt(i);
            }

            return bufferView.buffer;
        }

        public static ForEach(view: Uint16Array | Uint32Array | Float32Array, func: (nvalue: number, index: number) => void) : void {
            for (var index = 0; index < view.length; index++) {
                func(view[index], index);
            }
        }

        public static GetTextureWrapMode(mode: ETextureWrapMode): number {
            // Set defaults if undefined
            mode = mode === undefined ? ETextureWrapMode.CLAMP_TO_EDGE : mode;

            switch (mode) {
                case ETextureWrapMode.CLAMP_TO_EDGE: Texture.CLAMP_ADDRESSMODE;
                case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default:
                    Tools.Warn("Invalid texture wrap mode (" + mode + ")");
                    return Texture.WRAP_ADDRESSMODE;
            }
        }

        /**
         * Returns the byte stride giving an accessor
         * @param accessor: the GLTF accessor objet
         */
        public static GetByteStrideFromType(accessor: IGLTFAccessor): number {
            // Needs this function since "byteStride" isn't requiered in glTF format
            var type = accessor.type;

            switch (type) {
                case "VEC2": return 2;
                case "VEC3": return 3;
                case "VEC4": return 4;
                case "MAT2": return 4;
                case "MAT3": return 9;
                case "MAT4": return 16;
                default: return 1;
            }
        }

        public static GetTextureSamplingMode(magFilter: ETextureMagFilter, minFilter: ETextureMinFilter): number {
            // Set defaults if undefined
            magFilter = magFilter === undefined ? ETextureMagFilter.NEAREST : magFilter;
            minFilter = minFilter === undefined ? ETextureMinFilter.NEAREST_MIPMAP_NEAREST : minFilter;

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

        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        public static DecodeBufferToText(view: ArrayBufferView): string {
            var result = "";
            var length = view.byteLength;

            for (var i = 0; i < length; ++i) {
                result += String.fromCharCode(view[i]);
            }

            return result;
        }
    }
}
