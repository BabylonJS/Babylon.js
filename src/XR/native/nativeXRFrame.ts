import { NativeXRPlugin } from "./nativeXRPlugin";

/** @hidden */
interface INativeXRFrame extends XRFrame {
    // Native supported functions
    createAnchor(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
    fillPoses(spaces: XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean;
    getJointPose(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose;
    fillJointRadii(jointSpaces: XRJointSpace[], radii: Float32Array): boolean;

    // Native-only helper functions
    getPoseData: (space: XRSpace, baseSpace: XRReferenceSpace, vectorBuffer: ArrayBuffer, matrixBuffer: ArrayBuffer) => XRPose;
}

/** @hidden */
export class NativeXRFrame implements XRFrame {
    private _xrTransform = new XRRigidTransform();
    private _xrPose: XRPose = {
        transform: this._xrTransform,
        emulatedPosition: false
    };
    // Enough space for position, orientation
    private _xrPoseVectorData = new Float32Array(4 * (4 + 4));

    public get session(): XRSession {
        return this._nativeImpl.session;
    }

    constructor(private _nativeImpl: INativeXRFrame) { }

    public getPose(space: XRSpace, baseSpace: XRReferenceSpace): XRPose | undefined {
        if (!this._nativeImpl.getPoseData(space, baseSpace, this._xrPoseVectorData.buffer, this._xrTransform.matrix.buffer)) {
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

    public fillPoses(spaces: XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean {
        return this._nativeImpl.fillPoses(spaces, baseSpace, transforms);
    }

    public getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined {
        return this._nativeImpl.getViewerPose(referenceSpace);
    }

    public getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[] {
        return this._nativeImpl.getHitTestResults(hitTestSource);
    }

    public getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): XRTransientInputHitTestResult[] {
        return this._nativeImpl.getHitTestResultsForTransientInput(hitTestSource);
    }

    public get trackedAnchors(): XRAnchorSet | undefined {
        return this._nativeImpl.trackedAnchors;
    }

    public createAnchor(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor> {
        return this._nativeImpl.createAnchor(pose, space);
    }

    public get worldInformation(): XRWorldInformation | undefined {
        return this._nativeImpl.worldInformation;
    }

    public get detectedPlanes(): XRPlaneSet | undefined {
        return this._nativeImpl.detectedPlanes;
    }

    public getJointPose(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose {
        return this._nativeImpl.getJointPose(joint, baseSpace);
    }

    public fillJointRadii(jointSpaces: XRJointSpace[], radii: Float32Array): boolean {
        return this._nativeImpl.fillJointRadii(jointSpaces, radii);
    }

    public getLightEstimate(xrLightProbe: XRLightProbe): XRLightEstimate {
        return this._nativeImpl.getLightEstimate(xrLightProbe);
    }

    public get featurePointCloud(): number[] | undefined {
        return this._nativeImpl.featurePointCloud;
    }
}

NativeXRPlugin.RegisterType("NativeXRFrame", NativeXRFrame);