/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * Abstract class that can be implemented to extend existing glTF loader behavior.
     */
    export abstract class GLTFLoaderExtension implements IGLTFLoaderExtension, IDisposable {
        public enabled = true;
        public abstract readonly name: string;

        protected _loader: GLTFLoader;

        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        public dispose(): void {
            delete this._loader;
        }

        // #region Overridable Methods

        /** Override this method to modify the default behavior for loading scenes. */
        protected _loadSceneAsync(context: string, node: _ILoaderScene): Nullable<Promise<void>> { return null; }

        /** Override this method to modify the default behavior for loading nodes. */
        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>> { return null; }

        /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
        protected _loadVertexDataAsync(context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> { return null; }

        /** Override this method to modify the default behavior for loading materials. */
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> { return null; }

        /** Override this method to modify the default behavior for loading uris. */
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> { return null; }

        // #endregion

        /** Helper method called by a loader extension to load an glTF extension. */
        protected _loadExtensionAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (extensionContext: string, extension: TProperty) => Promise<TResult>): Nullable<Promise<TResult>> {
            if (!property.extensions) {
                return null;
            }

            const extensions = property.extensions;

            const extension = extensions[this.name] as TProperty;
            if (!extension) {
                return null;
            }

            // Clear out the extension before executing the action to avoid recursing into the same property.
            delete extensions[this.name];

            try {
                return actionAsync(`${context}/extensions/${this.name}`, extension);
            }
            finally {
                // Restore the extension after executing the action.
                extensions[this.name] = extension;
            }
        }

        /** Helper method called by the loader to allow extensions to override loading scenes. */
        public static _LoadSceneAsync(loader: GLTFLoader, context: string, scene: _ILoaderScene): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadSceneAsync(context, scene));
        }

        /** Helper method called by the loader to allow extensions to override loading nodes. */
        public static _LoadNodeAsync(loader: GLTFLoader, context: string, node: _ILoaderNode): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadNodeAsync(context, node));
        }

        /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
        public static _LoadVertexDataAsync(loader: GLTFLoader, context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
            return loader._applyExtensions(extension => extension._loadVertexDataAsync(context, primitive, babylonMesh));
        }

        /** Helper method called by the loader to allow extensions to override loading materials. */
        public static _LoadMaterialAsync(loader: GLTFLoader, context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign));
        }

        /** Helper method called by the loader to allow extensions to override loading uris. */
        public static _LoadUriAsync(loader: GLTFLoader, context: string, uri: string): Nullable<Promise<ArrayBufferView>> {
            return loader._applyExtensions(extension => extension._loadUriAsync(context, uri));
        }
    }
}

/**
 * Defines the module of the glTF 2.0 loader extensions.
 */
module BABYLON.GLTF2.Extensions {
}