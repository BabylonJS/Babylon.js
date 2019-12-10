import { WebXRFeature, WebXRFeaturesManager } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable, Observer } from '../../../Misc/observable';
import { Vector3, Matrix } from '../../../Maths/math.vector';
import { TransformNode } from '../../../Meshes/transformNode';
import { Nullable } from '../../../types';

/**
 * name of module (can be reused with other versions)
 */
const WebXRHitTestModuleName = "xr-hit-test";

// the plugin is registered at the end of the file

/**
 * Options used for hit testing
 */
export interface WebXRHitTestOptions {
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
export interface WebXRHitResult {
    /**
     * The native hit test result
     */
    xrHitResult: XRHitResult;
    /**
     * Transformation matrix that can be applied to a node that will put it in the hit point location
     */
    transformationMatrix: Matrix;
}

/**
 * The currently-working hit-test module.
 * Hit test (or raycasting) is used to interact with the real world.
 * For further information read here - https://github.com/immersive-web/hit-test
 */
export class WebXRHitTestLegacy implements WebXRFeature {

    /**
     * The module's name
     */
    public static readonly Name = WebXRHitTestModuleName;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the webxr specs version
     */
    public static readonly Version = 1;

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
     * execute a hit test with an XR Ray
     *
     * @param xrSession a native xrSession that will execute this hit test
     * @param xrRay the ray (position and direction) to use for raycasting
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
     * Triggered when new babylon (transformed) hit test results are available
     */
    public onHitTestResultObservable: Observable<WebXRHitResult[]> = new Observable();

    /**
     * Creates a new instance of the (legacy version) hit test feature
     * @param xrSessionManager an instance of WebXRSessionManager
     * @param options options to use when constructing this feature
     */
    constructor(private xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: WebXRHitTestOptions = {}) { }

    private _onSelectEnabled = false;
    private _xrFrameObserver: Nullable<Observer<XRFrame>>;
    private _attached: boolean = false;

    /**
     * Populated with the last native XR Hit Results
     */
    public lastNativeXRHitResults: XRHitResult[] = [];

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    attach(): boolean {
        if (this.options.testOnPointerDownOnly) {
            this.xrSessionManager.session.addEventListener('select', this.onSelect, false);
        } else {
            // we are in XR space!
            const origin = new Vector3(0, 0, 0);
            // in XR space z-forward is negative
            const direction = new Vector3(0, 0, -1);
            const mat = new Matrix();
            this._xrFrameObserver = this.xrSessionManager.onXRFrameObservable.add((frame) => {
                // make sure we do nothing if (async) not attached
                if (!this._attached) {
                    return;
                }
                let pose = frame.getViewerPose(this.xrSessionManager.referenceSpace);
                if (!pose) {
                    return;
                }
                Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
                Vector3.TransformCoordinatesFromFloatsToRef(0, 0, 0, mat, origin);
                Vector3.TransformCoordinatesFromFloatsToRef(0, 0, -1, mat, direction);
                direction.subtractInPlace(origin);
                direction.normalize();
                let ray = new XRRay((<DOMPointReadOnly>{ x: origin.x, y: origin.y, z: origin.z, w: 0 }),
                    (<DOMPointReadOnly>{ x: direction.x, y: direction.y, z: direction.z, w: 0 }));
                WebXRHitTestLegacy.XRHitTestWithRay(this.xrSessionManager.session, ray, this.xrSessionManager.referenceSpace).then(this.onHitTestResults);
            });
        }
        this._attached = true;

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    detach(): boolean {
        // disable select
        this._onSelectEnabled = false;
        this.xrSessionManager.session.removeEventListener('select', this.onSelect);
        if (this._xrFrameObserver) {
            this.xrSessionManager.onXRFrameObservable.remove(this._xrFrameObserver);
            this._xrFrameObserver = null;
        }
        this._attached = false;
        return true;
    }

    private onHitTestResults = (xrResults: XRHitResult[]) => {
        const mats = xrResults.map((result) => {
            let mat = Matrix.FromArray(result.hitMatrix);
            if (!this.xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            // if (this.options.coordinatesSpace === Space.WORLD) {
            if (this.options.worldParentNode) {
                mat.multiplyToRef(this.options.worldParentNode.getWorldMatrix(), mat);
            }
            return {
                xrHitResult: result,
                transformationMatrix: mat
            };
        });

        this.lastNativeXRHitResults = xrResults;
        this.onHitTestResultObservable.notifyObservers(mats);
    }

    // can be done using pointerdown event, and xrSessionManager.currentFrame
    private onSelect = (event: XRInputSourceEvent) => {
        if (!this._onSelectEnabled) {
            return;
        }
        WebXRHitTestLegacy.XRHitTestWithSelectEvent(event, this.xrSessionManager.referenceSpace);
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    dispose(): void {
        this.detach();
        this.onHitTestResultObservable.clear();
    }
}

//register the plugin versions
WebXRFeaturesManager.AddWebXRFeature(WebXRHitTestLegacy.Name, (xrSessionManager, options) => {
    return () => new WebXRHitTestLegacy(xrSessionManager, options);
}, WebXRHitTestLegacy.Version, true);