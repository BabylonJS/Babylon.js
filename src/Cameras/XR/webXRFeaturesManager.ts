import { WebXRSessionManager } from './webXRSessionManager';
import { IDisposable } from '../../scene';
import { Observable } from '../../Misc/observable';

export interface WebXRFeature extends IDisposable {
    readonly name: string;
    attachAsync(): Promise<boolean>;
    detachAsync(): Promise<boolean>;
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

    public onFeatureAttachedObservable: Observable<WebXRFeature> = new Observable();
    public onFeatureDetachedObservable: Observable<WebXRFeature> = new Observable();

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

    public enableFeature(featureName: string, options: any = {}, attachIfPossible: boolean = true): WebXRFeature {
        const feature = this.features[featureName];
        if (!feature || !feature.featureImplementation) {
            const constructFunction = WebXRFeaturesManager.ConstructFeature(featureName, this.xrSessionManager, options);
            if (!constructFunction) {
                // report error?
                throw new Error(`feature not found - ${featureName}`);
            }

            this.features[featureName] = {
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
            this.attachFeature(featureName);
        }

        return this.features[featureName].featureImplementation;
    }

    public disableFeature(featureName: string) {
        const feature = this.features[featureName];
        if (feature && feature.enabled) {
            feature.enabled = false;
            this.detachFeature(featureName);
        }
    }

    public attachFeature(featureName: string) {
        const feature = this.features[featureName];
        if (feature && feature.enabled && !feature.attached) {
            feature.featureImplementation.attachAsync().then(() => {
                this.onFeatureAttachedObservable.notifyObservers(feature.featureImplementation);
            });
        }
    }

    public detachFeature(featureName: string) {
        const feature = this.features[featureName];
        if (feature && !feature.attached) {
            feature.featureImplementation.detachAsync().then(() => {
                this.onFeatureDetachedObservable.notifyObservers(feature.featureImplementation);
            });
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