/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export abstract class GLTFLoaderExtension {
        public enabled: boolean = true;

        public abstract get name(): string;

        protected _traverseNode(loader: GLTFLoader, index: number, action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean { return false; }

        protected _loadNode(loader: GLTFLoader, node: IGLTFNode): boolean { return false; }

        protected _loadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean { return false; }

        protected _loadExtension<T>(property: IGLTFProperty, action: (extension: T, onComplete: () => void) => void): boolean {
            if (!property.extensions) {
                return false;
            }

            var extension = property.extensions[this.name] as T;
            if (!extension) {
                return false;
            }

            // Clear out the extension before executing the action to avoid recursing into the same property.
            property.extensions[this.name] = undefined;

            action(extension, () => {
                // Restore the extension after completing the action.
                property.extensions[this.name] = extension;
            });

            return true;
        }

        //
        // Utilities
        //

        public static _Extensions: GLTFLoaderExtension[] = [];

        public static TraverseNode(loader: GLTFLoader, index: number, action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean {
            return this._ApplyExtensions(extension => extension._traverseNode(loader, index, action, parentNode));
        }

        public static LoadNode(loader: GLTFLoader, node: IGLTFNode): boolean {
            return this._ApplyExtensions(extension => extension._loadNode(loader, node));
        }

        public static LoadMaterial(loader: GLTFLoader, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._ApplyExtensions(extension => extension._loadMaterial(loader, material, assign));
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