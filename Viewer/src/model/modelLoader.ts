import { AbstractViewer } from "..";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, Tools, SceneLoader, Tags, GLTFFileLoader } from "babylonjs";
import { IModelConfiguration } from "../configuration/configuration";
import { ViewerModel, ModelState } from "./viewerModel";

export class ModelLoader {

    private _loadId: number;
    private _disposed = false;

    private _loaders: Array<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;

    constructor(private _viewer: AbstractViewer) {
        this._loaders = [];
        this._loadId = 0;
    }

    public load(modelConfiguration: IModelConfiguration): ViewerModel {

        const model = new ViewerModel(this._viewer.scene, modelConfiguration);

        model.loadId = this._loadId++;
        this._loaders.push(model.loader);

        return model;
    }

    public dispose() {
        this._loaders.forEach(loader => {
            if (loader.name === "gltf") {
                (<GLTFFileLoader>loader).dispose();
            }
        });
        this._loaders.length = 0;
        this._disposed = true;
    }
}