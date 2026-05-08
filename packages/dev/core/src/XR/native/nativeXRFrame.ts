import { RegisterNativeTypeAsync } from "../../Engines/thinNativeEngine";

/** @internal */
interface INativeXRFrame extends XRFrame {
    // Native-only helper functions
    getPoseData: (space: XRSpace, baseSpace: XRReferenceSpace, vectorBuffer: ArrayBufferLike, matrixBuffer: ArrayBufferLike) => XRPose;
    _imageTrackingResults?: XRImageTrackingResult[];
}

/** @internal */
export class NativeXRFrame implements XRFrame {
    private readonly _xrTransform = new XRRigidTransform();
    private readonly _xrPose: XRPose = {
        transform: this._xrTransform,
        emulatedPosition: false,
    };
    // Enough space for position, orientation
    private readonly _xrPoseVectorData = new Float32Array(4 + 4);

    public get session(): XRSession {
        return this._nativeImpl.session;
    }

    constructor(private _nativeImpl: INativeXRFrame) {}

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

    public readonly fillPoses = this._nativeImpl.fillPoses!.bind(this._nativeImpl);

    public readonly getViewerPose = this._nativeImpl.getViewerPose.bind(this._nativeImpl);

    public readonly getHitTestResults = this._nativeImpl.getHitTestResults.bind(this._nativeImpl);

    public readonly getHitTestResultsForTransientInput = () => {
        throw new Error("XRFrame.getHitTestResultsForTransientInput not supported on native.");
    };

    public get trackedAnchors(): XRAnchorSet | undefined {
        return this._nativeImpl.trackedAnchors;
    }

    public readonly createAnchor = this._nativeImpl.createAnchor!.bind(this._nativeImpl);

    public get worldInformation(): XRWorldInformation | undefined {
        return this._nativeImpl.worldInformation;
    }

    public get detectedPlanes(): XRPlaneSet | undefined {
        return this._nativeImpl.detectedPlanes;
    }

    public readonly getJointPose = this._nativeImpl.getJointPose!.bind(this._nativeImpl);

    public readonly fillJointRadii = this._nativeImpl.fillJointRadii!.bind(this._nativeImpl);

    public readonly getLightEstimate = () => {
        throw new Error("XRFrame.getLightEstimate not supported on native.");
    };

    public get featurePointCloud(): number[] | undefined {
        return this._nativeImpl.featurePointCloud;
    }

    public readonly getImageTrackingResults = (): XRImageTrackingResult[] => {
        return this._nativeImpl._imageTrackingResults ?? [];
    };

    public getDepthInformation(view: XRView): XRCPUDepthInformation | undefined {
        throw new Error("This function is not available in Babylon Native");
        // return this._nativeImpl.getDepthInformation(view);
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
RegisterNativeTypeAsync("NativeXRFrame", NativeXRFrame);
