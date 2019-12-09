import { WebXRFeaturesManager, WebXRFeature } from '../webXRFeaturesManager';
import { TransformNode } from '../../../Meshes/transformNode';
import { WebXRSessionManager } from '../webXRSessionManager';
import { Observable, Observer } from '../../../Misc/observable';
import { Vector3, Matrix } from '../../../Maths/math.vector';
import { Nullable } from '../../../types';

const Name = "xr-plane-detector";
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(Name, (xrSessionManager, options) => {
    return () => new WebXRPlaneDetector(xrSessionManager, options);
});

export interface WebXRPlaneDetectorOptions {
    worldParentNode?: TransformNode;
    // coordinatesSpace?: Space;
}

export interface WebXRPlane {
    id: number;
    xrPlane: XRPlane;
    polygonDefinition: Array<Vector3>;
    transformationMatrix: Matrix;
}

let planeIdProvider = 0;

export class WebXRPlaneDetector implements WebXRFeature {

    public static Name = Name;

    public onPlaneAddedObservable: Observable<WebXRPlane> = new Observable();
    public onPlaneRemovedObservable: Observable<WebXRPlane> = new Observable();
    public onPlaneUpdatedObservable: Observable<WebXRPlane> = new Observable();

    private _enabled: boolean = false;
    private _attached: boolean = false;
    private _detectedPlanes: Array<WebXRPlane> = [];
    private _lastFrameDetected: XRPlaneSet = new Set();
    private _observerTracked: Nullable<Observer<XRFrame>>;

    constructor(private xrSessionManager: WebXRSessionManager, private options: WebXRPlaneDetectorOptions = {}) {
        if (this.xrSessionManager.session) {
            this.xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
            this._enabled = true;
        } else {
            this.xrSessionManager.onXRSessionInit.addOnce(() => {
                this.xrSessionManager.session.updateWorldTrackingState({ planeDetectionState: { enabled: true } });
                this._enabled = true;
            });
        }
    }

    attach(): boolean {

        this._observerTracked = this.xrSessionManager.onXRFrameObservable.add(() => {
            const frame = this.xrSessionManager.currentFrame;
            if (!this._attached || !this._enabled || !frame) { return; }
            // const timestamp = this.xrSessionManager.currentTimestamp;

            const detectedPlanes = frame.worldInformation.detectedPlanes;
            if (detectedPlanes && detectedPlanes.size) {
                this._detectedPlanes.filter((plane) => !detectedPlanes.has(plane.xrPlane)).map((plane) => {
                    const index = this._detectedPlanes.indexOf(plane);
                    this._detectedPlanes.splice(index, 1);
                    this.onPlaneRemovedObservable.notifyObservers(plane);
                });
                // now check for new ones
                detectedPlanes.forEach((xrPlane) => {
                    if (!this._lastFrameDetected.has(xrPlane)) {
                        const newPlane: Partial<WebXRPlane> = {
                            id: planeIdProvider++,
                            xrPlane: xrPlane,
                            polygonDefinition: []
                        };
                        const plane = this.updatePlaneWithXRPlane(xrPlane, newPlane, frame);
                        this._detectedPlanes.push(plane);
                        this.onPlaneAddedObservable.notifyObservers(plane);
                    } else {
                        // updated?
                        if (xrPlane.lastChangedTime === this.xrSessionManager.currentTimestamp) {
                            let index = this.findIndexInPlaneArray(xrPlane);
                            const plane = this._detectedPlanes[index];
                            this.updatePlaneWithXRPlane(xrPlane, plane, frame);
                            this.onPlaneUpdatedObservable.notifyObservers(plane);
                        }
                    }
                });
                this._lastFrameDetected = detectedPlanes;
            }
        });

        this._attached = true;
        return true;
    }
    detach(): boolean {
        this._attached = false;

        if (this._observerTracked) {
            this.xrSessionManager.onXRFrameObservable.remove(this._observerTracked);
        }

        return true;
    }

    dispose(): void {
        this.detach();
        this.onPlaneAddedObservable.clear();
        this.onPlaneRemovedObservable.clear();
        this.onPlaneUpdatedObservable.clear();
    }

    private updatePlaneWithXRPlane(xrPlane: XRPlane, plane: Partial<WebXRPlane>, xrFrame: XRFrame): WebXRPlane {
        plane.polygonDefinition = xrPlane.polygon.map((xrPoint) => {
            const rightHandedSystem = this.xrSessionManager.scene.useRightHandedSystem ? 1 : -1;
            return new Vector3(xrPoint.x, xrPoint.y, xrPoint.z * rightHandedSystem);
        });
        // matrix
        const pose = xrFrame.getPose(xrPlane.planeSpace, this.xrSessionManager.referenceSpace);
        if (pose) {
            const mat = plane.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this.xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            plane.transformationMatrix = mat;
            //if (this.options.coordinatesSpace === Space.WORLD) {
            if (!this.options.worldParentNode) {
                // Logger.Warn("Please provide a world parent node to apply world transformation");
            } else {
                mat.multiplyToRef(this.options.worldParentNode.getWorldMatrix(), mat);
            }
            //}
        }
        /*if (!this.options.dontCreatePolygon) {
            let mat;
            if (plane.mesh) {
                mat = plane.mesh.material;
                plane.mesh.dispose(false, false);
            } //else {
            plane.polygonDefinition.push(plane.polygonDefinition[0]);
            plane.mesh = TubeBuilder.CreateTube("tube", { path: plane.polygonDefinition, radius: 0.01, sideOrientation: Mesh.FRONTSIDE, updatable: true }, this.xrSessionManager.scene);
            //}
            if (!mat) {
                mat = new StandardMaterial("mat", this.xrSessionManager.scene);
                mat.alpha = 0.5;
                (<StandardMaterial>mat).diffuseColor = Color3.Random();
            }
            plane.mesh.material = mat;

            plane.mesh.rotationQuaternion = new Quaternion();
            plane.transformMatrix!.decompose(plane.mesh.scaling, plane.mesh.rotationQuaternion, plane.mesh.position);
            if (this.options.worldParentNode) {
                plane.mesh.parent = this.options.worldParentNode;
            }
        }*/
        return <WebXRPlane>plane;
    }

    /**
     * avoiding using Array.find for global support.
     * @param xrPlane the plane to find in the array
     */
    private findIndexInPlaneArray(xrPlane: XRPlane) {
        for (let i = 0; i < this._detectedPlanes.length; ++i) {
            if (this._detectedPlanes[i].xrPlane === xrPlane) {
                return i;
            }
        }
        return -1;
    }
}