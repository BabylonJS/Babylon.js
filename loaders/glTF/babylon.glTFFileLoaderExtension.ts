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

        public static loadRuntimeAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): void {
            GLTFFileLoaderExtension.applyExtensions<IGLTFRuntime>(loaderExtension => {
                return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
            }, () => {
                onSuccess(GLTFFileLoaderBase.createRuntime(JSON.parse(<string>data), scene, rootUrl));
            });
        }

        public static loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void): void {
            GLTFFileLoaderExtension.applyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.loadBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static loadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: () => void): void {
            GLTFFileLoaderExtension.applyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadTextureAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.loadTextureAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static loadShaderDataAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: () => void): void {
            GLTFFileLoaderExtension.applyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadShaderDataAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.loadShaderDataAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        public static loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void {
            GLTFFileLoaderExtension.applyExtensions<Texture>(loaderExtension => {
                return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            }, () => {
                GLTFFileLoaderBase.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            });
        }

        private static applyExtensions<ObjectT extends Object>(func: (loaderExtension: GLTFFileLoaderExtension) => boolean, defaultFunc: () => void): void {
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