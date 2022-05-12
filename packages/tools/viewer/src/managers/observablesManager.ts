import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Engine } from "core/Engines/engine";
import type { ISceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";

import type { ViewerModel } from "../model/viewerModel";

export class ObservablesManager {
    /**
     * Will notify when the scene was initialized
     */
    public onSceneInitObservable: Observable<Scene>;
    /**
     * will notify when the engine was initialized
     */
    public onEngineInitObservable: Observable<Engine>;

    /**
     * Will notify when a new model was added to the scene.
     * Note that added does not necessarily mean loaded!
     */
    public onModelAddedObservable: Observable<ViewerModel>;
    /**
     * will notify after every model load
     */
    public onModelLoadedObservable: Observable<ViewerModel>;
    /**
     * will notify when any model notify of progress
     */
    public onModelLoadProgressObservable: Observable<ISceneLoaderProgressEvent>;
    /**
     * will notify when any model load failed.
     */
    public onModelLoadErrorObservable: Observable<{ message: string; exception: any }>;
    /**
     * Will notify when a model was removed from the scene;
     */
    public onModelRemovedObservable: Observable<ViewerModel>;
    /**
     * will notify when a new loader was initialized.
     * Used mainly to know when a model starts loading.
     */
    public onLoaderInitObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    /**
     * Observers registered here will be executed when the entire load process has finished.
     */
    public onViewerInitDoneObservable: Observable<any>;

    /**
     * Will notify when the viewer init started (after configuration was loaded)
     */
    public onViewerInitStartedObservable: Observable<any>;

    /**
     * Functions added to this observable will be executed on each frame rendered.
     */
    public onFrameRenderedObservable: Observable<any>;

    /**
     * Will notify when VR mode is entered.
     */
    public onEnteringVRObservable: Observable<any>;
    /**
     * Will notify when VR mode is exited.
     */
    public onExitingVRObservable: Observable<any>;

    constructor() {
        this.onSceneInitObservable = new Observable();
        this.onEngineInitObservable = new Observable();
        this.onModelLoadedObservable = new Observable();
        this.onModelLoadProgressObservable = new Observable();
        this.onModelLoadErrorObservable = new Observable();
        this.onModelAddedObservable = new Observable();
        this.onModelRemovedObservable = new Observable();
        this.onViewerInitDoneObservable = new Observable();
        this.onViewerInitStartedObservable = new Observable();
        this.onLoaderInitObservable = new Observable();
        this.onFrameRenderedObservable = new Observable();
        this.onEnteringVRObservable = new Observable();
        this.onExitingVRObservable = new Observable();
    }

    dispose() {
        this.onSceneInitObservable.clear();
        this.onEngineInitObservable.clear();
        this.onModelLoadedObservable.clear();
        this.onModelLoadProgressObservable.clear();
        this.onModelLoadErrorObservable.clear();
        this.onModelAddedObservable.clear();
        this.onModelRemovedObservable.clear();
        this.onViewerInitDoneObservable.clear();
        this.onLoaderInitObservable.clear();
        this.onFrameRenderedObservable.clear();
        this.onEnteringVRObservable.clear();
        this.onExitingVRObservable.clear();
    }
}
