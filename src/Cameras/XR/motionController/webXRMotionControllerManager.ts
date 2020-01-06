import {
    WebXRAbstractMotionController,
} from './webXRAbstractController';
import { WebXRGenericTriggerMotionController } from './webXRGenericMotionController';
import { Scene } from '../../../scene';

/**
 * A construction function type to create a new controller based on an xrInput object
 */
export type MotionControllerConstructor = (xrInput: XRInputSource, scene: Scene) => WebXRAbstractMotionController;

/**
 * The MotionController Manager manages all registered motion controllers and loads the right one when needed.
 *
 * When this repository is complete: https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/assets
 * it should be replaced with auto-loaded controllers.
 *
 * When using a model try to stay as generic as possible. Eventually there will be no need in any of the controller classes
 */
export class WebXRMotionControllerManager {
    private static _AvailableControllers: { [type: string]: MotionControllerConstructor } = {};
    private static _Fallbacks: { [profileId: string]: string[] } = {};

    /**
     * Register a new controller based on its profile. This function will be called by the controller classes themselves.
     *
     * If you are missing a profile, make sure it is imported in your source, otherwise it will not register.
     *
     * @param type the profile type to register
     * @param constructFunction the function to be called when loading this profile
     */
    public static RegisterController(type: string, constructFunction: MotionControllerConstructor) {
        this._AvailableControllers[type] = constructFunction;
    }

    /**
     * When acquiring a new xrInput object (usually by the WebXRInput class), match it with the correct profile.
     * The order of search:
     *
     * 1) Iterate the profiles array of the xr input and try finding a corresponding motion controller
     * 2) (If not found) search in the gamepad id and try using it (legacy versions only)
     * 3) search for registered fallbacks (should be redundant, nonetheless it makes sense to check)
     * 4) return the generic trigger controller if none were found
     *
     * @param xrInput the xrInput to which a new controller is initialized
     * @param scene the scene to which the model will be added
     * @param forceProfile force a certain profile for this controller
     * @return the motion controller class for this profile id or the generic standard class if none was found
     */
    public static GetMotionControllerWithXRInput(xrInput: XRInputSource, scene: Scene, forceProfile?: string): WebXRAbstractMotionController {
        //if a type was forced, try creating a controller using it. Continue if not found.
        if (forceProfile) {
            const constructionFunction = this._AvailableControllers[forceProfile];
            if (constructionFunction) {
                return constructionFunction(xrInput, scene);
            }
        }

        for (let i = 0; i < xrInput.profiles.length; ++i) {
            const constructionFunction = this._AvailableControllers[xrInput.profiles[i]];
            if (constructionFunction) {
                return constructionFunction(xrInput, scene);
            }
        }
        // try using the gamepad id
        if (xrInput.gamepad && xrInput.gamepad.id) {
            switch (xrInput.gamepad.id) {
                case (xrInput.gamepad.id.match(/oculus touch/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    return this._AvailableControllers["oculus-touch-legacy"](xrInput, scene);
                case (xrInput.gamepad.id.match(/Spatial Controller/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    return this._AvailableControllers["microsoft-mixed-reality"](xrInput, scene);
                case (xrInput.gamepad.id.match(/openvr/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    return this._AvailableControllers["htc-vive-legacy"](xrInput, scene);
            }
        }
        // check fallbacks
        for (let i = 0; i < xrInput.profiles.length; ++i) {
            const fallbacks = this.FindFallbackWithProfileId(xrInput.profiles[i]);
            for (let j = 0; j < fallbacks.length; ++j) {
                const constructionFunction = this._AvailableControllers[fallbacks[j]];
                if (constructionFunction) {
                    return constructionFunction(xrInput, scene);
                }
            }
        }
        // return the most generic thing we have
        return this._AvailableControllers[WebXRGenericTriggerMotionController.ProfileId](xrInput, scene);
    }

    /**
     * Find a fallback profile if the profile was not found. There are a few predefined generic profiles.
     * @param profileId the profile to which a fallback needs to be found
     * @return an array with corresponding fallback profiles
     */
    public static FindFallbackWithProfileId(profileId: string): string[] {
        return this._Fallbacks[profileId] || [];
    }

    /**
     * Register a fallback to a specific profile.
     * @param profileId the profileId that will receive the fallbacks
     * @param fallbacks A list of fallback profiles
     */
    public static RegisterFallbacksForProfileId(profileId: string, fallbacks: string[]): void {
        if (this._Fallbacks[profileId]) {
            this._Fallbacks[profileId].push(...fallbacks);
        } else {
            this._Fallbacks[profileId] = fallbacks;
        }
    }

    /**
     * Register the default fallbacks.
     * This function is called automatically when this file is imported.
     */
    public static DefaultFallbacks() {
        this.RegisterFallbacksForProfileId("google-daydream", ["generic-touchpad"]);
        this.RegisterFallbacksForProfileId("htc-vive-focus", ["generic-trigger-touchpad"]);
        this.RegisterFallbacksForProfileId("htc-vive", ["generic-trigger-squeeze-touchpad"]);
        this.RegisterFallbacksForProfileId("magicleap-one", ["generic-trigger-squeeze-touchpad"]);
        this.RegisterFallbacksForProfileId("microsoft-mixed-reality", ["generic-trigger-squeeze-touchpad-thumbstick"]);
        this.RegisterFallbacksForProfileId("oculus-go", ["generic-trigger-touchpad"]);
        this.RegisterFallbacksForProfileId("oculus-touch-v2", ["oculus-touch", "generic-trigger-squeeze-thumbstick"]);
        this.RegisterFallbacksForProfileId("oculus-touch", ["generic-trigger-squeeze-thumbstick"]);
        this.RegisterFallbacksForProfileId("samsung-gearvr", ["microsoft-mixed-reality", "generic-trigger-squeeze-touchpad-thumbstick"]);
        this.RegisterFallbacksForProfileId("samsung-odyssey", ["generic-touchpad"]);
        this.RegisterFallbacksForProfileId("valve-index", ["generic-trigger-squeeze-touchpad-thumbstick"]);
    }
}

// register the generic profile(s) here so we will at least have them
WebXRMotionControllerManager.RegisterController(WebXRGenericTriggerMotionController.ProfileId, (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRGenericTriggerMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness);
});

// register fallbacks
WebXRMotionControllerManager.DefaultFallbacks();