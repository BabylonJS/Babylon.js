// Mixins
interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    webkitURL: typeof URL;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
    oRequestAnimationFrame(callback: FrameRequestCallback): number;
    WebGLRenderingContext: WebGLRenderingContext;
    MSGesture: MSGesture;
    CANNON: any;
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
    PointerEvent: any;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
    mozURL: typeof URL;
    msURL: typeof URL;
    VRFrameData: any; // WebVR, from specs 1.1
    DracoDecoderModule: any;
    setImmediate(handler: (...args: any[]) => void): number;
}

interface HTMLCanvasElement {
    requestPointerLock(): void;
    msRequestPointerLock?(): void;
    mozRequestPointerLock?(): void;
    webkitRequestPointerLock?(): void;

    /** Track whether a record is in progress */
    isRecording: boolean;
    /** Capture Stream method defined by some browsers */
    captureStream(fps?: number): MediaStream;
}

interface ICanvasGradient {
    addColorStop(offset: number, color: string): void;
}

interface ITextMetrics {
    readonly width: number;
}

interface ICanvasRenderingContext {
    msImageSmoothingEnabled: boolean;

    beginPath() : void;
    stroke(): void;
    closePath(): void;
    drawImage(image: any, dx: number, dy: number): void;
    drawImage(image: any, dx: number, dy: number, dWidth: number, dHeight: number): void;
    drawImage(image: any, sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    clearRect(x: number, y: number, width: number, height: number): void;
    fill(): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    getImageData(sx: number, sy: number, sw: number, sh: number): any; // check uses!!!
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): ITextMetrics;
    lineWidth: number;
    strokeStyle: string;
    fillStyle: string | ICanvasGradient;
    font: string;
    readonly canvas: ICanvas;
    msImageSmoothingEnabled: boolean;
}

interface MouseEvent {
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}

interface Navigator {
    mozGetVRDevices: (any: any) => any;
    webkitGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    mozGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    msGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;

    webkitGetGamepads(): Gamepad[];
    msGetGamepads(): Gamepad[];
    webkitGamepads(): Gamepad[];
}

interface HTMLVideoElement {
    mozSrcObject: any;
}

interface Math {
    fround(x: number): number;
    imul(a: number, b: number): number;
    log2(x: number): number;
}
