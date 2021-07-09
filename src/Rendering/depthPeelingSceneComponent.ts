import { Material } from "../Materials/material";
import { Scene } from "../scene";
import { SceneComponentConstants, ISceneComponent } from "../sceneComponent";
import { Nullable } from "../types";
import { DepthPeelingRenderer } from "./depthPeelingRenderer";
impo

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
        useOrderIndependantTransparency: boolean
    }
}

// declare module "../Materials/material" {
//     export interface Material {
//         /**
//          * Flag to indicate if this mesh is using orderIndependantTransparency for this rendering pass
//          */
//     }
// }

Object.defineProperty(Scene.prototype, "depthPeelingRenderer", {
    get: function(this: Scene) {
        if (!this._depthPeelingRenderer) {
            let component = this._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER) as DepthPeelingSceneComponent;
            if (!component) {
                component = new DepthPeelingSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._depthPeelingRenderer;
    },
    set: function(this: Scene, value: DepthPeelingRenderer) {
        this._depthPeelingRenderer = value;
    },
    enumerable: true,
    configurable: true
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

        // TODO dynamic instancing
        scene.depthPeelingRenderer = new DepthPeelingRenderer(scene);
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        // this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_LAYER, this, this._drawCameraBackground);
        // this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LAYER, this, this._drawCameraForeground);

        // this.scene._beforeRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_LAYER, this, this._drawRenderTargetBackground);
        // this.scene._afterRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERTARGETDRAW_LAYER, this, this._drawRenderTargetForeground);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        this.scene.depthPeelingRenderer?.dispose();
        this.scene.depthPeelingRenderer = null;
    }

}

// DepthPeelingSceneComponent._SceneComponentInitialization = (scene: Scene) => {
//     // Register the component to the scene.
//     let component = scene._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER) as DepthPeelingSceneComponent;
//     if (!component) {
//         component = new DepthPeelingSceneComponent(scene);
//         scene._addComponent(component);
//     }
// };
