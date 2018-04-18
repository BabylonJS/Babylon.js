import { viewerManager } from './viewerManager';
import { SceneManager } from './sceneManager';
import { TemplateManager } from './../templateManager';
import { ConfigurationLoader } from './../configuration/loader';
import { Skeleton, AnimationGroup, ParticleSystem, CubeTexture, Color3, IEnvironmentHelperOptions, EnvironmentHelper, Effect, SceneOptimizer, SceneOptimizerOptions, Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, AbstractMesh, Mesh, HemisphericLight, Database, SceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Quaternion, Light, ShadowLight, ShadowGenerator, Tags, AutoRotationBehavior, BouncingBehavior, FramingBehavior, Behavior, Tools } from 'babylonjs';
import { ViewerConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, IObserversConfiguration, IModelConfiguration, ISkyboxConfiguration, IGroundConfiguration, ILightConfiguration, ICameraConfiguration } from '../configuration/configuration';

import * as deepmerge from '../../assets/deepmerge.min.js';
import { ViewerModel } from '../model/viewerModel';
import { GroupModelAnimation } from '../model/modelAnimation';
import { ModelLoader } from '../loader/modelLoader';
import { CameraBehavior } from '../interfaces';
import { viewerGlobals } from '../configuration/globals';
import { extendClassWithConfig } from '../helper';
import { telemetryManager } from '../telemetryManager';

/**
 * The AbstractViewr is the center of Babylon's viewer.
 * It is the basic implementation of the default viewer and is responsible of loading and showing the model and the templates
 */
export abstract class AbstractViewer {

    /**
     * The corresponsing template manager of this viewer.
     */
    public templateManager: TemplateManager;

    /**
     * Babylon Engine corresponding with this viewer
     */
    public engine: Engine;
    /**
     * The ID of this viewer. it will be generated randomly or use the HTML Element's ID.
     */
    public readonly baseId: string;

    /**
     * The last loader used to load a model. 
     * @deprecated
     */
    public lastUsedLoader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
    /**
     * The ModelLoader instance connected with this viewer.
     */
    public modelLoader: ModelLoader;

    /**
     * A flag that controls whether or not the render loop should be executed
     */
    public runRenderLoop: boolean = true;

    /**
     * The scene manager connected with this viewer instance
     */
    public sceneManager: SceneManager;

    /**
     * the viewer configuration object
     */
    protected _configuration: ViewerConfiguration;

    // observables
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
     * Note that added does not neccessarily mean loaded!
     */
    public onModelAddedObservable: Observable<ViewerModel>;
    /**
     * will notify after every model load
     */
    public onModelLoadedObservable: Observable<ViewerModel>;
    /**
     * will notify when any model notify of progress
     */
    public onModelLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
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
    public onInitDoneObservable: Observable<AbstractViewer>;

    /**
     * Functions added to this observable will be executed on each frame rendered.
     */
    public onFrameRenderedObservable: Observable<AbstractViewer>;

    /**
     * The canvas associated with this viewer
     */
    protected _canvas: HTMLCanvasElement;

    /**
     * The (single) canvas of this viewer
     */
    public get canvas(): HTMLCanvasElement {
        return this._canvas;
    }


    /**
     * is this viewer disposed?
     */
    protected _isDisposed: boolean = false;

    /**
     * registered onBeforeRender functions.
     * This functions are also registered at the native scene. The reference can be used to unregister them.
     */
    protected _registeredOnBeforeRenderFunctions: Array<() => void>;
    /**
     * The configuration loader of this viewer
     */
    protected _configurationLoader: ConfigurationLoader;

    protected _isInit: boolean;

    constructor(public containerElement: HTMLElement, initialConfiguration: ViewerConfiguration = {}) {
        // if exists, use the container id. otherwise, generate a random string.
        if (containerElement.id) {
            this.baseId = containerElement.id;
        } else {
            this.baseId = containerElement.id = 'bjs' + Math.random().toString(32).substr(2, 8);
        }

        this.onSceneInitObservable = new Observable();
        this.onEngineInitObservable = new Observable();
        this.onModelLoadedObservable = new Observable();
        this.onModelLoadProgressObservable = new Observable();
        this.onModelLoadErrorObservable = new Observable();
        this.onModelAddedObservable = new Observable();
        this.onModelRemovedObservable = new Observable();
        this.onInitDoneObservable = new Observable();
        this.onLoaderInitObservable = new Observable();
        this.onFrameRenderedObservable = new Observable();

        this._registeredOnBeforeRenderFunctions = [];
        this.modelLoader = new ModelLoader(this);

        // add this viewer to the viewer manager
        viewerManager.addViewer(this);

        // create a new template manager. TODO - singleton?
        this.templateManager = new TemplateManager(containerElement);
        this.sceneManager = new SceneManager(this);

        this._prepareContainerElement();

        // extend the configuration
        this._configurationLoader = new ConfigurationLoader();
        this._configurationLoader.loadConfiguration(initialConfiguration, (configuration) => {
            this._configuration = deepmerge(this._configuration || {}, configuration);
            if (this._configuration.observers) {
                this._configureObservers(this._configuration.observers);
            }
            if (this._configuration.loaderPlugins) {
                // TODO should plugins be removed?
                Object.keys(this._configuration.loaderPlugins).forEach((name => {
                    if (this._configuration.loaderPlugins && this._configuration.loaderPlugins[name]) {
                        this.modelLoader.addPlugin(name);
                    }
                }))
            }
            // initialize the templates
            let templateConfiguration = this._configuration.templates || {};
            this.templateManager.initTemplate(templateConfiguration);
            // when done, execute onTemplatesLoaded()
            this.templateManager.onAllLoaded.add(() => {
                let canvas = this.templateManager.getCanvas();
                if (canvas) {
                    this._canvas = canvas;
                }
                this._onTemplateLoaded();
            });
        });

        this.onModelLoadedObservable.add((model) => {
            this.updateConfiguration(this._configuration, model);
        });

        this.onInitDoneObservable.add(() => {
            this._isInit = true;
            this.engine.runRenderLoop(this._render);
        });
    }

    /**
     * get the baseId of this viewer
     */
    public getBaseId(): string {
        return this.baseId;
    }

    /**
     * Do we have a canvas to render on, and is it a part of the scene
     */
    public isCanvasInDOM(): boolean {
        return !!this._canvas && !!this._canvas.parentElement;
    }

    /**
     * Is the engine currently set to rende even when the page is in background
     */
    public get renderInBackground() {
        return this.engine.renderEvenInBackground;
    }

    /**
     * Set the viewer's background rendering flag.
     */
    public set renderInBackground(value: boolean) {
        this.engine.renderEvenInBackground = value;
    }

    /**
     * Get the configuration object. This is a reference only. 
     * The configuration can ONLY be updated using the updateConfiguration function.
     * changing this object will have no direct effect on the scene.
     */
    public get configuration(): ViewerConfiguration {
        return this._configuration;
    }

    /**
     * force resizing the engine.
     */
    public forceResize() {
        this._resize();
    }

    /**
     * The resize function that will be registered with the window object
     */
    protected _resize = (): void => {
        // Only resize if Canvas is in the DOM
        if (!this.isCanvasInDOM()) {
            return;
        }

        if (this.canvas.clientWidth <= 0 || this.canvas.clientHeight <= 0) {
            return;
        }

        if (this._configuration.engine && this._configuration.engine.disableResize) {
            return;
        }

        this.engine.resize();
    }

    /**
     * Force a single render loop execution.
     */
    public forceRender() {
        this._render(true);
    }

    /**
     * render loop that will be executed by the engine
     */
    protected _render = (force: boolean = false): void => {
        if (force || (this.sceneManager.scene && this.sceneManager.scene.activeCamera)) {
            if (this.runRenderLoop) {
                this.engine.performanceMonitor.enable();
                this.sceneManager.scene.render();
                this.onFrameRenderedObservable.notifyObservers(this);
            } else {
                this.engine.performanceMonitor.disable();

                // TODO - is this needed?
                this.sceneManager.scene.activeCamera && this.sceneManager.scene.activeCamera.update();
            }
        }
    }

    /**
     * Takes a screenshot of the scene and returns it as a base64 encoded png.
     * @param callback optional callback that will be triggered when screenshot is done.
     * @param width Optional screenshot width (default to 512).
     * @param height Optional screenshot height (default to 512).
     * @returns a promise with the screenshot data
     */
    public takeScreenshot(callback?: (data: string) => void, width = 0, height = 0): Promise<string> {
        width = width || this.canvas.clientWidth;
        height = height || this.canvas.clientHeight;

        // Create the screenshot
        return new Promise<string>((resolve, reject) => {
            try {
                BABYLON.Tools.CreateScreenshot(this.engine, this.sceneManager.camera, { width, height }, (data) => {
                    if (callback) {
                        callback(data);
                    }
                    resolve(data);
                });
            } catch (e) {
                reject(e);
            }
        });

    }

    /**
     * Update the current viewer configuration with new values.
     * Only provided information will be updated, old configuration values will be kept.
     * If this.configuration was manually changed, you can trigger this function with no parameters, 
     * and the entire configuration will be updated. 
     * @param newConfiguration 
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration> = this._configuration, mode?: ViewerModel) {
        // update this.configuration with the new data
        this._configuration = deepmerge(this._configuration || {}, newConfiguration);

        this.sceneManager.updateConfiguration(newConfiguration, this._configuration, mode);

        // observers in configuration
        if (newConfiguration.observers) {
            this._configureObservers(newConfiguration.observers);
        }

        if (newConfiguration.loaderPlugins) {
            // TODO should plugins be removed?
            Object.keys(newConfiguration.loaderPlugins).forEach((name => {
                if (newConfiguration.loaderPlugins && newConfiguration.loaderPlugins[name]) {
                    this.modelLoader.addPlugin(name);
                }
            }))
        }
    }

    /**
     * this is used to register native functions using the configuration object.
     * This will configure the observers.
     * @param observersConfiguration observers configuration
     */
    protected _configureObservers(observersConfiguration: IObserversConfiguration) {
        if (observersConfiguration.onEngineInit) {
            this.onEngineInitObservable.add(window[observersConfiguration.onEngineInit]);
        } else {
            if (observersConfiguration.onEngineInit === '' && this._configuration.observers && this._configuration.observers!.onEngineInit) {
                this.onEngineInitObservable.removeCallback(window[this._configuration.observers!.onEngineInit!]);
            }
        }
        if (observersConfiguration.onSceneInit) {
            this.onSceneInitObservable.add(window[observersConfiguration.onSceneInit]);
        } else {
            if (observersConfiguration.onSceneInit === '' && this._configuration.observers && this._configuration.observers!.onSceneInit) {
                this.onSceneInitObservable.removeCallback(window[this._configuration.observers!.onSceneInit!]);
            }
        }
        if (observersConfiguration.onModelLoaded) {
            this.onModelLoadedObservable.add(window[observersConfiguration.onModelLoaded]);
        } else {
            if (observersConfiguration.onModelLoaded === '' && this._configuration.observers && this._configuration.observers!.onModelLoaded) {
                this.onModelLoadedObservable.removeCallback(window[this._configuration.observers!.onModelLoaded!]);
            }
        }
    }

    /**
     * Dispoe the entire viewer including the scene and the engine
     */
    public dispose() {
        if (this._isDisposed) {
            return;
        }
        window.removeEventListener('resize', this._resize);

        //observers
        this.onEngineInitObservable.clear();
        delete this.onEngineInitObservable;
        this.onInitDoneObservable.clear();
        delete this.onInitDoneObservable;
        this.onLoaderInitObservable.clear();
        delete this.onLoaderInitObservable;
        this.onModelLoadedObservable.clear();
        delete this.onModelLoadedObservable;
        this.onModelLoadErrorObservable.clear();
        delete this.onModelLoadErrorObservable;
        this.onModelLoadProgressObservable.clear();
        delete this.onModelLoadProgressObservable;
        this.onSceneInitObservable.clear();
        delete this.onSceneInitObservable;
        this.onFrameRenderedObservable.clear();
        delete this.onFrameRenderedObservable;

        if (this.sceneManager.scene.activeCamera) {
            this.sceneManager.scene.activeCamera.detachControl(this.canvas);
        }

        this._fpsTimeout && clearTimeout(this._fpsTimeout);


        this.sceneManager.dispose();

        this.modelLoader.dispose();

        this.engine.dispose();

        this.templateManager.dispose();
        viewerManager.removeViewer(this);
        this._isDisposed = true;
    }

    /**
     * This will prepare the container element for the viewer
     */
    protected abstract _prepareContainerElement();

    /**
     * This function will execute when the HTML templates finished initializing.
     * It should initialize the engine and continue execution.
     * 
     * @returns {Promise<AbstractViewer>} The viewer object will be returned after the object was loaded.
     */
    protected _onTemplatesLoaded(): Promise<AbstractViewer> {
        return Promise.resolve(this);
    }

    /**
     * This will force the creation of an engine and a scene.
     * It will also load a model if preconfigured.
     * But first - it will load the extendible onTemplateLoaded()!
     */
    private _onTemplateLoaded(): Promise<AbstractViewer> {
        return this._onTemplatesLoaded().then(() => {
            let autoLoad = typeof this._configuration.model === 'string' || (this._configuration.model && this._configuration.model.url);
            return this._initEngine().then((engine) => {
                return this.onEngineInitObservable.notifyObserversWithPromise(engine);
            }).then(() => {
                if (autoLoad) {
                    return this.loadModel(this._configuration.model!).catch(e => { }).then(() => { return this.sceneManager.scene });
                } else {
                    return this.sceneManager.scene || this.sceneManager.initScene(this._configuration.scene);
                }
            }).then((scene) => {
                if (!autoLoad) {
                    this.updateConfiguration();
                }
                return this.onSceneInitObservable.notifyObserversWithPromise(scene);
            }).then(() => {
                return this.onInitDoneObservable.notifyObserversWithPromise(this);
            }).catch(e => {
                Tools.Warn(e.toString());
                return this;
            });
        })
    }

    /**
     * Initialize the engine. Retruns a promise in case async calls are needed.
     * 
     * @protected
     * @returns {Promise<Engine>} 
     * @memberof Viewer
     */
    protected _initEngine(): Promise<Engine> {

        // init custom shaders
        this._injectCustomShaders();

        let canvasElement = this.templateManager.getCanvas();
        if (!canvasElement) {
            return Promise.reject('Canvas element not found!');
        }
        let config = this._configuration.engine || {};
        // TDO enable further configuration

        // check for webgl2 support, force-disable if needed.
        if (viewerGlobals.disableWebGL2Support) {
            config.engineOptions = config.engineOptions || {};
            config.engineOptions.disableWebGL2Support = true;
        }

        this.engine = new Engine(canvasElement, !!config.antialiasing, config.engineOptions);

        // Disable manifest checking
        Database.IDBStorageEnabled = false;

        if (!config.disableResize) {
            window.addEventListener('resize', this._resize);
        }

        if (this._configuration.engine && this._configuration.engine.adaptiveQuality) {
            var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
            this.engine.setHardwareScalingLevel(scale);
        }

        return Promise.resolve(this.engine);
    }

    private _isLoading: boolean;
    private _nextLoading: Function;

    /**
     * Initialize a model loading. The returns object (a ViewerModel object) will be loaded in the background.
     * The difference between this and loadModel is that loadModel will fulfill the promise when the model finished loading.
     * 
     * @param modelConfig model configuration to use when loading the model.
     * @param clearScene should the scene be cleared before loading this model
     * @returns a ViewerModel object that is not yet fully loaded.
     */
    public initModel(modelConfig: string | IModelConfiguration, clearScene: boolean = true): ViewerModel {
        let modelUrl = (typeof modelConfig === 'string') ? modelConfig : modelConfig.url;
        if (!modelUrl) {
            throw new Error("no model url provided");
        }
        if (clearScene) {

        }
        let configuration: IModelConfiguration;
        if (typeof modelConfig === 'string') {
            configuration = {
                url: modelConfig
            }
        } else {
            configuration = modelConfig
        }

        //merge the configuration for future models:
        if (this._configuration.model && typeof this._configuration.model === 'object') {
            deepmerge(this._configuration.model, configuration)
        } else {
            this._configuration.model = configuration;
        }

        this._isLoading = true;

        let model = this.modelLoader.load(configuration);

        this.lastUsedLoader = model.loader;
        model.onLoadErrorObservable.add((errorObject) => {
            this.onModelLoadErrorObservable.notifyObserversWithPromise(errorObject);
        });
        model.onLoadProgressObservable.add((progressEvent) => {
            this.onModelLoadProgressObservable.notifyObserversWithPromise(progressEvent);
        });
        this.onLoaderInitObservable.notifyObserversWithPromise(this.lastUsedLoader);

        model.onLoadedObservable.add(() => {
            this._isLoading = false;
        });

        return model;
    }

    /**
     * load a model using the provided configuration
     * 
     * @param modelConfig the model configuration or URL to load.
     * @param clearScene Should the scene be cleared before loading the model
     * @returns a Promise the fulfills when the model finished loading successfully. 
     */
    public loadModel(modelConfig: string | IModelConfiguration, clearScene: boolean = true): Promise<ViewerModel> {
        if (this._isLoading) {
            // We can decide here whether or not to cancel the lst load, but the developer can do that.
            return Promise.reject("another model is curently being loaded.");
        }

        return Promise.resolve(this.sceneManager.scene).then((scene) => {
            if (!scene) return this.sceneManager.initScene(this._configuration.scene, this._configuration.optimizer);
            return scene;
        }).then(() => {
            let model = this.initModel(modelConfig, clearScene);
            return new Promise<ViewerModel>((resolve, reject) => {
                // at this point, configuration.model is an object, not a string
                model.onLoadedObservable.add(() => {
                    resolve(model);
                });
                model.onLoadErrorObservable.add((error) => {
                    reject(error);
                });
            });
        })
    }

    private _fpsTimeout: number;

    protected initTelemetryEvents() {
        telemetryManager.broadcast("Engine Capabilities", this, this.engine.getCaps());
        telemetryManager.broadcast("Platform Details", this, {
            userAgent: navigator.userAgent,
            platform: navigator.platform
        });

        telemetryManager.flushWebGLErrors(this);

        let trackFPS: Function = () => {
            telemetryManager.broadcast("Current FPS", this, { fps: this.engine.getFps() });
        };

        trackFPS();
        // Track the FPS again after 60 seconds
        this._fpsTimeout = window.setTimeout(trackFPS, 60 * 1000);
    }

    /**
     * Injects all the spectre shader in the babylon shader store
     */
    protected _injectCustomShaders(): void {
        let customShaders = this._configuration.customShaders;
        // Inject all the spectre shader in the babylon shader store.
        if (!customShaders) {
            return;
        }
        if (customShaders.shaders) {
            Object.keys(customShaders.shaders).forEach(key => {
                // typescript considers a callback "unsafe", so... '!'
                Effect.ShadersStore[key] = customShaders!.shaders![key];
            });
        }
        if (customShaders.includes) {
            Object.keys(customShaders.includes).forEach(key => {
                // typescript considers a callback "unsafe", so... '!'
                Effect.IncludesShadersStore[key] = customShaders!.includes![key];
            });
        }
    }
}