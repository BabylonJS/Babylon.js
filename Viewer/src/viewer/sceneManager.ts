import { Scene, ArcRotateCamera, Engine, Light, ShadowLight, Vector3, ShadowGenerator, Tags, CubeTexture, Quaternion, SceneOptimizer, EnvironmentHelper, SceneOptimizerOptions, Color3, IEnvironmentHelperOptions, AbstractMesh, FramingBehavior, Behavior, Observable } from 'babylonjs';
import { AbstractViewer } from './viewer';
import { ILightConfiguration, ISceneConfiguration, ISceneOptimizerConfiguration, ICameraConfiguration, ISkyboxConfiguration, ViewerConfiguration, IGroundConfiguration, IModelConfiguration } from '../configuration/configuration';
import { ViewerModel } from '../model/viewerModel';
import { extendClassWithConfig } from '../helper';
import { CameraBehavior } from '../interfaces';

/**
 * This interface describes the structure of the variable sent with the configuration observables of the scene manager.
 * O - the type of object we are dealing with (Light, ArcRotateCamera, Scene, etc')
 * T - the configuration type
 */
export interface IPostConfigurationCallback<OBJ, CONF> {
    newConfiguration: CONF;
    sceneManager: SceneManager;
    object: OBJ;
    model?: ViewerModel;
}

export class SceneManager {

    //Observers
    onSceneInitObservable: Observable<Scene>;
    onSceneConfiguredObservable: Observable<IPostConfigurationCallback<Scene, ISceneConfiguration>>;
    onSceneOptimizerConfiguredObservable: Observable<IPostConfigurationCallback<SceneOptimizer, ISceneOptimizerConfiguration | boolean>>;
    onCameraConfiguredObservable: Observable<IPostConfigurationCallback<ArcRotateCamera, ICameraConfiguration>>;
    onLightsConfiguredObservable: Observable<IPostConfigurationCallback<Array<Light>, { [name: string]: ILightConfiguration | boolean }>>;
    onModelsConfiguredObservable: Observable<IPostConfigurationCallback<Array<ViewerModel>, IModelConfiguration>>;
    onEnvironmentConfiguredObservable: Observable<IPostConfigurationCallback<EnvironmentHelper, { skybox?: ISkyboxConfiguration | boolean, ground?: IGroundConfiguration | boolean }>>;

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
     * Models displayed in this viewer.
     */
    public models: Array<ViewerModel>;
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

    private _globalConfiguration: ViewerConfiguration;


    /**
     * Returns a boolean representing HDR support
     */
    public get isHdrSupported() {
        return this._hdrSupport;
    }

    constructor(private _viewer: AbstractViewer) {
        this.models = [];

        this.onCameraConfiguredObservable = new Observable();
        this.onLightsConfiguredObservable = new Observable();
        this.onModelsConfiguredObservable = new Observable();
        this.onSceneConfiguredObservable = new Observable();
        this.onSceneInitObservable = new Observable();
        this.onSceneOptimizerConfiguredObservable = new Observable();
        this.onEnvironmentConfiguredObservable = new Observable();

        this._viewer.onEngineInitObservable.add(() => {
            this._handleHardwareLimitations();
        });

        this._viewer.onModelLoadedObservable.add((model) => {
            this._configureLights(this._viewer.configuration.lights, model);

            if (this._viewer.configuration.camera || !this.scene.activeCamera) {
                this._configureCamera(this._viewer.configuration.camera || {}, model);
            }
            return this._initEnvironment(model);
        })
    }

    /**
     * initialize the environment for a specific model.
     * Per default it will use the viewer's configuration.
     * @param model the model to use to configure the environment.
     * @returns a Promise that will resolve when the configuration is done.
     */
    protected _initEnvironment(model?: ViewerModel): Promise<Scene> {
        this._configureEnvironment(this._viewer.configuration.skybox, this._viewer.configuration.ground, model);

        return Promise.resolve(this.scene);
    }

    /**
     * initialize the scene. Calling this function again will dispose the old scene, if exists.
     */
    public initScene(sceneConfiguration?: ISceneConfiguration, optimizerConfiguration?: boolean | ISceneOptimizerConfiguration): Promise<Scene> {

        // if the scen exists, dispose it.
        if (this.scene) {
            this.scene.dispose();
        }

        // create a new scene
        this.scene = new Scene(this._viewer.engine);

        if (sceneConfiguration) {
            this._configureScene(sceneConfiguration);

            // Scene optimizer
            if (optimizerConfiguration) {
                this._configureOptimizer(optimizerConfiguration);
            }
        }

        return this.onSceneInitObservable.notifyObserversWithPromise(this.scene);
    }

    public clearScene(clearModels: boolean = true, clearLights: boolean = false) {
        if (clearModels) {
            this.models.forEach(m => m.dispose());
            this.models.length = 0;
        }
        if (clearLights) {
            this.scene.lights.forEach(l => l.dispose());
        }
    }

    /**
     * This will update the scene's configuration, including camera, lights, environment.
     * @param newConfiguration the delta that should be configured. This includes only the changes
     * @param globalConfiguration The global configuration object, after the new configuration was merged into it
     */
    public updateConfiguration(newConfiguration: Partial<ViewerConfiguration>, globalConfiguration: ViewerConfiguration) {

        // update scene configuration
        if (newConfiguration.scene) {
            this._configureScene(newConfiguration.scene);
        }
        // optimizer
        if (newConfiguration.optimizer) {
            this._configureOptimizer(newConfiguration.optimizer);
        }

        // lights
        this._configureLights(newConfiguration.lights);

        // environment
        if (newConfiguration.skybox !== undefined || newConfiguration.ground !== undefined) {
            this._configureEnvironment(newConfiguration.skybox, newConfiguration.ground);
        }

        // configure model
        if (newConfiguration.model && typeof newConfiguration.model === 'object') {
            this._configureModel(newConfiguration.model);
        }

        // camera
        this._configureCamera(newConfiguration.camera);
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
            extendClassWithConfig(this.scene.imageProcessingConfiguration, sceneConfig.imageProcessingConfiguration);
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

        this.onSceneConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.scene,
            newConfiguration: sceneConfig
        });
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

        this.onSceneOptimizerConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.sceneOptimizer,
            newConfiguration: optimizerConfig
        });
    }

    /**
     * configure all models using the configuration.
     * @param modelConfiguration the configuration to use to reconfigure the models
     */
    protected _configureModel(modelConfiguration: Partial<IModelConfiguration>) {
        this.models.forEach(model => {
            model.updateConfiguration(modelConfiguration);
        });

        this.onModelsConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.models,
            newConfiguration: modelConfiguration
        });
    }

    /**
     * (Re) configure the camera. The camera will only be created once and from this point will only be reconfigured.
     * @param cameraConfig the new camera configuration
     * @param model optionally use the model to configure the camera.
     */
    protected _configureCamera(cameraConfig: ICameraConfiguration = {}, model?: ViewerModel) {
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

        extendClassWithConfig(this.camera, cameraConfig);

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

        this.onCameraConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.camera,
            newConfiguration: cameraConfig,
            model
        });
    }

    protected _configureEnvironment(skyboxConifguration?: ISkyboxConfiguration | boolean, groundConfiguration?: IGroundConfiguration | boolean, model?: ViewerModel) {
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
                    extendClassWithConfig(skyboxMaterial.imageProcessingConfiguration, skyboxConifguration.material.imageProcessingConfiguration);
                }
            }
        }

        this.onEnvironmentConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.environmentHelper,
            newConfiguration: {
                skybox: skyboxConifguration,
                ground: groundConfiguration
            },
            model
        });
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
        if (!Object.keys(lightsConfiguration).length) {
            if (!this.scene.lights.length)
                this.scene.createDefaultLight(true);
            return;
        };

        let lightsAvailable: Array<string> = this.scene.lights.map(light => light.name);
        // compare to the global (!) configuration object and dispose unneeded:
        let lightsToConfigure = Object.keys(this._viewer.configuration.lights || []);
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


            extendClassWithConfig(light, lightConfig);

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
                    extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
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

        this.onLightsConfiguredObservable.notifyObservers({
            sceneManager: this,
            object: this.scene.lights,
            newConfiguration: lightsConfiguration,
            model
        });
    }

    /**
     * Alters render settings to reduce features based on hardware feature limitations
     * @param enableHDR Allows the viewer to run in HDR mode.
     */
    protected _handleHardwareLimitations(enableHDR = true) {
        //flip rendering settings switches based on hardware support
        let maxVaryingRows = this._viewer.engine.getCaps().maxVaryingVectors;
        let maxFragmentSamplers = this._viewer.engine.getCaps().maxTexturesImageUnits;

        //shadows are disabled if there's not enough varyings for a single shadow
        if ((maxVaryingRows < 8) || (maxFragmentSamplers < 8)) {
            this._maxShadows = 0;
        } else {
            this._maxShadows = 3;
        }

        //can we render to any >= 16-bit targets (required for HDR)
        let caps = this._viewer.engine.getCaps();
        let linearHalfFloatTargets = caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering;
        let linearFloatTargets = caps.textureFloatRender && caps.textureFloatLinearFiltering;

        this._hdrSupport = enableHDR && !!(linearFloatTargets || linearHalfFloatTargets);

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
     * Dispoe the entire viewer including the scene and the engine
     */
    public dispose() {

        if (this.sceneOptimizer) {
            this.sceneOptimizer.stop();
            this.sceneOptimizer.dispose();
        }

        if (this.environmentHelper) {
            this.environmentHelper.dispose();
        }

        this.models.forEach(model => {
            model.dispose();
        });

        this.models.length = 0;

        this.scene.dispose();
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
                extendClassWithConfig(behavior, behaviorConfig);
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