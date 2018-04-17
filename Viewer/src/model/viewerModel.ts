import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, AnimationGroup, Animatable, AbstractMesh, Tools, Scene, SceneLoader, Observable, SceneLoaderProgressEvent, Tags, ParticleSystem, Skeleton, IDisposable, Nullable, Animation, Quaternion, Material, Vector3, AnimationPropertiesOverride } from "babylonjs";
import { GLTFFileLoader, GLTF2 } from "babylonjs-loaders";
import { IModelConfiguration } from "../configuration/configuration";
import { IModelAnimation, GroupModelAnimation, AnimationPlayMode } from "./modelAnimation";

import * as deepmerge from '../../assets/deepmerge.min.js';
import { AbstractViewer } from "..";
import { extendClassWithConfig } from "../helper";


export enum ModelState {
    INIT,
    LOADING,
    LOADED,
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
    /**
     * ParticleSystems connected to this model
     */
    public particleSystems: Array<ParticleSystem> = [];
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

    public loadInfo: GLTF2.IAsset;
    private _loadedUrl: string;
    private _modelConfiguration: IModelConfiguration;

    constructor(protected _viewer: AbstractViewer, modelConfiguration: IModelConfiguration) {
        this.onLoadedObservable = new Observable();
        this.onLoadErrorObservable = new Observable();
        this.onLoadProgressObservable = new Observable();
        this.onAfterConfigure = new Observable();

        this.state = ModelState.INIT;

        this.rootMesh = new AbstractMesh("modelRootMesh", this._viewer.sceneManager.scene);

        this._animations = [];
        //create a copy of the configuration to make sure it doesn't change even after it is changed in the viewer
        this._modelConfiguration = deepmerge(this._viewer.configuration.model || {}, modelConfiguration);

        this._viewer.sceneManager.models.push(this);
        this._viewer.onModelAddedObservable.notifyObservers(this);
        this.onLoadedObservable.add(() => {
            this._viewer.onModelLoadedObservable.notifyObservers(this);
            this._initAnimations();
        });
    }

    /**
     * Get the viewer showing this model
     */
    public getViewer() {
        return this._viewer;
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
            mesh.parent = this.rootMesh;
        }
        mesh.receiveShadows = !!this.configuration.receiveShadows;
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

    public get

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
        Animation.AllowMatricesInterpolation = true;
        this._viewer.sceneManager.scene.animationPropertiesOverride = new AnimationPropertiesOverride();
        this._viewer.sceneManager.scene.animationPropertiesOverride.enableBlending = true;
        this._viewer.sceneManager.scene.animationPropertiesOverride.blendingSpeed = 0.02;
        this._viewer.sceneManager.scene.animationPropertiesOverride.loopMode = 1;
        // check if this is not a gltf loader and init the animations
        if (this.skeletons.length) {
            this.skeletons.forEach((skeleton, idx) => {
                let ag = new AnimationGroup("animation-" + idx, this._viewer.sceneManager.scene);
                skeleton.getAnimatables().forEach(a => {
                    if (a.animations[0]) {
                        ag.addTargetedAnimation(a.animations[0], a);
                    }
                });
                this.addAnimationGroup(ag);
            });
        }

        if (!this._modelConfiguration) return;

        if (this._modelConfiguration.animation) {
            if (this._modelConfiguration.animation.playOnce) {
                this._animations.forEach(a => {
                    a.playMode = AnimationPlayMode.ONCE;
                });
            }
            if (this._modelConfiguration.animation.autoStart && this._animations.length) {
                let animationName = this._modelConfiguration.animation.autoStart === true ?
                    this._animations[0].name : this._modelConfiguration.animation.autoStart;
                this.playAnimation(animationName);
            }
        }
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
        return this._animations.map(a => a.name);
    }

    /**
     * Get an animation by the provided name. Used mainly when playing n animation.
     * @param name the name of the animation to find
     */
    protected _getAnimationByName(name: string): Nullable<IModelAnimation> {
        // can't use .find, noe available on IE
        let filtered = this._animations.filter(a => a.name === name);
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
        let animation = this._getAnimationByName(name);
        if (animation) {
            if (this.currentAnimation) {
                this.currentAnimation.stop();
            }
            this.currentAnimation = animation;
            animation.start();
            return animation;
        } else {
            throw new Error("animation not found - " + name);
        }
    }

    private _configureModel() {
        // this can be changed to the meshes that have rootMesh a parent without breaking anything.
        let meshesWithNoParent: Array<AbstractMesh> = [this.rootMesh] //this._meshes.filter(m => m.parent === this.rootMesh);
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
        if (this._modelConfiguration.position) {
            updateXYZ('position', this._modelConfiguration.position);
        }
        if (this._modelConfiguration.rotation) {
            //quaternion?
            if (this._modelConfiguration.rotation.w) {
                meshesWithNoParent.forEach(mesh => {
                    if (!mesh.rotationQuaternion) {
                        mesh.rotationQuaternion = new Quaternion();
                    }
                })
                updateXYZ('rotationQuaternion', this._modelConfiguration.rotation);
            } else {
                updateXYZ('rotation', this._modelConfiguration.rotation);
            }
        }

        if (this._modelConfiguration.rotationOffsetAxis) {
            let rotationAxis = new Vector3(0, 0, 0).copyFrom(this._modelConfiguration.rotationOffsetAxis as Vector3);

            meshesWithNoParent.forEach(m => {
                if (this._modelConfiguration.rotationOffsetAngle) {
                    m.rotate(rotationAxis, this._modelConfiguration.rotationOffsetAngle);
                }
            })

        }

        if (this._modelConfiguration.scaling) {
            updateXYZ('scaling', this._modelConfiguration.scaling);
        }

        if (this._modelConfiguration.castShadow) {
            this._meshes.forEach(mesh => {
                Tags.AddTagsTo(mesh, 'castShadow');
            });
        }

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
                    //mesh.position.y = 0;

                    // Recompute Info.
                    mesh.computeWorldMatrix(true);
                });
            }
        }

        let meshes = this.rootMesh.getChildMeshes(false);
        meshes.filter(m => m.material).forEach((mesh) => {
            this._applyModelMaterialConfiguration(mesh.material!);
        });

        this.onAfterConfigure.notifyObservers(this);
    }

    /**
     * Apply a material configuration to a material
     * @param material Material to apply configuration to
     */
    private _applyModelMaterialConfiguration(material: Material) {
        if (!this._modelConfiguration.material) return;

        extendClassWithConfig(material, this._modelConfiguration.material);

        if (material instanceof BABYLON.PBRMaterial) {
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

            material.reflectionColor = this._viewer.sceneManager.mainColor;
        }
        else if (material instanceof BABYLON.MultiMaterial) {
            for (let i = 0; i < material.subMaterials.length; i++) {
                const subMaterial = material.subMaterials[i];
                if (subMaterial) {
                    this._applyModelMaterialConfiguration(subMaterial);
                }
            }
        }
    }

    /**
     * Will remove this model from the viewer (but NOT dispose it).
     */
    public remove() {
        this._viewer.sceneManager.models.splice(this._viewer.sceneManager.models.indexOf(this), 1);
        // hide it
        this.rootMesh.isVisible = false;
        this._viewer.onModelRemovedObservable.notifyObservers(this);
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
        this.particleSystems.forEach(ps => ps.dispose());
        this.particleSystems.length = 0;
        this.skeletons.forEach(s => s.dispose());
        this.skeletons.length = 0;
        this._animations.forEach(ag => ag.dispose());
        this._animations.length = 0;
        this._meshes.forEach(m => m.dispose());
        this._meshes.length = 0;
        this.rootMesh.dispose();
    }
}