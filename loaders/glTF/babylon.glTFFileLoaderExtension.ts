module BABYLON {
    export abstract class GLTFFileLoaderExtension {
        private _name: string;

        public constructor(name: string) {
            this._name = name;
        }

        public get name(): string {
            return this._name;
        }

        /**
        * Defines an override for loading the runtime
        * Return true to stop further extensions from processing this buffer
        */
        public loadRuntimeAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from processing this buffer
        */
        public loadBufferAsync(gltfRuntime: IGLTFRuntime, bufferName: IGLTFBuffer, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading textures
        * Return true to stop further extensions from processing this texture
        */
        public loadTextureAsync(gltfRuntime: IGLTFRuntime, texture: IGLTFTexture, onSuccess: (texture: Texture) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from processing this shader
        */
        public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, shader: IGLTFShader, onSuccess: (shaderString: string) => void, onError: () => void): boolean {
            return false;
        }
    }
}