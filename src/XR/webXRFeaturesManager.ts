import { WebXRSessionManager } from './webXRSessionManager';
import { IDisposable } from '../scene';

/**
 * Defining the interface required for a (webxr) feature
 */
export interface IWebXRFeature extends IDisposable {
    /**
     * Is this feature attached
     */
    attached: boolean;
    /**
     * Should auto-attach be disabled?
     */
    disableAutoAttach: boolean;

    /**
     * Attach the feature to the session
     * Will usually be called by the features manager
     *
     * @param force should attachment be forced (even when already attached)
     * @returns true if successful.
     */
    attach(force?: boolean): boolean;
    /**
     * Detach the feature from the session
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean;
}

/**
 * A list of the currently available features without referencing them
 */
export class WebXRFeatureName {
    /**
     * The name of the anchor system feature
     */
    public static ANCHOR_SYSTEM = "xr-anchor-system";
    /**
     * The name of the background remover feature
     */
    public static BACKGROUND_REMOVER = "xr-background-remover";
    /**
     * The name of the hit test feature
     */
    public static HIT_TEST = "xr-hit-test";
    /**
     * physics impostors for xr controllers feature
     */
    public static PHYSICS_CONTROLLERS = "xr-physics-controller";
    /**
     * The name of the plane detection feature
     */
    public static PLANE_DETECTION = "xr-plane-detection";
    /**
     * The name of the pointer selection feature
     */
    public static POINTER_SELECTION = "xr-controller-pointer-selection";
    /**
     * The name of the teleportation feature
     */
    public static TELEPORTATION = "xr-controller-teleportation";
}

/**
 * Defining the constructor of a feature. Used to register the modules.
 */
export type WebXRFeatureConstructor = (xrSessionManager: WebXRSessionManager, options?: any) => (() => IWebXRFeature);

/**
 * The WebXR features manager is responsible of enabling or disabling features required for the current XR session.
 * It is mainly used in AR sessions.
 *
 * A feature can have a version that is defined by Babylon (and does not correspond with the webxr version).
 */
export class WebXRFeaturesManager implements IDisposable {
    private static readonly _AvailableFeatures: {
        [name: string]: {
            stable: number;
            latest: number;
            [version: number]: WebXRFeatureConstructor;
        }
    } = {};

    private _features: {
        [name: string]: {
            featureImplementation: IWebXRFeature,
            version: number,
            enabled: boolean
        }
    } = {};

    /**
     * constructs a new features manages.
     *
     * @param _xrSessionManager an instance of WebXRSessionManager
     */
    constructor(private _xrSessionManager: WebXRSessionManager) {
        // when session starts / initialized - attach
        this._xrSessionManager.onXRSessionInit.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this._features[featureName];
                if (feature.enabled && !feature.featureImplementation.attached && !feature.featureImplementation.disableAutoAttach) {
                    this.attachFeature(featureName);
                }
            });
        });

        // when session ends - detach
        this._xrSessionManager.onXRSessionEnded.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this._features[featureName];
                if (feature.enabled && feature.featureImplementation.attached) {
                    // detach, but don't disable!
                    this.detachFeature(featureName);
                }
            });
        });
    }

    /**
     * Used to register a module. After calling this function a developer can use this feature in the scene.
     * Mainly used internally.
     *
     * @param featureName the name of the feature to register
     * @param constructorFunction the function used to construct the module
     * @param version the (babylon) version of the module
     * @param stable is that a stable version of this module
     */
    public static AddWebXRFeature(featureName: string, constructorFunction: WebXRFeatureConstructor, version: number = 1, stable: boolean = false) {
        this._AvailableFeatures[featureName] = this._AvailableFeatures[featureName] || { latest: version };
        if (version > this._AvailableFeatures[featureName].latest) {
            this._AvailableFeatures[featureName].latest = version;
        }
        if (stable) {
            this._AvailableFeatures[featureName].stable = version;
        }
        this._AvailableFeatures[featureName][version] = constructorFunction;
    }

    /**
     * Returns a constructor of a specific feature.
     *
     * @param featureName the name of the feature to construct
     * @param version the version of the feature to load
     * @param xrSessionManager the xrSessionManager. Used to construct the module
     * @param options optional options provided to the module.
     * @returns a function that, when called, will return a new instance of this feature
     */
    public static ConstructFeature(featureName: string, version: number = 1, xrSessionManager: WebXRSessionManager, options?: any): (() => IWebXRFeature) {
        const constructorFunction = this._AvailableFeatures[featureName][version];
        if (!constructorFunction) {
            // throw an error? return nothing?
            throw new Error('feature not found');
        }

        return constructorFunction(xrSessionManager, options);
    }

    /**
     * Can be used to return the list of features currently registered
     *
     * @returns an Array of available features
     */
    public static GetAvailableFeatures() {
        return Object.keys(this._AvailableFeatures);
    }

    /**
     * Gets the versions available for a specific feature
     * @param featureName the name of the feature
     * @returns an array with the available versions
     */
    public static GetAvailableVersions(featureName: string) {
        return Object.keys(this._AvailableFeatures[featureName]);
    }

    /**
     * Return the latest unstable version of this feature
     * @param featureName the name of the feature to search
     * @returns the version number. if not found will return -1
     */
    public static GetLatestVersionOfFeature(featureName: string): number {
        return (this._AvailableFeatures[featureName] && this._AvailableFeatures[featureName].latest) || -1;
    }

    /**
     * Return the latest stable version of this feature
     * @param featureName the name of the feature to search
     * @returns the version number. if not found will return -1
     */
    public static GetStableVersionOfFeature(featureName: string): number {
        return (this._AvailableFeatures[featureName] && this._AvailableFeatures[featureName].stable) || -1;
    }

    /**
     * Attach a feature to the current session. Mainly used when session started to start the feature effect.
     * Can be used during a session to start a feature
     * @param featureName the name of feature to attach
     */
    public attachFeature(featureName: string) {
        const feature = this._features[featureName];
        if (feature && feature.enabled && !feature.featureImplementation.attached) {
            feature.featureImplementation.attach();
        }
    }

    /**
     * Can be used inside a session or when the session ends to detach a specific feature
     * @param featureName the name of the feature to detach
     */
    public detachFeature(featureName: string) {
        const feature = this._features[featureName];
        if (feature && feature.featureImplementation.attached) {
            feature.featureImplementation.detach();
        }
    }

    /**
     * Used to disable an already-enabled feature
     * The feature will be disposed and will be recreated once enabled.
     * @param featureName the feature to disable
     * @returns true if disable was successful
     */
    public disableFeature(featureName: string | { Name: string }): boolean {
        const name = typeof featureName === 'string' ? featureName : featureName.Name;
        const feature = this._features[name];
        if (feature && feature.enabled) {
            feature.enabled = false;
            this.detachFeature(name);
            feature.featureImplementation.dispose();
            return true;
        }
        return false;
    }

    /**
     * dispose this features manager
     */
    public dispose(): void {
        this.getEnabledFeatures().forEach((feature) => {
            this.disableFeature(feature);
            this._features[feature].featureImplementation.dispose();
        });
    }

    /**
     * Enable a feature using its name and a version. This will enable it in the scene, and will be responsible to attach it when the session starts.
     * If used twice, the old version will be disposed and a new one will be constructed. This way you can re-enable with different configuration.
     *
     * @param featureName the name of the feature to load or the class of the feature
     * @param version optional version to load. if not provided the latest version will be enabled
     * @param moduleOptions options provided to the module. Ses the module documentation / constructor
     * @param attachIfPossible if set to true (default) the feature will be automatically attached, if it is currently possible
     * @returns a new constructed feature or throws an error if feature not found.
     */
    public enableFeature(featureName: string | { Name: string }, version: number | string = 'latest', moduleOptions: any = {}, attachIfPossible: boolean = true): IWebXRFeature {
        const name = typeof featureName === 'string' ? featureName : featureName.Name;
        let versionToLoad = 0;
        if (typeof version === 'string') {
            if (!version) {
                throw new Error(`Error in provided version - ${name} (${version})`);
            }
            if (version === 'stable') {
                versionToLoad = WebXRFeaturesManager.GetStableVersionOfFeature(name);
            } else if (version === 'latest') {
                versionToLoad = WebXRFeaturesManager.GetLatestVersionOfFeature(name);
            } else {
                // try loading the number the string represents
                versionToLoad = +version;
            }
            if (versionToLoad === -1 || isNaN(versionToLoad)) {
                throw new Error(`feature not found - ${name} (${version})`);
            }
        } else {
            versionToLoad = version;
        }
        // check if already initialized
        const feature = this._features[name];
        const constructFunction = WebXRFeaturesManager.ConstructFeature(name, versionToLoad, this._xrSessionManager, moduleOptions);
        if (!constructFunction) {
            // report error?
            throw new Error(`feature not found - ${name}`);
        }

        /* If the feature is already enabled, detach and dispose it, and create a new one */
        if (feature) {
            this.disableFeature(name);
        }

        this._features[name] = {
            featureImplementation: constructFunction(),
            enabled: true,
            version: versionToLoad
        };

        if (attachIfPossible) {
            // if session started already, request and enable
            if (this._xrSessionManager.session && !feature.featureImplementation.attached) {
                // enable feature
                this.attachFeature(name);
            }
        } else {
            // disable auto-attach when session starts
            this._features[name].featureImplementation.disableAutoAttach = true;
        }

        return this._features[name].featureImplementation;
    }

    /**
     * get the implementation of an enabled feature.
     * @param featureName the name of the feature to load
     * @returns the feature class, if found
     */
    public getEnabledFeature(featureName: string): IWebXRFeature {
        return this._features[featureName] && this._features[featureName].featureImplementation;
    }

    /**
     * Get the list of enabled features
     * @returns an array of enabled features
     */
    public getEnabledFeatures() {
        return Object.keys(this._features);
    }
}