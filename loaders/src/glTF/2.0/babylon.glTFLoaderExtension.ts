/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export abstract class GLTFLoaderExtension {
        private _name: string;

        public enabled: boolean = true;

        public constructor(name: string) {
            this._name = name;
        }

        public get name(): string {
            return this._name;
        }

        protected postCreateRuntime(runtime: IGLTFRuntime): void {}

        // Return true to stop other extensions from loading materials.
        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean { return false; }

        // ---------
        // Utilities
        // ---------

        public static PostCreateRuntime(runtime: IGLTFRuntime): void {
            for (var extensionName in GLTFLoader.Extensions) {
                var extension = GLTFLoader.Extensions[extensionName];
                if (extension.enabled) {
                    extension.postCreateRuntime(runtime);
                }
            }
        }

        public static LoadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): void {
            for (var extensionName in GLTFLoader.Extensions) {
                var extension = GLTFLoader.Extensions[extensionName];
                if (extension.enabled) {
                    if (extension.loadMaterialAsync(runtime, index, onSuccess, onError)) {
                        return;
                    }
                }
            }

            GLTFLoader.LoadCoreMaterialAsync(runtime, index, onSuccess, onError);
        }
    }
}