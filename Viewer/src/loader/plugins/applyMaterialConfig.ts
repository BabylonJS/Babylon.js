import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
import { Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material } from "babylonjs";
import { IGLTFLoaderData, GLTF2 } from "babylonjs-loaders";


export class ApplyMaterialConfigPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
    }

    public onMaterialLoaded(material: Material) {
        this._model && this._model._applyModelMaterialConfiguration(material);
    }
}