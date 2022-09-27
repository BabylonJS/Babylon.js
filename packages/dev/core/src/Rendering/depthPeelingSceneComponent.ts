import { Constants } from "../Engines/constants";
import { Scene } from "../scene";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { Nullable } from "../types";
import { DepthPeelingRenderer } from "./depthPeelingRenderer";

declare module "../scene" {
    export interface Scene {
        /**
         * The depth peeling renderer
         */
        depthPeelingRenderer: Nullable<DepthPeelingRenderer>;
        /** @internal (Backing field) */
        _depthPeelingRenderer: Nullable<DepthPeelingRenderer>;

        /**
         * Flag to indicate if we want to use order independent transparency, despite the performance hit
         */
        useOrderIndependentTransparency: boolean;
        /** @internal */
        _useOrderIndependentTransparency: boolean;
    }
}

Object.defineProperty(Scene.prototype, "depthPeelingRenderer", {
    get: function (this: Scene) {
        if (!this._depthPeelingRenderer) {
            let component = this._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER) as DepthPeelingSceneComponent;
            if (!component) {
                component = new DepthPeelingSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._depthPeelingRenderer;
    },
    set: function (this: Scene, value: DepthPeelingRenderer) {
        this._depthPeelingRenderer = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Scene.prototype, "useOrderIndependentTransparency", {
    get: function (this: Scene) {
        return this._useOrderIndependentTransparency;
    },
    set: function (this: Scene, value: boolean) {
        if (this._useOrderIndependentTransparency === value) {
            return;
        }
        this._useOrderIndependentTransparency = value;
        this.markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
        this.prePassRenderer?.markAsDirty();
    },
    enumerable: true,
    configurable: true,
});

/**
 * Scene component to render order independent transparency with depth peeling
 */
export class DepthPeelingSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_DEPTHPEELINGRENDERER;

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

        scene.depthPeelingRenderer = new DepthPeelingRenderer(scene);
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
        this.scene.depthPeelingRenderer?.dispose();
        this.scene.depthPeelingRenderer = null;
    }
}
