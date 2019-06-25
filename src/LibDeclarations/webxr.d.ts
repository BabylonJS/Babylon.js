interface XRDevice {
    requestSession(options: XRSessionCreationOptions): Promise<XRSession>;
    supportsSession(options: XRSessionCreationOptions): Promise<void>;
}
interface XRSession {
    getInputSources(): Array<any>;
    baseLayer: XRWebGLLayer;
    requestReferenceSpace(options: ReferenceSpaceOptions): Promise<void>;
    requestHitTest(origin: Float32Array, direction: Float32Array, frameOfReference: any): any;
    end(): Promise<void>;
    updateRenderState(state:any):Promise<void>;
    requestAnimationFrame: Function;
    addEventListener: Function;
}
interface XRSessionCreationOptions {
    mode?: string;
}

interface ReferenceSpaceOptions {
    type?: string;
    subtype?: string;
}

interface XRLayer {
    getViewport: Function;
    framebufferWidth: number;
    framebufferHeight: number;
}
interface XRView {
    projectionMatrix: Float32Array;
}
interface XRFrame {
    getDevicePose: Function;
    getInputPose: Function;
    views: Array<XRView>;
    baseLayer: XRLayer;
}
interface XRFrameOfReference {
}
interface XRWebGLLayer extends XRLayer {
    framebuffer: WebGLFramebuffer;
}
declare var XRWebGLLayer: {
    prototype: XRWebGLLayer;
    new(session: XRSession, context?: WebGLRenderingContext): XRWebGLLayer;
};