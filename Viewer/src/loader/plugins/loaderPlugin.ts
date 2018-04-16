import { ViewerModel } from "../../model/viewerModel";
import { IGLTFLoaderExtension, IGLTFLoaderData } from "babylonjs-loaders";
import { AbstractMesh, ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoaderProgressEvent, BaseTexture, Material } from "babylonjs";

export interface ILoaderPlugin {
    onInit?: (loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) => void;
    onLoaded?: (model: ViewerModel) => void;
    onError?: (message: string, exception?: any) => void;
    onProgress?: (progressEvent: SceneLoaderProgressEvent) => void;
    onExtensionLoaded?: (extension: IGLTFLoaderExtension) => void;
    onParsed?: (parsedData: IGLTFLoaderData) => void;
    onMeshLoaded?: (mesh: AbstractMesh) => void;
    onTextureLoaded?: (texture: BaseTexture) => void;
    onMaterialLoaded?: (material: Material) => void;
    onComplete?: () => void;
}