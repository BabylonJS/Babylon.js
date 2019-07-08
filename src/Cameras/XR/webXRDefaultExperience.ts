import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { Scene } from '../../scene';
import { WebXRInput } from './webXRInput';
import { WebXRControllerModelLoader } from './webXRControllerModelLoader';
import { WebXRControllerPointerSelection } from './webXRControllerPointerSelection';
import { WebXRControllerTeleportation } from './webXRControllerTeleportation';
import { WebXRManagedOutputCanvas } from './webXRManagedOutputCanvas';
import { WebXREnterExitUI } from './webXREnterExitUI';
import { AbstractMesh } from '../../Meshes/abstractMesh';
/**
 * Options for the default xr helper
 */
export class WebXRDefaultExperienceOptions {
    /**
     * Floor meshes that should be used for teleporting
     */
    public floorMeshes: Array<AbstractMesh>;
}

/**
 * Default experience which provides a similar setup to the previous webVRExperience
 */
export class WebXRDefaultExperience {
    /**
     * Base experience
     */
    public baseExperience: WebXRExperienceHelper;
    /**
     * Input experience extension
     */
    public input: WebXRInput;
    /**
     * Loads the controller models
     */
    public controllerModelLoader: WebXRControllerModelLoader;
    /**
     * Enables laser pointer and selection
     */
    public pointerSelection: WebXRControllerPointerSelection;
    /**
     * Enables teleportation
     */
    public teleportation: WebXRControllerTeleportation;
    /**
     * Enables ui for enetering/exiting xr
     */
    public enterExitUI: WebXREnterExitUI;
    /**
     * Default output canvas xr should render to
     */
    public outputCanvas: WebXRManagedOutputCanvas;

    /**
     * Creates the default xr experience
     * @param scene scene
     * @param options options for basic configuration
     * @returns resulting WebXRDefaultExperience
     */
    public static CreateAsync(scene: Scene, options: WebXRDefaultExperienceOptions) {
        var result = new WebXRDefaultExperience();

        // Create base experience
        return WebXRExperienceHelper.CreateAsync(scene).then((xrHelper) => {
            result.baseExperience = xrHelper;

            // Add controller support
            result.input = new WebXRInput(xrHelper);
            result.controllerModelLoader = new WebXRControllerModelLoader(result.input);
            result.pointerSelection = new WebXRControllerPointerSelection(result.input);
            result.teleportation = new WebXRControllerTeleportation(result.input, options.floorMeshes);

            // Create output canvas manager (this controls where the xr frames will be rendered)
            result.outputCanvas = new WebXRManagedOutputCanvas(xrHelper, scene.getEngine().getRenderingCanvas() as HTMLCanvasElement);

            // Create ui for entering/exiting xr
            return WebXREnterExitUI.CreateAsync(scene, result.baseExperience, {webXRManagedOutputCanvas: result.outputCanvas});
        }).then((ui) => {
            result.enterExitUI = ui;
            return result;
        });
    }

    private constructor() {

    }

    /**
     * DIsposes of the experience helper
     */
    public dispose() {
        if (this.baseExperience) {
            this.baseExperience.dispose();
        }
        if (this.input) {
            this.input.dispose();
        }
        if (this.enterExitUI) {
            this.enterExitUI.dispose();
        }
        if (this.outputCanvas) {
            this.outputCanvas.dispose();
        }
    }
}