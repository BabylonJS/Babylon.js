/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * Abstract class that can be implemented to extend existing glTF loader behavior.
     */
    export abstract class GLTFLoaderExtension implements IGLTFLoaderExtension, IDisposable {
        /**
         * Gets or sets a boolean indicating if the extension is enabled
         */
        public enabled = true;

        /**
         * Gets or sets extension name
         */
        public abstract readonly name: string;

        protected _loader: GLTFLoader;

        /**
         * Creates new GLTFLoaderExtension
         * @param loader defines the GLTFLoader to use
         */
        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        /**
         * Release all resources
         */
        public dispose(): void {
            delete this._loader;
        }

        // #region Overridable Methods

        /**
         * Override this method to modify the default behavior for loading scenes.
         * @hidden
         */
        protected _loadSceneAsync(context: string, node: _ILoaderScene): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading nodes.
         * @hidden
         */
        protected _loadNodeAsync(context: string, node: _ILoaderNode): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading mesh primitive vertex data.
         * @hidden
         */
        protected _loadVertexDataAsync(context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> { return null; }

        /**
         * Override this method to modify the default behavior for loading materials.
         * @hidden
         */
        protected _loadMaterialAsync(context: string, material: _ILoaderMaterial, mesh: _ILoaderMesh, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading material properties.
         * @hidden
         */
        protected _loadMaterialPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: Material): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading texture infos.
         * @hidden
         */
        protected _loadTextureInfoAsync(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: Texture) => void): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading textures.
         * @hidden
         */
        protected _loadTextureAsync(context: string, texture: _ILoaderTexture, assign: (babylonTexture: Texture) => void): Nullable<Promise<void>> { return null; }

        /**
         * Override this method to modify the default behavior for loading uris.
         * @hidden
         */
        protected _loadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> { return null; }

        // #endregion

        /**
         * Helper method called by a loader extension to load an glTF extension.
         * @hidden
         */
        protected _loadExtensionAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (extensionContext: string, extension: TProperty) => Nullable<Promise<TResult>>): Nullable<Promise<TResult>> {
            if (!property.extensions) {
                return null;
            }

            const extensions = property.extensions;

            const extension = extensions[this.name] as TProperty;
            if (!extension) {
                return null;
            }

            // Clear out the extension before executing the action to avoid infinite recursion.
            delete extensions[this.name];

            try {
                return actionAsync(`${context}/extensions/${this.name}`, extension);
            }
            finally {
                // Restore the extension after executing the action.
                extensions[this.name] = extension;
            }
        }

        /**
         * Helper method called by the loader to allow extensions to override loading scenes.
         * @hidden
         */
        protected _loadExtrasValueAsync<TProperty, TResult = void>(context: string, property: IProperty, actionAsync: (extensionContext: string, value: TProperty) => Nullable<Promise<TResult>>): Nullable<Promise<TResult>> {
            if (!property.extras) {
                return null;
            }

            const extras = property.extras;

            const value = extras[this.name] as TProperty;
            if (value === undefined) {
                return null;
            }

            // Clear out the extras value before executing the action to avoid infinite recursion.
            delete extras[this.name];

            try {
                return actionAsync(`${context}/extras/${this.name}`, value);
            }
            finally {
                // Restore the extras value after executing the action.
                extras[this.name] = value;
            }
        }

        /**
         * Helper method called by the loader to allow extensions to override loading scenes.
         * @hidden
         */
        public static _LoadSceneAsync(loader: GLTFLoader, context: string, scene: _ILoaderScene): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadSceneAsync(context, scene));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading nodes.
         * @hidden
         */
        public static _LoadNodeAsync(loader: GLTFLoader, context: string, node: _ILoaderNode): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadNodeAsync(context, node));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading mesh primitive vertex data.
         * @hidden
         */
        public static _LoadVertexDataAsync(loader: GLTFLoader, context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
            return loader._applyExtensions(extension => extension._loadVertexDataAsync(context, primitive, babylonMesh));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading materials.
         * @hidden
         */
        public static _LoadMaterialAsync(loader: GLTFLoader, context: string, material: _ILoaderMaterial, mesh: _ILoaderMesh, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadMaterialAsync(context, material, mesh, babylonMesh, babylonDrawMode, assign));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading material properties.
         * @hidden
         */
        public static _LoadMaterialPropertiesAsync(loader: GLTFLoader, context: string, material: _ILoaderMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadMaterialPropertiesAsync(context, material, babylonMaterial));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading texture infos.
         * @hidden
         */
        public static _LoadTextureInfoAsync(loader: GLTFLoader, context: string, textureInfo: ITextureInfo, assign: (babylonTexture: Texture) => void): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadTextureInfoAsync(context, textureInfo, assign));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading textures.
         * @hidden
         */
        public static _LoadTextureAsync(loader: GLTFLoader, context: string, texture: _ILoaderTexture, assign: (babylonTexture: Texture) => void): Nullable<Promise<void>> {
            return loader._applyExtensions(extension => extension._loadTextureAsync(context, texture, assign));
        }

        /**
         * Helper method called by the loader to allow extensions to override loading uris.
         * @hidden
         */
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