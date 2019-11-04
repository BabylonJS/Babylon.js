import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { Scene } from '../../scene';
import { WebXRInput } from './webXRInput';
import { WebXRControllerModelLoader } from './webXRControllerModelLoader';
import { WebXRControllerPointerSelection } from './webXRControllerPointerSelection';
import { WebXRControllerTeleportation } from './webXRControllerTeleportation';
import { WebXRRenderTarget } from './webXRTypes';
import { WebXREnterExitUI } from './webXREnterExitUI';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { WebXRManagedOutputCanvasOptions } from './webXRManagedOutputCanvas';

/**
 * Options for the default xr helper
 */
export class WebXRDefaultExperienceOptions {
    /**
     * Floor meshes that should be used for teleporting
     */
    public floorMeshes: Array<AbstractMesh>;

    /**
     * Enable or disable default UI to enter XR
     */
    public disableDefaultUI: boolean;

    /**
     * optional configuration for the output canvas
     */
    public outputCanvasOptions? : WebXRManagedOutputCanvasOptions;
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
     * Default target xr should render to
     */
    public renderTarget: WebXRRenderTarget;

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

            if (options.floorMeshes) {
                result.teleportation = new WebXRControllerTeleportation(result.input, options.floorMeshes);
            }

            // Create the WebXR output target
            result.renderTarget = result.baseExperience.sessionManager.getWebXRRenderTarget(xrHelper.onStateChangedObservable, options.outputCanvasOptions);

            if (!options.disableDefaultUI) {
                // Create ui for entering/exiting xr
                return WebXREnterExitUI.CreateAsync(scene, result.baseExperience, { renderTarget: result.renderTarget }).then((ui) => {
                    result.enterExitUI = ui;
                });
            } else {
                return;
            }
        }).then(() => {
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
        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
    }
}