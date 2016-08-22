// Mixins
interface Window {
    mozIndexedDB(func: any): any;
    webkitIndexedDB(func: any): any;
    IDBTransaction(func: any): any;
    webkitIDBTransaction(func: any): any;
    msIDBTransaction(func: any): any;
    IDBKeyRange(func: any): any;
    webkitIDBKeyRange(func: any): any;
    msIDBKeyRange(func: any): any;
    webkitURL: HTMLURL;
    webkitRequestAnimationFrame(func: any): any;
    mozRequestAnimationFrame(func: any): any;
    oRequestAnimationFrame(func: any): any;
    WebGLRenderingContext: WebGLRenderingContext;
    MSGesture: MSGesture;
    CANNON: any;
    SIMD: any;
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
    PointerEvent: any;
}

interface HTMLURL {
    createObjectURL(param1: any, param2?: any);
}

interface Document {
    exitFullscreen(): void;
    webkitCancelFullScreen(): void;
    mozCancelFullScreen(): void;
    msCancelFullScreen(): void;
    mozFullScreen: boolean;
    msIsFullScreen: boolean;
    fullscreen: boolean;
    mozPointerLockElement: HTMLElement;
    msPointerLockElement: HTMLElement;
    webkitPointerLockElement: HTMLElement;
}

interface HTMLCanvasElement {
    requestPointerLock(): void;
    msRequestPointerLock(): void;
    mozRequestPointerLock(): void;
    webkitRequestPointerLock(): void;
}

interface CanvasRenderingContext2D {
    imageSmoothingEnabled: boolean;
    mozImageSmoothingEnabled: boolean;
    oImageSmoothingEnabled: boolean;
    webkitImageSmoothingEnabled: boolean;
}

interface WebGLTexture {
    isReady: boolean;
    isCube: boolean;
    url: string;
    noMipmap: boolean;
    samplingMode: number;
    references: number;
    generateMipMaps: boolean;
    type: number;
    _size: number;
    _baseWidth: number;
    _baseHeight: number;
    _width: number;
    _height: number;
    _workingCanvas: HTMLCanvasElement;
    _workingContext: CanvasRenderingContext2D;
    _framebuffer: WebGLFramebuffer;
    _depthBuffer: WebGLRenderbuffer;
    _cachedCoordinatesMode: number;
    _cachedWrapU: number;
    _cachedWrapV: number;
    _isDisabled: boolean;
}

interface WebGLBuffer {
    references: number;
    capacity: number;
    is32Bits: boolean;
}

interface MouseEvent {
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}

interface MSStyleCSSProperties {
    webkitTransform: string;
    webkitTransition: string;
}

interface Navigator {
    getVRDisplays: () => any;
    mozGetVRDevices: (any: any) => any;
    isCocoonJS: boolean;
}

interface Screen {
    orientation: string;
    mozOrientation: string;
}

interface HTMLMediaElement {
    crossOrigin: string;
}