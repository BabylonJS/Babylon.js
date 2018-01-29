import { viewerManager } from './viewerManager';
import { TemplateManager } from './../templateManager';
import configurationLoader from './../configuration/loader';
import { CubeTexture, Color3, IEnvironmentHelperOptions, EnvironmentHelper, Effect, SceneOptimizer, SceneOptimizerOptions, Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, AbstractMesh, Mesh, HemisphericLight, Database, SceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Quaternion } from 'babylonjs';
import { ViewerConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, IObserversConfiguration, IModelConfiguration } from '../configuration/configuration';

import * as deepmerge from '../../assets/deepmerge.min.js';

export abstract class AbstractViewer {

    public templateManager: TemplateManager;

    public engine: Engine;
    public scene: Scene;
    public sceneOptimizer: SceneOptimizer;
    public baseId: string;

    /**
     * The last loader used to load a model. 
     * 
     * @type {(ISceneLoaderPlugin | ISceneLoaderPluginAsync)}
     * @memberof AbstractViewer
     */
    public lastUsedLoader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    protected configuration: ViewerConfiguration;
    protected environmentHelper: EnvironmentHelper;

    protected defaultHighpTextureType: number;
    protected shadowGeneratorBias: number;
    protected defaultPipelineTextureType: number;
    protected maxShadows: number;


    // observables
    public onSceneInitObservable: Observable<Scene>;
    public onEngineInitObservable: Observable<Engine>;
    public onModelLoadedObservable: Observable<AbstractMesh[]>;
    public onModelLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    public onModelLoadErrorObservable: Observable<{ message: string; exception: any }>;
    public onLoaderInitObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    public onInitDoneObservable: Observable<AbstractViewer>;

    protected canvas: HTMLCanvasElement;

    protected registeredOnBeforerenderFunctions: Array<() => void>;

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

        this.registeredOnBeforerenderFunctions = [];

        // add this viewer to the viewer manager
        viewerManager.addViewer(this);

        // create a new template manager. TODO - singleton?
        this.templateManager = new TemplateManager(containerElement);

        this.prepareContainerElement();

        // extend the configuration
        configurationLoader.loadConfiguration(initialConfiguration).then((configuration) => {
            this.configuration = configuration;
            //this.updateConfiguration(configuration);

            // initialize the templates
            let templateConfiguration = this.configuration.templates || {};
            this.templateManager.initTemplate(templateConfiguration);
            // when done, execute onTemplatesLoaded()
            this.templateManager.onAllLoaded.add(() => {
                let canvas = this.templateManager.getCanvas();
                if (canvas) {
                    this.canvas = canvas;
                }
                this._onTemplateLoaded();
            });
        });

        //this.onModelLoadedObservable.add(this.initEnvironment.bind(this));

    }

    public getBaseId(): string {
        return this.baseId;
    }

    public isCanvasInDOM(): boolean {
        return !!this.canvas && !!this.canvas.parentElement;
    }

    protected resize = (): void => {
        // Only resize if Canvas is in the DOM
        if (!this.isCanvasInDOM()) {
            return;
        }

        if (this.canvas.clientWidth <= 0 || this.canvas.clientHeight <= 0) {
            return;
        }

        this.engine.resize();
    }

    protected render = (): void => {
        this.scene && this.scene.render();
    }

    /**
     * Update the current viewer configuration with new values.
     * Only provided information will be updated, old configuration values will be kept.
     * If this.configuration was manually changed, you can trigger this function with no parameters, 
     * and the entire configuration will be updated. 
     * @param newConfiguration 
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration> = this.configuration) {
        // update scene configuration
        if (newConfiguration.scene) {
            this.configureScene(newConfiguration.scene);
        }
        // optimizer
        if (newConfiguration.optimizer) {
            this.configureOptimizer(newConfiguration.optimizer);
        }

        // observers in configuration
        if (newConfiguration.observers) {
            this.configureObservers(newConfiguration.observers);
        }

        // configure model
        if (newConfiguration.model && typeof newConfiguration.model === 'object') {
            this.configureModel(newConfiguration.model);
        }

        // update this.configuration with the new data
        this.configuration = deepmerge(this.configuration || {}, newConfiguration);
    }

    protected configureScene(sceneConfig: ISceneConfiguration, optimizerConfig?: ISceneOptimizerConfiguration) {
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
            this.extendClassWithConfig(this.scene.imageProcessingConfiguration, sceneConfig.imageProcessingConfiguration);
        }
        if (sceneConfig.environmentTexture) {
            if (this.scene.environmentTexture) {
                this.scene.environmentTexture.dispose();
            }
            const environmentTexture = CubeTexture.CreateFromPrefilteredData(sceneConfig.environmentTexture, this.scene);
            this.scene.environmentTexture = environmentTexture;
        }
    }

    protected configureOptimizer(optimizerConfig: ISceneOptimizerConfiguration | boolean) {
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

    protected configureObservers(observersConfiguration: IObserversConfiguration) {
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

    protected configureModel(modelConfiguration: Partial<IModelConfiguration>) {
        let meshesWithNoParent: Array<AbstractMesh> = this.scene.meshes.filter(m => !m.parent);
        let updateMeshesWithNoParent = (variable: string, value: any, param?: string) => {
            meshesWithNoParent.forEach(mesh => {
                if (param) {
                    mesh[variable][param] = value;
                } else {
                    mesh[variable] = value;
                }
            });
        }
        let updateXYZ = (variable: string, configValues: { x: number, y: number, z: number, w?: number }) => {
            if (configValues.x !== undefined) {
                updateMeshesWithNoParent(variable, configValues.x, 'x');
            }
            if (configValues.y !== undefined) {
                updateMeshesWithNoParent(variable, configValues.y, 'y');
            }
            if (configValues.z !== undefined) {
                updateMeshesWithNoParent(variable, configValues.z, 'z');
            }
            if (configValues.w !== undefined) {
                updateMeshesWithNoParent(variable, configValues.w, 'w');
            }
        }
        // position?
        if (modelConfiguration.position) {
            updateXYZ('position', modelConfiguration.position);
        }
        if (modelConfiguration.rotation) {
            if (modelConfiguration.rotation.w) {
                meshesWithNoParent.forEach(mesh => {
                    if (!mesh.rotationQuaternion) {
                        mesh.rotationQuaternion = new Quaternion();
                    }
                })
                updateXYZ('rotationQuaternion', modelConfiguration.rotation);
            } else {
                updateXYZ('rotation', modelConfiguration.rotation);
            }
        }
        if (modelConfiguration.scaling) {
            updateXYZ('scaling', modelConfiguration.scaling);
        }
    }

    public dispose() {
        window.removeEventListener('resize', this.resize);

        this.sceneOptimizer.stop();
        this.sceneOptimizer.dispose();

        if (this.scene.activeCamera) {
            this.scene.activeCamera.detachControl(this.canvas);
        }

        this.scene.dispose();
        this.engine.dispose();

        this.templateManager.dispose();
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
        return Promise.resolve(this);
    }

    /**
     * This will force the creation of an engine and a scene.
     * It will also load a model if preconfigured.
     * But first - it will load the extendible onTemplateLoaded()!
     */
    private _onTemplateLoaded(): Promise<AbstractViewer> {
        return this.onTemplatesLoaded().then(() => {
            let autoLoadModel = !!this.configuration.model;
            return this.initEngine().then((engine) => {
                return this.onEngineInitObservable.notifyObserversWithPromise(engine);
            }).then(() => {
                if (autoLoadModel) {
                    return this.loadModel();
                } else {
                    return this.scene || this.initScene();
                }
            }).then((scene) => {
                return this.onSceneInitObservable.notifyObserversWithPromise(scene);
            }).then(() => {
                return this.onInitDoneObservable.notifyObserversWithPromise(this);
            }).then(() => {
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
    protected initEngine(): Promise<Engine> {

        // init custom shaders
        this.injectCustomShaders();

        let canvasElement = this.templateManager.getCanvas();
        if (!canvasElement) {
            return Promise.reject('Canvas element not found!');
        }
        let config = this.configuration.engine || {};
        // TDO enable further configuration
        this.engine = new Engine(canvasElement, !!config.antialiasing, config.engineOptions);

        // Disable manifest checking
        Database.IDBStorageEnabled = false;

        if (!config.disableResize) {
            window.addEventListener('resize', this.resize);
        }


        this.engine.runRenderLoop(this.render);

        if (this.configuration.engine && this.configuration.engine.adaptiveQuality) {
            var scale = Math.max(0.5, 1 / (window.devicePixelRatio || 2));
            this.engine.setHardwareScalingLevel(scale);
        }

        // set hardware limitations for scene initialization
        this.handleHardwareLimitations();

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
        if (this.configuration.scene) {
            this.configureScene(this.configuration.scene);

            // Scene optimizer
            if (this.configuration.optimizer) {
                this.configureOptimizer(this.configuration.optimizer);
            }
        }

        return Promise.resolve(this.scene);
    }

    public loadModel(model: any = this.configuration.model, clearScene: boolean = true): Promise<Scene> {
        this.configuration.model = model;
        let modelUrl = (typeof model === 'string') ? model : model.url;
        let parts = modelUrl.split('/');
        let filename = parts.pop();
        let base = parts.join('/') + '/';
        let plugin = (typeof model === 'string') ? undefined : model.loader;

        return Promise.resolve(this.scene).then((scene) => {
            if (!scene || clearScene) return this.initScene();
            else return this.scene!;
        }).then(() => {
            return new Promise<Array<AbstractMesh>>((resolve, reject) => {
                this.lastUsedLoader = SceneLoader.ImportMesh(undefined, base, filename, this.scene, (meshes) => {
                    resolve(meshes);
                }, (progressEvent) => {
                    this.onModelLoadProgressObservable.notifyObserversWithPromise(progressEvent);
                }, (e, m, exception) => {
                    // console.log(m, exception);
                    this.onModelLoadErrorObservable.notifyObserversWithPromise({ message: m, exception: exception }).then(() => {
                        reject(exception);
                    });
                }, plugin)!;
                this.onLoaderInitObservable.notifyObserversWithPromise(this.lastUsedLoader);
            });
        }).then((meshes: Array<AbstractMesh>) => {
            return this.onModelLoadedObservable.notifyObserversWithPromise(meshes)
                .then(() => {
                    // update the models' configuration
                    this.configureModel(model);
                    return this.initEnvironment();
                }).then(() => {
                    return this.scene;
                });
        });
    }

    protected initEnvironment(focusMeshes: Array<AbstractMesh> = []): Promise<Scene> {
        if (!this.configuration.skybox && !this.configuration.ground) {
            if (this.environmentHelper) {
                this.environmentHelper.dispose();
            };
            return Promise.resolve(this.scene);
        }

        const options: Partial<IEnvironmentHelperOptions> = {
            createGround: !!this.configuration.ground,
            createSkybox: !!this.configuration.skybox,
            setupImageProcessing: false // will be done at the scene level!
        };

        if (this.configuration.ground) {
            let groundConfig = (typeof this.configuration.ground === 'boolean') ? {} : this.configuration.ground;

            let groundSize = groundConfig.size || (this.configuration.skybox && this.configuration.skybox.scale);
            if (groundSize) {
                options.groundSize = groundSize;
            }

            options.enableGroundShadow = this.configuration.ground === true || groundConfig.receiveShadows;
            if (groundConfig.shadowLevel) {
                options.groundShadowLevel = groundConfig.shadowLevel;
            }
            options.enableGroundMirror = !!groundConfig.mirror;
            if (groundConfig.texture) {
                options.groundTexture = groundConfig.texture;
            }
            if (groundConfig.color) {
                options.groundColor = new Color3(groundConfig.color.r, groundConfig.color.g, groundConfig.color.b)
            }

            if (groundConfig.mirror) {
                options.enableGroundMirror = true;
                // to prevent undefines
                if (typeof groundConfig.mirror === "object") {
                    if (groundConfig.mirror.amount)
                        options.groundMirrorAmount = groundConfig.mirror.amount;
                    if (groundConfig.mirror.sizeRatio)
                        options.groundMirrorSizeRatio = groundConfig.mirror.sizeRatio;
                    if (groundConfig.mirror.blurKernel)
                        options.groundMirrorBlurKernel = groundConfig.mirror.blurKernel;
                    if (groundConfig.mirror.fresnelWeight)
                        options.groundMirrorFresnelWeight = groundConfig.mirror.fresnelWeight;
                    if (groundConfig.mirror.fallOffDistance)
                        options.groundMirrorFallOffDistance = groundConfig.mirror.fallOffDistance;
                    if (this.defaultHighpTextureType !== undefined)
                        options.groundMirrorTextureType = this.defaultHighpTextureType;
                }
            }

        }

        let postInitSkyboxMaterial = false;
        if (this.configuration.skybox) {
            let conf = this.configuration.skybox;
            if (conf.material && conf.material.imageProcessingConfiguration) {
                options.setupImageProcessing = false; // will be configured later manually.
            }
            let skyboxSize = this.configuration.skybox.scale;
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

        if (!this.environmentHelper) {
            this.environmentHelper = this.scene.createDefaultEnvironment(options)!;
        }
        else {
            // there might be a new scene! we need to dispose.
            // get the scene used by the envHelper
            let scene: Scene = this.environmentHelper.rootMesh.getScene();
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
                if (this.configuration.skybox && this.configuration.skybox.material && this.configuration.skybox.material.imageProcessingConfiguration) {
                    this.extendClassWithConfig(skyboxMaterial.imageProcessingConfiguration, this.configuration.skybox.material.imageProcessingConfiguration);
                }
            }
        }

        return Promise.resolve(this.scene);
    }

    /**
		 * Alters render settings to reduce features based on hardware feature limitations
		 * @param options Viewer options to modify
		 */
    protected handleHardwareLimitations() {
        //flip rendering settings switches based on hardware support
        let maxVaryingRows = this.engine.getCaps().maxVaryingVectors;
        let maxFragmentSamplers = this.engine.getCaps().maxTexturesImageUnits;

        //shadows are disabled if there's not enough varyings for a single shadow
        if ((maxVaryingRows < 8) || (maxFragmentSamplers < 8)) {
            this.maxShadows = 0;
        } else {
            this.maxShadows = 3;
        }

        //can we render to any >= 16-bit targets (required for HDR)
        let caps = this.engine.getCaps();
        let linearHalfFloatTargets = caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering;
        let linearFloatTargets = caps.textureFloatRender && caps.textureFloatLinearFiltering;

        let supportsHDR: boolean = !!(linearFloatTargets || linearHalfFloatTargets);

        if (linearHalfFloatTargets) {
            this.defaultHighpTextureType = Engine.TEXTURETYPE_HALF_FLOAT;
            this.shadowGeneratorBias = 0.002;
        } else if (linearFloatTargets) {
            this.defaultHighpTextureType = Engine.TEXTURETYPE_FLOAT;
            this.shadowGeneratorBias = 0.001;
        } else {
            this.defaultHighpTextureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            this.shadowGeneratorBias = 0.001;
        }

        this.defaultPipelineTextureType = supportsHDR ? this.defaultHighpTextureType : Engine.TEXTURETYPE_UNSIGNED_INT;
    }

    /**
     * Injects all the spectre shader in the babylon shader store
     */
    protected injectCustomShaders(): void {
        let customShaders = this.configuration.customShaders;
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

    protected extendClassWithConfig(object: any, config: any) {
        if (!config) return;
        Object.keys(config).forEach(key => {
            if (key in object && typeof object[key] !== 'function') {
                if (typeof object[key] === 'function') return;
                // if it is an object, iterate internally until reaching basic types
                if (typeof object[key] === 'object') {
                    this.extendClassWithConfig(object[key], config[key]);
                } else {
                    object[key] = config[key];
                }
            }
        });
    }
}