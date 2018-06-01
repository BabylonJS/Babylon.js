import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../../model/viewerModel";
import { Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material } from "babylonjs";
import { IGLTFLoaderData, GLTF2 } from "babylonjs-loaders";

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