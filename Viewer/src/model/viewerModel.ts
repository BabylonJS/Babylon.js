import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, AnimationGroup, Animatable, AbstractMesh, Tools, Scene, SceneLoader, Observable, SceneLoaderProgressEvent, Tags, ParticleSystem, Skeleton, IDisposable, Nullable, Animation, GLTFFileLoader, Quaternion } from "babylonjs";
import { IModelConfiguration } from "../configuration/configuration";
import { IModelAnimation, GroupModelAnimation, AnimationPlayMode } from "./modelAnimation";

import * as deepmerge from '../../assets/deepmerge.min.js';

export enum ModelState {
    INIT,
    LOADING,
    LOADED,
    CANCELED,
    ERROR
}

export class ViewerModel implements IDisposable {

    public loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    private _animations: Array<IModelAnimation>;
    public meshes: Array<AbstractMesh> = [];
    public rootMesh: AbstractMesh;
    public particleSystems: Array<ParticleSystem> = [];
    public skeletons: Array<Skeleton> = [];
    public currentAnimation: IModelAnimation;

    public onLoadedObservable: Observable<ViewerModel>;
    public onLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    public onLoadErrorObservable: Observable<{ message: string; exception: any }>;

    public onAfterConfigure: Observable<ViewerModel>;

    public state: ModelState;
    public loadId: number;

    private _loaderDisposed: boolean = false;
    private _loadedUrl: string;

    constructor(private _scene: Scene, private _modelConfiguration: IModelConfiguration, disableAutoLoad = false) {
        this.onLoadedObservable = new Observable();
        this.onLoadErrorObservable = new Observable();
        this.onLoadProgressObservable = new Observable();
        this.onAfterConfigure = new Observable();

        this.state = ModelState.INIT;

        this._animations = [];

        if (!disableAutoLoad) {
            this._initLoad();
        }
    }

    public load() {
        if (this.loader) {
            Tools.Error("Model was already loaded or in the process of loading.");
        } else {
            this._initLoad();
        }
    }

    public cancelLoad() {
        // ATM only available in the GLTF Loader
        if (this.loader && this.loader.name === "gltf") {
            let gltfLoader = (<GLTFFileLoader>this.loader);
            gltfLoader.dispose();
            this.state = ModelState.CANCELED;
        }
    }

    public get configuration(): IModelConfiguration {
        return this._modelConfiguration;
    }

    public set configuration(newConfiguration: IModelConfiguration) {
        this._modelConfiguration = newConfiguration;
        this._configureModel();
    }

    public updateConfiguration(newConfiguration: Partial<IModelConfiguration>) {
        this._modelConfiguration = deepmerge(this._modelConfiguration, newConfiguration);
        this._configureModel();
    }

    public getAnimations() {
        return this._animations;
    }

    public getAnimationNames() {
        return this._animations.map(a => a.name);
    }

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
        let meshesWithNoParent: Array<AbstractMesh> = this.meshes.filter(m => !m.parent);
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
        if (this._modelConfiguration.scaling) {
            updateXYZ('scaling', this._modelConfiguration.scaling);
        }

        if (this._modelConfiguration.castShadow) {
            this.meshes.forEach(mesh => {
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
                parentIndex = 0;
            } else {
                center = !!this._modelConfiguration.normalize.center;
                unitSize = !!this._modelConfiguration.normalize.unitSize;
                parentIndex = this._modelConfiguration.normalize.parentIndex;
            }

            let meshesToNormalize: Array<AbstractMesh> = [];
            if (parentIndex !== undefined) {
                meshesToNormalize.push(this.meshes[parentIndex]);
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
        this.onAfterConfigure.notifyObservers(this);
    }

    private _initLoad() {
        if (!this._modelConfiguration.url) {
            this.state = ModelState.ERROR;
            Tools.Error("No URL provided");
            return;
        }

        let filename = Tools.GetFilename(this._modelConfiguration.url) || this._modelConfiguration.url;
        let base = this._modelConfiguration.root || Tools.GetFolderPath(this._modelConfiguration.url);
        let plugin = this._modelConfiguration.loader;
        this._loadedUrl = this._modelConfiguration.url;

        //temp solution for animation group handling
        let animationsArray = this._scene.animationGroups.slice();

        this.loader = SceneLoader.ImportMesh(undefined, base, filename, this._scene, (meshes, particleSystems, skeletons) => {
            meshes.forEach(mesh => {
                Tags.AddTagsTo(mesh, "viewerMesh");
            });
            this.meshes = meshes;
            this.particleSystems = particleSystems;
            this.skeletons = skeletons;

            // check if this is a gltf loader and load the animations
            if (this.loader.name === 'gltf') {
                this._scene.animationGroups.forEach(ag => {
                    // add animations that didn't exist before
                    if (animationsArray.indexOf(ag) === -1) {
                        this._animations.push(new GroupModelAnimation(ag));
                    }
                })
            } else {
                skeletons.forEach((skeleton, idx) => {
                    let ag = new AnimationGroup("animation-" + idx, this._scene);
                    skeleton.getAnimatables().forEach(a => {
                        if (a.animations[0]) {
                            ag.addTargetedAnimation(a.animations[0], a);
                        }
                    });
                    this._animations.push(new GroupModelAnimation(ag));
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
            this.onLoadedObservable.notifyObserversWithPromise(this);
        }, (progressEvent) => {
            this.onLoadProgressObservable.notifyObserversWithPromise(progressEvent);
        }, (e, m, exception) => {
            this.state = ModelState.ERROR;
            Tools.Error("Load Error: There was an error loading the model. " + m);
            this.onLoadErrorObservable.notifyObserversWithPromise({ message: m, exception: exception });
        }, plugin)!;

        if (this.loader.name === "gltf") {
            let gltfLoader = (<GLTFFileLoader>this.loader);
            gltfLoader.animationStartMode = 0;
            gltfLoader.onDispose = () => {
                this._loaderDisposed = true;
            }
        }

    }

    public dispose() {
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
        this.meshes.forEach(m => m.dispose());
        this.meshes.length = 0;
    }
}