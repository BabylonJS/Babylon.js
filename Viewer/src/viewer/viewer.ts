import { viewerManager } from './viewerManager';
import { TemplateManager } from './../templateManager';
import { ConfigurationLoader } from './../configuration/loader';
import { Skeleton, AnimationGroup, ParticleSystem, CubeTexture, Color3, IEnvironmentHelperOptions, EnvironmentHelper, Effect, SceneOptimizer, SceneOptimizerOptions, Observable, Engine, Scene, ArcRotateCamera, Vector3, SceneLoader, AbstractMesh, Mesh, HemisphericLight, Database, SceneLoaderProgressEvent, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Quaternion, Light, ShadowLight, ShadowGenerator, Tags, AutoRotationBehavior, BouncingBehavior, FramingBehavior, Behavior, Tools } from 'babylonjs';
import { ViewerConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, IObserversConfiguration, IModelConfiguration, ISkyboxConfiguration, IGroundConfiguration, ILightConfiguration, ICameraConfiguration } from '../configuration/configuration';

import * as deepmerge from '../../assets/deepmerge.min.js';
import { CameraBehavior } from 'src/interfaces';
import { ViewerModel } from '../model/viewerModel';
import { GroupModelAnimation } from '../model/modelAnimation';

export abstract class AbstractViewer {

    public templateManager: TemplateManager;

    public engine: Engine;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public sceneOptimizer: SceneOptimizer;
    public baseId: string;
    public models: Array<ViewerModel>;

    /**
     * The last loader used to load a model. 
     */
    public lastUsedLoader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    protected configuration: ViewerConfiguration;
    public environmentHelper: EnvironmentHelper;

    protected defaultHighpTextureType: number;
    protected shadowGeneratorBias: number;
    protected defaultPipelineTextureType: number;
    protected maxShadows: number;
    private _hdrSupport: boolean;

    protected _isDisposed: boolean = false;

    public get isHdrSupported() {
        return this._hdrSupport;
    }


    // observables
    public onSceneInitObservable: Observable<Scene>;
    public onEngineInitObservable: Observable<Engine>;
    public onModelLoadedObservable: Observable<ViewerModel>;
    public onModelLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    public onModelLoadErrorObservable: Observable<{ message: string; exception: any }>;
    public onLoaderInitObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    public onInitDoneObservable: Observable<AbstractViewer>;

    public canvas: HTMLCanvasElement;

    protected registeredOnBeforerenderFunctions: Array<() => void>;
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

        this.registeredOnBeforerenderFunctions = [];
        this.models = [];

        // add this viewer to the viewer manager
        viewerManager.addViewer(this);

        // create a new template manager. TODO - singleton?
        this.templateManager = new TemplateManager(containerElement);

        this.prepareContainerElement();

        // extend the configuration
        this._configurationLoader = new ConfigurationLoader();
        this._configurationLoader.loadConfiguration(initialConfiguration, (configuration) => {
            this.configuration = deepmerge(this.configuration || {}, configuration);
            if (this.configuration.observers) {
                this.configureObservers(this.configuration.observers);
            }
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
        this.scene && this.scene.activeCamera && this.scene.render();
    }

    /**
     * Update the current viewer configuration with new values.
     * Only provided information will be updated, old configuration values will be kept.
     * If this.configuration was manually changed, you can trigger this function with no parameters, 
     * and the entire configuration will be updated. 
     * @param newConfiguration 
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration> = this.configuration) {
        // update this.configuration with the new data
        this.configuration = deepmerge(this.configuration || {}, newConfiguration);

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

        // lights
        if (newConfiguration.lights) {
            this.configureLights(newConfiguration.lights);
        }

        // environment
        if (newConfiguration.skybox !== undefined || newConfiguration.ground !== undefined) {
            this.configureEnvironment(newConfiguration.skybox, newConfiguration.ground);
        }

        // camera
        if (newConfiguration.camera) {
            this.configureCamera(newConfiguration.camera);
        }
    }

    protected configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean) {
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
                    if (this.defaultPipelineTextureType !== undefined)
                        options.groundMirrorTextureType = this.defaultPipelineTextureType;
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
                    this.extendClassWithConfig(skyboxMaterial.imageProcessingConfiguration, skyboxConifguration.material.imageProcessingConfiguration);
                }
            }
        }
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

        if (sceneConfig.autoRotate) {
            this.camera.useAutoRotationBehavior = true;
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

    protected configureCamera(cameraConfig: ICameraConfiguration, model?: ViewerModel) {
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

        this.extendClassWithConfig(this.camera, cameraConfig);

        this.camera.minZ = cameraConfig.minZ || this.camera.minZ;
        this.camera.maxZ = cameraConfig.maxZ || this.camera.maxZ;

        if (cameraConfig.behaviors) {
            for (let name in cameraConfig.behaviors) {
                this.setCameraBehavior(cameraConfig.behaviors[name], focusMeshes);
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

    protected configureLights(lightsConfiguration: { [name: string]: ILightConfiguration | boolean } = {}, model?: ViewerModel) {
        let focusMeshes = model ? model.meshes : this.scene.meshes;
        // sanity check!
        if (!Object.keys(lightsConfiguration).length) return;

        let lightsAvailable: Array<string> = this.scene.lights.map(light => light.name);
        // compare to the global (!) configuration object and dispose unneeded:
        let lightsToConfigure = Object.keys(this.configuration.lights || []);
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


            this.extendClassWithConfig(light, lightConfig);

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
                if (lightConfig.shadowEnabled && this.maxShadows) {
                    if (!shadowGenerator) {
                        shadowGenerator = new ShadowGenerator(512, light);
                        // TODO blur kernel definition
                    }
                    this.extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
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

    protected configureModel(modelConfiguration: Partial<IModelConfiguration>, model?: ViewerModel) {
        let focusMeshes = model ? model.meshes : this.scene.meshes;
        let meshesWithNoParent: Array<AbstractMesh> = focusMeshes.filter(m => !m.parent);
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

        if (modelConfiguration.castShadow) {
            focusMeshes.forEach(mesh => {
                Tags.AddTagsTo(mesh, 'castShadow');
            });
        }

        if (modelConfiguration.normalize) {
            let center = false;
            let unitSize = false;
            let parentIndex;
            if (modelConfiguration.normalize === true) {
                center = true;
                unitSize = true;
                parentIndex = 0;
            } else {
                center = !!modelConfiguration.normalize.center;
                unitSize = !!modelConfiguration.normalize.unitSize;
                parentIndex = modelConfiguration.normalize.parentIndex;
            }

            let meshesToNormalize: Array<AbstractMesh> = [];
            if (parentIndex !== undefined) {
                meshesToNormalize.push(focusMeshes[parentIndex]);
            } else {
                meshesToNormalize = meshesWithNoParent;
            }

            if (unitSize) {
                meshesToNormalize.forEach(mesh => {
                    mesh.normalizeToUnitCube(true);
                    mesh.computeWorldMatrix(true);
                });
            }
            if (center) {
                meshesToNormalize.forEach(mesh => {
                    const boundingInfo = mesh.getHierarchyBoundingVectors(true);
                    const sizeVec = boundingInfo.max.subtract(boundingInfo.min);
                    const halfSizeVec = sizeVec.scale(0.5);
                    const center = boundingInfo.min.add(halfSizeVec);
                    mesh.position = center.scale(-1);

                    // Set on ground.
                    mesh.position.y += halfSizeVec.y;

                    // Recompute Info.
                    mesh.computeWorldMatrix(true);
                });
            }
        }
    }

    public dispose() {
        if (this._isDisposed) {
            return;
        }
        window.removeEventListener('resize', this.resize);
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
            let autoLoadModel = this.configuration.model;
            return this.initEngine().then((engine) => {
                return this.onEngineInitObservable.notifyObserversWithPromise(engine);
            }).then(() => {
                if (autoLoadModel) {
                    return this.loadModel().catch(e => { }).then(() => { return this.scene });
                } else {
                    return this.scene || this.initScene();
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
        this.scene.createDefaultLight(true);

        if (this.configuration.scene) {
            this.configureScene(this.configuration.scene);

            // Scene optimizer
            if (this.configuration.optimizer) {
                this.configureOptimizer(this.configuration.optimizer);
            }
        }

        return Promise.resolve(this.scene);
    }

    private isLoading: boolean;
    private nextLoading: Function;

    public loadModel(modelConfig: any = this.configuration.model, clearScene: boolean = true): Promise<ViewerModel> {
        // no model was provided? Do nothing!
        let modelUrl = (typeof modelConfig === 'string') ? modelConfig : modelConfig.url;
        if (!modelUrl) {
            return Promise.reject("no model configuration found");
        }
        if (this.isLoading) {
            //another model is being model. Wait for it to finish, trigger the load afterwards
            /*this.nextLoading = () => {
                delete this.nextLoading;
                return this.loadModel(modelConfig, clearScene);
            }*/
            return Promise.reject("sanother model is curently being loaded.");
        }
        this.isLoading = true;
        if ((typeof modelConfig === 'string')) {
            if (this.configuration.model && typeof this.configuration.model === 'object') {
                this.configuration.model.url = modelConfig;
            }
        } else {
            if (this.configuration.model) {
                deepmerge(this.configuration.model, modelConfig)
            } else {
                this.configuration.model = modelConfig;
            }
        }

        return Promise.resolve(this.scene).then((scene) => {
            if (!scene) return this.initScene();

            if (clearScene) {
                this.models.forEach(m => m.dispose());
                this.models.length = 0;
            }
            return scene;
        }).then(() => {
            return new Promise<ViewerModel>((resolve, reject) => {
                // at this point, configuration.model is an object, not a string
                let model = new ViewerModel(this.scene, <IModelConfiguration>this.configuration.model);
                this.models.push(model);
                this.lastUsedLoader = model.loader;
                model.onLoadedObservable.add((model) => {
                    resolve(model);
                });
                model.onLoadErrorObservable.add((errorObject) => {
                    this.onModelLoadErrorObservable.notifyObserversWithPromise(errorObject).then(() => {
                        reject(errorObject.exception);
                    });
                });
                model.onLoadProgressObservable.add((progressEvent) => {
                    return this.onModelLoadProgressObservable.notifyObserversWithPromise(progressEvent);
                });
                this.onLoaderInitObservable.notifyObserversWithPromise(this.lastUsedLoader);
            });
        }).then((model: ViewerModel) => {
            return this.onModelLoadedObservable.notifyObserversWithPromise(model)
                .then(() => {
                    // update the models' configuration
                    this.configureModel(this.configuration.model || modelConfig, model);
                    this.configureLights(this.configuration.lights);

                    if (this.configuration.camera) {
                        this.configureCamera(this.configuration.camera, model);
                    }
                    return this.initEnvironment(model);
                }).then(() => {
                    this.isLoading = false;
                    /*if (this.nextLoading) {
                        return this.nextLoading();
                    }*/
                    return model;
                });
        });
    }

    public addModel(meshes: Array<AbstractMesh>, skeletons: Array<Skeleton>, particleSystems: Array<ParticleSystem>, animationGroups: Array<AnimationGroup>): ViewerModel {
        let model = new ViewerModel(this.scene);
        model.meshes = meshes;
        model.skeletons = skeletons;
        model.particleSystems = particleSystems;
        let animations = model.getAnimations();
        animationGroups.forEach(ag => {
            animations.push(new GroupModelAnimation(ag));
        });

        return model;
    }

    protected initEnvironment(model?: ViewerModel): Promise<Scene> {
        this.configureEnvironment(this.configuration.skybox, this.configuration.ground);

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

        this._hdrSupport = !!(linearFloatTargets || linearHalfFloatTargets);

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

        this.defaultPipelineTextureType = this._hdrSupport ? this.defaultHighpTextureType : Engine.TEXTURETYPE_UNSIGNED_INT;
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
                // if (typeof object[key] === 'function') return;
                // if it is an object, iterate internally until reaching basic types
                if (typeof object[key] === 'object') {
                    this.extendClassWithConfig(object[key], config[key]);
                } else {
                    if (config[key] !== undefined) {
                        object[key] = config[key];
                    }
                }
            }
        });
    }

    private setCameraBehavior(behaviorConfig: number | {
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
                this.extendClassWithConfig(behavior, behaviorConfig);
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