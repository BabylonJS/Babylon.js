import { ISceneLoaderPlugin, ISceneLoaderPluginAsync, AnimationGroup, Animatable, AbstractMesh, Tools, Scene, SceneLoader, Observable, SceneLoaderProgressEvent, Tags, ParticleSystem, Skeleton } from "babylonjs";
import { IModelConfiguration } from "../configuration/configuration";

export class ViewerModel {

    public loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    public animationGroups: Array<AnimationGroup>;
    public animatables: Array<Animatable>;
    public meshes: Array<AbstractMesh>;
    public particleSystems: Array<ParticleSystem>;
    public skeletons: Array<Skeleton>;

    public onLoadedObservable: Observable<ViewerModel>;
    public onLoadProgressObservable: Observable<SceneLoaderProgressEvent>;
    public onLoadErrorObservable: Observable<{ message: string; exception: any }>;

    constructor(private _modelConfiguration: IModelConfiguration, private _scene: Scene, disableAutoLoad = false) {
        this.onLoadedObservable = new Observable();
        this.onLoadErrorObservable = new Observable();
        this.onLoadProgressObservable = new Observable();

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

    private _initLoad() {
        if (!this._modelConfiguration || !this._modelConfiguration.url) {
            return Tools.Error("No model URL to load.");
        }
        let parts = this._modelConfiguration.url.split('/');
        let filename = parts.pop() || this._modelConfiguration.url;
        let base = parts.length ? parts.join('/') + '/' : './';

        let plugin = this._modelConfiguration.loader;

        this.loader = SceneLoader.ImportMesh(undefined, base, filename, this._scene, (meshes, particleSystems, skeletons) => {
            meshes.forEach(mesh => {
                Tags.AddTagsTo(mesh, "viewerMesh");
            });
            this.meshes = meshes;
            this.particleSystems = particleSystems;
            this.skeletons = skeletons;
            this.onLoadedObservable.notifyObserversWithPromise(this);
        }, (progressEvent) => {
            this.onLoadProgressObservable.notifyObserversWithPromise(progressEvent);
        }, (e, m, exception) => {
            this.onLoadErrorObservable.notifyObserversWithPromise({ message: m, exception: exception });
        }, plugin)!;
    }

    public dispose() {
        this.animatables.forEach(a => {
            a.stop();
        });
        this.particleSystems.forEach(ps => ps.dispose());
        this.skeletons.forEach(s => s.dispose());
        this.animationGroups.forEach(ag => ag.dispose());
        this.meshes.forEach(m => m.dispose());
    }
}