import { Nullable } from "../types";
import { Scene } from "../scene";
import { ISceneSerializableComponent, SceneComponentConstants } from "../sceneComponent";
import { SubSurfaceConfiguration } from "./subSurfaceConfiguration";
import { AbstractScene } from "../abstractScene";
import { Color3 } from "../Maths/math.color";

// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_SUBSURFACE, (parsedData: any, scene: Scene) => {
    // Diffusion profiles
    if (parsedData.ssDiffusionProfileColors !== undefined && parsedData.ssDiffusionProfileColors !== null) {
        scene.enableSubSurfaceForPrePass();
        if (scene.subSurfaceConfiguration) {
            for (var index = 0, cache = parsedData.ssDiffusionProfileColors.length; index < cache; index++) {
                var color = parsedData.ssDiffusionProfileColors[index];
                scene.subSurfaceConfiguration.addDiffusionProfile(new Color3(color.r, color.g, color.b));
            }
        }
    }
});

declare module "../abstractScene" {
    export interface AbstractScene {
        /** @hidden (Backing field) */
        _subSurfaceConfiguration: Nullable<SubSurfaceConfiguration>;

        /**
         * Gets or Sets the current prepass renderer associated to the scene.
         */
        subSurfaceConfiguration: Nullable<SubSurfaceConfiguration>;

        /**
         * Enables the subsurface effect for prepass
         * @returns the SubSurfaceConfiguration
         */
        enableSubSurfaceForPrePass(): Nullable<SubSurfaceConfiguration>;

        /**
         * Disables the subsurface effect for prepass
         */
        disableSubSurfaceForPrePass(): void;
    }
}

Object.defineProperty(Scene.prototype, "subSurfaceConfiguration", {
    get: function(this: Scene) {
        return this._subSurfaceConfiguration;
    },
    set: function(this: Scene, value: Nullable<SubSurfaceConfiguration>) {
        if (value) {
            if (this.enablePrePassRenderer()) {
                    this._subSurfaceConfiguration = value;
            }
        }
    },
    enumerable: true,
    configurable: true
});

Scene.prototype.enableSubSurfaceForPrePass = function(): Nullable<SubSurfaceConfiguration> {
    if (this._subSurfaceConfiguration) {
        return this._subSurfaceConfiguration;
    }

    const prePassRenderer = this.enablePrePassRenderer();
    if (prePassRenderer) {
        this._subSurfaceConfiguration = new SubSurfaceConfiguration(this);
        prePassRenderer.addEffectConfiguration(this._subSurfaceConfiguration);
        return this._subSurfaceConfiguration;
    }

    return null;

};

Scene.prototype.disableSubSurfaceForPrePass = function(): void {
    if (!this._subSurfaceConfiguration) {
        return;
    }

    this._subSurfaceConfiguration.dispose();
    this._subSurfaceConfiguration = null;
};

/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class SubSurfaceSceneComponent implements ISceneSerializableComponent {
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
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        if (!this.scene.subSurfaceConfiguration) {
            return;
        }

        const ssDiffusionProfileColors = this.scene.subSurfaceConfiguration.ssDiffusionProfileColors;
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
        if (!this.scene.prePassRenderer) {
            return;
        }

        if (this.scene.subSurfaceConfiguration) {
            this.scene.subSurfaceConfiguration.clearAllDiffusionProfiles();
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

SubSurfaceConfiguration._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_SUBSURFACE) as SubSurfaceSceneComponent;
    if (!component) {
        component = new SubSurfaceSceneComponent(scene);
        scene._addComponent(component);
    }
};
