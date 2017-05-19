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

        public static GetBufferFromBufferView(runtime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): ArrayBufferView {
            byteOffset += (bufferView.byteOffset || 0);

            var loadedBufferView = runtime.gltf.buffers[bufferView.buffer].loadedBufferView;
            if (byteOffset + byteLength > loadedBufferView.byteLength) {
                throw new Error("Buffer access is out of range");
            }

            var buffer = loadedBufferView.buffer;
            byteOffset += loadedBufferView.byteOffset;

            switch (componentType) {
                case EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                case EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                case EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                case EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                case EComponentType.UNSIGNED_INT: return new Uint32Array(buffer, byteOffset, byteLength);
                default: return new Float32Array(buffer, byteOffset, byteLength);
            }
        }

        /**
         * Returns a buffer from its accessor
         * @param runtime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        public static GetBufferFromAccessor(runtime: IGLTFRuntime, accessor: IGLTFAccessor): ArrayBufferView {
            var bufferView = runtime.gltf.bufferViews[accessor.bufferView];
            var byteOffset = accessor.byteOffset || 0;
            var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
            return GLTFUtils.GetBufferFromBufferView(runtime, bufferView, byteOffset, byteLength, accessor.componentType);
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

        /**
         * Returns the default material of gltf.
         * @param scene: the Babylon.js scene
         */
        public static GetDefaultMaterial(runtime: IGLTFRuntime): PBRMaterial {
            if (!runtime.defaultMaterial) {
                var material = new PBRMaterial("gltf_default", runtime.babylonScene);
                material.sideOrientation = Material.CounterClockWiseSideOrientation;
                material.metallic = 1;
                material.roughness = 1;
                runtime.defaultMaterial = material;
            }

            return runtime.defaultMaterial;
        }
    }
}