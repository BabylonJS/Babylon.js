/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import { SceneComponentConstants } from "../sceneComponent";
import type { ISceneComponent } from "../sceneComponent";

import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { type Observer } from "../Misc/observable.pure";
import { Nullable } from "../types";
import { IblCdfGenerator } from "./iblCdfGenerator";

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
        this.scene.addIsReadyCheck(this);
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
        this.scene.removeIsReadyCheck(this);
    }

    /**
     * @returns true once the CDF generator's procedural textures and effects are ready.
     * Used by `Scene.isReady` so that `executeWhenReady` waits for the CDF maps to be
     * generated before declaring the scene ready to render.
     */
    public isReady(): boolean {
        const generator = this.scene._iblCdfGenerator;
        // If there's no generator, or no environment texture for it to consume,
        // there's nothing to wait for - report ready so Scene.isReady() doesn't stall.
        if (!generator || !this.scene.environmentTexture) {
            return true;
        }
        return !!generator.isReady();
    }

    private _updateIblSource(): void {
        if (this.scene.iblCdfGenerator && this.scene.environmentTexture) {
            this.scene.iblCdfGenerator.iblSource = this.scene.environmentTexture;
        }
    }

    private _newIblObserver: Nullable<Observer<Nullable<BaseTexture>>> = null;
}

let _Registered = false;
/**
 * Register side effects for iblCdfGeneratorSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterIblCdfGeneratorSceneComponent(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
        if (!this._iblCdfGenerator.isSupported) {
            this._iblCdfGenerator = null;
            return null;
        }
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

    IblCdfGenerator._SceneComponentInitialization = (scene: Scene) => {
        // Register the CDF generator component to the scene.
        let component = scene._getComponent(SceneComponentConstants.NAME_IBLCDFGENERATOR) as IblCdfGeneratorSceneComponent;
        if (!component) {
            component = new IblCdfGeneratorSceneComponent(scene);
            scene._addComponent(component);
        }
    };
}
