// Mixins
interface Window {
    mozIndexedDB(func: any): any;
    webkitIndexedDB(func: any): any;
    msIndexedDB: IDBFactory;
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
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
}

interface AudioContext extends EventTarget {
    decodeAudioData(audioData: ArrayBuffer, successCallback: DecodeSuccessCallback, errorCallback?: any): void;
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
    msRequestPointerLock?(): void;
    mozRequestPointerLock?(): void;
    webkitRequestPointerLock?(): void;
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
    onLoadedCallbacks: Array<Function>;
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

interface Math {
    fround(x: number): number;
    imul(a: number, b: number): number;
}

interface SIMDglobal {
    SIMD: SIMD;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
}

interface SIMD {
    Float32x4: SIMD.Float32x4Constructor;
    Int32x4: SIMD.Int32x4Constructor;
    Int16x8: SIMD.Int16x8Constructor;
    Int8x16: SIMD.Int8x16Constructor;
    Uint32x4: SIMD.Uint32x4Constructor;
    Uint16x8: SIMD.Uint16x8Constructor;
    Uint8x16: SIMD.Uint8x16Constructor;
    Bool32x4: SIMD.Bool32x4Constructor;
    Bool16x8: SIMD.Bool16x8Constructor;
    Bool8x16: SIMD.Bool8x16Constructor;
}

interface GamepadPose {
    angularAccelaration: number;
    angularVelocity: Float32Array
    hasOrientation: boolean;
    hasPosition: boolean;
    linearAcceleration: number;
    linearVelocity: Float32Array;
    orientation: Float32Array
    position: Float32Array;
}

declare namespace SIMD {
    interface Float32x4 {
        constructor: Float32x4Constructor;
        valueOf(): Float32x4;
        toLocaleString(): string;
        toString(): string;
    }

    interface Float32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Float32x4;
        prototype: Float32x4;
        extractLane(simd: SIMD.Float32x4, lane: number): number;
        swizzle(a: SIMD.Float32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Float32x4;
        shuffle(a: SIMD.Float32x4, b: SIMD.Float32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Float32x4;
        check(a: SIMD.Float32x4): SIMD.Float32x4;
        splat(n: number): SIMD.Float32x4;
        replaceLane(simd: SIMD.Float32x4, lane: number, value: number): SIMD.Float32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        equal(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        add(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        sub(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        mul(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        div(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        neg(a: SIMD.Float32x4): SIMD.Float32x4;
        abs(a: SIMD.Float32x4): SIMD.Float32x4;
        min(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        max(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        minNum(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        maxNum(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        reciprocalApproximation(a: SIMD.Float32x4): SIMD.Float32x4;
        reciprocalSqrtApproximation(a: SIMD.Float32x4): SIMD.Float32x4;
        sqrt(a: SIMD.Float32x4): SIMD.Float32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        fromInt32x4(value: SIMD.Int32x4): SIMD.Float32x4;
        fromUint32x4(value: SIMD.Uint32x4): SIMD.Float32x4;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Float32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Float32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Float32x4;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Float32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Float32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Float32x4;
    }

    interface Int32x4 {
        constructor: Int32x4Constructor;
        valueOf(): Int32x4;
        toLocaleString(): string;
        toString(): string;
    }

    interface Int32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Int32x4;
        prototype: Int32x4;
        extractLane(simd: SIMD.Int32x4, lane: number): number;
        swizzle(a: SIMD.Int32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Int32x4;
        shuffle(a: SIMD.Int32x4, b: SIMD.Int32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Int32x4;
        check(a: SIMD.Int32x4): SIMD.Int32x4;
        splat(n: number): SIMD.Int32x4;
        replaceLane(simd: SIMD.Int32x4, lane: number, value: number): SIMD.Int32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        equal(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        and(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        or(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        xor(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        not(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        add(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        sub(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        mul(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        neg(a: SIMD.Int32x4): SIMD.Int32x4;
        shiftLeftByScalar(a: SIMD.Int32x4, bits: number): SIMD.Int32x4;
        shiftRightByScalar(a: SIMD.Int32x4, bits: number): SIMD.Int32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        fromFloat32x4(value: SIMD.Float32x4): SIMD.Int32x4;
        fromUint32x4(value: SIMD.Uint32x4): SIMD.Int32x4;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Int32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Int32x4;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int32x4;
    }

    interface Int16x8 {
        constructor: Int16x8Constructor;
        valueOf(): Int16x8;
        toLocaleString(): string;
        toString(): string;
    }

    interface Int16x8Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number): Int16x8;
        prototype: Int16x8;
        extractLane(simd: SIMD.Int16x8, lane: number): number;
        swizzle(a: SIMD.Int16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Int16x8;
        shuffle(a: SIMD.Int16x8, b: SIMD.Int16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Int16x8;
        check(a: SIMD.Int16x8): SIMD.Int16x8;
        splat(n: number): SIMD.Int16x8;
        replaceLane(simd: SIMD.Int16x8, lane: number, value: number): SIMD.Int16x8;
        select(selector: SIMD.Bool16x8, a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        equal(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        notEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        lessThan(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        lessThanOrEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        greaterThan(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        greaterThanOrEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        and(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        or(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        xor(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        not(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        add(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        sub(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        mul(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        neg(a: SIMD.Int16x8): SIMD.Int16x8;
        shiftLeftByScalar(a: SIMD.Int16x8, bits: number): SIMD.Int16x8;
        shiftRightByScalar(a: SIMD.Int16x8, bits: number): SIMD.Int16x8;
        addSaturate(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        subSaturate(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int16x8;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int16x8): SIMD.Int16x8;
        fromUint16x8(value: SIMD.Uint16x8): SIMD.Int16x8;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int16x8;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Int16x8;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Int16x8;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int16x8;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int16x8;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int16x8;
    }

    interface Int8x16 {
        constructor: Int8x16Constructor;
        valueOf(): Int8x16;
        toLocaleString(): string;
        toString(): string;
    }

    interface Int8x16Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number, s8?: number, s9?: number, s10?: number, s11?: number, s12?: number, s13?: number, s14?: number, s15?: number): Int8x16;
        prototype: Int8x16;
        extractLane(simd: SIMD.Int8x16, lane: number): number;
        swizzle(a: SIMD.Int8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Int8x16;
        shuffle(a: SIMD.Int8x16, b: SIMD.Int8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Int8x16;
        check(a: SIMD.Int8x16): SIMD.Int8x16;
        splat(n: number): SIMD.Int8x16;
        replaceLane(simd: SIMD.Int8x16, lane: number, value: number): SIMD.Int8x16;
        select(selector: SIMD.Bool8x16, a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        equal(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        notEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        lessThan(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        lessThanOrEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        greaterThan(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        greaterThanOrEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        and(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        or(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        xor(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        not(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        add(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        sub(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        mul(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        neg(a: SIMD.Int8x16): SIMD.Int8x16;
        shiftLeftByScalar(a: SIMD.Int8x16, bits: number): SIMD.Int8x16;
        shiftRightByScalar(a: SIMD.Int8x16, bits: number): SIMD.Int8x16;
        addSaturate(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        subSaturate(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int8x16;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int8x16): SIMD.Int8x16;
        fromUint8x16(value: SIMD.Uint8x16): SIMD.Int8x16;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int8x16;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Int8x16;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Int8x16;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int8x16;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int8x16;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int8x16;
    }

    interface Uint32x4 {
        constructor: Uint32x4Constructor;
        valueOf(): Uint32x4;
        toLocaleString(): string;
        toString(): string;
    }

    interface Uint32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Uint32x4;
        prototype: Uint32x4;
        extractLane(simd: SIMD.Uint32x4, lane: number): number;
        swizzle(a: SIMD.Uint32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Uint32x4;
        shuffle(a: SIMD.Uint32x4, b: SIMD.Uint32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Uint32x4;
        check(a: SIMD.Uint32x4): SIMD.Uint32x4;
        splat(n: number): SIMD.Uint32x4;
        replaceLane(simd: SIMD.Uint32x4, lane: number, value: number): SIMD.Uint32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        equal(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        and(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        or(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        xor(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        not(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        add(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        sub(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        mul(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        shiftLeftByScalar(a: SIMD.Uint32x4, bits: number): SIMD.Uint32x4;
        shiftRightByScalar(a: SIMD.Uint32x4, bits: number): SIMD.Uint32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        fromFloat32x4(value: SIMD.Float32x4): SIMD.Uint32x4;
        fromInt32x4(value: SIMD.Int32x4): SIMD.Uint32x4;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint32x4;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Uint32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Uint32x4;
    }

    interface Uint16x8 {
        constructor: Uint16x8Constructor;
        valueOf(): Uint16x8;
        toLocaleString(): string;
        toString(): string;
    }

    interface Uint16x8Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number): Uint16x8;
        prototype: Uint16x8;
        extractLane(simd: SIMD.Uint16x8, lane: number): number;
        swizzle(a: SIMD.Uint16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Uint16x8;
        shuffle(a: SIMD.Uint16x8, b: SIMD.Uint16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Uint16x8;
        check(a: SIMD.Uint16x8): SIMD.Uint16x8;
        splat(n: number): SIMD.Uint16x8;
        replaceLane(simd: SIMD.Uint16x8, lane: number, value: number): SIMD.Uint16x8;
        select(selector: SIMD.Bool16x8, a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        equal(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        notEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        lessThan(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        lessThanOrEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        greaterThan(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        greaterThanOrEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        and(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        or(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        xor(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        not(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        add(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        sub(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        mul(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        shiftLeftByScalar(a: SIMD.Uint16x8, bits: number): SIMD.Uint16x8;
        shiftRightByScalar(a: SIMD.Uint16x8, bits: number): SIMD.Uint16x8;
        addSaturate(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        subSaturate(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint16x8;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint16x8): SIMD.Uint16x8;
        fromInt16x8(value: SIMD.Int16x8): SIMD.Uint16x8;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint16x8;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint16x8;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint16x8;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint16x8;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Uint16x8;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Uint16x8;
    }

    interface Uint8x16 {
        constructor: Uint8x16Constructor;
        valueOf(): Uint8x16;
        toLocaleString(): string;
        toString(): string;
    }

    interface Uint8x16Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number, s8?: number, s9?: number, s10?: number, s11?: number, s12?: number, s13?: number, s14?: number, s15?: number): Uint8x16;
        prototype: Uint8x16;
        extractLane(simd: SIMD.Uint8x16, lane: number): number;
        swizzle(a: SIMD.Uint8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Uint8x16;
        shuffle(a: SIMD.Uint8x16, b: SIMD.Uint8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Uint8x16;
        check(a: SIMD.Uint8x16): SIMD.Uint8x16;
        splat(n: number): SIMD.Uint8x16;
        replaceLane(simd: SIMD.Uint8x16, lane: number, value: number): SIMD.Uint8x16;
        select(selector: SIMD.Bool8x16, a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        equal(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        notEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        lessThan(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        lessThanOrEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        greaterThan(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        greaterThanOrEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        and(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        or(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        xor(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        not(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        add(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        sub(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        mul(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        shiftLeftByScalar(a: SIMD.Uint8x16, bits: number): SIMD.Uint8x16;
        shiftRightByScalar(a: SIMD.Uint8x16, bits: number): SIMD.Uint8x16;
        addSaturate(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        subSaturate(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint8x16;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint8x16): SIMD.Uint8x16;
        fromInt8x16(value: SIMD.Int8x16): SIMD.Uint8x16;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint8x16;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint8x16;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint8x16;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint8x16;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Uint8x16;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Uint8x16;
    }

    interface Bool32x4 {
        constructor: Bool32x4Constructor;
        valueOf(): Bool32x4;
        toLocaleString(): string;
        toString(): string;
    }

    interface Bool32x4Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean): Bool32x4;
        prototype: Bool32x4;
        extractLane(simd: SIMD.Bool32x4, lane: number): boolean;
        check(a: SIMD.Bool32x4): SIMD.Bool32x4;
        splat(n: boolean): SIMD.Bool32x4;
        replaceLane(simd: SIMD.Bool32x4, lane: number, value: boolean): SIMD.Bool32x4;
        allTrue(a: SIMD.Bool32x4): boolean;
        anyTrue(a: SIMD.Bool32x4): boolean;
        and(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        or(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        xor(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        not(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
    }

    interface Bool16x8 {
        constructor: Bool16x8Constructor;
        valueOf(): Bool16x8;
        toLocaleString(): string;
        toString(): string;
    }

    interface Bool16x8Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean, s4?: boolean, s5?: boolean, s6?: boolean, s7?: boolean): Bool16x8;
        prototype: Bool16x8;
        extractLane(simd: SIMD.Bool16x8, lane: number): boolean;
        check(a: SIMD.Bool16x8): SIMD.Bool16x8;
        splat(n: boolean): SIMD.Bool16x8;
        replaceLane(simd: SIMD.Bool16x8, lane: number, value: boolean): SIMD.Bool16x8;
        allTrue(a: SIMD.Bool16x8): boolean;
        anyTrue(a: SIMD.Bool16x8): boolean;
        and(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        or(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        xor(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        not(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
    }

    interface Bool8x16 {
        constructor: Bool8x16Constructor;
        valueOf(): Bool8x16;
        toLocaleString(): string;
        toString(): string;
    }

    interface Bool8x16Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean, s4?: boolean, s5?: boolean, s6?: boolean, s7?: boolean, s8?: boolean, s9?: boolean, s10?: boolean, s11?: boolean, s12?: boolean, s13?: boolean, s14?: boolean, s15?: boolean): Bool8x16;
        prototype: Bool8x16;
        extractLane(simd: SIMD.Bool8x16, lane: number): boolean;
        check(a: SIMD.Bool8x16): SIMD.Bool8x16;
        splat(n: boolean): SIMD.Bool8x16;
        replaceLane(simd: SIMD.Bool8x16, lane: number, value: boolean): SIMD.Bool8x16;
        allTrue(a: SIMD.Bool8x16): boolean;
        anyTrue(a: SIMD.Bool8x16): boolean;
        and(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        or(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        xor(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        not(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
    }
}