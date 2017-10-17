import { TemplateManager } from './../templateManager';
import configurationLoader from './../configuration/loader';
import { Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { ViewerConfiguration } from '../configuration/configuration';

export abstract class AbstractViewer {

    public templateManager: TemplateManager;

    public engine: Engine;
    public scene: Scene;
    public baseId: string;

    protected configuration: ViewerConfiguration;

    constructor(public containerElement: HTMLElement, initialConfiguration: ViewerConfiguration = { defaultViewer: true }) {
        // if exists, use the container id. otherwise, generate a random string.
        if (containerElement.id) {
            this.baseId = containerElement.id;
        } else {
            this.baseId = containerElement.id = 'bjs' + Math.random().toString(32).substr(2, 8);
        }

        this.templateManager = new TemplateManager(containerElement);

        this.prepareContainerElement();

        configurationLoader.loadConfiguration(initialConfiguration).then((configuration) => {
            this.configuration = configuration;
            this.templateManager.initTemplate(this.configuration.template);
            this.templateManager.onAllLoaded.add(() => {
                this.onTemplatesLoaded();
            })
        });

    }

    public getBaseId(): string {
        return this.baseId;
    }

    protected prepareContainerElement() {
        // nothing to see here, go home!
    }

    protected onTemplatesLoaded(): Promise<AbstractViewer> {
        return this.initEngine().then(() => {
            return this.initScene();
        }).then(() => {
            return this.initCameras();
        }).then(() => {
            return this.initLights();
        }).then(() => {
            return this.loadModel();
        }).then(() => {
            return this;
        });

    }

    /**
     * Initialize the engine. Retruns a promise in case async calls are needed.
     * 
     * @protected
     * @returns {Promise<Engine>} 
     * @memberof Viewer
     */
    protected initEngine(): Promise<Engine> {
        let canvasElement = this.templateManager.getCanvas();
        let config = this.configuration.engine || {};
        // TDO enable further configuration
        this.engine = new Engine(canvasElement, !!config.antialiasing);

        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        return Promise.resolve(this.engine);
    }

    protected initScene(): Promise<Scene> {
        this.scene = new Scene(this.engine);
        return Promise.resolve(this.scene);
    }

    protected abstract initCameras(): Promise<Scene>;

    protected abstract initLights(): Promise<Scene>;

    public abstract loadModel(model?: string): Promise<Scene>;

}