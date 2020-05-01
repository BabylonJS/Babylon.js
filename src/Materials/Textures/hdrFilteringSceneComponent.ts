import { Scene } from "../../scene";
import { HDRFiltering } from "./Filtering/hdrFiltering";
import { SceneComponentConstants, ISceneComponent } from "../../sceneComponent";

declare module "../../scene" {
    export interface Scene {
        /**
         * Gets or sets the HDRFiltering component
         */
        hdrFiltering: HDRFiltering;
        /** @hidden (Backing field) */
        _hdrFiltering: HDRFiltering;
    }
}
Object.defineProperty(Scene.prototype, "hdrFiltering", {
    get: function(this: Scene) {
        if (!this._hdrFiltering) {
            this._hdrFiltering = new HDRFiltering(this);
            let component = this._getComponent(SceneComponentConstants.NAME_HDRFILTERING) as HDRFilteringSceneComponent;
            if (!component) {
                component = new HDRFilteringSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._hdrFiltering;
    },
    set: function(this: Scene, value: HDRFiltering) {
        this._hdrFiltering = value;
    },
    enumerable: true,
    configurable: true
});

/**
 * Defines the hdr filtering scene component responsible to filter unprefiltered HDR maps on load.
 */
export class HDRFilteringSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_HDRFILTERING;

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
        // Nothing to do for this component
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated ressources
     */
    public dispose(): void {
        this.scene.hdrFiltering.dispose();
    }
}
