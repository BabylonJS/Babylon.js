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

interface XRSpace extends EventTarget {

}

interface XRRenderState {
    depthNear: number ;
    depthFar: number ;
    inlineVerticalFieldOfView: number | undefined;
    baseLayer: XRWebGLLayer | undefined;
}

interface XRInputSource {
    handedness: XRHandedness;
    targetRayMode: XRTargetRayMode;
    targetRaySpace: XRSpace;
    gripSpace: XRSpace | undefined;
    gamepad: Gamepad | undefined;
    profiles: Array<string>;
}

interface XRSession {
    addEventListener: Function;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    updateRenderState(XRRenderStateInit: any): Promise<void>;
    requestAnimationFrame: Function;
    end(): Promise<void>;
    renderState: XRRenderState;
    inputSources: Array<XRInputSource>;

}

interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset: any;
}

interface XRFrame {
    session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;
}

interface XRViewerPose extends XRPose {
    views: Array<XRView>;
}

interface XRPose {
    transform: XRRigidTransform;
    emulatedPosition: boolean;
}

declare var XRWebGLLayer: {
    prototype: XRWebGLLayer;
    new(session: XRSession, context: WebGLRenderingContext | undefined): XRWebGLLayer;
};
interface XRWebGLLayer {
    framebuffer: WebGLFramebuffer;
    framebufferWidth: number;
    framebufferHeight: number;
    getViewport: Function;
}

interface XRRigidTransform {
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