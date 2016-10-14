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
        * Return true to stop further extensions from loading the runtime
        */
        public loadRuntimeAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from loading this buffer
        */
        public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading texture buffers
        * Return true to stop further extensions from loading this texture data
        */
        public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for creating textures
        * Return true to stop further extensions from loading this texture
        */
        public createTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from loading this shader data
        */
        public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading materials
        * Return true to stop further extensions from loading this material
        */
        public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): boolean {
            return false;
        }

        // ---------
        // Utilities
        // ---------

        public static LoadRuntimeAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<IGLTFRuntime>(loaderExtension => {
                return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
            }, () => {
                setTimeout(() => {
                    onSuccess(GLTFFileLoaderBase.CreateRuntime(JSON.parse(<string>data), scene, rootUrl));
                });
            });
        }

        public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static LoadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: () => void): void {
            GLTFFileLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id,
                buffer => GLTFFileLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError),
                onError);
        }

        public static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        private static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        private static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            });
        }

        private static ApplyExtensions<ObjectT extends Object>(func: (loaderExtension: GLTFFileLoaderExtension) => boolean, defaultFunc: () => void): void {
            for (var extensionName in GLTFFileLoader.Extensions) {
                var loaderExtension = GLTFFileLoader.Extensions[extensionName];
                if (func(loaderExtension)) {
                    return;
                }
            }

            defaultFunc();
        }
    }
}