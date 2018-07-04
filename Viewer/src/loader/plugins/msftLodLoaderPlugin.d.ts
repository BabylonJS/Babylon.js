import { ILoaderPlugin } from "./loaderPlugin";
import { ViewerModel } from "../..";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs";
import { IGLTFLoaderExtension } from "babylonjs-loaders";
export declare class MSFTLodLoaderPlugin implements ILoaderPlugin {
    private _model;
    onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel): void;
    onExtensionLoaded(extension: IGLTFLoaderExtension): void;
}
