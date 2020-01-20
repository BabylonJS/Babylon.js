import {
    WebXRAbstractMotionController, IMotionControllerProfile,
} from './webXRAbstractController';
import { WebXRGenericTriggerMotionController } from './webXRGenericMotionController';
import { Scene } from '../../../scene';
import { Tools } from '../../../Misc/tools';
import { WebXRProfiledMotionController } from './webXRProfiledMotionController';

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
    public static BaseRepositoryUrl = "https://immersive-web.github.io/webxr-input-profiles/packages/viewer/dist";
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
     * @return A promise that fulfils with the motion controller class for this profile id or the generic standard class if none was found
     */
    public static GetMotionControllerWithXRInput(xrInput: XRInputSource, scene: Scene, forceProfile?: string): Promise<WebXRAbstractMotionController> {
        const profileArray: string[] = [];
        if (forceProfile) {
            profileArray.push(forceProfile);
        }
        profileArray.push(...(xrInput.profiles || []));

        // try using the gamepad id
        if (xrInput.gamepad && xrInput.gamepad.id) {
            switch (xrInput.gamepad.id) {
                case (xrInput.gamepad.id.match(/oculus touch/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    // return Promise.resolve(this._AvailableControllers["oculus-touch-legacy"](xrInput, scene));
                    profileArray.push("oculus-touch-v2");
                    break;
                case (xrInput.gamepad.id.match(/Spatial Controller/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    // return Promise.resolve(this._AvailableControllers["microsoft-mixed-reality"](xrInput, scene));
                    break;
                case (xrInput.gamepad.id.match(/openvr/gi) ? xrInput.gamepad.id : undefined):
                    // oculus in gamepad id - legacy mapping
                    // return Promise.resolve(this._AvailableControllers["htc-vive-legacy"](xrInput, scene));
                    break;
            }
        }

        // make sure microsoft/windows mixed reality works correctly
        const windowsMRIdx = profileArray.indexOf("windows-mixed-reality");
        if (windowsMRIdx !== -1) {
            profileArray.splice(windowsMRIdx, 1, "microsoft-mixed-reality");
        }

        // for (let i = 0; i < profileArray.length; ++i) {
        //     const constructionFunction = this._AvailableControllers[profileArray[i]];
        //     if (constructionFunction) {
        //         return Promise.resolve(constructionFunction(xrInput, scene));
        //     }
        // }

        if (!profileArray.length) {
            profileArray.push("generic-button");
        }

        // TODO use local repository, if asked by the user

        return this._LoadProfileFromRepository(profileArray, xrInput, scene);
        // // check fallbacks
        // for (let i = 0; i < profileArray.length; ++i) {
        //     const fallbacks = this.FindFallbackWithProfileId(profileArray[i]);
        //     for (let j = 0; j < fallbacks.length; ++j) {
        //         const constructionFunction = this._AvailableControllers[fallbacks[j]];
        //         if (constructionFunction) {
        //             return Promise.resolve(constructionFunction(xrInput, scene));
        //         }
        //     }
        // }
        // return the most generic thing we have
        // return this._AvailableControllers[WebXRGenericTriggerMotionController.ProfileId](xrInput, scene);

        // Check if there is an online profile and use it if possible
    }

    private static _ProfilesList: { [profile: string]: string };

    // cache for loading
    private static _ProfileLoadingPromises: { [profileName: string]: Promise<IMotionControllerProfile> } = {};

    private static _LoadProfileFromRepository(profileArray: string[], xrInput: XRInputSource, scene: Scene): Promise<WebXRAbstractMotionController> {
        return Promise.resolve().then(() => {
            if (!this._ProfilesList) {
                return this.UpdateProfilesList();
            } else {
                return this._ProfilesList;
            }
        }).then((profilesList: { [profile: string]: string }) => {
            // load the right profile
            for (let i = 0; i < profileArray.length; ++i) {
                if (profilesList[profileArray[i]]) {
                    return profileArray[i];
                }
            }

            return "generic-button";
        }).then((profileToLoad: string) => {
            // load the profile
            if (!this._ProfileLoadingPromises[profileToLoad]) {
                this._ProfileLoadingPromises[profileToLoad] = Tools.LoadFileAsync(`${this.BaseRepositoryUrl}/profiles/${profileToLoad}/profile.json`, false).then((data) => <IMotionControllerProfile>JSON.parse(data as string));
            }
            return this._ProfileLoadingPromises[profileToLoad];
        }).then((profile: IMotionControllerProfile) => {
            return new WebXRProfiledMotionController(scene, xrInput, profile);
        });

    }

    public static ClearProfileCache() {
        delete this._ProfilesList;
        this._ProfileLoadingPromises = {};
    }

    public static UpdateProfilesList() {
        return Tools.LoadFileAsync(this.BaseRepositoryUrl + '/profiles/profilesList.json', false).then((data) => {
            this._ProfilesList = JSON.parse(data.toString());
            return this._ProfilesList;
        });
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
        this.RegisterFallbacksForProfileId("windows-mixed-reality", ["generic-trigger-squeeze-touchpad-thumbstick"]);
        this.RegisterFallbacksForProfileId("microsoft-mixed-reality", ["windows-mixed-reality", "generic-trigger-squeeze-touchpad-thumbstick"]);
        this.RegisterFallbacksForProfileId("oculus-go", ["generic-trigger-touchpad"]);
        this.RegisterFallbacksForProfileId("oculus-touch-v2", ["oculus-touch", "generic-trigger-squeeze-thumbstick"]);
        this.RegisterFallbacksForProfileId("oculus-touch", ["generic-trigger-squeeze-thumbstick"]);
        this.RegisterFallbacksForProfileId("samsung-gearvr", ["windows-mixed-reality", "generic-trigger-squeeze-touchpad-thumbstick"]);
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