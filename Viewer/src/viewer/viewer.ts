import { TemplateManager } from './../templateManager';
import configurationLoader from './../configuration/loader';
import { Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, AbstractMesh, Mesh, HemisphericLight } from 'babylonjs';
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
            return this.initEnvironment();
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

        var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
        this.engine.setHardwareScalingLevel(scale);

        return Promise.resolve(this.engine);
    }

    protected initScene(): Promise<Scene> {
        this.scene = new Scene(this.engine);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        return Promise.resolve(this.scene);
    }

    protected abstract initCameras(): Promise<Scene>;

    protected abstract initLights(): Promise<Scene>;

    public abstract loadModel(model?: string): Promise<Scene>;

    protected onModelLoaded(meshes: Array<AbstractMesh>): Promise<Scene> {
        console.log("model loaded");
        return Promise.resolve(this.scene);
    }

    public abstract initEnvironment(): Promise<Scene>;

}