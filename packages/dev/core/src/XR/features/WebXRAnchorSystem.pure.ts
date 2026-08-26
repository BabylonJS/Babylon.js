/** This file must only contain pure code and pure imports */

import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { type WebXRSessionManager } from "../webXRSessionManager";
import { Observable } from "../../Misc/observable.pure";
import { Matrix, Vector3, Quaternion } from "../../Maths/math.vector.pure";
import { type TransformNode } from "../../Meshes/transformNode.pure";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { type IWebXRHitResult } from "./WebXRHitTest.pure";

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

    /**
     * If set to true, all anchor arrays will be cleared when the session initializes
     */
    clearAnchorsOnSessionInit?: boolean;
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
     * The persistent handle associated with this anchor, if one was requested or the anchor was restored from one
     */
    persistentHandle?: string;

    /**
     * if defined, this object will be constantly updated by the anchor's position and rotation
     */
    attachedNode?: TransformNode;

    /**
     * Remove this anchor from the scene
     */
    remove(): void;

    /**
     * @internal - set to true when the anchor was removed
     */
    _removed: boolean;
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
    reject: (reason?: unknown) => void;
    /**
     * The XR Transformation of the future anchor
     */
    xrTransformation?: XRRigidTransform;
    /**
     * The persistent handle used to restore this anchor
     */
    persistentHandle?: string;
}

let AnchorIdProvider = 0;

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

        if (this._options.clearAnchorsOnSessionInit) {
            this._xrSessionManager.onXRSessionInit.add(() => {
                this._rejectPendingPersistentAnchors("Persistent anchor restoration was interrupted before tracking began");
                this._trackedAnchors.length = 0;
                this._futureAnchors.length = 0;
                this._lastFrameDetected.clear();
            });
        }
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
                return await new Promise<IWebXRAnchor>((resolve, reject) => {
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
                throw new Error(String(error), { cause: error });
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
                ? await this._createAnchorAtTransformationAsync(xrTransformation, this._xrSessionManager.currentFrame)
                : undefined;
        // add the transformation to the future anchors list
        return await new Promise<IWebXRAnchor>((resolve, reject) => {
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
     * Whether the current XR session exposes all session-level persistent anchor APIs
     * @returns Whether all session-level persistent anchor APIs are supported
     */
    public get isPersistentAnchorSupported(): boolean {
        const session = this._xrSessionManager.session;
        return (
            !!session && session.persistentAnchors !== undefined && typeof session.restorePersistentAnchor === "function" && typeof session.deletePersistentAnchor === "function"
        );
    }

    /**
     * Get the persistent anchor handles known to the current XR session
     * @returns The persistent anchor handles
     * @throws If persistent anchor enumeration is not supported by the current session
     */
    public get persistentAnchors(): ReadonlyArray<string> {
        const persistentAnchors = this._xrSessionManager.session?.persistentAnchors;
        if (persistentAnchors === undefined) {
            throw new Error("Persistent anchor enumeration is not supported in this environment/browser");
        }
        return persistentAnchors;
    }

    /**
     * Request a persistent handle for a tracked anchor
     * @param anchor The Babylon anchor to persist
     * @returns A promise that resolves with the persistent handle
     * @throws If requesting persistent handles is not supported by the native anchor
     */
    public async requestPersistentHandleAsync(anchor: IWebXRAnchor): Promise<string> {
        const requestPersistentHandle = anchor.xrAnchor.requestPersistentHandle;
        if (!requestPersistentHandle) {
            throw new Error("Requesting persistent anchor handles is not supported in this environment/browser");
        }
        const handle = await requestPersistentHandle.call(anchor.xrAnchor);
        this._setPersistentHandle(anchor, handle);
        return handle;
    }

    /**
     * Restore a persistent anchor into the Babylon anchor lifecycle
     * @param handle The persistent anchor handle to restore
     * @returns A promise that resolves after the restored anchor is tracked by an XR frame
     * @throws If restoring persistent anchors is not supported by the current session
     */
    public async restorePersistentAnchorAsync(handle: string): Promise<IWebXRAnchor> {
        if (!this.attached) {
            throw new Error("Restoring persistent anchors requires the anchor system to be attached");
        }

        const session = this._xrSessionManager.session;
        const restorePersistentAnchor = session?.restorePersistentAnchor;
        if (!restorePersistentAnchor) {
            throw new Error("Restoring persistent anchors is not supported in this environment/browser");
        }

        const nativeAnchor = await restorePersistentAnchor.call(session, handle);
        if (!this.attached || this._xrSessionManager.session !== session) {
            nativeAnchor.delete();
            throw new Error("Persistent anchor restoration was interrupted before tracking began");
        }
        const existingAnchorIndex = this._findIndexInAnchorArray(nativeAnchor);
        if (existingAnchorIndex !== -1) {
            const existingAnchor = this._trackedAnchors[existingAnchorIndex];
            existingAnchor.persistentHandle = handle;
            return existingAnchor;
        }

        return await new Promise<IWebXRAnchor>((resolve, reject) => {
            this._futureAnchors.push({
                nativeAnchor,
                resolved: false,
                submitted: true,
                persistentHandle: handle,
                resolve,
                reject,
            });
        });
    }

    /**
     * Restore all persistent anchors known to the current XR session
     * @returns A promise that resolves after all restored anchors are tracked by an XR frame
     * @throws If persistent anchor enumeration or restoration is not supported by the current session
     */
    public async restorePersistentAnchorsAsync(): Promise<IWebXRAnchor[]> {
        return await Promise.all(this.persistentAnchors.map(async (handle) => await this.restorePersistentAnchorAsync(handle)));
    }

    /**
     * Delete a persistent anchor from native storage
     * @param handle The persistent anchor handle to delete
     * @returns A promise that resolves after native persistent storage is deleted
     * @throws If deleting persistent anchors is not supported by the current session
     */
    public async deletePersistentAnchorAsync(handle: string): Promise<void> {
        const deletePersistentAnchor = this._xrSessionManager.session?.deletePersistentAnchor;
        if (!deletePersistentAnchor) {
            throw new Error("Deleting persistent anchors is not supported in this environment/browser");
        }

        await deletePersistentAnchor.call(this._xrSessionManager.session, handle);
        for (const anchor of this._trackedAnchors) {
            if (anchor.persistentHandle === handle) {
                anchor._removed = true;
            }
        }
        for (const futureAnchor of this._futureAnchors) {
            if (!futureAnchor.resolved && futureAnchor.persistentHandle === handle) {
                futureAnchor.resolved = true;
                futureAnchor.reject(new Error("The persistent anchor was deleted before tracking began"));
            }
        }
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        this._rejectPendingPersistentAnchors("Persistent anchor restoration was interrupted before tracking began");

        if (!this._options.doNotRemoveAnchorsOnSessionEnded) {
            while (this._trackedAnchors.length) {
                const toRemove = this._trackedAnchors.pop();
                if (toRemove && !toRemove._removed) {
                    // as the xr frame loop is removed, we need to notify manually
                    this.onAnchorRemovedObservable.notifyObservers(toRemove);
                    toRemove._removed = true;
                    // no need to call the remove fn as the anchor is already removed from the session
                }
            }
        }

        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public override dispose(): void {
        super.dispose();
        this._futureAnchors.length = 0;
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
            for (const anchor of this._trackedAnchors) {
                if (!anchor._removed) {
                    continue;
                }
                const index = this._trackedAnchors.indexOf(anchor);
                this._trackedAnchors.splice(index, 1);
                anchor.xrAnchor.delete();
                this.onAnchorRemovedObservable.notifyObservers(anchor);
            }
            // now check for new ones
            trackedAnchors.forEach((xrAnchor) => {
                const trackedAnchorIndex = this._findIndexInAnchorArray(xrAnchor);
                const futureAnchor = this._findFutureAnchor(xrAnchor);
                if (!this._lastFrameDetected.has(xrAnchor) || (trackedAnchorIndex === -1 && futureAnchor !== undefined)) {
                    const anchor: IWebXRAnchor = {
                        _removed: false,
                        id: AnchorIdProvider++,
                        xrAnchor: xrAnchor,
                        transformationMatrix: new Matrix(),
                        persistentHandle: futureAnchor?.persistentHandle,
                        remove: () => {
                            anchor._removed = true;
                        },
                    };
                    this._updateAnchorWithXRFrame(xrAnchor, anchor, frame);
                    this._trackedAnchors.push(anchor);
                    this.onAnchorAddedObservable.notifyObservers(anchor);
                    // search for the future anchor promise that matches this
                    for (const pendingAnchor of this._futureAnchors) {
                        if (pendingAnchor.nativeAnchor === xrAnchor && !pendingAnchor.resolved) {
                            pendingAnchor.resolve(anchor);
                            pendingAnchor.resolved = true;
                        }
                    }
                } else {
                    if (trackedAnchorIndex < 0) {
                        return;
                    }
                    const anchor = this._trackedAnchors[trackedAnchorIndex];
                    this._updateAnchorWithXRFrame(xrAnchor, anchor, frame);
                    if (anchor.attachedNode) {
                        anchor.attachedNode.rotationQuaternion = anchor.attachedNode.rotationQuaternion || new Quaternion();
                        anchor.transformationMatrix.decompose(anchor.attachedNode.scaling, anchor.attachedNode.rotationQuaternion, anchor.attachedNode.position);
                    }
                    this.onAnchorUpdatedObservable.notifyObservers(anchor);
                }
            });
            this._lastFrameDetected = trackedAnchors;
        }

        // process future anchors
        for (const futureAnchor of this._futureAnchors) {
            if (!futureAnchor.resolved && !futureAnchor.submitted) {
                if (!futureAnchor.xrTransformation) {
                    futureAnchor.resolved = true;
                    futureAnchor.reject(new Error("Anchor creation requires an XR transformation"));
                    continue;
                }
                // eslint-disable-next-line github/no-then
                this._createAnchorAtTransformationAsync(futureAnchor.xrTransformation, frame).then(
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
        }
        for (let i = this._futureAnchors.length - 1; i >= 0; --i) {
            if (this._futureAnchors[i].resolved) {
                this._futureAnchors.splice(i, 1);
            }
        }
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

    private _findFutureAnchor(xrAnchor: XRAnchor): IWebXRFutureAnchor | undefined {
        for (const futureAnchor of this._futureAnchors) {
            if (futureAnchor.nativeAnchor === xrAnchor && !futureAnchor.resolved) {
                return futureAnchor;
            }
        }
        return undefined;
    }

    private _setPersistentHandle(anchor: IWebXRAnchor, handle: string): void {
        anchor.persistentHandle = handle;
    }

    private _rejectPendingPersistentAnchors(message: string): void {
        for (const futureAnchor of this._futureAnchors) {
            if (!futureAnchor.resolved && futureAnchor.persistentHandle !== undefined) {
                futureAnchor.resolved = true;
                futureAnchor.reject(new Error(message));
            }
        }
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

    private async _createAnchorAtTransformationAsync(xrTransformation: XRRigidTransform, xrFrame: XRFrame) {
        if (xrFrame.createAnchor) {
            try {
                return await xrFrame.createAnchor(xrTransformation, this._referenceSpaceForFrameAnchors ?? this._xrSessionManager.referenceSpace);
            } catch (error) {
                throw new Error(String(error), { cause: error });
            }
        } else {
            this.detach();
            throw new Error("Anchors are not enabled in your browser");
        }
    }
}

let _Registered = false;
/**
 * Register side effects for webXRAnchorSystem.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterWebXRAnchorSystem(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // register the plugin
    WebXRFeaturesManager.AddWebXRFeature(
        WebXRAnchorSystem.Name,
        (xrSessionManager, options) => {
            return () => new WebXRAnchorSystem(xrSessionManager, options);
        },
        WebXRAnchorSystem.Version
    );
}
