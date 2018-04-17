import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
import { Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs";
import { IGLTFLoaderExtension, GLTF2 } from "babylonjs-loaders";


export class MSFTLodLoaderPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
    }

    public onExtensionLoaded(extension: IGLTFLoaderExtension) {
        if (extension.name === "MSFT_lod" && this._model.configuration.loaderConfiguration) {
            const MSFT_lod = extension as GLTF2.Extensions.MSFT_lod;
            MSFT_lod.enabled = !!this._model.configuration.loaderConfiguration.progressiveLoading;
            MSFT_lod.maxLODsToLoad = this._model.configuration.loaderConfiguration.maxLODsToLoad || Number.MAX_VALUE;
        }
    }
}