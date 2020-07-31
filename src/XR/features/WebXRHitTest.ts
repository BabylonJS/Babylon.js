import { WebXRFeaturesManager, WebXRFeatureName } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable } from '../../Misc/observable';
import { Vector3, Matrix, Quaternion } from '../../Maths/math.vector';
import { WebXRAbstractFeature } from './WebXRAbstractFeature';
import { IWebXRLegacyHitTestOptions, IWebXRLegacyHitResult } from './WebXRHitTestLegacy';
import { Tools } from '../../Misc/tools';

/**
 * Options used for hit testing (version 2)
 */
export interface IWebXRHitTestOptions extends IWebXRLegacyHitTestOptions {
    /**
     * Do not create a permanent hit test. Will usually be used when only
     * transient inputs are needed.
     */
    disablePermanentHitTest?: boolean;
    /**
     * Enable transient (for example touch-based) hit test inspections
     */
    enableTransientHitTest?: boolean;
    /**
     * Offset ray for the permanent hit test
     */
    offsetRay?: Vector3;
    /**
     * Offset ray for the transient hit test
     */
    transientOffsetRay?: Vector3;
    /**
     * Instead of using viewer space for hit tests, use the reference space defined in the session manager
     */
    useReferenceSpace?: boolean;
}

/**
 * Interface defining the babylon result of hit-test
 */
export interface IWebXRHitResult extends IWebXRLegacyHitResult {
    /**
     * The input source that generated this hit test (if transient)
     */
    inputSource?: XRInputSource;
    /**
     * Is this a transient hit test
     */
    isTransient?: boolean;
    /**
     * Position of the hit test result
     */
    position: Vector3;
    /**
     * Rotation of the hit test result
     */
    rotationQuaternion: Quaternion;
}

/**
 * The currently-working hit-test module.
 * Hit test (or Ray-casting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 *
 * Tested on chrome (mobile) 80.
 */
export class WebXRHitTest extends WebXRAbstractFeature {
    private _tmpMat: Matrix = new Matrix();
    private _tmpPos: Vector3 = new Vector3();
    private _tmpQuat: Quaternion = new Quaternion();
    private _transientXrHitTestSource: XRTransientInputHitTestSource;
    // in XR space z-forward is negative
    private _xrHitTestSource: XRHitTestSource;
    private initHitTestSource = (referenceSpace: XRReferenceSpace) => {
        if (!referenceSpace) {
            return;
        }
        const offsetRay = new XRRay(this.options.offsetRay || {});
        const options: XRHitTestOptionsInit = {
            space: this.options.useReferenceSpace ? referenceSpace : this._xrSessionManager.viewerReferenceSpace,
            offsetRay: offsetRay
        };
        if (!options.space) {
            Tools.Warn('waiting for viewer reference space to initialize');
            return;
        }
        this._xrSessionManager.session.requestHitTestSource(options).then((hitTestSource) => {
            if (this._xrHitTestSource) {
                this._xrHitTestSource.cancel();
            }
            this._xrHitTestSource = hitTestSource;
        });
    }

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
     * When set to true, each hit test will have its own position/rotation objects
     * When set to false, position and rotation objects will be reused for each hit test. It is expected that
     * the developers will clone them or copy them as they see fit.
     */
    public autoCloneTransformation: boolean = false;
    /**
     * Populated with the last native XR Hit Results
     */
    public lastNativeXRHitResults: XRHitResult[] = [];
    /**
     * Triggered when new babylon (transformed) hit test results are available
     */
    public onHitTestResultObservable: Observable<IWebXRHitResult[]> = new Observable();
    /**
     * Use this to temporarily pause hit test checks.
     */
    public paused: boolean = false;

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
        Tools.Warn('Hit test is an experimental and unstable feature. make sure you enable optionalFeatures when creating the XR session');
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

        if (!this.options.disablePermanentHitTest) {
            if (this._xrSessionManager.referenceSpace) {
                this.initHitTestSource(this._xrSessionManager.referenceSpace);
            }
            this._xrSessionManager.onXRReferenceSpaceChanged.add(this.initHitTestSource);
        }
        if (this.options.enableTransientHitTest) {
            const offsetRay = new XRRay(this.options.transientOffsetRay || {});
            this._xrSessionManager.session.requestHitTestSourceForTransientInput({
                profile : 'generic-touchscreen',
                offsetRay
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
        if (this._xrHitTestSource) {
            this._xrHitTestSource.cancel();
        }
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
        if (!this.attached || this.paused) {
            return;
        }

        if (this._xrHitTestSource) {
            const results = frame.getHitTestResults(this._xrHitTestSource);
            if (results.length) {
                this._processWebXRHitTestResult(results);
            }
        }
        if (this._transientXrHitTestSource) {
            let hitTestResultsPerInputSource = frame.getHitTestResultsForTransientInput(this._transientXrHitTestSource);

            hitTestResultsPerInputSource.forEach((resultsPerInputSource) => {
                if (resultsPerInputSource.results.length > 0) {
                    this._processWebXRHitTestResult(resultsPerInputSource.results, resultsPerInputSource.inputSource);
                }
            });
        }
    }

    private _processWebXRHitTestResult(hitTestResults: XRHitTestResult[], inputSource?: XRInputSource) {
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