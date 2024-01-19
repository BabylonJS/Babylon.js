import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable";
import { Matrix, Vector3, Quaternion } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes/transformNode";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { IWebXRHitResult } from "./WebXRHitTest";
import { Tools } from "../../Misc/tools";

/**
 * Configuration options of the anchor system
 */
export interface IWebXRAnchorSystemOptions {
    /**
     * a node that will be used to convert local to world coordinates
     */
    worldParentNode?: TransformNode;

    /**
     * If set to true a reference of the created anchors will be kept until the next session starts
     * If not defined, anchors will be removed from the array when the feature is detached or the session ended.
     */
    doNotRemoveAnchorsOnSessionEnded?: boolean;
}

/**
 * A babylon container for an XR Anchor
 */
export interface IWebXRAnchor {
    /**
     * A babylon-assigned ID for this anchor
     */
    id: number;
    /**
     * Transformation matrix to apply to an object attached to this anchor
     */
    transformationMatrix: Matrix;
    /**
     * The native anchor object
     */
    xrAnchor: XRAnchor;

    /**
     * if defined, this object will be constantly updated by the anchor's position and rotation
     */
    attachedNode?: TransformNode;

    /**
     * Remove this anchor from the scene
     */
    remove(): void;
}

/**
 * An internal interface for a future (promise based) anchor
 */
interface IWebXRFutureAnchor {
    /**
     * The native anchor
     */
    nativeAnchor?: XRAnchor;
    /**
     * Was this request submitted to the xr frame?
     */
    submitted: boolean;
    /**
     * Was this promise resolved already?
     */
    resolved: boolean;
    /**
     * A resolve function
     */
    resolve: (xrAnchor: IWebXRAnchor) => void;
    /**
     * A reject function
     */
    reject: (msg?: string) => void;
    /**
     * The XR Transformation of the future anchor
     */
    xrTransformation: XRRigidTransform;
}

let anchorIdProvider = 0;

/**
 * An implementation of the anchor system for WebXR.
 * For further information see https://github.com/immersive-web/anchors/
 */
export class WebXRAnchorSystem extends WebXRAbstractFeature {
    private _lastFrameDetected: XRAnchorSet = new Set();

    private _trackedAnchors: Array<IWebXRAnchor> = [];

    private _referenceSpaceForFrameAnchors: XRReferenceSpace;

    private _futureAnchors: IWebXRFutureAnchor[] = [];

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.ANCHOR_SYSTEM;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Observers registered here will be executed when a new anchor was added to the session
     */
    public onAnchorAddedObservable: Observable<IWebXRAnchor> = new Observable();
    /**
     * Observers registered here will be executed when an anchor was removed from the session
     */
    public onAnchorRemovedObservable: Observable<IWebXRAnchor> = new Observable();
    /**
     * Observers registered here will be executed when an existing anchor updates
     * This can execute N times every frame
     */
    public onAnchorUpdatedObservable: Observable<IWebXRAnchor> = new Observable();

    /**
     * Set the reference space to use for anchor creation, when not using a hit test.
     * Will default to the session's reference space if not defined
     */
    public set referenceSpaceForFrameAnchors(referenceSpace: XRReferenceSpace) {
        this._referenceSpaceForFrameAnchors = referenceSpace;
    }

    /**
     * constructs a new anchor system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param _options configuration object for this feature
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        private _options: IWebXRAnchorSystemOptions = {}
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "anchors";
    }

    private _tmpVector = new Vector3();
    private _tmpQuaternion = new Quaternion();

    private _populateTmpTransformation(position: Vector3, rotationQuaternion: Quaternion) {
        this._tmpVector.copyFrom(position);
        this._tmpQuaternion.copyFrom(rotationQuaternion);
        if (!this._xrSessionManager.scene.useRightHandedSystem) {
            this._tmpVector.z *= -1;
            this._tmpQuaternion.z *= -1;
            this._tmpQuaternion.w *= -1;
        }
        return {
            position: this._tmpVector,
            rotationQuaternion: this._tmpQuaternion,
        };
    }

    /**
     * Create a new anchor point using a hit test result at a specific point in the scene
     * An anchor is tracked only after it is added to the trackerAnchors in xrFrame. The promise returned here does not yet guaranty that.
     * Use onAnchorAddedObservable to get newly added anchors if you require tracking guaranty.
     *
     * @param hitTestResult The hit test result to use for this anchor creation
     * @param position an optional position offset for this anchor
     * @param rotationQuaternion an optional rotation offset for this anchor
     * @returns A promise that fulfills when babylon has created the corresponding WebXRAnchor object and tracking has begun
     */
    public async addAnchorPointUsingHitTestResultAsync(
        hitTestResult: IWebXRHitResult,
        position: Vector3 = new Vector3(),
        rotationQuaternion: Quaternion = new Quaternion()
    ): Promise<IWebXRAnchor> {
        // convert to XR space (right handed) if needed
        this._populateTmpTransformation(position, rotationQuaternion);
        // the matrix that we'll use
        const m = new XRRigidTransform(
            { x: this._tmpVector.x, y: this._tmpVector.y, z: this._tmpVector.z },
            { x: this._tmpQuaternion.x, y: this._tmpQuaternion.y, z: this._tmpQuaternion.z, w: this._tmpQuaternion.w }
        );
        if (!hitTestResult.xrHitResult.createAnchor) {
            this.detach();
            throw new Error("Anchors not enabled in this environment/browser");
        } else {
            try {
                const nativeAnchor = await hitTestResult.xrHitResult.createAnchor(m);
                return new Promise<IWebXRAnchor>((resolve, reject) => {
                    this._futureAnchors.push({
                        nativeAnchor,
                        resolved: false,
                        submitted: true,
                        xrTransformation: m,
                        resolve,
                        reject,
                    });
                });
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    /**
     * Add a new anchor at a specific position and rotation
     * This function will add a new anchor per default in the next available frame. Unless forced, the createAnchor function
     * will be called in the next xrFrame loop to make sure that the anchor can be created correctly.
     * An anchor is tracked only after it is added to the trackerAnchors in xrFrame. The promise returned here does not yet guaranty that.
     * Use onAnchorAddedObservable to get newly added anchors if you require tracking guaranty.
     *
     * @param position the position in which to add an anchor
     * @param rotationQuaternion an optional rotation for the anchor transformation
     * @param forceCreateInCurrentFrame force the creation of this anchor in the current frame. Must be called inside xrFrame loop!
     * @returns A promise that fulfills when babylon has created the corresponding WebXRAnchor object and tracking has begun
     */
    public async addAnchorAtPositionAndRotationAsync(
        position: Vector3,
        rotationQuaternion: Quaternion = new Quaternion(),
        forceCreateInCurrentFrame = false
    ): Promise<IWebXRAnchor> {
        // convert to XR space (right handed) if needed
        this._populateTmpTransformation(position, rotationQuaternion);
        // the matrix that we'll use
        const xrTransformation = new XRRigidTransform(
            { x: this._tmpVector.x, y: this._tmpVector.y, z: this._tmpVector.z },
            { x: this._tmpQuaternion.x, y: this._tmpQuaternion.y, z: this._tmpQuaternion.z, w: this._tmpQuaternion.w }
        );
        const xrAnchor =
            forceCreateInCurrentFrame && this.attached && this._xrSessionManager.currentFrame
                ? await this._createAnchorAtTransformation(xrTransformation, this._xrSessionManager.currentFrame)
                : undefined;
        // add the transformation to the future anchors list
        return new Promise<IWebXRAnchor>((resolve, reject) => {
            this._futureAnchors.push({
                nativeAnchor: xrAnchor,
                resolved: false,
                submitted: false,
                xrTransformation,
                resolve,
                reject,
            });
        });
    }

    /**
     * Get the list of anchors currently being tracked by the system
     */
    public get anchors(): IWebXRAnchor[] {
        return this._trackedAnchors;
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

        if (!this._options.doNotRemoveAnchorsOnSessionEnded) {
            while (this._trackedAnchors.length) {
                const toRemove = this._trackedAnchors.pop();
                if (toRemove) {
                    try {
                        // try to natively remove it as well
                        toRemove.remove();
                    } catch (e) {
                        // no-op
                    }
                    // as the xr frame loop is removed, we need to notify manually
                    this.onAnchorRemovedObservable.notifyObservers(toRemove);
                }
            }
        }

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        this._futureAnchors.length = 0;
        super.dispose();
        this.onAnchorAddedObservable.clear();
        this.onAnchorRemovedObservable.clear();
        this.onAnchorUpdatedObservable.clear();
    }

    protected _onXRFrame(frame: XRFrame) {
        if (!this.attached || !frame) {
            return;
        }

        const trackedAnchors = frame.trackedAnchors;
        if (trackedAnchors) {
            const toRemove = this._trackedAnchors
                .filter((anchor) => !trackedAnchors.has(anchor.xrAnchor))
                .map((anchor) => {
                    const index = this._trackedAnchors.indexOf(anchor);
                    return index;
                });
            let idxTracker = 0;
            toRemove.forEach((index) => {
                const anchor = this._trackedAnchors.splice(index - idxTracker, 1)[0];
                this.onAnchorRemovedObservable.notifyObservers(anchor);
                idxTracker++;
            });
            // now check for new ones
            trackedAnchors.forEach((xrAnchor) => {
                if (!this._lastFrameDetected.has(xrAnchor)) {
                    const newAnchor: Partial<IWebXRAnchor> = {
                        id: anchorIdProvider++,
                        xrAnchor: xrAnchor,
                        remove: () => xrAnchor.delete(),
                    };
                    const anchor = this._updateAnchorWithXRFrame(xrAnchor, newAnchor, frame);
                    this._trackedAnchors.push(anchor);
                    this.onAnchorAddedObservable.notifyObservers(anchor);
                    // search for the future anchor promise that matches this
                    const results = this._futureAnchors.filter((futureAnchor) => futureAnchor.nativeAnchor === xrAnchor);
                    const result = results[0];
                    if (result) {
                        result.resolve(anchor);
                        result.resolved = true;
                    }
                } else {
                    const index = this._findIndexInAnchorArray(xrAnchor);
                    const anchor = this._trackedAnchors[index];
                    try {
                        // anchors update every frame
                        this._updateAnchorWithXRFrame(xrAnchor, anchor, frame);
                        if (anchor.attachedNode) {
                            anchor.attachedNode.rotationQuaternion = anchor.attachedNode.rotationQuaternion || new Quaternion();
                            anchor.transformationMatrix.decompose(anchor.attachedNode.scaling, anchor.attachedNode.rotationQuaternion, anchor.attachedNode.position);
                        }
                        this.onAnchorUpdatedObservable.notifyObservers(anchor);
                    } catch (e) {
                        Tools.Warn(`Anchor could not be updated`);
                    }
                }
            });
            this._lastFrameDetected = trackedAnchors;
        }

        // process future anchors
        this._futureAnchors.forEach((futureAnchor) => {
            if (!futureAnchor.resolved && !futureAnchor.submitted) {
                this._createAnchorAtTransformation(futureAnchor.xrTransformation, frame).then(
                    (nativeAnchor) => {
                        futureAnchor.nativeAnchor = nativeAnchor;
                    },
                    (error) => {
                        futureAnchor.resolved = true;
                        futureAnchor.reject(error);
                    }
                );
                futureAnchor.submitted = true;
            }
        });
    }

    /**
     * avoiding using Array.find for global support.
     * @param xrAnchor the plane to find in the array
     * @returns the index of the anchor in the array or -1 if not found
     */
    private _findIndexInAnchorArray(xrAnchor: XRAnchor) {
        for (let i = 0; i < this._trackedAnchors.length; ++i) {
            if (this._trackedAnchors[i].xrAnchor === xrAnchor) {
                return i;
            }
        }
        return -1;
    }

    private _updateAnchorWithXRFrame(xrAnchor: XRAnchor, anchor: Partial<IWebXRAnchor>, xrFrame: XRFrame): IWebXRAnchor {
        // matrix
        const pose = xrFrame.getPose(xrAnchor.anchorSpace, this._xrSessionManager.referenceSpace);
        if (pose) {
            const mat = anchor.transformationMatrix || new Matrix();
            Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mat.toggleModelMatrixHandInPlace();
            }
            anchor.transformationMatrix = mat;
            if (!this._options.worldParentNode) {
                // Logger.Warn("Please provide a world parent node to apply world transformation");
            } else {
                mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
            }
        }

        return <IWebXRAnchor>anchor;
    }

    private async _createAnchorAtTransformation(xrTransformation: XRRigidTransform, xrFrame: XRFrame) {
        if (xrFrame.createAnchor) {
            try {
                return xrFrame.createAnchor(xrTransformation, this._referenceSpaceForFrameAnchors ?? this._xrSessionManager.referenceSpace);
            } catch (error) {
                throw new Error(error);
            }
        } else {
            this.detach();
            throw new Error("Anchors are not enabled in your browser");
        }
    }
}

// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRAnchorSystem.Name,
    (xrSessionManager, options) => {
        return () => new WebXRAnchorSystem(xrSessionManager, options);
    },
    WebXRAnchorSystem.Version
);
