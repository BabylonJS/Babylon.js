import { WebXRSessionManager } from './webXRSessionManager';
import { IDisposable } from '../../scene';

export interface WebXRFeature extends IDisposable {
    attach(): boolean;
    detach(): boolean;
}

export type WebXRFeatureConstructor = (xrSessionManager: WebXRSessionManager, options?: any) => (() => WebXRFeature);

export class WebXRFeaturesManager implements IDisposable {

    private static readonly _AvailableFeatures: { [name: string]: WebXRFeatureConstructor } = {};

    public static AddWebXRFeature(featureName: string, constructorFunction: WebXRFeatureConstructor) {
        this._AvailableFeatures[featureName] = constructorFunction;
    }

    public static ConstructFeature(featureName: string, xrSessionManager: WebXRSessionManager, options?: any) {
        const constructorFunction = this._AvailableFeatures[featureName];
        if (!constructorFunction) {
            // throw an error? return nothing?
            return;
        }

        return constructorFunction(xrSessionManager, options);
    }

    public static GetAvailableFeatures() {
        return Object.keys(this._AvailableFeatures);
    }

    private features: {
        [name: string]: {
            featureImplementation: WebXRFeature,
            enabled: boolean,
            attached: boolean
        }
    } = {};

    constructor(private xrSessionManager: WebXRSessionManager) {
        this.xrSessionManager.onXRSessionInit.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this.features[featureName];
                if (feature.enabled && !feature.attached) {
                    this.attachFeature(featureName);
                }
            });
        });

        this.xrSessionManager.onXRSessionEnded.add(() => {
            this.getEnabledFeatures().forEach((featureName) => {
                const feature = this.features[featureName];
                if (feature.enabled && feature.attached) {
                    // detach, but don't disable!
                    this.detachFeature(featureName);
                }
            });
        });
    }

    public enableFeature(featureName: string | { Name: string }, options: any = {}, attachIfPossible: boolean = true): WebXRFeature {
        const name = typeof featureName === 'string' ? featureName : featureName.Name;
        const feature = this.features[name];
        if (!feature || !feature.featureImplementation) {
            const constructFunction = WebXRFeaturesManager.ConstructFeature(name, this.xrSessionManager, options);
            if (!constructFunction) {
                // report error?
                throw new Error(`feature not found - ${name}`);
            }

            this.features[name] = {
                featureImplementation: constructFunction(),
                attached: false,
                enabled: true
            };
        } else {
            // make sure it is enabled now:
            feature.enabled = true;
        }

        // if session started already, request and enable
        if (this.xrSessionManager.session && !feature.attached && attachIfPossible) {
            // enable feature
            this.attachFeature(name);
        }

        return this.features[name].featureImplementation;
    }

    public disableFeature(featureName: string | { Name: string }) {
        const name = typeof featureName === 'string' ? featureName : featureName.Name;
        const feature = this.features[name];
        if (feature && feature.enabled) {
            feature.enabled = false;
            this.detachFeature(name);
        }
    }

    public attachFeature(featureName: string) {
        const feature = this.features[featureName];
        if (feature && feature.enabled && !feature.attached) {
            feature.featureImplementation.attach();
            feature.attached = true;
        }
    }

    public detachFeature(featureName: string) {
        const feature = this.features[featureName];
        if (feature && feature.attached) {
            feature.featureImplementation.detach();
            feature.attached = false;
        }
    }

    public getEnabledFeatures() {
        return Object.keys(this.features);
    }

    public getEnabledFeature(featureName: string) {
        return this.features[featureName] && this.features[featureName].featureImplementation;
    }

    dispose(): void {
        this.getEnabledFeatures().forEach((feature) => this.features[feature].featureImplementation.dispose());
    }

}