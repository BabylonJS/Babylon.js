/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF1 {
    export abstract class GLTFLoaderExtension {
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
        public loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): boolean {
            return false;
        }

        /**
         * Defines an onverride for creating gltf runtime
         * Return true to stop further extensions from creating the runtime
         */
        public loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from loading this buffer
        */
        public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading texture buffers
        * Return true to stop further extensions from loading this texture data
        */
        public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean {
            return false;
        }

        /**
        * Defines an override for creating textures
        * Return true to stop further extensions from loading this texture
        */
        public createTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from loading this shader data
        */
        public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading materials
        * Return true to stop further extensions from loading this material
        */
        public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): boolean {
            return false;
        }

        // ---------
        // Utilities
        // ---------

        public static LoadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
            }, () => {
                setTimeout(() => {
                    onSuccess(GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                });
            });
        }

        public static LoadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
            }, () => {
                setTimeout(() => {
                    onSuccess();
                });
            });
        }

        public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
            }, () => {
                GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
            });
        }

        public static LoadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id,
                buffer => GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError),
                onError);
        }

        public static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        private static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        private static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void {
            GLTFLoaderExtension.ApplyExtensions(loaderExtension => {
                return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            }, () => {
                GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            });
        }

        private static ApplyExtensions(func: (loaderExtension: GLTFLoaderExtension) => boolean, defaultFunc: () => void): void {
            for (var extensionName in GLTFLoader.Extensions) {
                var loaderExtension = GLTFLoader.Extensions[extensionName];
                if (func(loaderExtension)) {
                    return;
                }
            }

            defaultFunc();
        }
    }
}