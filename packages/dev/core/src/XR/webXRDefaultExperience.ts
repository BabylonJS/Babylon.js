import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import type { Scene } from "../scene";
import type { IWebXRInputOptions } from "./webXRInput";
import { WebXRInput } from "./webXRInput";
import type { IWebXRControllerPointerSelectionOptions } from "./features/WebXRControllerPointerSelection";
import { WebXRControllerPointerSelection } from "./features/WebXRControllerPointerSelection";
import type { IWebXRNearInteractionOptions } from "./features/WebXRNearInteraction";
import { WebXRNearInteraction } from "./features/WebXRNearInteraction";
import type { WebXRRenderTarget } from "./webXRTypes";
import type { WebXREnterExitUIOptions } from "./webXREnterExitUI";
import { WebXREnterExitUI } from "./webXREnterExitUI";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { WebXRManagedOutputCanvasOptions } from "./webXRManagedOutputCanvas";
import type { IWebXRTeleportationOptions } from "./features/WebXRControllerTeleportation";
import { WebXRHandTracking, type IWebXRHandTrackingOptions } from "./features/WebXRHandTracking";
import { WebXRMotionControllerTeleportation } from "./features/WebXRControllerTeleportation";
import { Logger } from "../Misc/logger";

/**
 * Options for the default xr helper
 */
export class WebXRDefaultExperienceOptions {
    /**
     * Enable or disable default UI to enter XR
     */
    public disableDefaultUI?: boolean;
    /**
     * Should pointer selection not initialize.
     * Note that disabling pointer selection also disables teleportation.
     * Defaults to false.
     */
    public disablePointerSelection?: boolean;
    /**
     * Should teleportation not initialize. Defaults to false.
     */
    public disableTeleportation?: boolean;
    /**
     * Should nearInteraction not initialize. Defaults to false.
     */
    public disableNearInteraction?: boolean;

    /**
     * Should hand tracking be disabled. Defaults to false.
     */
    public disableHandTracking?: boolean;
    /**
     * Floor meshes that will be used for teleport
     */
    public floorMeshes?: Array<AbstractMesh>;
    /**
     * If set to true, the first frame will not be used to reset position
     * The first frame is mainly used when copying transformation from the old camera
     * Mainly used in AR
     */
    public ignoreNativeCameraTransformation?: boolean;
    /**
     * Optional configuration for the XR input object
     */
    public inputOptions?: Partial<IWebXRInputOptions>;
    /**
     * optional configuration for pointer selection
     */
    public pointerSelectionOptions?: Partial<IWebXRControllerPointerSelectionOptions>;
    /**
     * optional configuration for near interaction
     */
    public nearInteractionOptions?: Partial<IWebXRNearInteractionOptions>;

    /**
     * optional configuration for hand tracking
     */
    public handSupportOptions?: Partial<IWebXRHandTrackingOptions>;
    /**
     * optional configuration for teleportation
     */
    public teleportationOptions?: Partial<IWebXRTeleportationOptions>;
    /**
     * optional configuration for the output canvas
     */
    public outputCanvasOptions?: WebXRManagedOutputCanvasOptions;
    /**
     * optional UI options. This can be used among other to change session mode and reference space type
     */
    public uiOptions?: Partial<WebXREnterExitUIOptions>;
    /**
     * When loading teleportation and pointer select, use stable versions instead of latest.
     */
    public useStablePlugins?: boolean;

    /**
     * An optional rendering group id that will be set globally for teleportation, pointer selection and default controller meshes
     */
    public renderingGroupId?: number;

    /**
     * A list of optional features to init the session with
     * If set to true, all features we support will be added
     */
    public optionalFeatures?: boolean | string[];
}

/**
 * Default experience for webxr
 */
export class WebXRDefaultExperience {
    /**
     * Base experience
     */
    public baseExperience: WebXRExperienceHelper;
    /**
     * Enables ui for entering/exiting xr
     */
    public enterExitUI: WebXREnterExitUI;
    /**
     * Input experience extension
     */
    public input: WebXRInput;
    /**
     * Enables laser pointer and selection
     */
    public pointerSelection: WebXRControllerPointerSelection;
    /**
     * Default target xr should render to
     */
    public renderTarget: WebXRRenderTarget;
    /**
     * Enables teleportation
     */
    public teleportation: WebXRMotionControllerTeleportation;

    /**
     * Enables near interaction for hands/controllers
     */
    public nearInteraction: WebXRNearInteraction;

    private constructor() {}

    /**
     * Creates the default xr experience
     * @param scene scene
     * @param options options for basic configuration
     * @returns resulting WebXRDefaultExperience
     */
    public static async CreateAsync(scene: Scene, options: WebXRDefaultExperienceOptions = {}) {
        const result = new WebXRDefaultExperience();
        scene.onDisposeObservable.addOnce(() => {
            result.dispose();
        });
        // init the UI right after construction
        if (!options.disableDefaultUI) {
            const uiOptions: WebXREnterExitUIOptions = {
                renderTarget: result.renderTarget,
                ...(options.uiOptions || {}),
            };
            if (options.optionalFeatures) {
                if (typeof options.optionalFeatures === "boolean") {
                    uiOptions.optionalFeatures = ["hit-test", "anchors", "plane-detection", "hand-tracking"];
                } else {
                    uiOptions.optionalFeatures = options.optionalFeatures;
                }
            }
            result.enterExitUI = new WebXREnterExitUI(scene, uiOptions);
        }

        try {
            // Create base experience
            const xrHelper = await WebXRExperienceHelper.CreateAsync(scene);
            // eslint-disable-next-line require-atomic-updates
            result.baseExperience = xrHelper;

            if (options.ignoreNativeCameraTransformation) {
                // eslint-disable-next-line require-atomic-updates
                result.baseExperience.camera.compensateOnFirstFrame = false;
            }

            // Add controller support
            // eslint-disable-next-line require-atomic-updates
            result.input = new WebXRInput(xrHelper.sessionManager, xrHelper.camera, {
                controllerOptions: {
                    renderingGroupId: options.renderingGroupId,
                },
                ...(options.inputOptions || {}),
            });

            if (!options.disablePointerSelection) {
                // Add default pointer selection
                const pointerSelectionOptions = {
                    ...options.pointerSelectionOptions,
                    xrInput: result.input,
                    renderingGroupId: options.renderingGroupId,
                };

                result.pointerSelection = result.baseExperience.featuresManager.enableFeature(
                    WebXRControllerPointerSelection.Name,
                    options.useStablePlugins ? "stable" : "latest",
                    <IWebXRControllerPointerSelectionOptions>pointerSelectionOptions
                );

                if (!options.disableTeleportation) {
                    // Add default teleportation, including rotation
                    result.teleportation = result.baseExperience.featuresManager.enableFeature(
                        WebXRMotionControllerTeleportation.Name,
                        options.useStablePlugins ? "stable" : "latest",
                        <IWebXRTeleportationOptions>{
                            floorMeshes: options.floorMeshes,
                            xrInput: result.input,
                            renderingGroupId: options.renderingGroupId,
                            ...options.teleportationOptions,
                        }
                    );
                    result.teleportation.setSelectionFeature(result.pointerSelection);
                }
            }

            if (!options.disableNearInteraction) {
                // Add default pointer selection
                result.nearInteraction = result.baseExperience.featuresManager.enableFeature(WebXRNearInteraction.Name, options.useStablePlugins ? "stable" : "latest", <
                    IWebXRNearInteractionOptions
                >{
                    xrInput: result.input,
                    farInteractionFeature: result.pointerSelection,
                    renderingGroupId: options.renderingGroupId,
                    useUtilityLayer: true,
                    enableNearInteractionOnAllControllers: true,
                    ...options.nearInteractionOptions,
                });
            }

            if (!options.disableHandTracking) {
                // Add default hand tracking
                result.baseExperience.featuresManager.enableFeature(
                    WebXRHandTracking.Name,
                    options.useStablePlugins ? "stable" : "latest",
                    <IWebXRHandTrackingOptions>{
                        xrInput: result.input,
                        ...options.handSupportOptions,
                    },
                    undefined,
                    false
                );
            }

            // Create the WebXR output target
            result.renderTarget = result.baseExperience.sessionManager.getWebXRRenderTarget(options.outputCanvasOptions);

            if (!options.disableDefaultUI) {
                // Create ui for entering/exiting xr
                await result.enterExitUI.setHelperAsync(result.baseExperience, result.renderTarget);
            }
            return result;
        } catch (error) {
            Logger.Error("Error initializing XR");
            Logger.Error(error);
            return result;
        }
    }

    /**
     * Disposes of the experience helper
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
