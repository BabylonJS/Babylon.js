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
            var decodedString = atob(uri.split(",")[1]);
            var bufferLength = decodedString.length;
            var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

            for (var i = 0; i < bufferLength; i++) {
                bufferView[i] = decodedString.charCodeAt(i);
            }

            return bufferView.buffer;
        }

        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        public static GetWrapMode(mode: number): number {
            switch (mode) {
                case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default: return Texture.WRAP_ADDRESSMODE;
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

        /**
         * Returns the texture filter mode giving a mode value
         * @param mode: the filter mode value
         */
        public static GetTextureFilterMode(mode: number): ETextureMinFilter {
            switch (mode) {
                case ETextureMinFilter.LINEAR:
                case ETextureMinFilter.LINEAR_MIPMAP_NEAREST:
                case ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.TRILINEAR_SAMPLINGMODE;
                case ETextureMinFilter.NEAREST:
                case ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_SAMPLINGMODE;
                default: return Texture.BILINEAR_SAMPLINGMODE;
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
