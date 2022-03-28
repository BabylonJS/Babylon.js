import type { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../managers/telemetryManager";
import type { ViewerModel } from "../../model/viewerModel";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import { PrecisionDate } from "core/Misc/precisionDate";

export class TelemetryLoaderPlugin implements ILoaderPlugin {
    private _model: ViewerModel;

    private _loadStart: number;
    private _loadEnd: number;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
        this._loadStart = PrecisionDate.Now;
    }

    public onLoaded(model: ViewerModel) {
        telemetryManager.broadcast("Model Loaded", model.getViewerId(), {
            model: model,
            loadTime: PrecisionDate.Now - this._loadStart,
        });
        telemetryManager.flushWebGLErrors(model.rootMesh.getEngine(), model.getViewerId());
    }

    public onError() {
        this._loadEnd = PrecisionDate.Now;
        telemetryManager.broadcast("Load Error", this._model.getViewerId(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart,
        });

        telemetryManager.flushWebGLErrors(this._model.rootMesh.getEngine(), this._model.getViewerId());
    }

    public onComplete() {
        this._loadEnd = PrecisionDate.Now;
        telemetryManager.broadcast("Load Complete", this._model.getViewerId(), {
            model: this._model,
            loadTime: this._loadEnd - this._loadStart,
        });

        telemetryManager.flushWebGLErrors(this._model.rootMesh.getEngine(), this._model.getViewerId());
    }
}
