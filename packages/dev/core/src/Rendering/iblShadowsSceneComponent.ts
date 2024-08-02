import { Constants } from "../Engines/constants";
import { Scene } from "../scene";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { Nullable } from "../types";
import { IblShadowsRenderer } from "./iblShadowsRenderer";

declare module "../scene" {
    export interface Scene {
        /**
         * The IBL shadows renderer
         */
        iblShadowsRenderer: Nullable<IblShadowsRenderer>;
        /** @internal (Backing field) */
        _iblShadowsRenderer: Nullable<IblShadowsRenderer>;

        /**
         * Flag to indicate if we want to use IBL shadows, despite the performance hit
         */
        useIblShadows: boolean;
        /** @internal */
        _useIblShadows: boolean;
    }
}

Object.defineProperty(Scene.prototype, "iblShadowsRenderer", {
    get: function (this: Scene) {
        if (!this._iblShadowsRenderer) {
            let component = this._getComponent(SceneComponentConstants.NAME_IBLSHADOWSRENDERER) as IblShadowsSceneComponent;
            if (!component) {
                component = new IblShadowsSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._iblShadowsRenderer;
    },
    set: function (this: Scene, value: IblShadowsRenderer) {
        this._iblShadowsRenderer = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Scene.prototype, "useIblShadows", {
    get: function (this: Scene) {
        return this._useIblShadows;
    },
    set: function (this: Scene, value: boolean) {
        if (this._useIblShadows === value) {
            return;
        }
        this._useIblShadows = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
        this.prePassRenderer?.markAsDirty();
    },
    enumerable: true,
    configurable: true,
});

/**
 * Scene component to render voxel-based shadows for an IBL
 */
export class IblShadowsSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_IBLSHADOWSRENDERER;

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

        scene.iblShadowsRenderer = new IblShadowsRenderer(scene);
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {}

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {}

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        this.scene.iblShadowsRenderer?.dispose();
        this.scene.iblShadowsRenderer = null;
    }
}
