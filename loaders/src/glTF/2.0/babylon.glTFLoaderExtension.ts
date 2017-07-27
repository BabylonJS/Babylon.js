/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export abstract class GLTFLoaderExtension {
        public enabled: boolean = true;

        public abstract get name(): string;

        protected loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean { return false; }

        //
        // Utilities
        //

        public static _Extensions: GLTFLoaderExtension[] = [];

        public static LoadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._ApplyExtensions(extension => extension.loadMaterial(loader, material, assign));
        }

        private static _ApplyExtensions(action: (extension: GLTFLoaderExtension) => boolean) {
            var extensions = GLTFLoaderExtension._Extensions;
            if (!extensions) {
                return;
            }

            for (var i = 0; i < extensions.length; i++) {
                var extension = extensions[i];
                if (extension.enabled && action(extension)) {
                    return true;
                }
            }

            return false;
        }
    }
}