/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export abstract class GLTFLoaderExtension {
        public enabled: boolean = true;

        public abstract get name(): string;

        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: Nullable<IGLTFNode>): boolean { return false; }

        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean { return false; }

        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean { return false; }

        protected _loadExtension<T>(context: string, property: IGLTFProperty, action: (context: string, extension: T, onComplete: () => void) => void): boolean {
            if (!property.extensions) {
                return false;
            }

            const extension = property.extensions[this.name] as T;
            if (!extension) {
                return false;
            }

            // Clear out the extension before executing the action to avoid recursing into the same property.
            property.extensions[this.name] = undefined;

            action(context + "extensions/" + this.name, extension, () => {
                // Restore the extension after completing the action.
                property.extensions![this.name] = extension;
            });

            return true;
        }

        //
        // Utilities
        //

        public static _Extensions: GLTFLoaderExtension[] = [];

        public static TraverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: Nullable<IGLTFNode>): boolean {
            return this._ApplyExtensions(extension => extension._traverseNode(loader, context, node, action, parentNode));
        }

        public static LoadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean {
            return this._ApplyExtensions(extension => extension._loadNode(loader, context, node));
        }

        public static LoadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean {
            return this._ApplyExtensions(extension => extension._loadMaterial(loader, context, material, assign));
        }

        private static _ApplyExtensions(action: (extension: GLTFLoaderExtension) => boolean) {
            const extensions = GLTFLoaderExtension._Extensions;
            if (!extensions) {
                return false;
            }

            for (const extension of extensions) {
                if (extension.enabled && action(extension)) {
                    return true;
                }
            }

            return false;
        }
    }
}