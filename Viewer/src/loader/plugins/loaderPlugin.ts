import { ViewerModel } from "../../model/viewerModel";
import { IGLTFLoaderExtension, IGLTFLoaderData } from "babylonjs-loaders/glTF/glTFFileLoader";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs/Loading/sceneLoader";
import { ISceneLoaderProgressEvent } from "babylonjs/Loading/sceneLoader";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Material } from "babylonjs/Materials/material";

/**
 * This interface defines the structure of a loader plugin.
 * Any of those functions will be called if (!) the loader supports those callbacks.
 * Any loader supports onInit, onLoaded, onError and onProgress.
 */
export interface ILoaderPlugin {
    onInit?: (loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) => void;
    onLoaded?: (model: ViewerModel) => void;
    onError?: (message: string, exception?: any) => void;
    onProgress?: (progressEvent: ISceneLoaderProgressEvent) => void;
    onExtensionLoaded?: (extension: IGLTFLoaderExtension) => void;
    onParsed?: (parsedData: IGLTFLoaderData) => void;
    onMeshLoaded?: (mesh: AbstractMesh) => void;
    onTextureLoaded?: (texture: BaseTexture) => void;
    onMaterialLoaded?: (material: Material) => void;
    onComplete?: () => void;
}