import { Nullable } from "../types";
import { Scene } from "../scene";
import { ISceneComponent, SceneComponentConstants } from "../sceneComponent";
import { PrePassRenderer } from "./prePassRenderer";

declare module "../scene" {
    export interface Scene {
        /** @hidden (Backing field) */
        _prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Gets or Sets the current geometry buffer associated to the scene.
         */
        prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Enables the prepass and associates it with the scene
         * @returns the PrePassRenderer
         */
        enablePrepassRenderer(ratio?: number): Nullable<PrePassRenderer>;

        /**
         * Disables the prepass associated with the scene
         */
        disablePrepassRenderer(): void;
    }
}

Object.defineProperty(Scene.prototype, "prePassRenderer", {
    get: function(this: Scene) {
        return this._prePassRenderer;
    },
    set: function(this: Scene, value: Nullable<PrePassRenderer>) {
        if (value && value.isSupported) {
            this._prePassRenderer = value;
        }
    },
    enumerable: true,
    configurable: true
});

Scene.prototype.enablePrepassRenderer = function(ratio: number = 1): Nullable<PrePassRenderer> {
    if (this._prePassRenderer) {
        return this._prePassRenderer;
    }

    this._prePassRenderer = new PrePassRenderer(this);
    if (!this._prePassRenderer.isSupported) {
        this._prePassRenderer = null;
    }

    return this._prePassRenderer;
};

Scene.prototype.disablePrepassRenderer = function(): void {
    if (!this._prePassRenderer) {
        return;
    }

    this._prePassRenderer.dispose();
    this._prePassRenderer = null;
};

/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class PrePassRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_PREPASSRENDERER;

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
        this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_PREPASS, this, this._beforeCameraDraw);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_PREPASS, this, this._afterCameraDraw);
        this.scene._beforeClearStage.registerStep(SceneComponentConstants.STEP_BEFORECLEARSTAGE_PREPASS, this, this._beforeClearStage);
    }

    private _beforeCameraDraw() {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer._beforeCameraDraw();
        }
    }

    private _afterCameraDraw() {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer._afterCameraDraw();
        }
    }

    private _beforeClearStage() {
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer.clear();
        }
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
        // Nothing to do for this component
    }

}

PrePassRenderer._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_PREPASSRENDERER) as PrePassRendererSceneComponent;
    if (!component) {
        component = new PrePassRendererSceneComponent(scene);
        scene._addComponent(component);
    }
};
