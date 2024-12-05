import type { Nullable } from "../types";
import { Scene } from "../scene";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { IblCdfGenerator } from "./iblCdfGenerator";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Observer } from "../Misc/observable";

declare module "../scene" {
    export interface Scene {
        /** @internal (Backing field) */
        _iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Gets or Sets the current CDF generator associated to the scene.
         * The CDF (cumulative distribution function) generator creates CDF maps
         * for a given IBL texture that can then be used for more efficient
         * importance sampling.
         */
        iblCdfGenerator: Nullable<IblCdfGenerator>;

        /**
         * Enables a IblCdfGenerator and associates it with the scene.
         * @returns the IblCdfGenerator
         */
        enableIblCdfGenerator(): Nullable<IblCdfGenerator>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableIblCdfGenerator(): void;
    }
}

Object.defineProperty(Scene.prototype, "iblCdfGenerator", {
    get: function (this: Scene) {
        return this._iblCdfGenerator;
    },
    set: function (this: Scene, value: Nullable<IblCdfGenerator>) {
        if (value) {
            this._iblCdfGenerator = value;
        }
    },
    enumerable: true,
    configurable: true,
});

Scene.prototype.enableIblCdfGenerator = function (): Nullable<IblCdfGenerator> {
    if (this._iblCdfGenerator) {
        return this._iblCdfGenerator;
    }

    this._iblCdfGenerator = new IblCdfGenerator(this);
    if (this.environmentTexture) {
        this._iblCdfGenerator.iblSource = this.environmentTexture;
    }
    return this._iblCdfGenerator;
};

Scene.prototype.disableIblCdfGenerator = function (): void {
    if (!this._iblCdfGenerator) {
        return;
    }

    this._iblCdfGenerator.dispose();
    this._iblCdfGenerator = null;
};

/**
 * Defines the IBL CDF Generator scene component responsible for generating CDF maps for a given IBL.
 */
export class IblCdfGeneratorSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_IBLCDFGENERATOR;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this._updateIblSource();
        this._newIblObserver = this.scene.onEnvironmentTextureChangedObservable.add(this._updateIblSource.bind(this));
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        this.scene.onEnvironmentTextureChangedObservable.remove(this._newIblObserver);
    }

    private _updateIblSource(): void {
        if (this.scene.iblCdfGenerator && this.scene.environmentTexture) {
            this.scene.iblCdfGenerator.iblSource = this.scene.environmentTexture;
        }
    }

    private _newIblObserver: Nullable<Observer<Nullable<BaseTexture>>> = null;
}

IblCdfGenerator._SceneComponentInitialization = (scene: Scene) => {
    // Register the CDF generator component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_IBLCDFGENERATOR) as IblCdfGeneratorSceneComponent;
    if (!component) {
        component = new IblCdfGeneratorSceneComponent(scene);
        scene._addComponent(component);
    }
};
