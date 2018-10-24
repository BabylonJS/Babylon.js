/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * Interface for a glTF loader extension.
     */
    export interface IGLTFLoaderExtension extends BABYLON.IGLTFLoaderExtension, IDisposable {
        /**
         * Called after the loader state changes to LOADING.
         */
        onLoading?(): void;

        /**
         * Called after the loader state changes to READY.
         */
        onReady?(): void;

        /**
         * Define this method to modify the default behavior when loading scenes.
         * @param context The context when loading the asset
         * @param scene The glTF scene property
         * @returns A promise that resolves when the load is complete or null if not handled
         */
        loadSceneAsync?(context: string, scene: Loader.IScene): Nullable<Promise<void>>;

        /**
         * Define this method to modify the default behavior when loading nodes.
         * @param context The context when loading the asset
         * @param node The glTF node property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon transform node when the load is complete or null if not handled
         */
        loadNodeAsync?(context: string, node: Loader.INode, assign: (babylonMesh: TransformNode) => void): Nullable<Promise<TransformNode>>;

        /**
         * Define this method to modify the default behavior when loading cameras.
         * @param context The context when loading the asset
         * @param camera The glTF camera property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon camera when the load is complete or null if not handled
         */
        loadCameraAsync?(context: string, camera: Loader.ICamera, assign: (babylonCamera: Camera) => void): Nullable<Promise<Camera>>;

        /**
         * @hidden Define this method to modify the default behavior when loading vertex data for mesh primitives.
         * @param context The context when loading the asset
         * @param primitive The glTF mesh primitive property
         * @returns A promise that resolves with the loaded geometry when the load is complete or null if not handled
         */
        _loadVertexDataAsync?(context: string, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;

        /**
         * @hidden Define this method to modify the default behavior when loading materials. Load material creates the material and then loads material properties.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon material when the load is complete or null if not handled
         */
        _loadMaterialAsync?(context: string, material: Loader.IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<Material>>;

        /**
         * Define this method to modify the default behavior when creating materials.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonDrawMode The draw mode for the Babylon material
         * @returns The Babylon material or null if not handled
         */
        createMaterial?(context: string, material: Loader.IMaterial, babylonDrawMode: number): Nullable<Material>;

        /**
         * Define this method to modify the default behavior when loading material properties.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonMaterial The Babylon material
         * @returns A promise that resolves when the load is complete or null if not handled
         */
        loadMaterialPropertiesAsync?(context: string, material: Loader.IMaterial, babylonMaterial: Material): Nullable<Promise<void>>;

        /**
         * Define this method to modify the default behavior when loading texture infos.
         * @param context The context when loading the asset
         * @param textureInfo The glTF texture info property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon texture when the load is complete or null if not handled
         */
        loadTextureInfoAsync?(context: string, textureInfo: Loader.ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>>;

        /**
         * Define this method to modify the default behavior when loading animations.
         * @param context The context when loading the asset
         * @param animation The glTF animation property
         * @returns A promise that resolves with the loaded Babylon animation group when the load is complete or null if not handled
         */
        loadAnimationAsync?(context: string, animation: Loader.IAnimation): Nullable<Promise<AnimationGroup>>;

        /**
         * Define this method to modify the default behavior when loading uris.
         * @param context The context when loading the asset
         * @param uri The uri to load
         * @returns A promise that resolves with the loaded data when the load is complete or null if not handled
         */
        _loadUriAsync?(context: string, uri: string): Nullable<Promise<ArrayBufferView>>;
    }
}

/**
 * Defines the module for the built-in glTF 2.0 loader extensions.
 */
module BABYLON.GLTF2.Loader.Extensions {
}