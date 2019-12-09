import { WebXRFeature, WebXRFeaturesManager } from '../webXRFeaturesManager';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable, Observer } from '../../../Misc/observable';
import { Matrix } from '../../../Maths/math.vector';
import { TransformNode } from '../../../Meshes/transformNode';
import { Space } from '../../../Maths/math.axis';
import { WebXRPlaneDetector } from './WebXRPlaneDetector';
import { Nullable } from '../../../types';
import { WebXRHitTest } from './WebXRHitTest';

const Name = "xr-anchor-system";
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(Name, (xrSessionManager, options) => {
    return () => new WebXRAnchorSystem(xrSessionManager, options);
});

export interface WebXRAnchorSystemOptions {
    worldParentNode?: TransformNode;
    coordinatesSpace?: Space;
    usePlaneDetection?: boolean;
    addAnchorOnSelect?: boolean;
}

export interface WebXRAnchor {
    id: number;
    xrAnchor: XRAnchor;
    transformationMatrix: Matrix;
}

let anchorIdProvider = 0;

export class WebXRAnchorSystem implements WebXRFeature {

    public static Name = Name;

    public onAnchorAddedObservable: Observable<WebXRAnchor> = new Observable();
    public onAnchorUpdatedObservable: Observable<WebXRAnchor> = new Observable();
    public onAnchorRemovedObservable: Observable<WebXRAnchor> = new Observable();

    private _planeDetector: WebXRPlaneDetector;
    private _hitTestModule: WebXRHitTest;

    private _enabled: boolean = false;
    private _attached: boolean = false;
    private _trackedAnchors: Array<WebXRAnchor> = [];
    private _lastFrameDetected: XRAnchorSet = new Set();
    private _observerTracked: Nullable<Observer<XRFrame>>;

    constructor(private xrSessionManager: WebXRSessionManager, private options: WebXRAnchorSystemOptions = {}) {
    }

    public setPlaneDetector(planeDetector: WebXRPlaneDetector, enable: boolean = true) {
        this._planeDetector = planeDetector;
        this.options.usePlaneDetection = enable;
    }

    public setHitTestModule(hitTestModule: WebXRHitTest) {
        this._hitTestModule = hitTestModule;
    }

    attach(): boolean {
        this._observerTracked = this.xrSessionManager.onXRFrameObservable.add(() => {
            const frame = this.xrSessionManager.currentFrame;
            if (!this._attached || !this._enabled || !frame) { return; }
            // const timestamp = this.xrSessionManager.currentTimestamp;

            const trackedAnchors = frame.trackedAnchors;
            if (trackedAnchors && trackedAnchors.size) {
                this._trackedAnchors.filter((anchor) => !trackedAnchors.has(anchor.xrAnchor)).map((anchor) => {
                    const index = this._trackedAnchors.indexOf(anchor);
                    this._trackedAnchors.splice(index, 1);
                    this.onAnchorRemovedObservable.notifyObservers(anchor);
                });
                // now check for new ones
                trackedAnchors.forEach((xrAnchor) => {
                    if (!this._lastFrameDetected.has(xrAnchor)) {
                        const newAnchor: Partial<WebXRAnchor> = {
                            id: anchorIdProvider++,
                            xrAnchor: xrAnchor
                        };
                        const plane = this.updateAnchorWithXRFrame(xrAnchor, newAnchor, frame);
                        this._trackedAnchors.push(plane);
                        this.onAnchorAddedObservable.notifyObservers(plane);
                    } else {
                        // updated?
                        if (xrAnchor.lastChangedTime === this.xrSessionManager.currentTimestamp) {
                            let index = this.findIndexInAnchorArray(xrAnchor);
                            const anchor = this._trackedAnchors[index];
                            this.updateAnchorWithXRFrame(xrAnchor, anchor, frame);
                            this.onAnchorUpdatedObservable.notifyObservers(anchor);
                        }
                    }
                });
                this._lastFrameDetected = trackedAnchors;
            }
        });

        if (this.options.addAnchorOnSelect) {
            this.xrSessionManager.session.addEventListener('select', this.onSelect, false);
        }

        this._attached = true;
        return true;
    }

    detach(): boolean {
        this._attached = false;

        this.xrSessionManager.session.removeEventListener('select', this.onSelect);

        if (this._observerTracked) {
            this.xrSessionManager.onXRFrameObservable.remove(this._observerTracked);
        }

        return true;
    }

    dispose(): void {
        this.detach();
        this.onAnchorAddedObservable.clear();
        this.onAnchorRemovedObservable.clear();
        this.onAnchorUpdatedObservable.clear();
    }

    private onSelect = (event: XRInputSourceEvent) => {
        if (!this.options.addAnchorOnSelect) {
            return;
        }
        const onResults = (results: XRHitResult[]) => {
            if (results.length) {
                const hitResult = results[0];
                const transform = new XRRigidTransform(hitResult.hitMatrix);
                this.addAnchorAtRigidTransformation(transform, hitResult.plane);
            }
        };

        // avoid the hit-test, if the hit-test module is defined
        if (this._hitTestModule && !this._hitTestModule.options.testOnPointerDownOnly) {
            onResults(this._hitTestModule.lastNativeXRHitResults);
        }
        WebXRHitTest.XRHitTestWithSelectEvent(event, this.xrSessionManager.referenceSpace).then(onResults);
    }

    public addAnchorAtRigidTransformation(xrRigidTransformation: XRRigidTransform, anchorCreator?: XRAnchorCreator) {
        const creator = anchorCreator || this.xrSessionManager.session;
        return creator.createAnchor(xrRigidTransformation, this.xrSessionManager.referenceSpace);
    }

    private updateAnchorWithXRFrame(xrAnchor: XRAnchor, anchor: Partial<WebXRAnchor>, xrFrame: XRFrame): WebXRAnchor {
        // matrix
        const pose = xrFrame.getPose(xrAnchor.anchorSpace, this.xrSessionManager.referenceSpace);
        if (pose) {
            const mat = anchor.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this.xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            anchor.transformationMatrix = mat;
            if (!this.options.worldParentNode) {
                // Logger.Warn("Please provide a world parent node to apply world transformation");
            } else {
                mat.multiplyToRef(this.options.worldParentNode.getWorldMatrix(), mat);
            }
        }

        return <WebXRAnchor>anchor;
    }

    /**
     * avoiding using Array.find for global support.
     * @param xrAnchor the plane to find in the array
     */
    private findIndexInAnchorArray(xrAnchor: XRAnchor) {
        for (let i = 0; i < this._trackedAnchors.length; ++i) {
            if (this._trackedAnchors[i].xrAnchor === xrAnchor) {
                return i;
            }
        }
        return -1;
    }

}