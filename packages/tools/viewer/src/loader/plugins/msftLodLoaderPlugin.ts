import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import { IGLTFLoaderExtension } from "loaders/glTF/2.0/glTFLoaderExtension";
import { GLTF2 } from "loaders/glTF/index";
import { ViewerModel } from "../../model/viewerModel";
import { ILoaderPlugin } from "./loaderPlugin";

/**
 * A loader plugin to use MSFT_lod extension correctly (glTF)
 */
export class MSFTLodLoaderPlugin implements ILoaderPlugin {
    private _model: ViewerModel;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
    }

    public onExtensionLoaded(extension: IGLTFLoaderExtension) {
        if (extension.name === "MSFT_lod" && this._model.configuration.loaderConfiguration) {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const MSFT_lod = extension as GLTF2.MSFT_lod;
            MSFT_lod.enabled = !!this._model.configuration.loaderConfiguration.progressiveLoading;
            MSFT_lod.maxLODsToLoad = this._model.configuration.loaderConfiguration.maxLODsToLoad || Number.MAX_VALUE;
        }
    }
}
