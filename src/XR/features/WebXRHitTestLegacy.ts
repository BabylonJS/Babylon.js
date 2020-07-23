import { WebXRFeaturesManager, WebXRFeatureName, IWebXRFeature } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { Vector3, Matrix } from "../../Maths/math.vector";
import { TransformNode } from "../../Meshes/transformNode";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from '../../Misc';

// the plugin is registered at the end of the file

/**
 * An interface for all Hit test features
 */
export interface IWebXRHitTestFeature<T extends IWebXRLegacyHitResult> extends IWebXRFeature {
    /**
     * Triggered when new babylon (transformed) hit test results are available
     */
    onHitTestResultObservable: Observable<T[]>;
}

/**
 * Options used for hit testing
 */
export interface IWebXRLegacyHitTestOptions {
    /**
     * Only test when user interacted with the scene. Default - hit test every frame
     */
    testOnPointerDownOnly?: boolean;
    /**
     * The node to use to transform the local results to world coordinates
     */
    worldParentNode?: TransformNode;
}

/**
 * Interface defining the babylon result of raycasting/hit-test
 */
export interface IWebXRLegacyHitResult {
    /**
     * Transformation matrix that can be applied to a node that will put it in the hit point location
     */
    transformationMatrix: Matrix;
    /**
     * The native hit test result
     */
    xrHitResult: XRHitResult | XRHitTestResult;
}

/**
 * The currently-working hit-test module.
 * Hit test (or Ray-casting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 */
export class WebXRHitTestLegacy extends WebXRAbstractFeature implements IWebXRHitTestFeature<IWebXRLegacyHitResult> {
    // in XR space z-forward is negative
    private _direction = new Vector3(0, 0, -1);
    private _mat = new Matrix();
    private _onSelectEnabled = false;
    private _origin = new Vector3(0, 0, 0);

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.HIT_TEST;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Populated with the last native XR Hit Results
     */
    public lastNativeXRHitResults: XRHitResult[] = [];
    /**
     * Triggered when new babylon (transformed) hit test results are available
     */
    public onHitTestResultObservable: Observable<IWebXRLegacyHitResult[]> = new Observable();

    /**
     * Creates a new instance of the (legacy version) hit test feature
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRLegacyHitTestOptions = {}
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = 'hit-test';
        Tools.Warn('A newer version of this plugin is available');
    }

    /**
     * execute a hit test with an XR Ray
     *
     * @param xrSession a native xrSession that will execute this hit test
     * @param xrRay the ray (position and direction) to use for ray-casting
     * @param referenceSpace native XR reference space to use for the hit-test
     * @param filter filter function that will filter the results
     * @returns a promise that resolves with an array of native XR hit result in xr coordinates system
     */
    public static XRHitTestWithRay(xrSession: XRSession, xrRay: XRRay, referenceSpace: XRReferenceSpace, filter?: (result: XRHitResult) => boolean): Promise<XRHitResult[]> {
        return xrSession.requestHitTest(xrRay, referenceSpace).then((results) => {
            const filterFunction = filter || ((result) => !!result.hitMatrix);
            return results.filter(filterFunction);
        });
    }

    /**
     * Execute a hit test on the current running session using a select event returned from a transient input (such as touch)
     * @param event the (select) event to use to select with
     * @param referenceSpace the reference space to use for this hit test
     * @returns a promise that resolves with an array of native XR hit result in xr coordinates system
     */
    public static XRHitTestWithSelectEvent(event: XRInputSourceEvent, referenceSpace: XRReferenceSpace): Promise<XRHitResult[]> {
        let targetRayPose = event.frame.getPose(event.inputSource.targetRaySpace, referenceSpace);
        if (!targetRayPose) {
            return Promise.resolve([]);
        }
        let targetRay = new XRRay(targetRayPose.transform);

        return this.XRHitTestWithRay(event.frame.session, targetRay, referenceSpace);
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
        if (this.options.testOnPointerDownOnly) {
            this._xrSessionManager.session.addEventListener("select", this._onSelect, false);
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
        // disable select
        this._onSelectEnabled = false;
        this._xrSessionManager.session.removeEventListener("select", this._onSelect);
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
        if (!this.attached || this.options.testOnPointerDownOnly) {
            return;
        }
        let pose = frame.getViewerPose(this._xrSessionManager.referenceSpace);
        if (!pose) {
            return;
        }
        Matrix.FromArrayToRef(pose.transform.matrix, 0, this._mat);
        Vector3.TransformCoordinatesFromFloatsToRef(0, 0, 0, this._mat, this._origin);
        Vector3.TransformCoordinatesFromFloatsToRef(0, 0, -1, this._mat, this._direction);
        this._direction.subtractInPlace(this._origin);
        this._direction.normalize();
        let ray = new XRRay(<DOMPointReadOnly>{ x: this._origin.x, y: this._origin.y, z: this._origin.z, w: 0 }, <DOMPointReadOnly>{ x: this._direction.x, y: this._direction.y, z: this._direction.z, w: 0 });
        WebXRHitTestLegacy.XRHitTestWithRay(this._xrSessionManager.session, ray, this._xrSessionManager.referenceSpace).then(this._onHitTestResults);
    }

    private _onHitTestResults = (xrResults: XRHitResult[]) => {
        const mats = xrResults.map((result) => {
            let mat = Matrix.FromArray(result.hitMatrix);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            // if (this.options.coordinatesSpace === Space.WORLD) {
            if (this.options.worldParentNode) {
                mat.multiplyToRef(this.options.worldParentNode.getWorldMatrix(), mat);
            }
            return {
                xrHitResult: result,
                transformationMatrix: mat,
            };
        });

        this.lastNativeXRHitResults = xrResults;
        this.onHitTestResultObservable.notifyObservers(mats);
    };

    // can be done using pointerdown event, and xrSessionManager.currentFrame
    private _onSelect = (event: XRInputSourceEvent) => {
        if (!this._onSelectEnabled) {
            return;
        }
        WebXRHitTestLegacy.XRHitTestWithSelectEvent(event, this._xrSessionManager.referenceSpace);
    };
}

//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(
    WebXRHitTestLegacy.Name,
    (xrSessionManager, options) => {
        return () => new WebXRHitTestLegacy(xrSessionManager, options);
    },
    WebXRHitTestLegacy.Version,
    false
);
