/**
 * Available session modes
 */
type XRSessionMode = "inline" | "immersive-vr" | "immersive-ar";

/**
 * Reference space types
 */
type XRReferenceSpaceType = "viewer" | "local" | "local-floor" | "unbounded";
type XRBoundedReferenceSpaceType = "bounded-floor";

type XREnvironmentBlendMode = "opaque" | "additive" | "alpha-blend";

type XRVisibilityState = "visible" | "visible-blurred" | "hidden";

/**
 * Handedness types
 */
type XRHandedness = "none" | "left" | "right";

/**
 * InputSource target ray modes
 */
type XRTargetRayMode = "gaze" | "tracked-pointer" | "screen";

/**
 * Eye types
 */
type XREye = "none" | "left" | "right";

/**
 * Type of XR events available
 */
type XREventType = "devicechange" | "visibilitychange" | "end" | "inputsourceschange" | "select" | "selectstart" | "selectend" | "squeeze" | "squeezestart" | "squeezeend" | "reset" | "eyetrackingstart" | "eyetrackingend";

type XRDOMOverlayType = "screen" | "floating" | "head-locked";

type XRReflectionFormat = "srgba8" | "rgba16f";

type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

type XRPlaneSet = Set<XRPlane>;
type XRAnchorSet = Set<XRAnchor>;

type XREventHandler = (callback: any) => void;

interface XRLayer extends EventTarget { }

type XRDOMOverlayInit = {
    /**
     * The root attribute specifies the overlay element that will be displayed to the user as the content of the DOM overlay. This is a required attribute, there is no default.
     */
    root: Element;
};

type XRLightProbeInit = {
     reflectionFormat: XRReflectionFormat;
};

interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
    trackedImages?: XRTrackedImageInit[];
    /**
     * When 'dom-overly' is (optionally) requested the application MUST provide configuration for the DOM overlay
     */
    domOverlay?: XRDOMOverlayInit;
}

interface XRSessionEvent extends Event {
    readonly session: XRSession;
}

interface XRSystem {
    isSessionSupported: (sessionMode: XRSessionMode) => Promise<boolean>;
    requestSession: (sessionMode: XRSessionMode, sessionInit?: any) => Promise<XRSession>;
}

interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

interface XRWebGLLayerInit {
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    alpha?: boolean;
    multiview?: boolean;
    framebufferScaleFactor?: number;
}

// https://www.w3.org/TR/webxrlayers-1/#XRWebGLBindingtype
declare class XRWebGLBinding {
    constructor(xrSession: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext);
    getReflectionCubeMap: (lightProbe: XRLightProbe) => WebGLTexture;

    // https://immersive-web.github.io/layers/#XRWebGLBindingtype
    createProjectionLayer(init: XRProjectionLayerInit): XRProjectionLayer;
    getSubImage(layer: XRCompositionLayer, frame: XRFrame, eye: XREye): XRWebGLSubImage;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRWebGLSubImage;
}

declare class XRWebGLLayer implements XRLayer {
    static getNativeFramebufferScaleFactor(session: XRSession): number;
    constructor(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext, layerInit?: XRWebGLLayerInit);
    readonly antialias: boolean;
    readonly framebuffer: WebGLFramebuffer;
    readonly framebufferWidth: number;
    readonly framebufferHeight: number;
    readonly ignoreDepthValues: boolean;
    fixedFoveation?: number | null;
    getViewport: (view: XRView) => XRViewport;

    // Methods for EventTarget required through XRLayer
    addEventListener(): void;
    dispatchEvent(): boolean;
    removeEventListener(): void;
}

type XRLayerLayout = "default" | "mono" | "stereo" | "stereo-left-right" | "stereo-top-bottom";

// https://immersive-web.github.io/layers/#xrcompositionlayertype
interface XRCompositionLayer extends XRLayer {
    layout: XRLayerLayout;

    blendTextureSourceAlpha: boolean;
    chromaticAberrationCorrection: boolean;
    mipLevels: number;

    needsRedraw: boolean;

    destroy(): void;
}

type XRTextureType = "texture" | "texture-array";

interface XRProjectionLayerInit {
    textureType: XRTextureType; //  Default  "texture";
    colorFormat: GLenum;        //  Default 0x1908, RGBA
    depthFormat: GLenum;        //  Default 0x1902, DEPTH_COMPONENT
    scaleFactor: number;        //  Default 1.0;
}

interface XRProjectionLayer extends XRCompositionLayer {
    textureWidth: number;
    textureHeight: number;
    textureArrayLength: number;

    ignoreDepthValues: boolean;
    fixedFoveation?: number;
}

interface XRSubImage {
    viewport: XRViewport;
}

interface XRWebGLSubImage extends XRSubImage {
    colorTexture: WebGLTexture;
    depthStencilTexture?: WebGLTexture;
    imageIndex?: number;
    textureWidth: number;
    textureHeight: number;
}

// tslint:disable-next-line no-empty-interface
interface XRSpace extends EventTarget { }

interface XRRenderState {
    readonly baseLayer?: XRWebGLLayer;
    readonly depthFar: number;
    readonly depthNear: number;
    readonly inlineVerticalFieldOfView?: number;
    readonly layers?: XRLayer[];
}

// https://immersive-web.github.io/webxr/#dictdef-xrrenderstateinit
interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
    depthFar: number;
    depthNear: number;
    inlineVerticalFieldOfView?: number;
    layers?: XRLayer[];
}

interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset: XREventHandler;
}

interface XRBoundedReferenceSpace extends XRSpace {
    readonly boundsGeometry: DOMPointReadOnly[];
}

interface XRInputSource {
    readonly handedness: XRHandedness;
    readonly targetRayMode: XRTargetRayMode;
    readonly targetRaySpace: XRSpace;
    readonly gripSpace?: XRSpace;
    readonly gamepad?: Gamepad;
    readonly profiles: Array<string>;
    readonly hand?: XRHand;
}

interface XRLightEstimate {
    readonly sphericalHarmonicsCoefficients: Float32Array;
    readonly primaryLightDirection: DOMPointReadOnly;
    readonly primaryLightIntensity: DOMPointReadOnly;
}

interface XRPose {
    readonly transform: XRRigidTransform;
    readonly emulatedPosition: boolean;
    readonly linearVelocity?: DOMPointReadOnly;
    readonly angularVelocity?: DOMPointReadOnly;
}

interface XRWorldInformation {
    detectedPlanes?: XRPlaneSet;
}

interface XRFrame {
    readonly session: XRSession;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;
    fillPoses?(spaces: XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;

    // AR
    getHitTestResults(hitTestSource: XRHitTestSource): Array<XRHitTestResult>;
    getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): Array<XRTransientInputHitTestResult>;
    // Anchors
    trackedAnchors?: XRAnchorSet;
    createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
    // World geometries. DEPRECATED
    worldInformation?: XRWorldInformation;
    detectedPlanes?: XRPlaneSet;
    // Hand tracking
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose;
    fillJointRadii?(jointSpaces: XRJointSpace[], radii: Float32Array): boolean;
    // Image tracking
    getImageTrackingResults?(): Array<XRImageTrackingResult>;
    getLightEstimate(xrLightProbe: XRLightProbe): XRLightEstimate;
}

interface XRInputSourceEvent extends Event {
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
}

interface XREyeTrackingSourceEvent extends Event {
    readonly gazeSpace: XRSpace;
}

type XRInputSourceArray = XRInputSource[];

type XRDOMOverlayState = {
    /**
     * set if supported, or is null if the feature is not supported
     */
    type: XRDOMOverlayType | null
};

interface XRLightProbe extends EventTarget {
    readonly probeSpace: XRSpace ;
    onreflectionchange: XREventHandler ;
  }

interface XRSession {
    addEventListener(type: XREventType, listener: XREventHandler, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: XREventType, listener: XREventHandler, options?: boolean | EventListenerOptions): void;
    /**
     * Returns a list of this session's XRInputSources, each representing an input device
     * used to control the camera and/or scene.
     */
    readonly inputSources: Array<XRInputSource>;
    /**
     * object which contains options affecting how the imagery is rendered.
     * This includes things such as the near and far clipping planes
     */
    readonly renderState: XRRenderState;
    readonly visibilityState: XRVisibilityState;
    /**
     * Removes a callback from the animation frame painting callback from
     * XRSession's set of animation frame rendering callbacks, given the
     * identifying handle returned by a previous call to requestAnimationFrame().
     */
    cancelAnimationFrame: (handle: number) => void;
    /**
     * Ends the WebXR session. Returns a promise which resolves when the
     * session has been shut down.
     */
    end(): Promise<void>;
    /**
     * Schedules the specified method to be called the next time the user agent
     * is working on rendering an animation frame for the WebXR device. Returns an
     * integer value which can be used to identify the request for the purposes of
     * canceling the callback using cancelAnimationFrame(). This method is comparable
     * to the Window.requestAnimationFrame() method.
     */
    requestAnimationFrame: (callback: XRFrameRequestCallback) => number;
    /**
     * Requests that a new XRReferenceSpace of the specified type be created.
     * Returns a promise which resolves with the XRReferenceSpace or
     * XRBoundedReferenceSpace which was requested, or throws a NotSupportedError if
     * the requested space type isn't supported by the device.
     */
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    requestReferenceSpace(type: XRBoundedReferenceSpaceType): Promise<XRBoundedReferenceSpace>;

    /**
     * The XRSession interface is extended with the ability to create new XRLightProbe instances.
     * XRLightProbe instances have a session object, which is the XRSession that created this XRLightProbe.
     *
     * Can reject with with a "NotSupportedError" DOMException
     */
    requestLightProbe(options?: XRLightProbeInit): Promise<XRLightProbe>;

    updateRenderState(state: XRRenderStateInit): void;

    onend: XREventHandler;
    oneyetrackingstart: XREventHandler;
    oneyetrackingend: XREventHandler;
    oninputsourceschange: XREventHandler;
    onselect: XREventHandler;
    onselectstart: XREventHandler;
    onselectend: XREventHandler;
    onsqueeze: XREventHandler;
    onsqueezestart: XREventHandler;
    onsqueezeend: XREventHandler;
    onvisibilitychange: XREventHandler;

    // hit test
    requestHitTestSource?(options: XRHitTestOptionsInit): Promise<XRHitTestSource>;
    requestHitTestSourceForTransientInput?(options: XRTransientInputHitTestOptionsInit): Promise<XRTransientInputHitTestSource>;

    // legacy AR hit test
    requestHitTest?(ray: XRRay, referenceSpace: XRReferenceSpace): Promise<XRHitResult[]>;

    // legacy plane detection
    updateWorldTrackingState?(options: { planeDetectionState?: { enabled: boolean } }): void;

    // image tracking
    getTrackedImageScores?(): XRImageTrackingScore[];

    /**
     * Provided when the optional 'dom-overlay' feature is requested.
     */
    readonly domOverlayState?: XRDOMOverlayState;
    /**
     * Indicates the XRReflectionFormat most closely supported by the underlying XR device
     */
    readonly preferredReflectionFormat?: XRReflectionFormat;

    readonly frameRate?: number;
    readonly supportedFrameRates?: Float32Array;
    updateTargetFrameRate(rate: number): Promise<void>;
}

interface XRViewerPose extends XRPose {
    readonly views: Array<XRView>;
}

declare class XRRigidTransform {
    constructor(position?: DOMPointInit, direction?: DOMPointInit);
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
    matrix: Float32Array;
    inverse: XRRigidTransform;
}

interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
    readonly transform: XRRigidTransform;
    readonly recommendedViewportScale?: number;
    requestViewportScale(scale: number): void;
}

interface XRInputSourceChangeEvent extends Event {
    session: XRSession;
    removed: Array<XRInputSource>;
    added: Array<XRInputSource>;
}

// Experimental/Draft features
declare class XRRay {
    constructor(transformOrOrigin: XRRigidTransform | DOMPointInit, direction?: DOMPointInit);
    origin: DOMPointReadOnly;
    direction: DOMPointReadOnly;
    matrix: Float32Array;
}

declare enum XRHitTestTrackableType {
    "point",
    "plane",
    "mesh",
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

interface XRJointSpace extends XRSpace { }

interface XRJointPose extends XRPose {
    radius: number | undefined;
}

// to be extended
type XRHandJoint = string;

interface XRHand extends Iterable<XRJointSpace> {
    readonly size: number;

    [index: number]: XRJointSpace;

    get(joint: XRHandJoint): XRJointSpace;

    readonly WRIST: number;

    readonly THUMB_METACARPAL: number;
    readonly THUMB_PHALANX_PROXIMAL: number;
    readonly THUMB_PHALANX_DISTAL: number;
    readonly THUMB_PHALANX_TIP: number;

    readonly INDEX_METACARPAL: number;
    readonly INDEX_PHALANX_PROXIMAL: number;
    readonly INDEX_PHALANX_INTERMEDIATE: number;
    readonly INDEX_PHALANX_DISTAL: number;
    readonly INDEX_PHALANX_TIP: number;

    readonly MIDDLE_METACARPAL: number;
    readonly MIDDLE_PHALANX_PROXIMAL: number;
    readonly MIDDLE_PHALANX_INTERMEDIATE: number;
    readonly MIDDLE_PHALANX_DISTAL: number;
    readonly MIDDLE_PHALANX_TIP: number;

    readonly RING_METACARPAL: number;
    readonly RING_PHALANX_PROXIMAL: number;
    readonly RING_PHALANX_INTERMEDIATE: number;
    readonly RING_PHALANX_DISTAL: number;
    readonly RING_PHALANX_TIP: number;

    readonly LITTLE_METACARPAL: number;
    readonly LITTLE_PHALANX_PROXIMAL: number;
    readonly LITTLE_PHALANX_INTERMEDIATE: number;
    readonly LITTLE_PHALANX_DISTAL: number;
    readonly LITTLE_PHALANX_TIP: number;
}

type XRImageTrackingState = "tracked" | "emulated";
type XRImageTrackingScore = "untrackable" | "trackable";

interface XRTrackedImageInit {
    image: ImageBitmap;
    widthInMeters: number;
}

interface XRImageTrackingResult {
    readonly imageSpace: XRSpace;
    readonly index: number;
    readonly trackingState: XRImageTrackingState;
    readonly measuredWidthInMeters: number;
}
