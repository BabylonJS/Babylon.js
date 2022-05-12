import type { ViewerModel } from "../../model/viewerModel";
import type { ILoaderPlugin } from "./loaderPlugin";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { Material } from "core/Materials/material";

/**
 * Force-apply material configuration right after a material was loaded.
 */
export class ApplyMaterialConfigPlugin implements ILoaderPlugin {
    private _model: ViewerModel;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
    }

    public onMaterialLoaded(material: Material) {
        this._model && this._model._applyModelMaterialConfiguration(material);
    }
}
