import { IDisposable } from "babylonjs/scene";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs/Loading/sceneLoader";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { IParticleSystem } from "babylonjs/Particles/IParticleSystem";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { Observable } from "babylonjs/Misc/observable";
import { SceneLoaderProgressEvent } from "babylonjs/Loading/sceneLoader";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Animation, Animatable, CircleEase, BackEase, BounceEase, CubicEase, ElasticEase, ExponentialEase, PowerEase, QuadraticEase, QuarticEase, QuinticEase, SineEase } from "babylonjs/Animations/index";
import { Nullable } from "babylonjs/types";
import { Quaternion, Vector3 } from "babylonjs/Maths/math.vector";
import { Tags } from "babylonjs/Misc/tags";
import { Material } from "babylonjs/Materials/material";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { MultiMaterial } from "babylonjs/Materials/multiMaterial";
import { Tools } from "babylonjs/Misc/tools";
import { GLTFFileLoader } from "babylonjs-loaders/glTF/index";
import { IAsset } from "babylonjs-gltf2interface";
import { IModelConfiguration } from "../configuration/interfaces/modelConfiguration";
import { IModelAnimationConfiguration } from "../configuration/interfaces/modelAnimationConfiguration";
import { IModelAnimation, GroupModelAnimation, AnimationPlayMode, ModelAnimationConfiguration, EasingFunction, AnimationState } from "./modelAnimation";

import { deepmerge, extendClassWithConfig } from '../helper/';
import { ObservablesManager } from "../managers/observablesManager";
import { ConfigurationContainer } from "../configuration/configurationContainer";

/**
 * The current state of the model
 */
export enum ModelState {
    INIT,
    LOADING,
    LOADED,
    ENTRY,
    ENTRYDONE,
    COMPLETE,
    CANCELED,
    ERROR
}

/**
 * The viewer model is a container for all assets representing a sngle loaded model.
 */
export class ViewerModel implements IDisposable {
    /**
     * The loader used to load this model.
     */
    public loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    private _animations: Array<IModelAnimation>;

    /**
     * the list of meshes that are a part of this model
     */
    private _meshes: Array<AbstractMesh> = [];
    /**
     * This model's root mesh (the parent of all other meshes).
     * This mesh does not(!) exist in the meshes array.
     */
    public rootMesh: AbstractMesh;

    private _pivotMesh: AbstractMesh;
    /**
     * ParticleSystems connected to this model
     */
    public particleSystems: Array<IParticleSystem> = [];
    /**
     * Skeletons defined in this model
     */
    public skeletons: Array<Skeleton> = [];
    /**
     * The current model animation.
     * On init, this will be undefined.
     */
    public currentAnimation: IModelAnimation;

    /**
     * Observers registered here will be executed when the model is done loading
     */
    public onLoadedObservable: Observable<ViewerModel>;
    /**
     * Observers registered here will be executed when the loader notified of a progress event
     */
    public onLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    /**
     * Observers registered here will be executed when the loader notified of an error.
     */
    public onLoadErrorObservable: Observable<{ message: string; exception: any }>;

    /**
     * Will be executed after the model finished loading and complete, including entry animation and lod
     */
    public onCompleteObservable: Observable<ViewerModel>;
    /**
     * Observers registered here will be executed every time the model is being configured.
     * This can be used to extend the model's configuration without extending the class itself
     */
    public onAfterConfigure: Observable<ViewerModel>;

    /**
     * The current model state (loaded, error, etc)
     */
    public state: ModelState;
    /**
     * A loadID provided by the modelLoader, unique to ths (Abstract)Viewer instance.
     */
    public loadId: number;

    public loadInfo: IAsset;
    private _loadedUrl: string;
    private _modelConfiguration: IModelConfiguration;

    private _loaderDone: boolean = false;

    private _entryAnimation: ModelAnimationConfiguration;
    private _exitAnimation: ModelAnimationConfiguration;
    private _scaleTransition: Animation;
    private _animatables: Array<Animatable> = [];
    private _frameRate: number = 60;

    private _shadowsRenderedAfterLoad: boolean = false;

    constructor(private _observablesManager: ObservablesManager, modelConfiguration: IModelConfiguration, private _configurationContainer?: ConfigurationContainer) {
        this.onLoadedObservable = new Observable();
        this.onLoadErrorObservable = new Observable();
        this.onLoadProgressObservable = new Observable();
        this.onCompleteObservable = new Observable();
        this.onAfterConfigure = new Observable();

        this.state = ModelState.INIT;

        let scene = this._configurationContainer && this._configurationContainer.scene;

        this.rootMesh = new AbstractMesh("modelRootMesh", scene);
        this._pivotMesh = new AbstractMesh("pivotMesh", scene);
        this._pivotMesh.parent = this.rootMesh;
        // rotate 180, gltf fun
        this._pivotMesh.rotation.y += Math.PI;

        this._scaleTransition = new Animation("scaleAnimation", "scaling", this._frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

        this._animations = [];
        //create a copy of the configuration to make sure it doesn't change even after it is changed in the viewer
        this._modelConfiguration = deepmerge((this._configurationContainer && this._configurationContainer.configuration.model) || {}, modelConfiguration);

        if (this._observablesManager) { this._observablesManager.onModelAddedObservable.notifyObservers(this); }

        if (this._modelConfiguration.entryAnimation) {
            this.rootMesh.setEnabled(false);
        }

        this.onLoadedObservable.add(() => {
            this.updateConfiguration(this._modelConfiguration);
            if (this._observablesManager) { this._observablesManager.onModelLoadedObservable.notifyObservers(this); }
            this._initAnimations();
        });

        this.onCompleteObservable.add(() => {
            this.state = ModelState.COMPLETE;
        });
    }

    public get shadowsRenderedAfterLoad() {
        return this._shadowsRenderedAfterLoad;
    }

    public set shadowsRenderedAfterLoad(rendered: boolean) {
        if (!rendered) {
            throw new Error("can only be enabled");
        } else {
            this._shadowsRenderedAfterLoad = rendered;
        }
    }

    public getViewerId() {
        return this._configurationContainer && this._configurationContainer.viewerId;
    }

    /**
     * Is this model enabled?
     */
    public get enabled() {
        return this.rootMesh.isEnabled();
    }

    /**
     * Set whether this model is enabled or not.
     */
    public set enabled(enable: boolean) {
        this.rootMesh.setEnabled(enable);
    }

    public set loaderDone(done: boolean) {
        this._loaderDone = done;
        this._checkCompleteState();
    }

    private _checkCompleteState() {
        if (this._loaderDone && (this.state === ModelState.ENTRYDONE)) {
            this._modelComplete();
        }
    }

    /**
     * Add a mesh to this model.
     * Any mesh that has no parent will be provided with the root mesh as its new parent.
     *
     * @param mesh the new mesh to add
     * @param triggerLoaded should this mesh trigger the onLoaded observable. Used when adding meshes manually.
     */
    public addMesh(mesh: AbstractMesh, triggerLoaded?: boolean) {
        if (!mesh.parent) {
            mesh.parent = this._pivotMesh;
        }

        if (mesh.getClassName() !== "InstancedMesh") {
            mesh.receiveShadows = !!this.configuration.receiveShadows;
        }

        this._meshes.push(mesh);
        if (triggerLoaded) {
            return this.onLoadedObservable.notifyObserversWithPromise(this);
        }
    }

    /**
     * get the list of meshes (excluding the root mesh)
     */
    public get meshes() {
        return this._meshes;
    }

    /**
     * Get the model's configuration
     */
    public get configuration(): IModelConfiguration {
        return this._modelConfiguration;
    }

    /**
     * (Re-)set the model's entire configuration
     * @param newConfiguration the new configuration to replace the new one
     */
    public set configuration(newConfiguration: IModelConfiguration) {
        this._modelConfiguration = newConfiguration;
        this._configureModel();
    }

    /**
     * Update the current configuration with new values.
     * Configuration will not be overwritten, but merged with the new configuration.
     * Priority is to the new configuration
     * @param newConfiguration the configuration to be merged into the current configuration;
     */
    public updateConfiguration(newConfiguration: Partial<IModelConfiguration>) {
        this._modelConfiguration = deepmerge(this._modelConfiguration, newConfiguration);
        this._configureModel();
    }

    private _initAnimations() {
        // check if this is not a gltf loader and init the animations
        if (this.skeletons.length) {
            this.skeletons.forEach((skeleton, idx) => {
                let ag = new AnimationGroup("animation-" + idx, this._configurationContainer && this._configurationContainer.scene);
                let add = false;
                skeleton.getAnimatables().forEach((a) => {
                    if (a.animations && a.animations[0]) {
                        ag.addTargetedAnimation(a.animations[0], a);
                        add = true;
                    }
                });
                if (add) {
                    this.addAnimationGroup(ag);
                }
            });
        }

        let completeCallback = () => {

        };

        if (this._modelConfiguration.animation) {
            if (this._modelConfiguration.animation.playOnce) {
                this._animations.forEach((a) => {
                    a.playMode = AnimationPlayMode.ONCE;
                });
            }
            if (this._modelConfiguration.animation.autoStart && this._animations.length) {
                let animationName = this._modelConfiguration.animation.autoStart === true ?
                    this._animations[0].name : this._modelConfiguration.animation.autoStart;

                completeCallback = () => {
                    this.playAnimation(animationName);
                };
            }
        }

        this._enterScene(completeCallback);
    }

    /**
     * Animates the model from the current position to the default position
     * @param completeCallback A function to call when the animation has completed
     */
    private _enterScene(completeCallback?: () => void): void {
        const scene = this.rootMesh.getScene();
        let previousValue = scene.animationPropertiesOverride!.enableBlending;
        let callback = () => {
            this.state = ModelState.ENTRYDONE;
            scene.animationPropertiesOverride!.enableBlending = previousValue;
            this._checkCompleteState();
            if (completeCallback) { completeCallback(); }
        };
        if (!this._entryAnimation) {
            callback();
            return;
        }
        this.rootMesh.setEnabled(true);
        // disable blending for the sake of the entry animation;
        scene.animationPropertiesOverride!.enableBlending = false;
        this._applyAnimation(this._entryAnimation, true, callback);
    }

    /**
     * Animates the model from the current position to the exit-screen position
     * @param completeCallback A function to call when the animation has completed
     */
    private _exitScene(completeCallback: () => void): void {
        if (!this._exitAnimation) {
            completeCallback();
            return;
        }

        this._applyAnimation(this._exitAnimation, false, completeCallback);
    }

    private _modelComplete() {
        //reapply material defines to be sure:
        let meshes = this._pivotMesh.getChildMeshes(false);
        meshes.filter((m) => m.material).forEach((mesh) => {
            this._applyModelMaterialConfiguration(mesh.material!);
        });
        this.state = ModelState.COMPLETE;
        this.onCompleteObservable.notifyObservers(this);
    }

    /**
     * Add a new animation group to this model.
     * @param animationGroup the new animation group to be added
     */
    public addAnimationGroup(animationGroup: AnimationGroup) {
        this._animations.push(new GroupModelAnimation(animationGroup));
    }

    /**
     * Get the ModelAnimation array
     */
    public getAnimations(): Array<IModelAnimation> {
        return this._animations;
    }

    /**
     * Get the animations' names. Using the names you can play a specific animation.
     */
    public getAnimationNames(): Array<string> {
        return this._animations.map((a) => a.name);
    }

    /**
     * Get an animation by the provided name. Used mainly when playing n animation.
     * @param name the name of the animation to find
     */
    protected _getAnimationByName(name: string): Nullable<IModelAnimation> {
        // can't use .find, noe available on IE
        let filtered = this._animations.filter((a) => a.name === name.trim());
        // what the next line means - if two animations have the same name, they will not be returned!
        if (filtered.length === 1) {
            return filtered[0];
        } else {
            return null;
        }
    }

    /**
     * Choose an initialized animation using its name and start playing it
     * @param name the name of the animation to play
     * @returns The model aniamtion to be played.
     */
    public playAnimation(name: string): IModelAnimation {
        let animation = this.setCurrentAnimationByName(name);
        if (animation) {
            animation.start();
        }
        return animation;
    }

    public setCurrentAnimationByName(name: string) {
        let animation = this._getAnimationByName(name.trim());
        if (animation) {
            if (this.currentAnimation && this.currentAnimation.state !== AnimationState.STOPPED) {
                this.currentAnimation.stop();
            }
            this.currentAnimation = animation;
            return animation;
        } else {
            throw new Error("animation not found - " + name);
        }
    }

    private _configureModel() {
        // this can be changed to the meshes that have rootMesh a parent without breaking anything.
        let meshesWithNoParent: Array<AbstractMesh> = [this.rootMesh]; //this._meshes.filter(m => m.parent === this.rootMesh);
        let updateMeshesWithNoParent = (variable: string, value: any, param?: string) => {
            meshesWithNoParent.forEach((mesh) => {
                if (param) {
                    mesh[variable][param] = value;
                } else {
                    mesh[variable] = value;
                }
            });
        };
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
        };

        if (this._modelConfiguration.normalize) {
            let center = false;
            let unitSize = false;
            let parentIndex;
            if (this._modelConfiguration.normalize === true) {
                center = true;
                unitSize = true;
            } else {
                center = !!this._modelConfiguration.normalize.center;
                unitSize = !!this._modelConfiguration.normalize.unitSize;
                parentIndex = this._modelConfiguration.normalize.parentIndex;
            }

            let meshesToNormalize: Array<AbstractMesh> = [];
            if (parentIndex !== undefined) {
                meshesToNormalize.push(this._meshes[parentIndex]);
            } else {
                meshesToNormalize = this._pivotMesh.getChildMeshes(true).length === 1 ? [this._pivotMesh] : meshesWithNoParent;
            }

            if (unitSize) {
                meshesToNormalize.forEach((mesh) => {
                    mesh.normalizeToUnitCube(true);
                    mesh.computeWorldMatrix(true);
                });
            }
            if (center) {
                meshesToNormalize.forEach((mesh) => {
                    const boundingInfo = mesh.getHierarchyBoundingVectors(true);
                    const sizeVec = boundingInfo.max.subtract(boundingInfo.min);
                    const halfSizeVec = sizeVec.scale(0.5);
                    const center = boundingInfo.min.add(halfSizeVec);
                    mesh.position = center.scale(-1);

                    mesh.position.y += halfSizeVec.y;

                    // Recompute Info.
                    mesh.computeWorldMatrix(true);
                });
            }
        } else {
            // if centered, should be done here
        }

        // position?
        if (this._modelConfiguration.position) {
            updateXYZ('position', this._modelConfiguration.position);
        }
        if (this._modelConfiguration.rotation) {
            //quaternion?
            if (this._modelConfiguration.rotation.w) {
                meshesWithNoParent.forEach((mesh) => {
                    if (!mesh.rotationQuaternion) {
                        mesh.rotationQuaternion = new Quaternion();
                    }
                });
                updateXYZ('rotationQuaternion', this._modelConfiguration.rotation);
            } else {
                updateXYZ('rotation', this._modelConfiguration.rotation);
            }
        }

        if (this._modelConfiguration.rotationOffsetAxis) {
            let rotationAxis = new Vector3(this._modelConfiguration.rotationOffsetAxis.x, this._modelConfiguration.rotationOffsetAxis.y, this._modelConfiguration.rotationOffsetAxis.z);

            meshesWithNoParent.forEach((m) => {
                if (this._modelConfiguration.rotationOffsetAngle) {
                    m.rotate(rotationAxis, this._modelConfiguration.rotationOffsetAngle);
                }
            });

        }

        if (this._modelConfiguration.scaling) {
            updateXYZ('scaling', this._modelConfiguration.scaling);
        }

        if (this._modelConfiguration.castShadow) {
            this._meshes.forEach((mesh) => {
                Tags.AddTagsTo(mesh, 'castShadow');
            });
        }

        let meshes = this._pivotMesh.getChildMeshes(false);
        meshes.filter((m) => m.material).forEach((mesh) => {
            this._applyModelMaterialConfiguration(mesh.material!);
        });

        if (this._modelConfiguration.entryAnimation) {
            this._entryAnimation = this._modelAnimationConfigurationToObject(this._modelConfiguration.entryAnimation);
        }

        if (this._modelConfiguration.exitAnimation) {
            this._exitAnimation = this._modelAnimationConfigurationToObject(this._modelConfiguration.exitAnimation);
        }

        this.onAfterConfigure.notifyObservers(this);
    }

    private _modelAnimationConfigurationToObject(animConfig: IModelAnimationConfiguration): ModelAnimationConfiguration {
        let anim: ModelAnimationConfiguration = {
            time: 0.5
        };
        if (animConfig.scaling) {
            anim.scaling = Vector3.Zero();
        }
        if (animConfig.easingFunction !== undefined) {
            anim.easingFunction = animConfig.easingFunction;
        }
        if (animConfig.easingMode !== undefined) {
            anim.easingMode = animConfig.easingMode;
        }
        extendClassWithConfig(anim, animConfig);
        return anim;
    }

    /**
     * Apply a material configuration to a material
     * @param material Material to apply configuration to
     * @hidden
     */
    public _applyModelMaterialConfiguration(material: Material) {
        if (!this._modelConfiguration.material) { return; }

        extendClassWithConfig(material, this._modelConfiguration.material);

        if (material instanceof PBRMaterial) {
            if (this._modelConfiguration.material.directIntensity !== undefined) {
                material.directIntensity = this._modelConfiguration.material.directIntensity;
            }

            if (this._modelConfiguration.material.emissiveIntensity !== undefined) {
                material.emissiveIntensity = this._modelConfiguration.material.emissiveIntensity;
            }

            if (this._modelConfiguration.material.environmentIntensity !== undefined) {
                material.environmentIntensity = this._modelConfiguration.material.environmentIntensity;
            }

            if (this._modelConfiguration.material.directEnabled !== undefined) {
                material.disableLighting = !this._modelConfiguration.material.directEnabled;
            }
            if (this._configurationContainer && this._configurationContainer.reflectionColor) {
                material.reflectionColor = this._configurationContainer.reflectionColor.clone();
            }
        }
        else if (material instanceof MultiMaterial) {
            for (let i = 0; i < material.subMaterials.length; i++) {
                const subMaterial = material.subMaterials[i];
                if (subMaterial) {
                    this._applyModelMaterialConfiguration(subMaterial);
                }
            }
        }
    }

    /**
     * Start entry/exit animation given an animation configuration
     * @param animationConfiguration Entry/Exit animation configuration
     * @param isEntry Pass true if the animation is an entry animation
     * @param completeCallback Callback to execute when the animation completes
     */
    private _applyAnimation(animationConfiguration: ModelAnimationConfiguration, isEntry: boolean, completeCallback?: () => void) {
        let animations: Animation[] = [];

        //scale
        if (animationConfiguration.scaling) {

            let scaleStart: Vector3 = isEntry ? animationConfiguration.scaling : new Vector3(1, 1, 1);
            let scaleEnd: Vector3 = isEntry ? new Vector3(1, 1, 1) : animationConfiguration.scaling;

            if (!scaleStart.equals(scaleEnd)) {
                this.rootMesh.scaling = scaleStart;
                this._setLinearKeys(
                    this._scaleTransition,
                    this.rootMesh.scaling,
                    scaleEnd,
                    animationConfiguration.time
                );
                animations.push(this._scaleTransition);
            }
        }

        //Start the animation(s)
        this.transitionTo(
            animations,
            animationConfiguration.time,
            this._createEasingFunction(animationConfiguration.easingFunction),
            animationConfiguration.easingMode,
            () => { if (completeCallback) { completeCallback(); } }
        );
    }

    /**
    * Begin @animations with the specified @easingFunction
    * @param animations The BABYLON Animations to begin
    * @param duration of transition, in seconds
    * @param easingFunction An easing function to apply
    * @param easingMode A easing mode to apply to the easingFunction
    * @param onAnimationEnd Call back trigger at the end of the animation.
    */
    public transitionTo(
        animations: Animation[],
        duration: number,
        easingFunction: any,
        easingMode: number = 2, // BABYLON.EasingFunction.EASINGMODE_EASEINOUT,
        onAnimationEnd: () => void): void {

        if (easingFunction) {
            for (let animation of animations) {
                easingFunction.setEasingMode(easingMode);
                animation.setEasingFunction(easingFunction);
            }
        }

        //Stop any current animations before starting the new one - merging not yet supported.
        this.stopAllAnimations();

        this.rootMesh.animations = animations;

        if (this.rootMesh.getScene().beginAnimation) {
            let animatable: Animatable = this.rootMesh.getScene().beginAnimation(this.rootMesh, 0, this._frameRate * duration, false, 1, () => {
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
            });
            this._animatables.push(animatable);
        }
    }

    /**
     * Sets key values on an Animation from first to last frame.
     * @param animation The Babylon animation object to set keys on
     * @param startValue The value of the first key
     * @param endValue The value of the last key
     * @param duration The duration of the animation, used to determine the end frame
     */
    private _setLinearKeys(animation: Animation, startValue: any, endValue: any, duration: number) {
        animation.setKeys([
            {
                frame: 0,
                value: startValue
            },
            {
                frame: this._frameRate * duration,
                value: endValue
            }
        ]);
    }

    /**
     * Creates and returns a Babylon easing funtion object based on a string representing the Easing function
     * @param easingFunctionID The enum of the easing funtion to create
     * @return The newly created Babylon easing function object
     */
    private _createEasingFunction(easingFunctionID?: number): any {
        let easingFunction;

        switch (easingFunctionID) {
            case EasingFunction.CircleEase:
                easingFunction = new CircleEase();
                break;
            case EasingFunction.BackEase:
                easingFunction = new BackEase(0.3);
                break;
            case EasingFunction.BounceEase:
                easingFunction = new BounceEase();
                break;
            case EasingFunction.CubicEase:
                easingFunction = new CubicEase();
                break;
            case EasingFunction.ElasticEase:
                easingFunction = new ElasticEase();
                break;
            case EasingFunction.ExponentialEase:
                easingFunction = new ExponentialEase();
                break;
            case EasingFunction.PowerEase:
                easingFunction = new PowerEase();
                break;
            case EasingFunction.QuadraticEase:
                easingFunction = new QuadraticEase();
                break;
            case EasingFunction.QuarticEase:
                easingFunction = new QuarticEase();
                break;
            case EasingFunction.QuinticEase:
                easingFunction = new QuinticEase();
                break;
            case EasingFunction.SineEase:
                easingFunction = new SineEase();
                break;
            default:
                Tools.Log("No ease function found");
                break;
        }

        return easingFunction;
    }

    /**
     * Stops and removes all animations that have been applied to the model
     */
    public stopAllAnimations(): void {
        if (this.rootMesh) {
            this.rootMesh.animations = [];
        }
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }
        while (this._animatables.length) {
            this._animatables[0].onAnimationEnd = null;
            this._animatables[0].stop();
            this._animatables.shift();
        }
    }

    /**
     * Will remove this model from the viewer (but NOT dispose it).
     */
    public remove() {
        this.stopAllAnimations();

        // hide it
        this.rootMesh.isVisible = false;
        if (this._observablesManager) { this._observablesManager.onModelRemovedObservable.notifyObservers(this); }
    }

    /**
     * Dispose this model, including all of its associated assets.
     */
    public dispose() {
        this.remove();
        this.onAfterConfigure.clear();
        this.onLoadedObservable.clear();
        this.onLoadErrorObservable.clear();
        this.onLoadProgressObservable.clear();
        if (this.loader && this.loader.name === "gltf") {
            (<GLTFFileLoader>this.loader).dispose();
        }
        this.particleSystems.forEach((ps) => ps.dispose());
        this.particleSystems.length = 0;
        this.skeletons.forEach((s) => s.dispose());
        this.skeletons.length = 0;
        this._animations.forEach((ag) => ag.dispose());
        this._animations.length = 0;
        this.rootMesh.dispose(false, true);
    }
}
