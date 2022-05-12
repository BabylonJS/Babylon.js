import type { ViewerModel } from "../../model/viewerModel";
import type { IGLTFLoaderExtension } from "loaders/glTF/2.0/glTFLoaderExtension";
import type { IGLTFLoaderData } from "loaders/glTF/glTFFileLoader";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync, ISceneLoaderProgressEvent } from "core/Loading/sceneLoader";

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";

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
