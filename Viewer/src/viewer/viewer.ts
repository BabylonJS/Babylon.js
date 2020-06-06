import { Engine } from 'babylonjs/Engines/engine';
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoaderProgressEvent } from 'babylonjs/Loading/sceneLoader';
import { Observable } from 'babylonjs/Misc/observable';
import { Scene } from 'babylonjs/scene';
import { RenderingManager } from 'babylonjs/Rendering/renderingManager';
import { Vector3 } from 'babylonjs/Maths/math';
import { TargetCamera } from 'babylonjs/Cameras/targetCamera';
import { Tools } from 'babylonjs/Misc/tools';
import { Effect } from 'babylonjs/Materials/effect';
import { ConfigurationLoader } from '../configuration/loader';
import { IModelConfiguration, IObserversConfiguration, ViewerConfiguration } from '../configuration/';
import { processConfigurationCompatibility } from '../configuration/configurationCompatibility';
import { ConfigurationContainer } from '../configuration/configurationContainer';
import { viewerGlobals } from '../configuration/globals';
import { RenderOnlyConfigurationLoader } from '../configuration/renderOnlyLoader';
import { deepmerge } from '../helper/';
import { ModelLoader } from '../loader/modelLoader';
import { ObservablesManager } from '../managers/observablesManager';
import { SceneManager } from '../managers/sceneManager';
import { telemetryManager } from '../managers/telemetryManager';
import { ViewerModel } from '../model/viewerModel';
import { viewerManager } from './viewerManager';

/**
 * The AbstractViewer is the center of Babylon's viewer.
 * It is the basic implementation of the default viewer and is responsible of loading and showing the model and the templates
 */
export abstract class AbstractViewer {
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

    // observables
    /**
     * Will notify when the scene was initialized
     */
    public get onSceneInitObservable(): Observable<Scene> {
        return this.observablesManager.onSceneInitObservable;
    }
    /**
     * will notify when the engine was initialized
     */
    public get onEngineInitObservable(): Observable<Engine> {
        return this.observablesManager.onEngineInitObservable;
    }

    /**
     * Will notify when a new model was added to the scene.
     * Note that added does not neccessarily mean loaded!
     */
    public get onModelAddedObservable(): Observable<ViewerModel> {
        return this.observablesManager.onModelAddedObservable;
    }
    /**
     * will notify after every model load
     */
    public get onModelLoadedObservable(): Observable<ViewerModel> {
        return this.observablesManager.onModelLoadedObservable;
    }
    /**
     * will notify when any model notify of progress
     */
    public get onModelLoadProgressObservable(): Observable<SceneLoaderProgressEvent> {
        return this.observablesManager.onModelLoadProgressObservable;
    }
    /**
     * will notify when any model load failed.
     */
    public get onModelLoadErrorObservable(): Observable<{ message: string; exception: any }> {
        return this.observablesManager.onModelLoadErrorObservable;
    }
    /**
     * Will notify when a model was removed from the scene;
     */
    public get onModelRemovedObservable(): Observable<ViewerModel> {
        return this.observablesManager.onModelRemovedObservable;
    }
    /**
     * will notify when a new loader was initialized.
     * Used mainly to know when a model starts loading.
     */
    public get onLoaderInitObservable(): Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        return this.observablesManager.onLoaderInitObservable;
    }
    /**
     * Observers registered here will be executed when the entire load process has finished.
     */
    public get onInitDoneObservable(): Observable<AbstractViewer> {
        return this.observablesManager.onViewerInitDoneObservable;
    }

    /**
     * Functions added to this observable will be executed on each frame rendered.
     */
    public get onFrameRenderedObservable(): Observable<AbstractViewer> {
        return this.observablesManager.onFrameRenderedObservable;
    }

    /**
     * Observers registered here will be executed when VR more is entered.
     */
    public get onEnteringVRObservable(): Observable<AbstractViewer> {
        return this.observablesManager.onEnteringVRObservable;
    }
    /**
     * Observers registered here will be executed when VR mode is exited.
     */
    public get onExitingVRObservable(): Observable<AbstractViewer> {
        return this.observablesManager.onExitingVRObservable;
    }

    public observablesManager: ObservablesManager;

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
    protected _configurationLoader: RenderOnlyConfigurationLoader;

    /**
     * Is the viewer already initialized. for internal use.
     */
    protected _isInit: boolean;

    protected _configurationContainer: ConfigurationContainer;

    public get configurationContainer() {
        return this._configurationContainer;
    }

    protected getConfigurationLoader() {
        return new RenderOnlyConfigurationLoader();
    }

    constructor(public containerElement: Element, initialConfiguration: ViewerConfiguration = {}) {
        // if exists, use the container id. otherwise, generate a random string.
        if (containerElement.id) {
            this.baseId = containerElement.id;
        } else {
            this.baseId = containerElement.id = 'bjs' + Math.random().toString(32).substr(2, 8);
        }

        this._registeredOnBeforeRenderFunctions = [];

        this._configurationContainer = new ConfigurationContainer();

        this.observablesManager = new ObservablesManager();

        this.modelLoader = new ModelLoader(this.observablesManager, this._configurationContainer);

        RenderingManager.AUTOCLEAR = false;

        // extend the configuration
        this._configurationLoader = this.getConfigurationLoader();
        this._configurationLoader.loadConfiguration(initialConfiguration, (configuration) => {
            this._onConfigurationLoaded(configuration);
        });

        this.onSceneInitObservable.add(() => {
            this.updateConfiguration();
        });

        this.onInitDoneObservable.add(() => {
            this._isInit = true;
            this.engine.runRenderLoop(this._render);
        });

        this._prepareContainerElement();

        // add this viewer to the viewer manager
        viewerManager.addViewer(this);

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
        return this.engine && this.engine.renderEvenInBackground;
    }

    /**
     * Set the viewer's background rendering flag.
     */
    public set renderInBackground(value: boolean) {
        if (this.engine) {
            this.engine.renderEvenInBackground = value;
        }
    }

    /**
     * Get the configuration object. This is a reference only.
     * The configuration can ONLY be updated using the updateConfiguration function.
     * changing this object will have no direct effect on the scene.
     */
    public get configuration(): ViewerConfiguration {
        return this._configurationContainer.configuration;
    }

    /**
     * force resizing the engine.
     */
    public forceResize() {
        this._resize();
    }

    protected _hdToggled: boolean = false;

    public toggleHD() {
        this._hdToggled = !this._hdToggled;

        var scale = this._hdToggled ? Math.max(0.5, 1 / (window.devicePixelRatio || 2)) : 1;

        this.engine.setHardwareScalingLevel(scale);
    }

    protected _vrToggled: boolean = false;
    private _vrModelRepositioning: number = 0;
    protected _vrScale: number = 1;

    protected _vrInit: boolean = false;

    public toggleVR() {
        if (!this._vrInit) {
            this._initVR();
        }

        if (this.sceneManager.vrHelper && !this.sceneManager.vrHelper.isInVRMode) {

            // make sure the floor is set
            if (this.sceneManager.environmentHelper && this.sceneManager.environmentHelper.ground) {
                this.sceneManager.vrHelper.addFloorMesh(this.sceneManager.environmentHelper.ground);
            }

            this._vrToggled = true;
            this.sceneManager.vrHelper.enterVR();

            // position the vr camera to be in front of the object or wherever the user has configured it to be
            if (this.sceneManager.vrHelper.currentVRCamera && this.sceneManager.vrHelper.currentVRCamera !== this.sceneManager.camera) {
                if (this.configuration.vr && this.configuration.vr.cameraPosition !== undefined) {
                    this.sceneManager.vrHelper.currentVRCamera.position.copyFromFloats(this.configuration.vr.cameraPosition.x, this.configuration.vr.cameraPosition.y, this.configuration.vr.cameraPosition.z);
                } else {
                    this.sceneManager.vrHelper.currentVRCamera.position.copyFromFloats(0, this.sceneManager.vrHelper.currentVRCamera.position.y, -1);
                }
                (<TargetCamera>this.sceneManager.vrHelper.currentVRCamera).rotationQuaternion && (<TargetCamera>this.sceneManager.vrHelper.currentVRCamera).rotationQuaternion.copyFromFloats(0, 0, 0, 1);
                // set the height of the model to be what the user has configured, or floating by default
                if (this.configuration.vr && this.configuration.vr.modelHeightCorrection !== undefined) {
                    if (typeof this.configuration.vr.modelHeightCorrection === 'number') {
                        this._vrModelRepositioning = this.configuration.vr.modelHeightCorrection;
                    } else if (this.configuration.vr.modelHeightCorrection) {
                        this._vrModelRepositioning = this.sceneManager.vrHelper.currentVRCamera.position.y / 2;
                    } else {
                        this._vrModelRepositioning = 0;
                    }
                }

                // scale the model
                if (this.sceneManager.models.length) {
                    let boundingVectors = this.sceneManager.models[0].rootMesh.getHierarchyBoundingVectors();
                    let sizeVec = boundingVectors.max.subtract(boundingVectors.min);
                    let maxDimension = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
                    this._vrScale = (1 / maxDimension);
                    if (this.configuration.vr && this.configuration.vr.objectScaleFactor) {
                        this._vrScale *= this.configuration.vr.objectScaleFactor;
                    }

                    this.sceneManager.models[0].rootMesh.scaling.scaleInPlace(this._vrScale);

                    // reposition the object to "float" in front of the user
                    this.sceneManager.models[0].rootMesh.position.y += this._vrModelRepositioning;
                    this.sceneManager.models[0].rootMesh.rotationQuaternion = null;
                }

                // scale the environment to match the model
                if (this.sceneManager.environmentHelper) {
                    this.sceneManager.environmentHelper.ground && this.sceneManager.environmentHelper.ground.scaling.scaleInPlace(this._vrScale);
                    this.sceneManager.environmentHelper.skybox && this.sceneManager.environmentHelper.skybox.scaling.scaleInPlace(this._vrScale);
                }

                // post processing
                if (this.sceneManager.defaultRenderingPipelineEnabled && this.sceneManager.defaultRenderingPipeline) {
                    this.sceneManager.defaultRenderingPipeline.imageProcessingEnabled = false;
                    this.sceneManager.defaultRenderingPipeline.prepare();
                }
            } else {
                this._vrModelRepositioning = 0;
            }
        } else {
            if (this.sceneManager.vrHelper) {
                this.sceneManager.vrHelper.exitVR();
            }
        }
    }

    protected _initVR() {

        if (this.sceneManager.vrHelper) {
            this.observablesManager.onExitingVRObservable.add(() => {
                if (this._vrToggled) {
                    this._vrToggled = false;

                    // undo the scaling of the model
                    if (this.sceneManager.models.length) {
                        this.sceneManager.models[0].rootMesh.scaling.scaleInPlace(1 / this._vrScale);
                        this.sceneManager.models[0].rootMesh.position.y -= this._vrModelRepositioning;
                    }

                    // undo the scaling of the environment
                    if (this.sceneManager.environmentHelper) {
                        this.sceneManager.environmentHelper.ground && this.sceneManager.environmentHelper.ground.scaling.scaleInPlace(1 / this._vrScale);
                        this.sceneManager.environmentHelper.skybox && this.sceneManager.environmentHelper.skybox.scaling.scaleInPlace(1 / this._vrScale);
                    }

                    // post processing
                    if (this.sceneManager.defaultRenderingPipelineEnabled && this.sceneManager.defaultRenderingPipeline) {
                        this.sceneManager.defaultRenderingPipeline.imageProcessingEnabled = true;
                        this.sceneManager.defaultRenderingPipeline.prepare();
                    }

                    // clear set height and eidth
                    this.canvas.removeAttribute("height");
                    this.canvas.removeAttribute("width");
                    this.engine.resize();
                }
            });
        }

        this._vrInit = true;
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

        if (this.configuration.engine && this.configuration.engine.disableResize) {
            return;
        }

        this.engine.resize();
    }

    protected _onConfigurationLoaded(configuration: ViewerConfiguration) {
        this._configurationContainer.configuration = deepmerge(this.configuration || {}, configuration);
        if (this.configuration.observers) {
            this._configureObservers(this.configuration.observers);
        }
        // TODO remove this after testing, as this is done in the updateConfiguration as well.
        if (this.configuration.loaderPlugins) {
            Object.keys(this.configuration.loaderPlugins).forEach(((name) => {
                if (this.configuration.loaderPlugins && this.configuration.loaderPlugins[name]) {
                    this.modelLoader.addPlugin(name);
                }
            }));
        }

        this.observablesManager.onViewerInitStartedObservable.notifyObservers(this);
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
            if (this.runRenderLoop || force) {
                this.engine.performanceMonitor.enable();
                this.sceneManager.scene.render();
                this.onFrameRenderedObservable.notifyObservers(this);
            } else {
                this.engine.performanceMonitor.disable();

                // update camera instead of rendering
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
                Tools.CreateScreenshot(this.engine, this.sceneManager.camera, { width, height }, (data) => {
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
     * @param newConfiguration the partial configuration to update or a URL to a JSON holding the updated configuration
     *
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration> | string = this.configuration) {
        if (typeof newConfiguration === "string") {
            Tools.LoadFile(newConfiguration, (data) => {
                try {
                    const newData = JSON.parse(data.toString()) as ViewerConfiguration;
                    return this.updateConfiguration(newData);
                } catch (e) {
                    console.log("Error parsing file " + newConfiguration);
                }

            }, undefined, undefined, undefined, (error) => {
                console.log("Error parsing file " + newConfiguration, error);
            });
        } else {
            //backcompat
            processConfigurationCompatibility(newConfiguration);
            // update this.configuration with the new data
            this._configurationContainer.configuration = deepmerge(this.configuration || {}, newConfiguration);

            this.sceneManager.updateConfiguration(newConfiguration);

            // observers in configuration
            if (newConfiguration.observers) {
                this._configureObservers(newConfiguration.observers);
            }

            if (newConfiguration.loaderPlugins) {
                Object.keys(newConfiguration.loaderPlugins).forEach(((name) => {
                    if (newConfiguration.loaderPlugins && newConfiguration.loaderPlugins[name]) {
                        this.modelLoader.addPlugin(name);
                    }
                }));
            }
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
            if (observersConfiguration.onEngineInit === '' && this.configuration.observers && this.configuration.observers!.onEngineInit) {
                this.onEngineInitObservable.removeCallback(window[this.configuration.observers!.onEngineInit!]);
            }
        }
        if (observersConfiguration.onSceneInit) {
            this.onSceneInitObservable.add(window[observersConfiguration.onSceneInit]);
        } else {
            if (observersConfiguration.onSceneInit === '' && this.configuration.observers && this.configuration.observers!.onSceneInit) {
                this.onSceneInitObservable.removeCallback(window[this.configuration.observers!.onSceneInit!]);
            }
        }
        if (observersConfiguration.onModelLoaded) {
            this.onModelLoadedObservable.add(window[observersConfiguration.onModelLoaded]);
        } else {
            if (observersConfiguration.onModelLoaded === '' && this.configuration.observers && this.configuration.observers!.onModelLoaded) {
                this.onModelLoadedObservable.removeCallback(window[this.configuration.observers!.onModelLoaded!]);
            }
        }
    }

    /**
     * Dispose the entire viewer including the scene and the engine
     */
    public dispose() {
        if (this._isDisposed) {
            return;
        }
        window.removeEventListener('resize', this._resize);

        if (this.sceneManager) {
            if (this.sceneManager.scene && this.sceneManager.scene.activeCamera) {
                this.sceneManager.scene.activeCamera.detachControl(this.canvas);
            }
            this.sceneManager.dispose();
        }

        this._fpsTimeoutInterval && clearInterval(this._fpsTimeoutInterval);

        this.observablesManager.dispose();

        this.modelLoader.dispose();

        if (this.engine) {
            this.engine.dispose();
        }

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
    protected _onTemplateLoaded(): Promise<AbstractViewer> {
        // check if viewer was disposed right after created
        if (this._isDisposed) {
            return Promise.reject("viewer was disposed");
        }
        return this._onTemplatesLoaded().then(() => {
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
                Tools.Warn(e.toString());
                return this;
            });
        });
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

        //let canvasElement = this.templateManager.getCanvas();
        if (!this.canvas) {
            return Promise.reject('Canvas element not found!');
        }
        let config = this.configuration.engine || {};
        // TDO enable further configuration

        // check for webgl2 support, force-disable if needed.
        if (viewerGlobals.disableWebGL2Support) {
            config.engineOptions = config.engineOptions || {};
            config.engineOptions.disableWebGL2Support = true;
        }

        this.engine = new Engine(this.canvas, !!config.antialiasing, config.engineOptions);

        if (!config.disableResize) {
            window.addEventListener('resize', this._resize);
        }

        if (this.configuration.engine) {
            if (this.configuration.engine.adaptiveQuality) {
                var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
                this.engine.setHardwareScalingLevel(scale);
            }
            if (this.configuration.engine.hdEnabled) {
                this.toggleHD();
            }
        }

        // create a new template manager for this viewer
        this.sceneManager = new SceneManager(this.engine, this._configurationContainer, this.observablesManager);

        return Promise.resolve(this.engine);
    }

    private _isLoading: boolean;

    /**
     * Initialize a model loading. The returned object (a ViewerModel object) will be loaded in the background.
     * The difference between this and loadModel is that loadModel will fulfill the promise when the model finished loading.
     *
     * @param modelConfig model configuration to use when loading the model.
     * @param clearScene should the scene be cleared before loading this model
     * @returns a ViewerModel object that is not yet fully loaded.
     */
    public initModel(modelConfig: string | File | IModelConfiguration, clearScene: boolean = true): ViewerModel {
        let configuration: IModelConfiguration;
        if (typeof modelConfig === 'string') {
            configuration = {
                url: modelConfig
            };
        } else if (modelConfig instanceof File) {
            configuration = {
                file: modelConfig,
                root: "file:"
            };
        } else {
            configuration = modelConfig;
        }

        if (!configuration.url && !configuration.file) {
            throw new Error("no model provided");
        }

        if (clearScene) {
            this.sceneManager.clearScene(true, false);
        }

        //merge the configuration for future models:
        if (this.configuration.model && typeof this.configuration.model === 'object') {
            let globalConfig = deepmerge({}, this.configuration.model);
            configuration = deepmerge(globalConfig, configuration);
            if (modelConfig instanceof File) {
                configuration.file = modelConfig;
            }
        } else {
            this.configuration.model = configuration;
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
     * load a model using the provided configuration.
     * This function, as opposed to initModel, will return a promise that resolves when the model is loaded, and rejects with error.
     * If you want to attach to the observables of the model, use initModle instead.
     *
     * @param modelConfig the model configuration or URL to load.
     * @param clearScene Should the scene be cleared before loading the model
     * @returns a Promise the fulfills when the model finished loading successfully.
     */
    public loadModel(modelConfig: string | File | IModelConfiguration, clearScene: boolean = true): Promise<ViewerModel> {
        if (this._isLoading) {
            // We can decide here whether or not to cancel the lst load, but the developer can do that.
            return Promise.reject("another model is curently being loaded.");
        }

        return Promise.resolve(this.sceneManager.scene).then((scene) => {
            if (!scene) { return this.sceneManager.initScene(this.configuration.scene, this.configuration.optimizer); }
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
        });
    }

    private _fpsTimeoutInterval: number;

    protected _initTelemetryEvents() {
        telemetryManager.broadcast("Engine Capabilities", this.baseId, this.engine.getCaps());
        telemetryManager.broadcast("Platform Details", this.baseId, {
            userAgent: navigator.userAgent,
            platform: navigator.platform
        });

        telemetryManager.flushWebGLErrors(this.engine, this.baseId);

        let trackFPS: Function = () => {
            telemetryManager.broadcast("Current FPS", this.baseId, { fps: this.engine.getFps() });
        };

        trackFPS();
        // Track the FPS again after 60 seconds
        this._fpsTimeoutInterval = window.setInterval(trackFPS, 60 * 1000);
    }

    /**
     * Injects all the spectre shader in the babylon shader store
     */
    protected _injectCustomShaders(): void {
        let customShaders = this.configuration.customShaders;
        // Inject all the spectre shader in the babylon shader store.
        if (!customShaders) {
            return;
        }
        if (customShaders.shaders) {
            Object.keys(customShaders.shaders).forEach((key) => {
                // typescript considers a callback "unsafe", so... '!'
                Effect.ShadersStore[key] = customShaders!.shaders![key];
            });
        }
        if (customShaders.includes) {
            Object.keys(customShaders.includes).forEach((key) => {
                // typescript considers a callback "unsafe", so... '!'
                Effect.IncludesShadersStore[key] = customShaders!.includes![key];
            });
        }
    }
}