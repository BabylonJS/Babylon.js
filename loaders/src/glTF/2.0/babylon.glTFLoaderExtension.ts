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

        protected loadMaterial(index: number): Material { return null; }

        // ---------
        // Utilities
        // ---------

        public static LoadMaterial(index: number): Material {
            for (var extensionName in GLTFLoader.Extensions) {
                var extension = GLTFLoader.Extensions[extensionName];
                if (extension.enabled) {
                    var babylonMaterial = extension.loadMaterial(index);
                    if (babylonMaterial) {
                        return babylonMaterial;
                    }
                }
            }

            return GLTFLoader.LoadCoreMaterial(index);
        }
    }
}