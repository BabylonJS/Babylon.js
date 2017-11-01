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
    }
}
