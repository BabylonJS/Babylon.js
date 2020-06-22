import { Nullable } from "../types";
import { Scene } from "../scene";
import { ISceneSerializableComponent, SceneComponentConstants } from "../sceneComponent";
import { PrePassRenderer } from "./prePassRenderer";
import { AbstractScene } from "../abstractScene";
import { Color3 } from "../Maths/math.color";
import { Logger } from "../Misc/logger";

// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_PREPASSRENDERER, (parsedData: any, scene: Scene) => {
    // Diffusion profiles
    if (parsedData.ssDiffusionProfileColors !== undefined && parsedData.ssDiffusionProfileColors !== null) {
        scene.enablePrePassRenderer();
        if (scene.prePassRenderer) {
            for (var index = 0, cache = parsedData.ssDiffusionProfileColors.length; index < cache; index++) {
                var color = parsedData.ssDiffusionProfileColors[index];
                scene.prePassRenderer.subSurfaceConfiguration.addDiffusionProfile(new Color3(color.r, color.g, color.b));
            }
        }
    }
});

declare module "../abstractScene" {
    export interface AbstractScene {
        /** @hidden (Backing field) */
        _prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Gets or Sets the current prepass renderer associated to the scene.
         */
        prePassRenderer: Nullable<PrePassRenderer>;

        /**
         * Enables the prepass and associates it with the scene
         * @returns the PrePassRenderer
         */
        enablePrePassRenderer(): Nullable<PrePassRenderer>;

        /**
         * Disables the prepass associated with the scene
         */
        disablePrePassRenderer(): void;
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

Scene.prototype.enablePrePassRenderer = function(): Nullable<PrePassRenderer> {
    if (this._prePassRenderer) {
        return this._prePassRenderer;
    }

    this._prePassRenderer = new PrePassRenderer(this);

    if (!this._prePassRenderer.isSupported) {
        this._prePassRenderer = null;
        Logger.Error("PrePassRenderer needs WebGL 2 support.\n" +
            "Maybe you tried to use the following features that need the PrePassRenderer :\n" +
            " + Subsurface Scattering");
    }

    return this._prePassRenderer;
};

Scene.prototype.disablePrePassRenderer = function(): void {
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
export class PrePassRendererSceneComponent implements ISceneSerializableComponent {
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
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        if (!this.scene.prePassRenderer) {
            return;
        }

        const ssDiffusionProfileColors = this.scene.prePassRenderer.subSurfaceConfiguration.ssDiffusionProfileColors;
        serializationObject.ssDiffusionProfileColors = [];

        for (let i = 0; i < ssDiffusionProfileColors.length; i++) {
            serializationObject.ssDiffusionProfileColors.push({ r: ssDiffusionProfileColors[i].r,
                                                                g: ssDiffusionProfileColors[i].g,
                                                                b: ssDiffusionProfileColors[i].b });
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: AbstractScene): void {
        // Nothing to do
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: AbstractScene, dispose?: boolean): void {
        // Make sure nothing will be serialized
        if (this.scene.prePassRenderer) {
            this.scene.prePassRenderer.subSurfaceConfiguration.clearAllDiffusionProfiles();
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
