import { Scene } from "../scene";
import { SceneComponentConstants, ISceneComponent } from "../sceneComponent";
import { DepthPeelingRenderer } from "./depthPeelingRenderer";

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * The depth peeling renderer
         */
        depthPeelingRenderer: DepthPeelingRenderer;
    }
}

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
        scene.depthPeelingRenderer = new DepthPeelingRenderer();
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
        this.scene.depthPeelingRenderer.dispose();
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
