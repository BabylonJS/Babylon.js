import type { ViewerConfiguration } from "../configuration/configuration";
import { AbstractViewer } from "./viewer";
import "core/Misc/observable.extensions";
import { Logger } from "core/Misc/logger";

export class RenderOnlyViewer extends AbstractViewer {
    constructor(
        public containerElement: Element,
        initialConfiguration: ViewerConfiguration = {}
    ) {
        super(containerElement, initialConfiguration);
        this._canvas = containerElement as HTMLCanvasElement;
    }
    public initialize() {
        const autoLoad = typeof this.configuration.model === "string" || (this.configuration.model && this.configuration.model.url);
        return this._initEngine()
            .then((engine) => {
                return this.onEngineInitObservable.notifyObserversWithPromise(engine);
            })
            .then(() => {
                this._initTelemetryEvents();
                if (autoLoad) {
                    return this.loadModel(this.configuration.model!)
                        .catch(() => {})
                        .then(() => {
                            return this.sceneManager.scene;
                        });
                } else {
                    return this.sceneManager.scene || this.sceneManager.initScene(this.configuration.scene);
                }
            })
            .then(() => {
                return this.onInitDoneObservable.notifyObserversWithPromise(this);
            })
            .catch((e) => {
                Logger.Log(e.toString());
                return this;
            });
    }
    protected _prepareContainerElement() {}
}
