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

interface XRSession {
    addEventListener: Function
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<void>;
    updateRenderState(XRRenderStateInit:any):Promise<void>;
    requestAnimationFrame: Function;
    end():Promise<void>;
    renderState:XRRenderState;


};

interface XRFrame {
    session:XRSession
    getViewerPose(referenceSpace:XRReferenceSpace):XRViewerPose?
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

// interface XRDevice {
//     requestSession(options: XRSessionCreationOptions): Promise<XRSession>;
//     supportsSession(options: XRSessionCreationOptions): Promise<void>;
// }
// interface XRSession {
//     getInputSources(): Array<any>;
//     renderState: any;
//     requestReferenceSpace(options: ReferenceSpaceOptions): Promise<void>;
//     requestHitTest(origin: Float32Array, direction: Float32Array, frameOfReference: any): any;
//     end(): Promise<void>;
//     updateRenderState(state:any):Promise<void>;
//     requestAnimationFrame: Function;
//     addEventListener: Function;
// }
// interface XRSessionCreationOptions {
//     mode?: string;
// }



// interface ReferenceSpaceOptions {
//     type?: string;
//     subtype?: string;
// }

// interface XRLayer {
//     getViewport: Function;
//     framebufferWidth: number;
//     framebufferHeight: number;
// }
// interface XRView {
//     projectionMatrix: Float32Array;
// }
// interface XRFrame {
//     getViewerPose: Function;
//     getInputPose: Function;
//     views: Array<XRView>;
//     baseLayer: XRLayer;
// }
// interface XRFrameOfReference {
// }
// interface XRWebGLLayer extends XRLayer {
//     framebuffer: WebGLFramebuffer;
// }
// declare var XRWebGLLayer: {
//     prototype: XRWebGLLayer;
//     new(session: XRSession, context?: WebGLRenderingContext): XRWebGLLayer;
// };