import { WebXRFeature, WebXRFeaturesManager } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable } from '../../../Misc/observable';
import { Vector3, Matrix } from '../../../Maths/math';

const Name = "xr-hit-test";
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(Name, (xrSessionManager, options) => {
    return () => new WebXRHitTest(xrSessionManager, options);
});

export interface XRSession {

}

export interface WebXRHitTestOptions {
    testOnSelect?: boolean;
    parentObject?: Node;
}

export interface WebXRHitResult {

}

export class WebXRHitTest implements WebXRFeature {

    public static readonly Name = Name;

    public onHitTestResultObservable: Observable<Matrix[]> = new Observable();

    constructor(private xrSessionManager: WebXRSessionManager, private options: WebXRHitTestOptions = {}) {

    }

    readonly name: string = "ar-hit-test";

    private _onSelectEnabled = false;

    attachAsync(): Promise<boolean> {
        if (this.options.testOnSelect) {
            this.xrSessionManager.session.addEventListener('select', this.onSelect, false);
        } else {
            // we are in XR space!
            const origin = new Vector3(0, 0, 0);
            const direction = new Vector3(0, 0, -1);
            const mat = new Matrix();
            this.xrSessionManager.onXRFrameObservable.add((frame) => {
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
                this.requestHitTest(ray);
            });
        }

        return Promise.resolve(true);
    }
    detachAsync(): Promise<boolean> {
        // disable select
        this._onSelectEnabled = false;
        return Promise.resolve(true);
    }

    private requestHitTest(ray: XRRay) {
        this.xrSessionManager.session.requestHitTest(ray, this.xrSessionManager.referenceSpace).then((results) => {
            // convert to babylon world space and notify the matrices results
            const mats = results.map((result) => {
                let mat = Matrix.FromArray(result.hitMatrix);
                if (!this.xrSessionManager.scene.useRightHandedSystem) {
                    mat.toggleModelMatrixHandInPlace();
                }
                return mat;
            });
            this.onHitTestResultObservable.notifyObservers(mats);
        });
    }

    private onSelect = (event: XRInputSourceEvent) => {
        if (!this._onSelectEnabled) {
            return;
        }
        let targetRayPose = event.frame.getPose(event.inputSource.targetRaySpace, this.xrSessionManager.referenceSpace);
        if (!targetRayPose) {
            return;
        }
        let targetRay = new XRRay(targetRayPose.transform);
        this.requestHitTest(targetRay);
    }

    dispose(): void {
        this.xrSessionManager.session.removeEventListener('select', this.onSelect);
        this.onHitTestResultObservable.clear();
    }

}