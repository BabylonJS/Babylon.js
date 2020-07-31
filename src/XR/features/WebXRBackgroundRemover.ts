import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager";
import { WebXRSessionManager } from '../webXRSessionManager';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Observable } from '../../Misc/observable';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';

/**
 * Options interface for the background remover plugin
 */
export interface IWebXRBackgroundRemoverOptions {
    /**
     * Further background meshes to disable when entering AR
     */
    backgroundMeshes?: AbstractMesh[];
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
     * don't disable the environment helper
     */
    ignoreEnvironmentHelper?: boolean;
}

/**
 * A module that will automatically disable background meshes when entering AR and will enable them when leaving AR.
 */
export class WebXRBackgroundRemover extends WebXRAbstractFeature {
    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.BACKGROUND_REMOVER;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * registered observers will be triggered when the background state changes
     */
    public onBackgroundStateChangedObservable: Observable<boolean> = new Observable();

    /**
     * constructs a new background remover module
     * @param _xrSessionManager the session manager for this module
     * @param options read-only options to be used in this module
     */
    constructor(_xrSessionManager: WebXRSessionManager,
        /**
         * read-only options to be used in this module
         */
        public readonly options: IWebXRBackgroundRemoverOptions = {}) {
        super(_xrSessionManager);
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        this._setBackgroundState(false);
        return super.attach();
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        this._setBackgroundState(true);
        return super.detach();
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        this.onBackgroundStateChangedObservable.clear();
    }

    protected _onXRFrame(_xrFrame: XRFrame) {
        // no-op
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
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRBackgroundRemover.Name, (xrSessionManager, options) => {
    return () => new WebXRBackgroundRemover(xrSessionManager, options);
}, WebXRBackgroundRemover.Version, true);
