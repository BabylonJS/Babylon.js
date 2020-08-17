type XRSessionMode =
    | "inline"
    | "immersive-vr"
    | "immersive-ar";

type XRReferenceSpaceType =
    | "viewer"
    | "local"
    | "local-floor"
    | "bounded-floor"
    | "unbounded";

type XREnvironmentBlendMode =
    | "opaque"
    | "additive"
    | "alpha-blend";

type XRVisibilityState =
    | "visible"
    | "visible-blurred"
    | "hidden";

type XRHandedness =
    | "none"
    | "left"
    | "right";

type XRTargetRayMode =
    | "gaze"
    | "tracked-pointer"
    | "screen";

type XREye =
    | "none"
    | "left"
    | "right";

type XREventType =
    | "devicechange"
    | "visibilitychange"
    | "end"
    | "inputsourceschange"
    | "select"
    | "selectstart"
    | "selectend"
    | "squeeze"
    | "squeezestart"
    | "squeezeend"
    | "reset";

interface XRSpace extends EventTarget {

}

interface XRRenderState {
    depthNear?: number;
    depthFar?: number;
    inlineVerticalFieldOfView?: number;
    baseLayer?: XRWebGLLayer;
}

interface XRInputSource {
    handedness: XRHandedness;
    targetRayMode: XRTargetRayMode;
    targetRaySpace: XRSpace;
    gripSpace: XRSpace | undefined;
    gamepad: Gamepad | undefined;
    profiles: Array<string>;
    hand: XRHand | undefined;
}

interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
}

interface XRSession {
    addEventListener: Function;
    removeEventListener: Function;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    updateRenderState(XRRenderStateInit: XRRenderState): Promise<void>;
    requestAnimationFrame: Function;
    end(): Promise<void>;
    renderState: XRRenderState;
    inputSources: Array<XRInputSource>;

    // hit test
    requestHitTestSource(options: XRHitTestOptionsInit): Promise<XRHitTestSource>;
    requestHitTestSourceForTransientInput(options: XRTransientInputHitTestOptionsInit): Promise<XRTransientInputHitTestSource>;

    // legacy AR hit test
    requestHitTest(ray: XRRay, referenceSpace: XRReferenceSpace): Promise<XRHitResult[]>;

    // legacy plane detection
    updateWorldTrackingState(options: {
        planeDetectionState?: { enabled: boolean; }
    }): void;
}

interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset: any;
}

type XRPlaneSet = Set<XRPlane>;
type XRAnchorSet = Set<XRAnchor>;

interface XRFrame {
    session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;

    // AR
    getHitTestResults(hitTestSource: XRHitTestSource): Array<XRHitTestResult> ;
    getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): Array<XRTransientInputHitTestResult>;
    // Anchors
    trackedAnchors?: XRAnchorSet;
    createAnchor(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
    // Planes
    worldInformation: {
        detectedPlanes?: XRPlaneSet;
    };
    // Hand tracking
    getJointPose(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose
}

interface XRViewerPose extends XRPose {
    views: Array<XRView>;
}

interface XRPose {
    transform: XRRigidTransform;
    emulatedPosition: boolean;
}

interface XRWebGLLayerOptions {
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    alpha?: boolean;
    multiview?: boolean;
    framebufferScaleFactor?: number;
}

declare var XRWebGLLayer: {
    prototype: XRWebGLLayer;
    new(session: XRSession, context: WebGLRenderingContext | undefined, options?: XRWebGLLayerOptions): XRWebGLLayer;
};
interface XRWebGLLayer {
    framebuffer: WebGLFramebuffer;
    framebufferWidth: number;
    framebufferHeight: number;
    getViewport: Function;
}

declare class XRRigidTransform {
    constructor(matrix: Float32Array | DOMPointInit, direction?: DOMPointInit);
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
    matrix: Float32Array;
    inverse: XRRigidTransform;
}

interface XRView {
    eye: XREye;
    projectionMatrix: Float32Array;
    transform: XRRigidTransform;
}

interface XRInputSourceChangeEvent {
    session: XRSession;
    removed: Array<XRInputSource>;
    added: Array<XRInputSource>;
}

interface XRInputSourceEvent extends Event {
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
}

// Experimental(er) features
declare class XRRay {
    constructor(transformOrOrigin: XRRigidTransform | DOMPointInit, direction?: DOMPointInit);
    origin: DOMPointReadOnly;
    direction: DOMPointReadOnly;
    matrix: Float32Array;
}

declare enum XRHitTestTrackableType {
    "point",
    "plane",
    "mesh"
}

interface XRHitResult {
    hitMatrix: Float32Array;
}

interface XRTransientInputHitTestResult {
    readonly inputSource: XRInputSource;
    readonly results: Array<XRHitTestResult>;
}

interface XRHitTestResult {
    getPose(baseSpace: XRSpace): XRPose | undefined;
    // When anchor system is enabled
    createAnchor?(pose: XRRigidTransform): Promise<XRAnchor>;
}

interface XRHitTestSource {
    cancel(): void;
}

interface XRTransientInputHitTestSource {
    cancel(): void;
}

interface XRHitTestOptionsInit {
    space: XRSpace;
    entityTypes?: Array<XRHitTestTrackableType>;
    offsetRay?: XRRay;
}

interface XRTransientInputHitTestOptionsInit {
    profile: string;
    entityTypes?: Array<XRHitTestTrackableType>;
    offsetRay?: XRRay;
}

interface XRAnchor {
    anchorSpace: XRSpace;
    delete(): void;
}

interface XRPlane {
    orientation: "Horizontal" | "Vertical";
    planeSpace: XRSpace;
    polygon: Array<DOMPointReadOnly>;
    lastChangedTime: number;
}

interface XRJointSpace extends XRSpace {};

interface XRJointPose extends XRPose {
    radius: number | undefined;
};

declare class XRHand implements Iterable<XRJointSpace> {
    readonly const length: number;

    readonly static const WRIST = 0;

    readonly static const THUMB_METACARPAL = 1;
    readonly static const THUMB_PHALANX_PROXIMAL = 2;
    readonly static const THUMB_PHALANX_DISTAL = 3;
    readonly static const THUMB_PHALANX_TIP = 4;

    readonly static const INDEX_METACARPAL = 5;
    readonly static const INDEX_PHALANX_PROXIMAL = 6;
    readonly static const INDEX_PHALANX_INTERMEDIATE = 7;
    readonly static const INDEX_PHALANX_DISTAL = 8;
    readonly static const INDEX_PHALANX_TIP = 9;

    readonly static const MIDDLE_METACARPAL = 10;
    readonly static const MIDDLE_PHALANX_PROXIMAL = 11;
    readonly static const MIDDLE_PHALANX_INTERMEDIATE = 12;
    readonly static const MIDDLE_PHALANX_DISTAL = 13;
    readonly static const MIDDLE_PHALANX_TIP = 14;

    readonly static const RING_METACARPAL = 15;
    readonly static const RING_PHALANX_PROXIMAL = 16;
    readonly static const RING_PHALANX_INTERMEDIATE = 17;
    readonly static const RING_PHALANX_DISTAL = 18;
    readonly static const RING_PHALANX_TIP = 19;

    readonly static const LITTLE_METACARPAL = 20;
    readonly static const LITTLE_PHALANX_PROXIMAL = 21;
    readonly static const LITTLE_PHALANX_INTERMEDIATE = 22;
    readonly static const LITTLE_PHALANX_DISTAL = 23;
    readonly static const LITTLE_PHALANX_TIP = 24;
};