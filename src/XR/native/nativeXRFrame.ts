declare const _native: any;

/** @hidden */
export class NativeXRFrame implements XRFrame {
    private _nativeImpl: XRFrame;

    public get session(): XRSession {
        return this._nativeImpl.session;
    }

    private _xrTransform = new XRRigidTransform();
    private _xrPose: XRPose = {
        transform: this._xrTransform,
        emulatedPosition: false
    };
    // Enough space for position, orientation
    private _xrPoseVectorData = new Float32Array(4 * (4 + 4));

    public getPose(space: XRSpace, baseSpace: XRReferenceSpace): XRPose | undefined {
        if (!this._nativeImpl.getPoseData!(space, baseSpace, this._xrPoseVectorData.buffer, this._xrTransform.matrix.buffer)) {
            return undefined;
        }
        const position = this._xrTransform.position as DOMPoint;
        position.x = this._xrPoseVectorData[0];
        position.y = this._xrPoseVectorData[1];
        position.z = this._xrPoseVectorData[2];
        position.w = this._xrPoseVectorData[3];

        const orientation = this._xrTransform.orientation as DOMPoint;
        orientation.x = this._xrPoseVectorData[4];
        orientation.y = this._xrPoseVectorData[5];
        orientation.z = this._xrPoseVectorData[6];
        orientation.w = this._xrPoseVectorData[7];
        return this._xrPose;
    }

    public getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined {
        return this._nativeImpl.getViewerPose(referenceSpace);
    }
    
    // AR
    
    public getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[] {
        return this._nativeImpl.getHitTestResults(hitTestSource);
    }
    
    public getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): XRTransientInputHitTestResult[] {
        return this._nativeImpl.getHitTestResultsForTransientInput(hitTestSource);
    }
    
    // Anchors
    
    public get trackedAnchors(): XRAnchorSet | undefined {
        return this._nativeImpl.trackedAnchors;
    }
    
    public createAnchor(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor> {
        return this._nativeImpl.createAnchor!(pose, space);
    }
    
    // Scene understanding
    
    private _trackedPlanes = new Map<number, XRPlane>();
    private _newPlaneIds = new Array<number>();
    private _newPlanes = new Array<XRPlane>();
    private _detectedPlanes = new Set<XRPlane>();

    public updatePlanes(timestamp: number, updatedPlaneIds?: Uint32Array, removedPlaneIds?: Uint32Array) {
        if (updatedPlaneIds) {
            this._newPlaneIds.length = 0;
            updatedPlaneIds.forEach((planeId) => {
                if (this._trackedPlanes.has(planeId)) {
                    this._trackedPlanes.get(planeId)!.lastChangedTime = timestamp;
                } else {
                    this._newPlaneIds.push(planeId);
                }
            });

            if (this._newPlaneIds.length > 0) {
                this._newPlanes.length = this._newPlaneIds.length;
                this._nativeImpl.createPlanes!(this._newPlaneIds, this._newPlaneIds.length, this._newPlanes);
                this._newPlaneIds.forEach((newPlaneId, planeIdIdx) => {
                    const newPlane = this._newPlanes[planeIdIdx];
                    newPlane.lastChangedTime = timestamp;
                    this._trackedPlanes.set(newPlaneId, newPlane);
                });
            }
        }

        if (removedPlaneIds) {
            removedPlaneIds.forEach((removedPlaneId) => {
                this._trackedPlanes.delete(removedPlaneId);
            });
        }

        this._detectedPlanes = new Set<XRPlane>(Array.from(this._trackedPlanes.values()));    
    }

    public get detectedPlanes(): XRPlaneSet | undefined {
        return this._detectedPlanes;
    }
    
    public get featurePointCloud(): number[] | undefined {
        return this._nativeImpl.featurePointCloud;
    }
    
    public get detectedMeshes(): XRMeshSet | undefined {
        return this._nativeImpl.detectedMeshes;
    }
    
    // Hand tracking
    
    public getJointPose(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose {
        return this._nativeImpl.getJointPose!(joint, baseSpace);
    }
    
    public fillPoses(spaces: XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean {
        return this._nativeImpl.fillJointPoseData!(spaces, baseSpace, spaces.length, transforms.buffer, transforms.byteOffset);
    }

    public fillJointRadii(jointSpaces: XRJointSpace[], radii: Float32Array): boolean {
        return this._nativeImpl.fillJointPoseRadiiData!(jointSpaces, jointSpaces.length, radii.buffer, radii.byteOffset);
    }

    // Image tracking
    
    public getImageTrackingResults?(): Array<XRImageTrackingResult> {
        return this._nativeImpl.getImageTrackingResults!();
    }

    public getLightEstimate(xrLightProbe: XRLightProbe): XRLightEstimate {
        return this._nativeImpl.getLightEstimate(xrLightProbe);
    }
}

_native.NativeXRFrame = NativeXRFrame;