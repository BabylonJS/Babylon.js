import { Nullable } from "../types";
import { Scene } from "../scene";
import { ISceneComponent, SceneComponentConstants } from "../sceneComponent";
import { SmartArrayNoDuplicate } from "../Misc/smartArray";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { GeometryBufferRenderer } from "./geometryBufferRenderer";

declare module "../scene" {
    export interface Scene {
        /** @hidden (Backing field) */
        _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Gets or Sets the current geometry buffer associated to the scene.
         */
        geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Enables a GeometryBufferRender and associates it with the scene
         * @param ratio defines the scaling ratio to apply to the renderer (1 by default which means same resolution)
         * @returns the GeometryBufferRenderer
         */
        enableGeometryBufferRenderer(ratio?: number): Nullable<GeometryBufferRenderer>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableGeometryBufferRenderer(): void;
    }
}

Object.defineProperty(Scene.prototype, "geometryBufferRenderer", {
    get: function(this: Scene) {
        this._geometryBufferRenderer;
    },
    set: function(this: Scene, value: Nullable<GeometryBufferRenderer>) {
        if (value && value.isSupported) {
            this._geometryBufferRenderer = value;
        }
    },
    enumerable: true,
    configurable: true
});

Scene.prototype.enableGeometryBufferRenderer = function(ratio: number = 1): Nullable<GeometryBufferRenderer> {
    if (this._geometryBufferRenderer) {
        return this._geometryBufferRenderer;
    }

    this._geometryBufferRenderer = new GeometryBufferRenderer(this, ratio);
    if (!this._geometryBufferRenderer.isSupported) {
        this._geometryBufferRenderer = null;
    }

    return this._geometryBufferRenderer;
};

Scene.prototype.disableGeometryBufferRenderer = function(): void {
    if (!this._geometryBufferRenderer) {
        return;
    }

    this._geometryBufferRenderer.dispose();
    this._geometryBufferRenderer = null;
};

/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class GeometryBufferRendererSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER;

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
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_GEOMETRYBUFFERRENDERER, this, this._gatherRenderTargets);
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

    private _gatherRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        if (this.scene._geometryBufferRenderer) {
            renderTargets.push(this.scene._geometryBufferRenderer.getGBuffer());
        }
    }
}

GeometryBufferRenderer._SceneComponentInitialization = (scene: Scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER) as GeometryBufferRendererSceneComponent;
    if (!component) {
        component = new GeometryBufferRendererSceneComponent(scene);
        scene._addComponent(component);
    }
};
