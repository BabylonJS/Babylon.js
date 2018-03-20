import { viewerManager } from './viewerManager';
import { TemplateManager } from './../templateManager';
import { ConfigurationLoader } from './../configuration/loader';
import { Skeleton, AnimationGroup, ParticleSystem, CubeTexture, Color3, IEnvironmentHelperOptions, EnvironmentHelper, Effect, SceneOptimizer, SceneOptimizerOptions, Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, AbstractMesh, Mesh, HemisphericLight, Database, SceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Quaternion, Light, ShadowLight, ShadowGenerator, Tags, AutoRotationBehavior, BouncingBehavior, FramingBehavior, Behavior, Tools } from 'babylonjs';
import { ViewerConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, IObserversConfiguration, IModelConfiguration, ISkyboxConfiguration, IGroundConfiguration, ILightConfiguration, ICameraConfiguration } from '../configuration/configuration';

import * as deepmerge from '../../assets/deepmerge.min.js';
import { ViewerModel } from '../model/viewerModel';
import { GroupModelAnimation } from '../model/modelAnimation';
import { ModelLoader } from '../model/modelLoader';
import { CameraBehavior } from '../interfaces';

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
     * The Babylon Scene of this viewer
     */
    public scene: Scene;
    /**
     * The camera used in this viewer
     */
    public camera: ArcRotateCamera;
    /**
     * Babylon's scene optimizer
     */
    public sceneOptimizer: SceneOptimizer;
    /**
     * The ID of this viewer. it will be generated randomly or use the HTML Element's ID.
     */
    public readonly baseId: string;
    /**
     * Models displayed in this viewer.
     */
    public models: Array<ViewerModel>;

    /**
     * The last loader used to load a model. 
     */
    public lastUsedLoader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
    /**
     * The ModelLoader instance connected with this viewer.
     */
    public modelLoader: ModelLoader;

    /**
     * the viewer configuration object
     */
    protected _configuration: ViewerConfiguration;
    /**
     * Babylon's environment helper of this viewer
     */
    public environmentHelper: EnvironmentHelper;

    //The following are configuration objects, default values.
    protected _defaultHighpTextureType: number;
    protected _shadowGeneratorBias: number;
    protected _defaultPipelineTextureType: number;

    /**
     * The maximum number of shadows supported by the curent viewer
     */
    protected _maxShadows: number;
    /**
     * is HDR supported?
     */
    private _hdrSupport: boolean;

    /**
     * is this viewer disposed?
     */
    protected _isDisposed: boolean = false;

    /**
     * Returns a boolean representing HDR support
     */
    public get isHdrSupported() {
        return this._hdrSupport;
    }


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
     * will notify when a new loader was initialized.
     * Used mainly to know when a model starts loading.
     */
    public onLoaderInitObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    /**
     * Observers registered here will be executed when the entire load process has finished.
     */
    public onInitDoneObservable: Observable<AbstractViewer>;

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
     * registered onBeforeRender functions.
     * This functions are also registered at the native scene. The reference can be used to unregister them.
     */
    protected _registeredOnBeforeRenderFunctions: Array<() => void>;
    /**
     * The configuration loader of this viewer
     */
    protected _configurationLoader: ConfigurationLoader;

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
        this.onInitDoneObservable = new Observable();
        this.onLoaderInitObservable = new Observable();

        this._registeredOnBeforeRenderFunctions = [];
        this.models = [];
        this.modelLoader = new ModelLoader(this);

        // add this viewer to the viewer manager
        viewerManager.addViewer(this);

        // create a new template manager. TODO - singleton?
        this.templateManager = new TemplateManager(containerElement);

        this._prepareContainerElement();

        // extend the configuration
        this._configurationLoader = new ConfigurationLoader();
        this._configurationLoader.loadConfiguration(initialConfiguration, (configuration) => {
            this._configuration = deepmerge(this._configuration || {}, configuration);
            if (this._configuration.observers) {
                this._configureObservers(this._configuration.observers);
            }
            //this.updateConfiguration(configuration);

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

        this.engine.resize();
    }

    /**
     * render loop that will be executed by the engine
     */
    protected _render = (): void => {
        this.scene && this.scene.activeCamera && this.scene.render();
    }

    /**
     * Update the current viewer configuration with new values.
     * Only provided information will be updated, old configuration values will be kept.
     * If this.configuration was manually changed, you can trigger this function with no parameters, 
     * and the entire configuration will be updated. 
     * @param newConfiguration 
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration> = this._configuration) {
        // update this.configuration with the new data
        this._configuration = deepmerge(this._configuration || {}, newConfiguration);

        // update scene configuration
        if (newConfiguration.scene) {
            this._configureScene(newConfiguration.scene);
        }
        // optimizer
        if (newConfiguration.optimizer) {
            this._configureOptimizer(newConfiguration.optimizer);
        }

        // observers in configuration
        if (newConfiguration.observers) {
            this._configureObservers(newConfiguration.observers);
        }

        // configure model
        if (newConfiguration.model && typeof newConfiguration.model === 'object') {
            this._configureModel(newConfiguration.model);
        }

        // lights
        if (newConfiguration.lights) {
            this._configureLights(newConfiguration.lights);
        }

        // environment
        if (newConfiguration.skybox !== undefined || newConfiguration.ground !== undefined) {
            this._configureEnvironment(newConfiguration.skybox, newConfiguration.ground);
        }

        // camera
        if (newConfiguration.camera) {
            this._configureCamera(newConfiguration.camera);
        }
    }

    protected _configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean) {
        if (!skyboxConifguration && !groundConfiguration) {
            if (this.environmentHelper) {
                this.environmentHelper.dispose();
                delete this.environmentHelper;
            };
            return Promise.resolve(this.scene);
        }

        const options: Partial<IEnvironmentHelperOptions> = {
            createGround: !!groundConfiguration,
            createSkybox: !!skyboxConifguration,
            setupImageProcessing: false // will be done at the scene level!
        };

        if (groundConfiguration) {
            let groundConfig = (typeof groundConfiguration === 'boolean') ? {} : groundConfiguration;

            let groundSize = groundConfig.size || (typeof skyboxConifguration === 'object' && skyboxConifguration.scale);
            if (groundSize) {
                options.groundSize = groundSize;
            }

            options.enableGroundShadow = groundConfig === true || groundConfig.receiveShadows;
            if (groundConfig.shadowLevel !== undefined) {
                options.groundShadowLevel = groundConfig.shadowLevel;
            }
            options.enableGroundMirror = !!groundConfig.mirror;
            if (groundConfig.texture) {
                options.groundTexture = groundConfig.texture;
            }
            if (groundConfig.color) {
                options.groundColor = new Color3(groundConfig.color.r, groundConfig.color.g, groundConfig.color.b)
            }

            if (groundConfig.opacity !== undefined) {
                options.groundOpacity = groundConfig.opacity;
            }

            if (groundConfig.mirror) {
                options.enableGroundMirror = true;
                // to prevent undefines
                if (typeof groundConfig.mirror === "object") {
                    if (groundConfig.mirror.amount !== undefined)
                        options.groundMirrorAmount = groundConfig.mirror.amount;
                    if (groundConfig.mirror.sizeRatio !== undefined)
                        options.groundMirrorSizeRatio = groundConfig.mirror.sizeRatio;
                    if (groundConfig.mirror.blurKernel !== undefined)
                        options.groundMirrorBlurKernel = groundConfig.mirror.blurKernel;
                    if (groundConfig.mirror.fresnelWeight !== undefined)
                        options.groundMirrorFresnelWeight = groundConfig.mirror.fresnelWeight;
                    if (groundConfig.mirror.fallOffDistance !== undefined)
                        options.groundMirrorFallOffDistance = groundConfig.mirror.fallOffDistance;
                    if (this._defaultPipelineTextureType !== undefined)
                        options.groundMirrorTextureType = this._defaultPipelineTextureType;
                }
            }

        }

        let postInitSkyboxMaterial = false;
        if (skyboxConifguration) {
            let conf = skyboxConifguration === true ? {} : skyboxConifguration;
            if (conf.material && conf.material.imageProcessingConfiguration) {
                options.setupImageProcessing = false; // will be configured later manually.
            }
            let skyboxSize = conf.scale;
            if (skyboxSize) {
                options.skyboxSize = skyboxSize;
            }
            options.sizeAuto = !options.skyboxSize;
            if (conf.color) {
                options.skyboxColor = new Color3(conf.color.r, conf.color.g, conf.color.b)
            }
            if (conf.cubeTexture && conf.cubeTexture.url) {
                if (typeof conf.cubeTexture.url === "string") {
                    options.skyboxTexture = conf.cubeTexture.url;
                } else {
                    // init later!
                    postInitSkyboxMaterial = true;
                }
            }

            if (conf.material && conf.material.imageProcessingConfiguration) {
                postInitSkyboxMaterial = true;
            }
        }

        options.setupImageProcessing = false; // TMP

        if (!this.environmentHelper) {
            this.environmentHelper = this.scene.createDefaultEnvironment(options)!;
        } else {
            // there might be a new scene! we need to dispose.

            // get the scene used by the envHelper
            let scene: Scene = this.environmentHelper.rootMesh.getScene();
            // is it a different scene? Oh no!
            if (scene !== this.scene) {
                this.environmentHelper.dispose();
                this.environmentHelper = this.scene.createDefaultEnvironment(options)!;
            } else {
                this.environmentHelper.updateOptions(options)!;
            }
        }

        if (postInitSkyboxMaterial) {
            let skyboxMaterial = this.environmentHelper.skyboxMaterial;
            if (skyboxMaterial) {
                if (typeof skyboxConifguration === 'object' && skyboxConifguration.material && skyboxConifguration.material.imageProcessingConfiguration) {
                    this._extendClassWithConfig(skyboxMaterial.imageProcessingConfiguration, skyboxConifguration.material.imageProcessingConfiguration);
                }
            }
        }
    }

    /**
     * internally configure the scene using the provided configuration.
     * The scene will not be recreated, but just updated.
     * @param sceneConfig the (new) scene configuration
     */
    protected _configureScene(sceneConfig: ISceneConfiguration) {
        // sanity check!
        if (!this.scene) {
            return;
        }
        if (sceneConfig.debug) {
            this.scene.debugLayer.show();
        } else {
            if (this.scene.debugLayer.isVisible()) {
                this.scene.debugLayer.hide();
            }
        }

        if (sceneConfig.clearColor) {
            let cc = sceneConfig.clearColor;
            let oldcc = this.scene.clearColor;
            if (cc.r !== undefined) {
                oldcc.r = cc.r;
            }
            if (cc.g !== undefined) {
                oldcc.g = cc.g
            }
            if (cc.b !== undefined) {
                oldcc.b = cc.b
            }
            if (cc.a !== undefined) {
                oldcc.a = cc.a
            }
        }

        // image processing configuration - optional.
        if (sceneConfig.imageProcessingConfiguration) {
            this._extendClassWithConfig(this.scene.imageProcessingConfiguration, sceneConfig.imageProcessingConfiguration);
        }
        if (sceneConfig.environmentTexture) {
            if (this.scene.environmentTexture) {
                this.scene.environmentTexture.dispose();
            }
            const environmentTexture = CubeTexture.CreateFromPrefilteredData(sceneConfig.environmentTexture, this.scene);
            this.scene.environmentTexture = environmentTexture;
        }

        if (sceneConfig.autoRotate) {
            this.camera.useAutoRotationBehavior = true;
        }
    }


    /**
     * Configure the scene optimizer.
     * The existing scene optimizer will be disposed and a new one will be created.
     * @param optimizerConfig the (new) optimizer configuration
     */
    protected _configureOptimizer(optimizerConfig: ISceneOptimizerConfiguration | boolean) {
        if (typeof optimizerConfig === 'boolean') {
            if (this.sceneOptimizer) {
                this.sceneOptimizer.stop();
                this.sceneOptimizer.dispose();
                delete this.sceneOptimizer;
            }
            if (optimizerConfig) {
                this.sceneOptimizer = new SceneOptimizer(this.scene);
                this.sceneOptimizer.start();
            }
        } else {
            let optimizerOptions: SceneOptimizerOptions = new SceneOptimizerOptions(optimizerConfig.targetFrameRate, optimizerConfig.trackerDuration);
            // check for degradation
            if (optimizerConfig.degradation) {
                switch (optimizerConfig.degradation) {
                    case "low":
                        optimizerOptions = SceneOptimizerOptions.LowDegradationAllowed(optimizerConfig.targetFrameRate);
                        break;
                    case "moderate":
                        optimizerOptions = SceneOptimizerOptions.ModerateDegradationAllowed(optimizerConfig.targetFrameRate);
                        break;
                    case "hight":
                        optimizerOptions = SceneOptimizerOptions.HighDegradationAllowed(optimizerConfig.targetFrameRate);
                        break;
                }
            }
            if (this.sceneOptimizer) {
                this.sceneOptimizer.stop();
                this.sceneOptimizer.dispose()
            }
            this.sceneOptimizer = new SceneOptimizer(this.scene, optimizerOptions, optimizerConfig.autoGeneratePriorities, optimizerConfig.improvementMode);
            this.sceneOptimizer.start();
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
     * (Re) configure the camera. The camera will only be created once and from this point will only be reconfigured.
     * @param cameraConfig the new camera configuration
     * @param model optionally use the model to configure the camera.
     */
    protected _configureCamera(cameraConfig: ICameraConfiguration, model?: ViewerModel) {
        let focusMeshes = model ? model.meshes : this.scene.meshes;

        if (!this.scene.activeCamera) {
            this.scene.createDefaultCamera(true, true, true);
            this.camera = <ArcRotateCamera>this.scene.activeCamera!;
        }
        if (cameraConfig.position) {
            this.camera.position.copyFromFloats(cameraConfig.position.x || 0, cameraConfig.position.y || 0, cameraConfig.position.z || 0);
        }

        if (cameraConfig.rotation) {
            this.camera.rotationQuaternion = new Quaternion(cameraConfig.rotation.x || 0, cameraConfig.rotation.y || 0, cameraConfig.rotation.z || 0, cameraConfig.rotation.w || 0)
        }

        this._extendClassWithConfig(this.camera, cameraConfig);

        this.camera.minZ = cameraConfig.minZ || this.camera.minZ;
        this.camera.maxZ = cameraConfig.maxZ || this.camera.maxZ;

        if (cameraConfig.behaviors) {
            for (let name in cameraConfig.behaviors) {
                this._setCameraBehavior(cameraConfig.behaviors[name], focusMeshes);
            }
        };

        const sceneExtends = this.scene.getWorldExtends((mesh) => {
            return !this.environmentHelper || (mesh !== this.environmentHelper.ground && mesh !== this.environmentHelper.rootMesh && mesh !== this.environmentHelper.skybox);
        });
        const sceneDiagonal = sceneExtends.max.subtract(sceneExtends.min);
        const sceneDiagonalLenght = sceneDiagonal.length();
        if (isFinite(sceneDiagonalLenght))
            this.camera.upperRadiusLimit = sceneDiagonalLenght * 3;
    }

    /**
     * configure the lights.
     * 
     * @param lightsConfiguration the (new) light(s) configuration
     * @param model optionally use the model to configure the camera.
     */
    protected _configureLights(lightsConfiguration: { [name: string]: ILightConfiguration | boolean } = {}, model?: ViewerModel) {
        let focusMeshes = model ? model.meshes : this.scene.meshes;
        // sanity check!
        if (!Object.keys(lightsConfiguration).length) return;

        let lightsAvailable: Array<string> = this.scene.lights.map(light => light.name);
        // compare to the global (!) configuration object and dispose unneeded:
        let lightsToConfigure = Object.keys(this._configuration.lights || []);
        if (Object.keys(lightsToConfigure).length !== lightsAvailable.length) {
            lightsAvailable.forEach(lName => {
                if (lightsToConfigure.indexOf(lName) === -1) {
                    this.scene.getLightByName(lName)!.dispose()
                }
            });
        }

        Object.keys(lightsConfiguration).forEach((name, idx) => {
            let lightConfig: ILightConfiguration = { type: 0 };
            if (typeof lightsConfiguration[name] === 'object') {
                lightConfig = <ILightConfiguration>lightsConfiguration[name];
            }

            lightConfig.name = name;

            let light: Light;
            // light is not already available
            if (lightsAvailable.indexOf(name) === -1) {
                let constructor = Light.GetConstructorFromName(lightConfig.type, lightConfig.name, this.scene);
                if (!constructor) return;
                light = constructor();
            } else {
                // available? get it from the scene
                light = <Light>this.scene.getLightByName(name);
                lightsAvailable = lightsAvailable.filter(ln => ln !== name);
                if (lightConfig.type !== undefined && light.getTypeID() !== lightConfig.type) {
                    light.dispose();
                    let constructor = Light.GetConstructorFromName(lightConfig.type, lightConfig.name, this.scene);
                    if (!constructor) return;
                    light = constructor();
                }
            }

            // if config set the light to false, dispose it.
            if (lightsConfiguration[name] === false) {
                light.dispose();
                return;
            }

            //enabled
            var enabled = lightConfig.enabled !== undefined ? lightConfig.enabled : !lightConfig.disabled;
            light.setEnabled(enabled);


            this._extendClassWithConfig(light, lightConfig);

            //position. Some lights don't support shadows
            if (light instanceof ShadowLight) {
                if (lightConfig.target) {
                    if (light.setDirectionToTarget) {
                        let target = Vector3.Zero().copyFrom(lightConfig.target as Vector3);
                        light.setDirectionToTarget(target);
                    }
                } else if (lightConfig.direction) {
                    let direction = Vector3.Zero().copyFrom(lightConfig.direction as Vector3);
                    light.direction = direction;
                }
                let shadowGenerator = light.getShadowGenerator();
                if (lightConfig.shadowEnabled && this._maxShadows) {
                    if (!shadowGenerator) {
                        shadowGenerator = new ShadowGenerator(512, light);
                        // TODO blur kernel definition
                    }
                    this._extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
                    // add the focues meshes to the shadow list
                    let shadownMap = shadowGenerator.getShadowMap();
                    if (!shadownMap) return;
                    let renderList = shadownMap.renderList;
                    for (var index = 0; index < focusMeshes.length; index++) {
                        if (Tags.MatchesQuery(focusMeshes[index], 'castShadow')) {
                            renderList && renderList.push(focusMeshes[index]);
                        }
                    }
                } else if (shadowGenerator) {
                    shadowGenerator.dispose();
                }
            }
        });
    }

    /**
     * configure all models using the configuration.
     * @param modelConfiguration the configuration to use to reconfigure the models
     */
    protected _configureModel(modelConfiguration: Partial<IModelConfiguration>) {
        this.models.forEach(model => {
            model.updateConfiguration(modelConfiguration);
        })
    }

    /**
     * Dispoe the entire viewer including the scene and the engine
     */
    public dispose() {
        if (this._isDisposed) {
            return;
        }
        window.removeEventListener('resize', this._resize);
        if (this.sceneOptimizer) {
            this.sceneOptimizer.stop();
            this.sceneOptimizer.dispose();
        }

        if (this.environmentHelper) {
            this.environmentHelper.dispose();
        }

        if (this._configurationLoader) {
            this._configurationLoader.dispose();
        }

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

        if (this.scene.activeCamera) {
            this.scene.activeCamera.detachControl(this.canvas);
        }

        this.modelLoader.dispose();

        this.models.forEach(model => {
            model.dispose();
        });

        this.models.length = 0;

        this.scene.dispose();
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
            let autoLoadModel = this._configuration.model;
            return this._initEngine().then((engine) => {
                return this.onEngineInitObservable.notifyObserversWithPromise(engine);
            }).then(() => {
                if (autoLoadModel) {
                    return this.loadModel().catch(e => { }).then(() => { return this.scene });
                } else {
                    return this.scene || this._initScene();
                }
            }).then((scene) => {
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
        this.engine = new Engine(canvasElement, !!config.antialiasing, config.engineOptions);

        // Disable manifest checking
        Database.IDBStorageEnabled = false;

        if (!config.disableResize) {
            window.addEventListener('resize', this._resize);
        }


        this.engine.runRenderLoop(this._render);

        if (this._configuration.engine && this._configuration.engine.adaptiveQuality) {
            var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
            this.engine.setHardwareScalingLevel(scale);
        }

        // set hardware limitations for scene initialization
        this._handleHardwareLimitations();

        return Promise.resolve(this.engine);
    }

    /**
     * initialize the scene. Calling thsi function again will dispose the old scene, if exists.
     */
    protected _initScene(): Promise<Scene> {

        // if the scen exists, dispose it.
        if (this.scene) {
            this.scene.dispose();
        }

        // create a new scene
        this.scene = new Scene(this.engine);
        // make sure there is a default camera and light.
        this.scene.createDefaultLight(true);

        if (this._configuration.scene) {
            this._configureScene(this._configuration.scene);

            // Scene optimizer
            if (this._configuration.optimizer) {
                this._configureOptimizer(this._configuration.optimizer);
            }
        }

        return Promise.resolve(this.scene);
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
    public initModel(modelConfig: IModelConfiguration, clearScene: boolean = true): ViewerModel {
        if (clearScene) {
            this.models.forEach(m => m.dispose());
            this.models.length = 0;
        }
        let model = this.modelLoader.load(modelConfig);

        this.lastUsedLoader = model.loader;
        model.onLoadErrorObservable.add((errorObject) => {
            this.onModelLoadErrorObservable.notifyObserversWithPromise(errorObject);
        });
        model.onLoadProgressObservable.add((progressEvent) => {
            return this.onModelLoadProgressObservable.notifyObserversWithPromise(progressEvent);
        });
        this.onLoaderInitObservable.notifyObserversWithPromise(this.lastUsedLoader);

        model.onLoadedObservable.add(() => {
            this.onModelLoadedObservable.notifyObserversWithPromise(model)
                .then(() => {
                    this._configureLights(this._configuration.lights);

                    if (this._configuration.camera) {
                        this._configureCamera(this._configuration.camera, model);
                    }
                    return this._initEnvironment(model);
                }).then(() => {
                    this._isLoading = false;
                    return model;
                });
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
    public loadModel(modelConfig: any = this._configuration.model, clearScene: boolean = true): Promise<ViewerModel> {
        // no model was provided? Do nothing!
        let modelUrl = (typeof modelConfig === 'string') ? modelConfig : modelConfig.url;
        if (!modelUrl) {
            return Promise.reject("no model configuration found");
        }
        if (this._isLoading) {
            // We can decide here whether or not to cancel the lst load, but the developer can do that.
            return Promise.reject("another model is curently being loaded.");
        }
        this._isLoading = true;
        if ((typeof modelConfig === 'string')) {
            if (this._configuration.model && typeof this._configuration.model === 'object') {
                this._configuration.model.url = modelConfig;
            }
        } else {
            if (this._configuration.model) {
                deepmerge(this._configuration.model, modelConfig)
            } else {
                this._configuration.model = modelConfig;
            }
        }

        return Promise.resolve(this.scene).then((scene) => {
            if (!scene) return this._initScene();
            return scene;
        }).then(() => {
            return new Promise<ViewerModel>((resolve, reject) => {
                // at this point, configuration.model is an object, not a string
                return this.initModel(modelConfig, clearScene);
            });
        })
    }

    /**
     * initialize the environment for a specific model.
     * Per default it will use the viewer'S configuration.
     * @param model the model to use to configure the environment.
     * @returns a Promise that will resolve when the configuration is done.
     */
    protected _initEnvironment(model?: ViewerModel): Promise<Scene> {
        this._configureEnvironment(this._configuration.skybox, this._configuration.ground);

        return Promise.resolve(this.scene);
    }

    /**
     * Alters render settings to reduce features based on hardware feature limitations
     * @param options Viewer options to modify
     */
    protected _handleHardwareLimitations() {
        //flip rendering settings switches based on hardware support
        let maxVaryingRows = this.engine.getCaps().maxVaryingVectors;
        let maxFragmentSamplers = this.engine.getCaps().maxTexturesImageUnits;

        //shadows are disabled if there's not enough varyings for a single shadow
        if ((maxVaryingRows < 8) || (maxFragmentSamplers < 8)) {
            this._maxShadows = 0;
        } else {
            this._maxShadows = 3;
        }

        //can we render to any >= 16-bit targets (required for HDR)
        let caps = this.engine.getCaps();
        let linearHalfFloatTargets = caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering;
        let linearFloatTargets = caps.textureFloatRender && caps.textureFloatLinearFiltering;

        this._hdrSupport = !!(linearFloatTargets || linearHalfFloatTargets);

        if (linearHalfFloatTargets) {
            this._defaultHighpTextureType = Engine.TEXTURETYPE_HALF_FLOAT;
            this._shadowGeneratorBias = 0.002;
        } else if (linearFloatTargets) {
            this._defaultHighpTextureType = Engine.TEXTURETYPE_FLOAT;
            this._shadowGeneratorBias = 0.001;
        } else {
            this._defaultHighpTextureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            this._shadowGeneratorBias = 0.001;
        }

        this._defaultPipelineTextureType = this._hdrSupport ? this._defaultHighpTextureType : Engine.TEXTURETYPE_UNSIGNED_INT;
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

    /**
     * This will extend an object with configuration values.
     * What it practically does it take the keys from the configuration and set them on the object.
     * I the configuration is a tree, it will traverse into the tree.
     * @param object the object to extend
     * @param config the configuration object that will extend the object
     */
    protected _extendClassWithConfig(object: any, config: any) {
        if (!config) return;
        Object.keys(config).forEach(key => {
            if (key in object && typeof object[key] !== 'function') {
                // if (typeof object[key] === 'function') return;
                // if it is an object, iterate internally until reaching basic types
                if (typeof object[key] === 'object') {
                    this._extendClassWithConfig(object[key], config[key]);
                } else {
                    if (config[key] !== undefined) {
                        object[key] = config[key];
                    }
                }
            }
        });
    }

    private _setCameraBehavior(behaviorConfig: number | {
        type: number;
        [propName: string]: any;
    }, payload: any) {

        let behavior: Behavior<ArcRotateCamera> | null;
        let type = (typeof behaviorConfig !== "object") ? behaviorConfig : behaviorConfig.type;

        let config: { [propName: string]: any } = (typeof behaviorConfig === "object") ? behaviorConfig : {};

        // constructing behavior
        switch (type) {
            case CameraBehavior.AUTOROTATION:
                this.camera.useAutoRotationBehavior = true;
                behavior = this.camera.autoRotationBehavior;
                break;
            case CameraBehavior.BOUNCING:
                this.camera.useBouncingBehavior = true;
                behavior = this.camera.bouncingBehavior;
                break;
            case CameraBehavior.FRAMING:
                this.camera.useFramingBehavior = true;
                behavior = this.camera.framingBehavior;
                break;
            default:
                behavior = null;
                break;
        }

        if (behavior) {
            if (typeof behaviorConfig === "object") {
                this._extendClassWithConfig(behavior, behaviorConfig);
            }
        }

        // post attach configuration. Some functionalities require the attached camera.
        switch (type) {
            case CameraBehavior.AUTOROTATION:
                break;
            case CameraBehavior.BOUNCING:
                break;
            case CameraBehavior.FRAMING:
                if (config.zoomOnBoundingInfo) {
                    //payload is an array of meshes
                    let meshes = <Array<AbstractMesh>>payload;
                    let bounding = meshes[0].getHierarchyBoundingVectors();
                    (<FramingBehavior>behavior).zoomOnBoundingInfo(bounding.min, bounding.max);
                }
                break;
        }
    }
}