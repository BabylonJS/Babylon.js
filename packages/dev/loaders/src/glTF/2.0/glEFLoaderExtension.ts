import { INode, IProperty, IScene } from "babylonjs-gltf2interface";
import { TransformNode } from "core/Meshes/transformNode";
import { Nullable } from "core/types";
import { IBaseLoaderExtension } from "./Extensions/BaseLoaderExtension";

// TODO move out of here ?
export interface IInteractivity extends IProperty {
    actions?: any[];
    behaviors?: any[];
    triggers?: any[];
    references?: any[];
}

export interface IGLEFLoaderExtension extends IBaseLoaderExtension {
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

    loadInteractivityAsync?(context: string, interactivity: IInteractivity): Nullable<Promise<void>>;
}
