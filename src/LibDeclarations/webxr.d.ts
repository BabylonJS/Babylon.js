enum XRSessionMode {
    "inline",
    "immersive-vr",
    "immersive-ar"
};

enum XRReferenceSpaceType {
    "viewer",
    "local",
    "local-floor",
    "bounded-floor",
    "unbounded"
};

enum XREnvironmentBlendMode {
    "opaque",
    "additive",
    "alpha-blend",
};

enum XRVisibilityState {
    "visible",
    "visible-blurred",
    "hidden",
};

interface XRInputSource {
    handedness:XRHandedness;
    targetRayMode:XRTargetRayMode;
    targetRaySpace:XRSpace;
    gripSpace:XRSpace?;
    gamepad:Gamepad?;
    profiles:FrozenArray<DOMString>;
};

interface XRSession {
    addEventListener: Function
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<void>;
    updateRenderState(XRRenderStateInit:any):Promise<void>;
    requestAnimationFrame: Function;
    end():Promise<void>;
    renderState:XRRenderState;
    inputSources:Array<XRInputSource>


};

interface XRFrame {
    session:XRSession
    getViewerPose(referenceSpace:XRReferenceSpace):XRViewerPose?;
    getPose(space:XRSpace, baseSpace:XRSpace):XRPose?;
}

interface XRViewerPose extends XRPose {
    views:FrozenArray<XRView>;
}

interface XRPose {
    transform:XRRigidTransform;
    emulatedPosition:boolean;
}

declare var XRWebGLLayer: {
    prototype: XRWebGLLayer;
    new(session: XRSession, context?: WebGLRenderingContext): XRWebGLLayer;
};
interface XRWebGLLayer extends XRLayer {
    framebuffer: WebGLFramebuffer;
    framebufferWidth: number
    framebufferHeight: number
}

interface XRRigidTransform {
    position:DOMPointReadOnly;
    orientation:DOMPointReadOnly;
    matrix:Float32Array;
    inverse:XRRigidTransform;
};

interface XRView {
    eye:XREye;
    projectionMatrix:Float32Array;
    transform:XRRigidTransform;
};

interface XRInputSourceChangeEvent {
    session:XRSession;
    removed:Array<XRInputSource>;
    added:Array<XRInputSource>;
}