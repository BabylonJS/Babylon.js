import { ILoaderPlugin } from "./loaderPlugin";
import { ViewerModel } from "../..";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material } from "babylonjs";
import { IGLTFLoaderData } from "babylonjs-loaders";
export declare class MinecraftLoaderPlugin implements ILoaderPlugin {
    private _model;
    private _minecraftEnabled;
    onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel): void;
    inParsed(data: IGLTFLoaderData): void;
    onMaterialLoaded(material: Material): void;
}
