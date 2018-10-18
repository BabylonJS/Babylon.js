import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../managers/telemetryManager";
import { ViewerModel } from "../../model/viewerModel";
import { Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs";

export class TelemetryLoaderPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    private _loadStart: number;
    private _loadEnd: number;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
        this._loadStart = Tools.Now;
    }

    public onLoaded(model: ViewerModel) {
        telemetryManager.broadcast("Model Loaded", model.getViewerId(), {
            model: model,
            loadTime: Tools.Now - this._loadStart
        });
        telemetryManager.flushWebGLErrors(model.rootMesh.getEngine(), model.getViewerId());
    }

    public onError(message: string, exception: any) {
        this._loadEnd = Tools.Now;
        telemetryManager.broadcast("Load Error", this._model.getViewerId(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart
        });

        telemetryManager.flushWebGLErrors(this._model.rootMesh.getEngine(), this._model.getViewerId());
    }

    public onComplete() {
        this._loadEnd = Tools.Now;
        telemetryManager.broadcast("Load Complete", this._model.getViewerId(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart
        });

        telemetryManager.flushWebGLErrors(this._model.rootMesh.getEngine(), this._model.getViewerId());
    }
}