import {
    WebXRAbstractMotionController,
} from './webXRAbstractController';
import { WebXRGenericTriggerMotionController } from './webXRGenericMotionController';
import { Scene } from '../../../scene';

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
    public static RegisterController(type: string, constructFunction: MotionControllerConstructor) {
        this._AvailableControllers[type] = constructFunction;
    }

    public static GetMotionControllerWithXRInput(xrInput: XRInputSource, scene: Scene) {
        for (let i = 0; i < xrInput.profiles.length; ++i) {
            if (this._AvailableControllers[xrInput.profiles[i]]) {
                return this._AvailableControllers[xrInput.profiles[i]](xrInput, scene);
            }
        }
        // try using the gamepad id
        if (xrInput.gamepad) {
            switch (xrInput.gamepad.id) {
                case (xrInput.gamepad.id.match(/oculus/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    return this._AvailableControllers["oculus-touch-legacy"](xrInput, scene);
            }
        }
        // check fallbacks
        for (let i = 0; i < xrInput.profiles.length; ++i) {
            const fallbacks = this.FindFallbackWithProfileId(xrInput.profiles[i]);
            if (fallbacks) {
                for (let j = 0; j < fallbacks.length; ++j) {
                    if (this._AvailableControllers[fallbacks[j]]) {
                        return this._AvailableControllers[fallbacks[j]](xrInput, scene);
                    }
                }
            }
        }
        // return the most generic thing we have
        return this._AvailableControllers[WebXRGenericTriggerMotionController.ProfileId](xrInput, scene);
    }

    public static FindFallbackWithProfileId(profileId: string): string[] {
        return this._Fallbacks[profileId];
    }

    public static RegisterFallbacksForProfileId(profileId: string, fallbacks: string[]) {
        if (this._Fallbacks[profileId]) {
            this._Fallbacks[profileId].push(...fallbacks);
        } else {
            this._Fallbacks[profileId] = fallbacks;
        }
    }

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