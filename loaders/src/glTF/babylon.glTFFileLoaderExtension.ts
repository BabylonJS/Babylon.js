/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export abstract class GLTFFileLoaderExtension {
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
            for (var extensionName in GLTFFileLoader.Extensions) {
                var extension = GLTFFileLoader.Extensions[extensionName];
                extension.postCreateRuntime(runtime);
            }
        }

        public static LoadMaterial(runtime: IGLTFRuntime, index: number): void {
            for (var extensionName in GLTFFileLoader.Extensions) {
                var extension = GLTFFileLoader.Extensions[extensionName];
                if (extension.loadMaterial(runtime, index)) {
                    return;
                }
            }

            var material = GLTFFileLoader.LoadMaterial(runtime, index);
            if (material) {
                GLTFFileLoader.LoadMetallicRoughnessMaterialProperties(runtime, material);
                GLTFFileLoader.LoadCommonMaterialProperties(runtime, material);
            }
        }
    }
}