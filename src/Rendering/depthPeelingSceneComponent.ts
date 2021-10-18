import { Scene } from "../scene";
import { SceneComponentConstants, ISceneComponent } from "../sceneComponent";
import { Nullable } from "../types";
import { DepthPeelingRenderer } from "./depthPeelingRenderer";

declare module "../scene" {
    export interface Scene {
        /**
         * The depth peeling renderer
         */
        depthPeelingRenderer: Nullable<DepthPeelingRenderer>;
        /** @hidden (Backing field) */
        _depthPeelingRenderer: Nullable<DepthPeelingRenderer>;

        /**
         * Flag to indicate if we want to use order independant transparency, despite the performance hit
         */
        useOrderIndependentTransparency: boolean;
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

/**
 * Scene component to render order independant transparency with depth peeling
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
