import { WebXRFeaturesManager, IWebXRFeature } from "../webXRFeaturesManager";
import { WebXRSessionManager } from '../webXRSessionManager';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Observable } from '../../../Misc/observable';

const Name = "xr-background-remover";

/**
 * Options interface for the background remover plugin
 */
export interface IWebXRBackgroundRemoverOptions {
    /**
     * don't disable the environment helper
     */
    ignoreEnvironmentHelper?: boolean;
    /**
     * flags to configure the removal of the environment helper.
     * If not set, the entire background will be removed. If set, flags should be set as well.
     */
    environmentHelperRemovalFlags?: {
        /**
         * Should the skybox be removed (default false)
         */
        skyBox?: boolean;
        /**
         * Should the ground be removed (default false)
         */
        ground?: boolean;
    };
    /**
     * Further background meshes to disable when entering AR
     */
    backgroundMeshes?: AbstractMesh[];
}

/**
 * A module that will automatically disable background meshes when entering AR and will enable them when leaving AR.
 */
export class WebXRBackgroundRemover implements IWebXRFeature {

    /**
     * The module's name
     */
    public static readonly Name = Name;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

    /**
     * registered observers will be triggered when the background state changes
     */
    public onBackgroundStateChangedObservable: Observable<boolean> = new Observable();

    /**
     * Set to true when attached
     */
    public attached: boolean = false;

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param options read-only options to be used in this module
     */
    constructor(private _xrSessionManager: WebXRSessionManager,
        /**
         * read-only options to be used in this module
         */
        public readonly options: IWebXRBackgroundRemoverOptions = {}) {

    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    attach(): boolean {
        this._setBackgroundState(false);

        this.attached = true;

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean {
        this._setBackgroundState(true);

        this.attached = false;

        return true;
    }

    private _setBackgroundState(newState: boolean) {
        const scene = this._xrSessionManager.scene;
        if (!this.options.ignoreEnvironmentHelper) {
            if (this.options.environmentHelperRemovalFlags) {
                if (this.options.environmentHelperRemovalFlags.skyBox) {
                    const backgroundSkybox = scene.getMeshByName("BackgroundSkybox");
                    if (backgroundSkybox) {
                        backgroundSkybox.setEnabled(newState);
                    }
                }
                if (this.options.environmentHelperRemovalFlags.ground) {
                    const backgroundPlane = scene.getMeshByName("BackgroundPlane");
                    if (backgroundPlane) {
                        backgroundPlane.setEnabled(newState);
                    }
                }
            } else {
                const backgroundHelper = scene.getMeshByName("BackgroundHelper");
                if (backgroundHelper) {
                    backgroundHelper.setEnabled(newState);
                }
            }
        }

        if (this.options.backgroundMeshes) {
            this.options.backgroundMeshes.forEach((mesh) => mesh.setEnabled(newState));
        }

        this.onBackgroundStateChangedObservable.notifyObservers(newState);
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    dispose(): void {
        this.detach();
        this.onBackgroundStateChangedObservable.clear();
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRBackgroundRemover.Name, (xrSessionManager, options) => {
    return () => new WebXRBackgroundRemover(xrSessionManager, options);
}, WebXRBackgroundRemover.Version, true);
