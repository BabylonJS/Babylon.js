
import { ViewerConfiguration } from '../configuration';
import { AbstractViewer } from './viewer';

export class RenderOnlyViewer extends AbstractViewer {
    constructor(public containerElement: Element, initialConfiguration: ViewerConfiguration = {}) {
        super(containerElement, initialConfiguration);
        this._canvas = containerElement as HTMLCanvasElement
    }
    public initialize(){
        let autoLoad = typeof this.configuration.model === 'string' || (this.configuration.model && this.configuration.model.url);
        return this._initEngine().then((engine) => {
            return this.onEngineInitObservable.notifyObserversWithPromise(engine);
        }).then(() => {
            this._initTelemetryEvents();
            if (autoLoad) {
                return this.loadModel(this.configuration.model!).catch(() => { }).then(() => { return this.sceneManager.scene; });
            } else {
                return this.sceneManager.scene || this.sceneManager.initScene(this.configuration.scene);
            }
        }).then(() => {
            return this.onInitDoneObservable.notifyObserversWithPromise(this);
        }).catch((e) => {
            console.log(e.toString());
            return this;
        });
    }
    protected _prepareContainerElement() {
    }
}