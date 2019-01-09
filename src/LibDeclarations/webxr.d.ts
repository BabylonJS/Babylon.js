interface XRDevice {
    requestSession(options: XRSessionCreationOptions): Promise<XRSession>;
    supportsSession(options: XRSessionCreationOptions): Promise<void>;
}
interface XRSession {
    getInputSources(): Array<any>;
    baseLayer: XRWebGLLayer;
    requestFrameOfReference(type: string): Promise<void>;
    requestHitTest(origin: Float32Array, direction: Float32Array, frameOfReference: any): any;
    end(): Promise<void>;
    requestAnimationFrame: Function;
    addEventListener: Function;
}
interface XRSessionCreationOptions {
    outputContext?: WebGLRenderingContext | null;
    immersive?: boolean;
    environmentIntegration?: boolean;
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