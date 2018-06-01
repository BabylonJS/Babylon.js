import { ILoaderPlugin } from "./loaderPlugin";
import { ViewerModel } from "../..";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material } from "babylonjs";
/**
 * Force-apply material configuration right after a material was loaded.
 */
export declare class ApplyMaterialConfigPlugin implements ILoaderPlugin {
    private _model;
    onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel): void;
    onMaterialLoaded(material: Material): void;
}
