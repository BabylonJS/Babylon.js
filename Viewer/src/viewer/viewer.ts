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

        // extend the configuration
        configurationLoader.loadConfiguration(initialConfiguration).then((configuration) => {
            this.configuration = configuration;
            // initialize the templates
            this.templateManager.initTemplate(this.configuration.template);
            // when done, execute onTemplatesLoaded()
            this.templateManager.onAllLoaded.add(() => {
                this.onTemplatesLoaded();
            })
        });

    }

    public getBaseId(): string {
        return this.baseId;
    }

    protected abstract prepareContainerElement();

    /**
     * This function will execute when the HTML templates finished initializing.
     * It should initialize the engine and continue execution.
     * 
     * @protected
     * @returns {Promise<AbstractViewer>} The viewer object will be returned after the object was loaded.
     * @memberof AbstractViewer
     */
    protected onTemplatesLoaded(): Promise<AbstractViewer> {
        return this.initEngine().then(() => {
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

        this.engine.runRenderLoop(() => {
            this.scene && this.scene.render();
        });

        var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
        this.engine.setHardwareScalingLevel(scale);

        return Promise.resolve(this.engine);
    }

    protected initScene(): Promise<Scene> {

        // if the scen exists, dispose it.
        if (this.scene) {
            this.scene.dispose();
        }

        // create a new scene
        this.scene = new Scene(this.engine);
        // make sure there is a default camera and light.
        this.scene.createDefaultCameraOrLight(true, true, true);
        return Promise.resolve(this.scene);
    }

    public loadModel(model: any = this.configuration.model, clearScene: boolean = true): Promise<Scene> {
        let modelUrl = (typeof model === 'string') ? model : model.url;
        let parts = modelUrl.split('/');
        let filename = parts.pop();
        let base = parts.join('/') + '/';

        return Promise.resolve().then(() => {
            if (!this.scene || clearScene) return this.initScene();
            else return this.scene;
        }).then(() => {
            return new Promise<Array<AbstractMesh>>((resolve, reject) => {
                SceneLoader.ImportMesh(undefined, base, filename, this.scene, (meshes) => {
                    resolve(meshes);
                }, undefined, (e, m, exception) => {
                    console.log(m, exception);
                    reject(m);
                });
            });
        }).then((meshes: Array<AbstractMesh>) => {
            return this.onModelLoaded(meshes);
        });
    }

    protected onModelLoaded(meshes: Array<AbstractMesh>): Promise<Scene> {
        console.log("model loaded");
        return Promise.resolve(this.scene);
    }

    public abstract initEnvironment(): Promise<Scene>;

}