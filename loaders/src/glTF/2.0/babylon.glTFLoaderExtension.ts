/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export abstract class GLTFLoaderExtension {
        private _name: string;

        public constructor(name: string) {
            this._name = name;
        }

        public get name(): string {
            return this._name;
        }

        protected postCreateRuntime(runtime: IGLTFRuntime): void {}

        // Return true to stop other extensions from loading materials.
        protected loadMaterial(runtime: IGLTFRuntime, index: number): boolean { return false; }

        // ---------
        // Utilities
        // ---------

        public static PostCreateRuntime(runtime: IGLTFRuntime): void {
            for (var extensionName in GLTFLoader.Extensions) {
                var extension = GLTFLoader.Extensions[extensionName];
                extension.postCreateRuntime(runtime);
            }
        }

        public static LoadMaterial(runtime: IGLTFRuntime, index: number): void {
            for (var extensionName in GLTFLoader.Extensions) {
                var extension = GLTFLoader.Extensions[extensionName];
                if (extension.loadMaterial(runtime, index)) {
                    return;
                }
            }

            var material = GLTFLoader.LoadMaterial(runtime, index);
            if (material) {
                GLTFLoader.LoadMetallicRoughnessMaterialProperties(runtime, material);
                GLTFLoader.LoadCommonMaterialProperties(runtime, material);
            }
        }
    }
}