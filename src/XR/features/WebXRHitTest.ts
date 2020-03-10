import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable } from '../../Misc/observable';
import { Vector3, Matrix, Quaternion } from '../../Maths/math.vector';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { IWebXRLegacyHitTestOptions, IWebXRLegacyHitResult } from '../../Legacy/legacy';

/**
 * Options used for hit testing
 */
export interface IWebXRHitTestOptions extends IWebXRLegacyHitTestOptions {
    enableTransientHitTest?: boolean;
    hitTestOffsetRay?: Vector3;
    disableAutoStart?: boolean;
}

/**
 * Interface defining the babylon result of hit-test
 */
export interface IWebXRHitResult extends IWebXRLegacyHitResult {
    inputSource?: XRInputSource;
    position: Vector3;
    rotationQuaternion: Quaternion;
    isTransient?: boolean;
}

/**
 * The currently-working hit-test module.
 * Hit test (or Ray-casting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 */
export class WebXRHitTest extends WebXRAbstractFeature {
    // in XR space z-forward is negative
    private _xrHitTestSource: XRHitTestSource;
    private _transientXrHitTestSource: XRTransientInputHitTestSource;
    private _tmpPos: Vector3 = new Vector3();
    private _tmpQuat: Quaternion = new Quaternion();
    private _tmpMat: Matrix = new Matrix();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.HIT_TEST;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 2;

    /**
     * Populated with the last native XR Hit Results
     */
    public lastNativeXRHitResults: XRHitResult[] = [];
    /**
     * Triggered when new babylon (transformed) hit test results are available
     */
    public onHitTestResultObservable: Observable<IWebXRHitResult[]> = new Observable();

    public autoCloneTransformation: boolean = false;

    /**
     * Creates a new instance of the hit test feature
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(_xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRHitTestOptions = {}) {
        super(_xrSessionManager);
    }

    public cancel() {
        if (this._xrHitTestSource) {
            this._xrHitTestSource.cancel();
        }
    }

    public start() {
        if (this._xrSessionManager.referenceSpace) {
            this.initHitTestSource();
        }
    }

    private initHitTestSource = () => {
        const offsetRay = new XRRay(this.options.hitTestOffsetRay || {});
        const options: XRHitTestOptionsInit = {
            space: this._xrSessionManager.viewerReferenceSpace,
            offsetRay: offsetRay
        };
        this._xrSessionManager.session.requestHitTestSource(options).then((hitTestSource) => {
            if (this._xrHitTestSource) {
                this._xrHitTestSource.cancel();
            }
            this._xrHitTestSource = hitTestSource;
        });
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        if (!this.options.disableAutoStart) {
            this.start();
            this._xrSessionManager.onXRReferenceSpaceChanged.add(this.initHitTestSource);
        }
        if (this.options.enableTransientHitTest) {
            this._xrSessionManager.session.requestHitTestSourceForTransientInput({
                profile : 'generic-touchscreen'
            }).then((hitSource) => {
                this._transientXrHitTestSource = hitSource;
            });
        }

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        this.cancel();
        this._xrSessionManager.onXRReferenceSpaceChanged.removeCallback(this.initHitTestSource);
        if (this._transientXrHitTestSource) {
            this._transientXrHitTestSource.cancel();
        }
        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        this.onHitTestResultObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        // make sure we do nothing if (async) not attached
        if (!this.attached) {
            return;
        }

        if (this._xrHitTestSource) {
            const results = frame.getHitTestResults(this._xrHitTestSource);
            if (results.length) {
                this.processWebXRHitTestResult(results);
            }
        }
        if (this._transientXrHitTestSource) {
            let hitTestResultsPerInputSource = frame.getHitTestResultsForTransientInput(this._transientXrHitTestSource);

            hitTestResultsPerInputSource.forEach((resultsPerInputSource) => {
                if (resultsPerInputSource.results.length > 0) {
                    this.processWebXRHitTestResult(resultsPerInputSource.results, resultsPerInputSource.inputSource);
                }
            });
        }
    }

    private processWebXRHitTestResult(hitTestResults: XRHitTestResult[], inputSource?: XRInputSource) {
        const results : IWebXRHitResult[] = [];
        hitTestResults.forEach((hitTestResult) => {
            const pose = hitTestResult.getPose(this._xrSessionManager.referenceSpace);
            if (!pose) {
                return;
            }
            this._tmpPos.copyFrom(pose.transform.position as unknown as Vector3);
            this._tmpQuat.copyFrom(pose.transform.orientation as unknown as Quaternion);
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                this._tmpPos.z *= -1;
                this._tmpQuat.z *= -1;
                this._tmpQuat.w *= -1;
                this._tmpMat.toggleModelMatrixHandInPlace();
            }

            const result: IWebXRHitResult = {
                position: this.autoCloneTransformation ? this._tmpPos.clone() : this._tmpPos,
                rotationQuaternion: this.autoCloneTransformation ? this._tmpQuat.clone() : this._tmpQuat,
                transformationMatrix: this.autoCloneTransformation ? this._tmpMat.clone() : this._tmpMat,
                inputSource: inputSource,
                isTransient: !!inputSource,
                xrHitResult: hitTestResult
            };
            results.push(result);
        });

        if (results.length) {
            this.onHitTestResultObservable.notifyObservers(results);
        }
    }
}

//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(WebXRHitTest.Name, (xrSessionManager, options) => {
    return () => new WebXRHitTest(xrSessionManager, options);
}, WebXRHitTest.Version, false);