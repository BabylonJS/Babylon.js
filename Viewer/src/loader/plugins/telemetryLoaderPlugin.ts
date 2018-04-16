import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
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
        telemetryManager.broadcast("Load First LOD Complete", model.getViewer(), {
            model: model,
            loadTime: Tools.Now - this._loadStart
        });
        telemetryManager.flushWebGLErrors(this._model.getViewer());
    }

    public onError(message: string, exception: any) {
        this._loadEnd = Tools.Now;
        telemetryManager.broadcast("Load Error", this._model.getViewer(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart
        });

        telemetryManager.flushWebGLErrors(this._model.getViewer());
    }

    public onComplete() {
        this._loadEnd = Tools.Now;
        telemetryManager.broadcast("Load Complete", this._model.getViewer(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart
        });

        telemetryManager.flushWebGLErrors(this._model.getViewer());
    }
}