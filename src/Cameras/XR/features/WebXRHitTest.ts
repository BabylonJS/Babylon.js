import { WebXRFeature, WebXRFeaturesManager } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable, Observer } from '../../../Misc/observable';
import { Vector3, Matrix } from '../../../Maths/math.vector';
import { TransformNode } from '../../../Meshes/transformNode';
import { Nullable } from '../../../types';

const Name = "xr-hit-test";
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(Name, (xrSessionManager, options) => {
    return () => new WebXRHitTest(xrSessionManager, options);
});

export interface WebXRHitTestOptions {
    testOnPointerDownOnly?: boolean;
    worldParentNode?: TransformNode;
    // coordinatesSpace?: Space;
}

export interface WebXRHitResult {
    xrHitResult: XRHitResult;
    transformationMatrix: Matrix;
}

export type WebXRHitResults = WebXRHitResult[];

export class WebXRHitTest implements WebXRFeature {

    public static readonly Name = Name;

    public static XRHitTestWithSelectEvent(event: XRInputSourceEvent, referenceSpace: XRReferenceSpace): Promise<XRHitResult[]> {
        let targetRayPose = event.frame.getPose(event.inputSource.targetRaySpace, referenceSpace);
        if (!targetRayPose) {
            return Promise.resolve([]);
        }
        let targetRay = new XRRay(targetRayPose.transform);

        return this.XRHitTestWithRay(event.frame.session, targetRay, referenceSpace);
    }

    public static XRHitTestWithRay(xrSession: XRSession, xrRay: XRRay, referenceSpace: XRReferenceSpace): Promise<XRHitResult[]> {
        return xrSession.requestHitTest(xrRay, referenceSpace);
    }

    public onHitTestResultObservable: Observable<WebXRHitResults> = new Observable();

    constructor(private xrSessionManager: WebXRSessionManager, public readonly options: WebXRHitTestOptions = {}) {

    }

    private _onSelectEnabled = false;
    private _xrFrameObserver: Nullable<Observer<XRFrame>>;

    public lastNativeXRHitResults: XRHitResult[] = [];

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
                WebXRHitTest.XRHitTestWithRay(this.xrSessionManager.session, ray, this.xrSessionManager.referenceSpace).then(this.onHitTestResults);
            });
        }

        return true;
    }
    detach(): boolean {
        // disable select
        this._onSelectEnabled = false;
        this.xrSessionManager.session.removeEventListener('select', this.onSelect);
        if (this._xrFrameObserver) {
            this.xrSessionManager.onXRFrameObservable.remove(this._xrFrameObserver);
            this._xrFrameObserver = null;
        }
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
        WebXRHitTest.XRHitTestWithSelectEvent(event, this.xrSessionManager.referenceSpace);
    }

    dispose(): void {
        this.detach();
        this.onHitTestResultObservable.clear();
    }
}