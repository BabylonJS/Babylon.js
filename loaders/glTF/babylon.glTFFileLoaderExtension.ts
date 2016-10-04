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
        public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading textures
        * Return true to stop further extensions from loading this texture
        */
        public loadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: () => void): boolean {
            return false;
        }

        /**
        * Defines an override for loading shader data
        * Return true to stop further extensions from loading this shader data
        */
        public loadShaderDataAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: () => void): boolean {
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
                onSuccess(GLTFFileLoaderBase.CreateRuntime(JSON.parse(<string>data), scene, rootUrl));
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
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadTextureAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadTextureAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static LoadShaderDataAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadShaderDataAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadShaderDataAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void {
            GLTFFileLoaderExtension.ApplyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
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