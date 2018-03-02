import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, AnimationGroup, Animatable, AbstractMesh, Tools, Scene, SceneLoader, Observable, SceneLoaderProgressEvent, Tags, ParticleSystem, Skeleton, IDisposable, Nullable, Animation } from "babylonjs";
import { IModelConfiguration } from "../configuration/configuration";
import { IModelAnimation, GroupModelAnimation, AnimationPlayMode } from "./modelAnimation";

export class ViewerModel implements IDisposable {

    public loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    private _animations: Array<IModelAnimation>;
    public meshes: Array<AbstractMesh>;
    public particleSystems: Array<ParticleSystem>;
    public skeletons: Array<Skeleton>;
    public currentAnimation: IModelAnimation;

    public onLoadedObservable: Observable<ViewerModel>;
    public onLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    public onLoadErrorObservable: Observable<{ message: string; exception: any }>;

    constructor(private _modelConfiguration: IModelConfiguration, private _scene: Scene, disableAutoLoad = false) {
        this.onLoadedObservable = new Observable();
        this.onLoadErrorObservable = new Observable();
        this.onLoadProgressObservable = new Observable();

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

    //public getAnimations() {
    //    return this._animations;
    //}

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
            throw new Error("aniamtion not found - " + name);
        }
    }

    private _initLoad() {
        if (!this._modelConfiguration || !this._modelConfiguration.url) {
            return Tools.Error("No model URL to load.");
        }
        let parts = this._modelConfiguration.url.split('/');
        let filename = parts.pop() || this._modelConfiguration.url;
        let base = parts.length ? parts.join('/') + '/' : './';

        let plugin = this._modelConfiguration.loader;

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
            /*if (this.loader['_loader'] && this.loader['_loader']['_gltf'] && this.loader['_loader']['_gltf'].animations) {
                this.loader['_loader']['_gltf'].animations.forEach(animation => {
                    this._animations.push(new GroupModelAnimation(animation._babylonAnimationGroup));
                });
            }*/
            if (this.loader.name === 'gltf') {
                this._scene.animationGroups.forEach(ag => {
                    // add animations that didn't exist before
                    if (animationsArray.indexOf(ag) === -1) {
                        this._animations.push(new GroupModelAnimation(ag));
                    }
                })
            } else {
                skeletons.forEach((skeleton, idx) => {
                    let ag = new BABYLON.AnimationGroup("animation-" + idx, this._scene);
                    skeleton.getAnimatables().forEach(a => {
                        if (a.animations[0]) {
                            ag.addTargetedAnimation(a.animations[0], a);
                        }
                    });
                    this._animations.push(new GroupModelAnimation(ag));
                });
            }

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
            this.onLoadErrorObservable.notifyObserversWithPromise({ message: m, exception: exception });
        }, plugin)!;

        this.loader['animationStartMode'] = 0;
    }

    public dispose() {
        this.particleSystems.forEach(ps => ps.dispose());
        this.skeletons.forEach(s => s.dispose());
        this._animations.forEach(ag => ag.dispose());
        this.meshes.forEach(m => m.dispose());
    }
}