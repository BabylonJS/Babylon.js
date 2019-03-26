import { Nullable } from "babylonjs/types";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Material } from "babylonjs/Materials/material";
import { Camera } from "babylonjs/Cameras/camera";
import { Geometry } from "babylonjs/Meshes/geometry";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Mesh } from "babylonjs/Meshes/mesh";
import { IDisposable } from "babylonjs/scene";

import { IScene, INode, ISkin, ICamera, IMeshPrimitive, IMaterial, ITextureInfo, IAnimation } from "./glTFLoaderInterfaces";
import { IGLTFLoaderExtension as IGLTFBaseLoaderExtension } from "../glTFFileLoader";
import { IProperty } from 'babylonjs-gltf2interface';

/**
 * Interface for a glTF loader extension.
 */
export interface IGLTFLoaderExtension extends IGLTFBaseLoaderExtension, IDisposable {
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
    loadSceneAsync?(context: string, scene: IScene): Nullable<Promise<void>>;

    /**
     * Define this method to modify the default behavior when loading nodes.
     * @param context The context when loading the asset
     * @param node The glTF node property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon transform node when the load is complete or null if not handled
     */
    loadNodeAsync?(context: string, node: INode, assign: (babylonMesh: TransformNode) => void): Nullable<Promise<TransformNode>>;

    /**
     * Define this method to modify the default behavior when loading cameras.
     * @param context The context when loading the asset
     * @param camera The glTF camera property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon camera when the load is complete or null if not handled
     */
    loadCameraAsync?(context: string, camera: ICamera, assign: (babylonCamera: Camera) => void): Nullable<Promise<Camera>>;

    /**
     * @hidden Define this method to modify the default behavior when loading vertex data for mesh primitives.
     * @param context The context when loading the asset
     * @param primitive The glTF mesh primitive property
     * @returns A promise that resolves with the loaded geometry when the load is complete or null if not handled
     */
    _loadVertexDataAsync?(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>>;

    /**
     * @hidden Define this method to modify the default behavior when loading materials. Load material creates the material and then loads material properties.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon material when the load is complete or null if not handled
     */
    _loadMaterialAsync?(context: string, material: IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<Material>>;

    /**
     * Define this method to modify the default behavior when creating materials.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonDrawMode The draw mode for the Babylon material
     * @returns The Babylon material or null if not handled
     */
    createMaterial?(context: string, material: IMaterial, babylonDrawMode: number): Nullable<Material>;

    /**
     * Define this method to modify the default behavior when loading material properties.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonMaterial The Babylon material
     * @returns A promise that resolves when the load is complete or null if not handled
     */
    loadMaterialPropertiesAsync?(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>>;

    /**
     * Define this method to modify the default behavior when loading texture infos.
     * @param context The context when loading the asset
     * @param textureInfo The glTF texture info property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded Babylon texture when the load is complete or null if not handled
     */
    loadTextureInfoAsync?(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>>;

    /**
     * Define this method to modify the default behavior when loading animations.
     * @param context The context when loading the asset
     * @param animation The glTF animation property
     * @returns A promise that resolves with the loaded Babylon animation group when the load is complete or null if not handled
     */
    loadAnimationAsync?(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>>;

    /**
     * Define this method to modify the default behavior when loading skins.
     * @param context The context when loading the asset
     * @param node The glTF node property
     * @param skin The glTF skin property
     * @returns A promise that resolves with the loaded Babylon skeleton when the load is complete or null if not handled
     */
    loadSkinAsync?(context: string, node: INode, skin: ISkin): Nullable<Promise<void>>;
    
    /**
     * Define this method to modify the default behavior when loading uris.
     * @param context The context when loading the asset
     * @param property The glTF property associated with the uri
     * @param uri The uri to load
     * @returns A promise that resolves with the loaded data when the load is complete or null if not handled
     */
    _loadUriAsync?(context: string, property: IProperty, uri: string): Nullable<Promise<ArrayBufferView>>;
}