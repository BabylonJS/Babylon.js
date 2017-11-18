

declare module 'babylonjs' { 
    export = BABYLON; 
}
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
    mozURL: any;
    msURL: any;
    VRFrameData: any;
}
interface WebGLRenderingContext {
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    createVertexArray(): any;
    bindVertexArray(vao: BABYLON.Nullable<WebGLVertexArrayObject>): void;
    deleteVertexArray(vao: WebGLVertexArrayObject): void;
    blitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;
    renderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;
    bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null): void;
    getUniformBlockIndex(program: WebGLProgram, uniformBlockName: string): number;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: number, uniformBlockBinding: number): void;
    createQuery(): WebGLQuery;
    deleteQuery(query: WebGLQuery): void;
    beginQuery(target: number, query: WebGLQuery): void;
    endQuery(target: number): void;
    getQueryParameter(query: WebGLQuery, pname: number): any;
    getQuery(target: number, pname: number): any;
    MAX_SAMPLES: number;
    RGBA8: number;
    READ_FRAMEBUFFER: number;
    DRAW_FRAMEBUFFER: number;
    UNIFORM_BUFFER: number;
    HALF_FLOAT_OES: number;
    RGBA16F: number;
    RGBA32F: number;
    DEPTH24_STENCIL8: number;
    drawBuffers(buffers: number[]): void;
    readBuffer(src: number): void;
    readonly COLOR_ATTACHMENT0: number;
    readonly COLOR_ATTACHMENT1: number;
    readonly COLOR_ATTACHMENT2: number;
    readonly COLOR_ATTACHMENT3: number;
    ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    ANY_SAMPLES_PASSED: number;
    QUERY_RESULT_AVAILABLE: number;
    QUERY_RESULT: number;
}
interface HTMLURL {
    createObjectURL(param1: any, param2?: any): string;
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
    msImageSmoothingEnabled: boolean;
}
interface WebGLBuffer {
    references: number;
    capacity: number;
    is32Bits: boolean;
}
interface WebGLProgram {
    transformFeedback: BABYLON.Nullable<WebGLTransformFeedback>;
    __SPECTOR_rebuildProgram: BABYLON.Nullable<(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) => void>;
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
    getUserMedia: any;
    webkitGetUserMedia: any;
    mozGetUserMedia: any;
    msGetUserMedia: any;
    getGamepads(func?: any): any;
    webkitGetGamepads(func?: any): any;
    msGetGamepads(func?: any): any;
    webkitGamepads(func?: any): any;
}
interface HTMLVideoElement {
    mozSrcObject: any;
}
interface Screen {
    orientation: string;
    mozOrientation: string;
}
interface HTMLMediaElement {
    crossOrigin: string | null;
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
    hasOrientation: boolean;
    hasPosition: boolean;
    position?: Float32Array;
    linearVelocity?: Float32Array;
    linearAcceleration?: Float32Array;
    orientation?: Float32Array;
    angularVelocity?: Float32Array;
    angularAcceleration?: Float32Array;
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
interface EXT_disjoint_timer_query {
    QUERY_COUNTER_BITS_EXT: number;
    TIME_ELAPSED_EXT: number;
    TIMESTAMP_EXT: number;
    GPU_DISJOINT_EXT: number;
    QUERY_RESULT_EXT: number;
    QUERY_RESULT_AVAILABLE_EXT: number;
    queryCounterEXT(query: WebGLQuery, target: number): void;
    createQueryEXT(): WebGLQuery;
    beginQueryEXT(target: number, query: WebGLQuery): void;
    endQueryEXT(target: number): void;
    getQueryObjectEXT(query: WebGLQuery, target: number): any;
    deleteQueryEXT(query: WebGLQuery): void;
}

declare module BABYLON {
    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    class Node {
        name: string;
        id: string;
        uniqueId: number;
        state: string;
        metadata: any;
        doNotSerialize: boolean;
        animations: Animation[];
        private _ranges;
        onReady: (node: Node) => void;
        private _isEnabled;
        private _isReady;
        _currentRenderId: number;
        private _parentRenderId;
        _waitingParentId: Nullable<string>;
        private _scene;
        _cache: any;
        private _parentNode;
        private _children;
        parent: Nullable<Node>;
        getClassName(): string;
        /**
        * An event triggered when the mesh is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Node>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
         * @constructor
         * @param {string} name - the name and id to be given to this node
         * @param {BABYLON.Scene} the scene this node will be added to
         */
        constructor(name: string, scene?: Nullable<Scene>);
        getScene(): Scene;
        getEngine(): Engine;
        private _behaviors;
        addBehavior(behavior: Behavior<Node>): Node;
        removeBehavior(behavior: Behavior<Node>): Node;
        readonly behaviors: Behavior<Node>[];
        getBehaviorByName(name: string): Nullable<Behavior<Node>>;
        getWorldMatrix(): Matrix;
        _initCache(): void;
        updateCache(force?: boolean): void;
        _updateCache(ignoreParentClass?: boolean): void;
        _isSynchronized(): boolean;
        _markSyncedWithParent(): void;
        isSynchronizedWithParent(): boolean;
        isSynchronized(updateCache?: boolean): boolean;
        hasNewParent(update?: boolean): boolean;
        /**
         * Is this node ready to be used/rendered
         * @return {boolean} is it ready
         */
        isReady(): boolean;
        /**
         * Is this node enabled.
         * If the node has a parent and is enabled, the parent will be inspected as well.
         * @return {boolean} whether this node (and its parent) is enabled.
         * @see setEnabled
         */
        isEnabled(): boolean;
        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        setEnabled(value: boolean): void;
        /**
         * Is this node a descendant of the given node.
         * The function will iterate up the hierarchy until the ancestor was found or no more parents defined.
         * @param {BABYLON.Node} ancestor - The parent node to inspect
         * @see parent
         */
        isDescendantOf(ancestor: Node): boolean;
        /**
         * Evaluate the list of children and determine if they should be considered as descendants considering the given criterias
         * @param {BABYLON.Node[]} results the result array containing the nodes matching the given criterias
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         */
        _getDescendants(results: Node[], directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): void;
        /**
         * Will return all nodes that have this node as ascendant.
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[];
        /**
         * Get all child-meshes of this node.
         */
        getChildMeshes(directDecendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[];
        /**
         * Get all direct children of this node.
        */
        getChildren(predicate?: (node: Node) => boolean): Node[];
        _setReady(state: boolean): void;
        getAnimationByName(name: string): Nullable<Animation>;
        createAnimationRange(name: string, from: number, to: number): void;
        deleteAnimationRange(name: string, deleteFrames?: boolean): void;
        getAnimationRange(name: string): Nullable<AnimationRange>;
        beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): void;
        serializeAnimationRanges(): any;
        dispose(): void;
        static ParseAnimationRanges(node: Node, parsedNode: any, scene: Scene): void;
    }
}

declare module BABYLON {
    interface IDisposable {
        dispose(): void;
    }
    /**
     * This class is used by the onRenderingGroupObservable
     */
    class RenderingGroupInfo {
        /**
         * The Scene that being rendered
         */
        scene: Scene;
        /**
         * The camera currently used for the rendering pass
         */
        camera: Nullable<Camera>;
        /**
         * The ID of the renderingGroup being processed
         */
        renderingGroupId: number;
        /**
         * The rendering stage, can be either STAGE_PRECLEAR, STAGE_PREOPAQUE, STAGE_PRETRANSPARENT, STAGE_POSTTRANSPARENT
         */
        renderStage: number;
        /**
         * Stage corresponding to the very first hook in the renderingGroup phase: before the render buffer may be cleared
         * This stage will be fired no matter what
         */
        static STAGE_PRECLEAR: number;
        /**
         * Called before opaque object are rendered.
         * This stage will be fired only if there's 3D Opaque content to render
         */
        static STAGE_PREOPAQUE: number;
        /**
         * Called after the opaque objects are rendered and before the transparent ones
         * This stage will be fired only if there's 3D transparent content to render
         */
        static STAGE_PRETRANSPARENT: number;
        /**
         * Called after the transparent object are rendered, last hook of the renderingGroup phase
         * This stage will be fired no matter what
         */
        static STAGE_POSTTRANSPARENT: number;
    }
    /**
     * Represents a scene to be rendered by the engine.
     * @see http://doc.babylonjs.com/page.php?p=21911
     */
    class Scene implements IAnimatable {
        private static _FOGMODE_NONE;
        private static _FOGMODE_EXP;
        private static _FOGMODE_EXP2;
        private static _FOGMODE_LINEAR;
        private static _uniqueIdCounter;
        static MinDeltaTime: number;
        static MaxDeltaTime: number;
        /** The fog is deactivated */
        static readonly FOGMODE_NONE: number;
        /** The fog density is following an exponential function */
        static readonly FOGMODE_EXP: number;
        /** The fog density is following an exponential function faster than FOGMODE_EXP */
        static readonly FOGMODE_EXP2: number;
        /** The fog density is following a linear function. */
        static readonly FOGMODE_LINEAR: number;
        autoClear: boolean;
        autoClearDepthAndStencil: boolean;
        clearColor: Color4;
        ambientColor: Color3;
        _environmentBRDFTexture: BaseTexture;
        protected _environmentTexture: BaseTexture;
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to reference from here than from all the materials.
         */
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to set here than in all the materials.
         */
        environmentTexture: BaseTexture;
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Default image processing configuration used either in the rendering
         * Forward main pass or through the imageProcessingPostProcess if present.
         * As in the majority of the scene they are the same (exception for multi camera),
         * this is easier to reference from here than from all the materials and post process.
         *
         * No setter as we it is a shared configuration, you can set the values instead.
         */
        readonly imageProcessingConfiguration: ImageProcessingConfiguration;
        forceWireframe: boolean;
        private _forcePointsCloud;
        forcePointsCloud: boolean;
        forceShowBoundingBoxes: boolean;
        clipPlane: Nullable<Plane>;
        animationsEnabled: boolean;
        constantlyUpdateMeshUnderPointer: boolean;
        hoverCursor: string;
        defaultCursor: string;
        /**
         * This is used to call preventDefault() on pointer down
         * in order to block unwanted artifacts like system double clicks
         */
        preventDefaultOnPointerDown: boolean;
        metadata: any;
        loadingPluginName: string;
        private _spritePredicate;
        /**
        * An event triggered when the scene is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Scene>;
        private _onDisposeObserver;
        /** A function to be executed when this scene is disposed. */
        onDispose: () => void;
        /**
        * An event triggered before rendering the scene (right after animations and physics)
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<Scene>;
        private _onBeforeRenderObserver;
        /** A function to be executed before rendering this scene */
        beforeRender: Nullable<() => void>;
        /**
        * An event triggered after rendering the scene
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Scene>;
        private _onAfterRenderObserver;
        /** A function to be executed after rendering this scene */
        afterRender: Nullable<() => void>;
        /**
        * An event triggered before animating the scene
        * @type {BABYLON.Observable}
        */
        onBeforeAnimationsObservable: Observable<Scene>;
        /**
        * An event triggered after animations processing
        * @type {BABYLON.Observable}
        */
        onAfterAnimationsObservable: Observable<Scene>;
        /**
        * An event triggered before draw calls are ready to be sent
        * @type {BABYLON.Observable}
        */
        onBeforeDrawPhaseObservable: Observable<Scene>;
        /**
        * An event triggered after draw calls have been sent
        * @type {BABYLON.Observable}
        */
        onAfterDrawPhaseObservable: Observable<Scene>;
        /**
        * An event triggered when physic simulation is about to be run
        * @type {BABYLON.Observable}
        */
        onBeforePhysicsObservable: Observable<Scene>;
        /**
        * An event triggered when physic simulation has been done
        * @type {BABYLON.Observable}
        */
        onAfterPhysicsObservable: Observable<Scene>;
        /**
        * An event triggered when the scene is ready
        * @type {BABYLON.Observable}
        */
        onReadyObservable: Observable<Scene>;
        /**
        * An event triggered before rendering a camera
        * @type {BABYLON.Observable}
        */
        onBeforeCameraRenderObservable: Observable<Camera>;
        private _onBeforeCameraRenderObserver;
        beforeCameraRender: () => void;
        /**
        * An event triggered after rendering a camera
        * @type {BABYLON.Observable}
        */
        onAfterCameraRenderObservable: Observable<Camera>;
        private _onAfterCameraRenderObserver;
        afterCameraRender: () => void;
        /**
        * An event triggered when active meshes evaluation is about to start
        * @type {BABYLON.Observable}
        */
        onBeforeActiveMeshesEvaluationObservable: Observable<Scene>;
        /**
        * An event triggered when active meshes evaluation is done
        * @type {BABYLON.Observable}
        */
        onAfterActiveMeshesEvaluationObservable: Observable<Scene>;
        /**
        * An event triggered when particles rendering is about to start
        * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onBeforeParticlesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when particles rendering is done
        * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onAfterParticlesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when sprites rendering is about to start
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onBeforeSpritesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when sprites rendering is done
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onAfterSpritesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
        * @type {BABYLON.Observable}
        */
        onDataLoadedObservable: Observable<Scene>;
        /**
        * An event triggered when a camera is created
        * @type {BABYLON.Observable}
        */
        onNewCameraAddedObservable: Observable<Camera>;
        /**
        * An event triggered when a camera is removed
        * @type {BABYLON.Observable}
        */
        onCameraRemovedObservable: Observable<Camera>;
        /**
        * An event triggered when a light is created
        * @type {BABYLON.Observable}
        */
        onNewLightAddedObservable: Observable<Light>;
        /**
        * An event triggered when a light is removed
        * @type {BABYLON.Observable}
        */
        onLightRemovedObservable: Observable<Light>;
        /**
        * An event triggered when a geometry is created
        * @type {BABYLON.Observable}
        */
        onNewGeometryAddedObservable: Observable<Geometry>;
        /**
        * An event triggered when a geometry is removed
        * @type {BABYLON.Observable}
        */
        onGeometryRemovedObservable: Observable<Geometry>;
        /**
        * An event triggered when a transform node is created
        * @type {BABYLON.Observable}
        */
        onNewTransformNodeAddedObservable: Observable<TransformNode>;
        /**
        * An event triggered when a transform node is removed
        * @type {BABYLON.Observable}
        */
        onTransformNodeRemovedObservable: Observable<TransformNode>;
        /**
        * An event triggered when a mesh is created
        * @type {BABYLON.Observable}
        */
        onNewMeshAddedObservable: Observable<AbstractMesh>;
        /**
        * An event triggered when a mesh is removed
        * @type {BABYLON.Observable}
        */
        onMeshRemovedObservable: Observable<AbstractMesh>;
        /**
        * An event triggered when render targets are about to be rendered
        * Can happen multiple times per frame.
        * @type {BABYLON.Observable}
        */
        OnBeforeRenderTargetsRenderObservable: Observable<Scene>;
        /**
        * An event triggered when render targets were rendered.
        * Can happen multiple times per frame.
        * @type {BABYLON.Observable}
        */
        OnAfterRenderTargetsRenderObservable: Observable<Scene>;
        /**
        * An event triggered before calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        onBeforeStepObservable: Observable<Scene>;
        /**
        * An event triggered after calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        onAfterStepObservable: Observable<Scene>;
        /**
         * This Observable will be triggered for each stage of each renderingGroup of each rendered camera.
         * The RenderinGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        onRenderingGroupObservable: Observable<RenderingGroupInfo>;
        animations: Animation[];
        pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
        pointerUpPredicate: (Mesh: AbstractMesh) => boolean;
        pointerMovePredicate: (Mesh: AbstractMesh) => boolean;
        private _onPointerMove;
        private _onPointerDown;
        private _onPointerUp;
        /** Deprecated. Use onPointerObservable instead */
        onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerUp: (evt: PointerEvent, pickInfo: Nullable<PickingInfo>) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        private _gamepadManager;
        readonly gamepadManager: GamepadManager;
        /**
         * This observable event is triggered when any ponter event is triggered. It is registered during Scene.attachControl() and it is called BEFORE the 3D engine process anything (mesh/sprite picking for instance).
         * You have the possibility to skip the process and the call to onPointerObservable by setting PointerInfoPre.skipOnPointerObservable to true
         */
        onPrePointerObservable: Observable<PointerInfoPre>;
        /**
         * Observable event triggered each time an input event is received from the rendering canvas
         */
        onPointerObservable: Observable<PointerInfo>;
        readonly unTranslatedPointer: Vector2;
        /** The distance in pixel that you have to move to prevent some events */
        static DragMovementThreshold: number;
        /** Time in milliseconds to wait to raise long press events if button is still pressed */
        static LongPressDelay: number;
        /** Time in milliseconds with two consecutive clicks will be considered as a double click */
        static DoubleClickDelay: number;
        /** If you need to check double click without raising a single click at first click, enable this flag */
        static ExclusiveDoubleClickMode: boolean;
        private _initClickEvent;
        private _initActionManager;
        private _delayedSimpleClick;
        private _delayedSimpleClickTimeout;
        private _previousDelayedSimpleClickTimeout;
        private _meshPickProceed;
        private _previousButtonPressed;
        private _currentPickResult;
        private _previousPickResult;
        private _totalPointersPressed;
        private _doubleClickOccured;
        /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
        cameraToUseForPointers: Nullable<Camera>;
        private _pointerX;
        private _pointerY;
        private _unTranslatedPointerX;
        private _unTranslatedPointerY;
        private _startingPointerPosition;
        private _previousStartingPointerPosition;
        private _startingPointerTime;
        private _previousStartingPointerTime;
        private _timeAccumulator;
        private _currentStepId;
        private _currentInternalStep;
        _mirroredCameraPosition: Nullable<Vector3>;
        /**
         * This observable event is triggered when any keyboard event si raised and registered during Scene.attachControl()
         * You have the possibility to skip the process and the call to onKeyboardObservable by setting KeyboardInfoPre.skipOnPointerObservable to true
         */
        onPreKeyboardObservable: Observable<KeyboardInfoPre>;
        /**
         * Observable event triggered each time an keyboard event is received from the hosting window
         */
        onKeyboardObservable: Observable<KeyboardInfo>;
        private _onKeyDown;
        private _onKeyUp;
        private _onCanvasFocusObserver;
        private _onCanvasBlurObserver;
        /**
        * use right-handed coordinate system on this scene.
        * @type {boolean}
        */
        private _useRightHandedSystem;
        useRightHandedSystem: boolean;
        setStepId(newStepId: number): void;
        getStepId(): number;
        getInternalStep(): number;
        private _fogEnabled;
        /**
        * is fog enabled on this scene.
        */
        fogEnabled: boolean;
        private _fogMode;
        fogMode: number;
        fogColor: Color3;
        fogDensity: number;
        fogStart: number;
        fogEnd: number;
        /**
        * is shadow enabled on this scene.
        * @type {boolean}
        */
        private _shadowsEnabled;
        shadowsEnabled: boolean;
        /**
        * is light enabled on this scene.
        * @type {boolean}
        */
        private _lightsEnabled;
        lightsEnabled: boolean;
        /**
        * All of the lights added to this scene.
        * @see BABYLON.Light
        * @type {BABYLON.Light[]}
        */
        lights: Light[];
        /** All of the cameras added to this scene. */
        cameras: Camera[];
        /** All of the active cameras added to this scene. */
        activeCameras: Camera[];
        /** The current active camera */
        activeCamera: Nullable<Camera>;
        /**
        * All of the tranform nodes added to this scene.
        * @see BABYLON.TransformNode
        * @type {BABYLON.TransformNode[]}
        */
        transformNodes: TransformNode[];
        /**
        * All of the (abstract) meshes added to this scene.
        * @see BABYLON.AbstractMesh
        * @type {BABYLON.AbstractMesh[]}
        */
        meshes: AbstractMesh[];
        private _geometries;
        materials: Material[];
        multiMaterials: MultiMaterial[];
        private _defaultMaterial;
        /** The default material used on meshes when no material is affected */
        /** The default material used on meshes when no material is affected */
        defaultMaterial: Material;
        private _texturesEnabled;
        texturesEnabled: boolean;
        textures: BaseTexture[];
        particlesEnabled: boolean;
        particleSystems: IParticleSystem[];
        spritesEnabled: boolean;
        spriteManagers: SpriteManager[];
        layers: Layer[];
        highlightLayers: HighlightLayer[];
        private _skeletonsEnabled;
        skeletonsEnabled: boolean;
        skeletons: Skeleton[];
        morphTargetManagers: MorphTargetManager[];
        lensFlaresEnabled: boolean;
        lensFlareSystems: LensFlareSystem[];
        collisionsEnabled: boolean;
        private _workerCollisions;
        collisionCoordinator: ICollisionCoordinator;
        /** Defines the gravity applied to this scene */
        gravity: Vector3;
        postProcesses: PostProcess[];
        postProcessesEnabled: boolean;
        postProcessManager: PostProcessManager;
        private _postProcessRenderPipelineManager;
        readonly postProcessRenderPipelineManager: PostProcessRenderPipelineManager;
        renderTargetsEnabled: boolean;
        dumpNextRenderTargets: boolean;
        customRenderTargets: RenderTargetTexture[];
        useDelayedTextureLoading: boolean;
        importedMeshesFiles: String[];
        probesEnabled: boolean;
        reflectionProbes: ReflectionProbe[];
        database: Database;
        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        actionManager: ActionManager;
        _actionManagers: ActionManager[];
        private _meshesForIntersections;
        proceduralTexturesEnabled: boolean;
        _proceduralTextures: ProceduralTexture[];
        private _mainSoundTrack;
        soundTracks: SoundTrack[];
        private _audioEnabled;
        private _headphone;
        readonly mainSoundTrack: SoundTrack;
        VRHelper: VRExperienceHelper;
        simplificationQueue: SimplificationQueue;
        private _engine;
        private _totalVertices;
        _activeIndices: PerfCounter;
        _activeParticles: PerfCounter;
        _activeBones: PerfCounter;
        private _animationRatio;
        private _animationTimeLast;
        private _animationTime;
        animationTimeScale: number;
        _cachedMaterial: Nullable<Material>;
        _cachedEffect: Nullable<Effect>;
        _cachedVisibility: Nullable<number>;
        private _renderId;
        private _executeWhenReadyTimeoutId;
        private _intermediateRendering;
        private _viewUpdateFlag;
        private _projectionUpdateFlag;
        private _alternateViewUpdateFlag;
        private _alternateProjectionUpdateFlag;
        _toBeDisposed: SmartArray<Nullable<IDisposable>>;
        private _pendingData;
        private _isDisposed;
        private _activeMeshes;
        private _processedMaterials;
        private _renderTargets;
        _activeParticleSystems: SmartArray<IParticleSystem>;
        private _activeSkeletons;
        private _softwareSkinnedMeshes;
        private _renderingManager;
        private _physicsEngine;
        _activeAnimatables: Animatable[];
        private _transformMatrix;
        private _sceneUbo;
        private _alternateSceneUbo;
        private _pickWithRayInverseMatrix;
        private _boundingBoxRenderer;
        private _outlineRenderer;
        private _viewMatrix;
        private _projectionMatrix;
        private _alternateViewMatrix;
        private _alternateProjectionMatrix;
        private _alternateTransformMatrix;
        private _useAlternateCameraConfiguration;
        private _alternateRendering;
        _forcedViewPosition: Nullable<Vector3>;
        readonly _isAlternateRenderingEnabled: boolean;
        private _frustumPlanes;
        readonly frustumPlanes: Plane[];
        requireLightSorting: boolean;
        private _selectionOctree;
        private _pointerOverMesh;
        private _pointerOverSprite;
        private _debugLayer;
        private _depthRenderer;
        private _geometryBufferRenderer;
        private _pickedDownMesh;
        private _pickedUpMesh;
        private _pickedDownSprite;
        private _externalData;
        private _uid;
        /**
         * @constructor
         * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
         */
        constructor(engine: Engine);
        readonly debugLayer: DebugLayer;
        workerCollisions: boolean;
        readonly selectionOctree: Octree<AbstractMesh>;
        /**
         * The mesh that is currently under the pointer.
         * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
         */
        readonly meshUnderPointer: Nullable<AbstractMesh>;
        /**
         * Current on-screen X position of the pointer
         * @return {number} X position of the pointer
         */
        readonly pointerX: number;
        /**
         * Current on-screen Y position of the pointer
         * @return {number} Y position of the pointer
         */
        readonly pointerY: number;
        getCachedMaterial(): Nullable<Material>;
        getCachedEffect(): Nullable<Effect>;
        getCachedVisibility(): Nullable<number>;
        isCachedMaterialInvalid(material: Material, effect: Effect, visibility?: number): boolean;
        getBoundingBoxRenderer(): BoundingBoxRenderer;
        getOutlineRenderer(): OutlineRenderer;
        getEngine(): Engine;
        getTotalVertices(): number;
        readonly totalVerticesPerfCounter: PerfCounter;
        getActiveIndices(): number;
        readonly totalActiveIndicesPerfCounter: PerfCounter;
        getActiveParticles(): number;
        readonly activeParticlesPerfCounter: PerfCounter;
        getActiveBones(): number;
        readonly activeBonesPerfCounter: PerfCounter;
        getInterFramePerfCounter(): number;
        readonly interFramePerfCounter: Nullable<PerfCounter>;
        getLastFrameDuration(): number;
        readonly lastFramePerfCounter: Nullable<PerfCounter>;
        getEvaluateActiveMeshesDuration(): number;
        readonly evaluateActiveMeshesDurationPerfCounter: Nullable<PerfCounter>;
        getActiveMeshes(): SmartArray<AbstractMesh>;
        getRenderTargetsDuration(): number;
        getRenderDuration(): number;
        readonly renderDurationPerfCounter: Nullable<PerfCounter>;
        getParticlesDuration(): number;
        readonly particlesDurationPerfCounter: Nullable<PerfCounter>;
        getSpritesDuration(): number;
        readonly spriteDuractionPerfCounter: Nullable<PerfCounter>;
        getAnimationRatio(): number;
        getRenderId(): number;
        incrementRenderId(): void;
        private _updatePointerPosition(evt);
        private _createUbo();
        private _createAlternateUbo();
        /**
         * Use this method to simulate a pointer move on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerMove(pickResult: PickingInfo): Scene;
        private _processPointerMove(pickResult, evt);
        /**
         * Use this method to simulate a pointer down on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerDown(pickResult: PickingInfo): Scene;
        private _processPointerDown(pickResult, evt);
        /**
         * Use this method to simulate a pointer up on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerUp(pickResult: PickingInfo): Scene;
        private _processPointerUp(pickResult, evt, clickInfo);
        /**
        * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
        * @param attachUp defines if you want to attach events to pointerup
        * @param attachDown defines if you want to attach events to pointerdown
        * @param attachMove defines if you want to attach events to pointermove
        */
        attachControl(attachUp?: boolean, attachDown?: boolean, attachMove?: boolean): void;
        detachControl(): void;
        isReady(): boolean;
        resetCachedMaterial(): void;
        registerBeforeRender(func: () => void): void;
        unregisterBeforeRender(func: () => void): void;
        registerAfterRender(func: () => void): void;
        unregisterAfterRender(func: () => void): void;
        _addPendingData(data: any): void;
        _removePendingData(data: any): void;
        getWaitingItemsCount(): number;
        readonly isLoading: boolean;
        /**
         * Registers a function to be executed when the scene is ready.
         * @param {Function} func - the function to be executed.
         */
        executeWhenReady(func: () => void): void;
        _checkIsReady(): void;
        /**
         * Will start the animation sequence of a given target
         * @param target - the target
         * @param {number} from - from which frame should animation start
         * @param {number} to - till which frame should animation run.
         * @param {boolean} [loop] - should the animation loop
         * @param {number} [speedRatio] - the speed in which to run the animation
         * @param {Function} [onAnimationEnd] function to be executed when the animation ended.
         * @param {BABYLON.Animatable} [animatable] an animatable object. If not provided a new one will be created from the given params.
         * Returns {BABYLON.Animatable} the animatable object created for this animation
         * See BABYLON.Animatable
         */
        beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, animatable?: Animatable): Animatable;
        beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable;
        getAnimatableByTarget(target: any): Nullable<Animatable>;
        readonly Animatables: Animatable[];
        /**
         * Will stop the animation of the given target
         * @param target - the target
         * @param animationName - the name of the animation to stop (all animations will be stopped is empty)
         * @see beginAnimation
         */
        stopAnimation(target: any, animationName?: string): void;
        /**
         * Stops and removes all animations that have been applied to the scene
         */
        stopAllAnimations(): void;
        private _animate();
        _switchToAlternateCameraConfiguration(active: boolean): void;
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix): void;
        _setAlternateTransformMatrix(view: Matrix, projection: Matrix): void;
        getSceneUniformBuffer(): UniformBuffer;
        getUniqueId(): number;
        addMesh(newMesh: AbstractMesh): void;
        removeMesh(toRemove: AbstractMesh): number;
        addTransformNode(newTransformNode: TransformNode): void;
        removeTransformNode(toRemove: TransformNode): number;
        removeSkeleton(toRemove: Skeleton): number;
        removeMorphTargetManager(toRemove: MorphTargetManager): number;
        removeLight(toRemove: Light): number;
        removeCamera(toRemove: Camera): number;
        addLight(newLight: Light): void;
        sortLightsByPriority(): void;
        addCamera(newCamera: Camera): void;
        /**
         * Switch active camera
         * @param {Camera} newCamera - new active camera
         * @param {boolean} attachControl - call attachControl for the new active camera (default: true)
         */
        switchActiveCamera(newCamera: Camera, attachControl?: boolean): void;
        /**
         * sets the active camera of the scene using its ID
         * @param {string} id - the camera's ID
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        setActiveCameraByID(id: string): Nullable<Camera>;
        /**
         * sets the active camera of the scene using its name
         * @param {string} name - the camera's name
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        setActiveCameraByName(name: string): Nullable<Camera>;
        /**
         * get a material using its id
         * @param {string} the material's ID
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        getMaterialByID(id: string): Nullable<Material>;
        /**
         * get a material using its name
         * @param {string} the material's name
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        getMaterialByName(name: string): Nullable<Material>;
        getLensFlareSystemByName(name: string): Nullable<LensFlareSystem>;
        getLensFlareSystemByID(id: string): Nullable<LensFlareSystem>;
        getCameraByID(id: string): Nullable<Camera>;
        getCameraByUniqueID(uniqueId: number): Nullable<Camera>;
        /**
         * get a camera using its name
         * @param {string} the camera's name
         * @return {BABYLON.Camera|null} the camera or null if none found.
         */
        getCameraByName(name: string): Nullable<Camera>;
        /**
         * get a bone using its id
         * @param {string} the bone's id
         * @return {BABYLON.Bone|null} the bone or null if not found
         */
        getBoneByID(id: string): Nullable<Bone>;
        /**
        * get a bone using its id
        * @param {string} the bone's name
        * @return {BABYLON.Bone|null} the bone or null if not found
        */
        getBoneByName(name: string): Nullable<Bone>;
        /**
         * get a light node using its name
         * @param {string} the light's name
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByName(name: string): Nullable<Light>;
        /**
         * get a light node using its ID
         * @param {string} the light's id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByID(id: string): Nullable<Light>;
        /**
         * get a light node using its scene-generated unique ID
         * @param {number} the light's unique id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByUniqueID(uniqueId: number): Nullable<Light>;
        /**
         * get a particle system by id
         * @param id {number} the particle system id
         * @return {BABYLON.IParticleSystem|null} the corresponding system or null if none found.
         */
        getParticleSystemByID(id: string): Nullable<IParticleSystem>;
        /**
         * get a geometry using its ID
         * @param {string} the geometry's id
         * @return {BABYLON.Geometry|null} the geometry or null if none found.
         */
        getGeometryByID(id: string): Nullable<Geometry>;
        /**
         * add a new geometry to this scene.
         * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
         * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
         * @return {boolean} was the geometry added or not
         */
        pushGeometry(geometry: Geometry, force?: boolean): boolean;
        /**
         * Removes an existing geometry
         * @param {BABYLON.Geometry} geometry - the geometry to be removed from the scene.
         * @return {boolean} was the geometry removed or not
         */
        removeGeometry(geometry: Geometry): boolean;
        getGeometries(): Geometry[];
        /**
         * Get the first added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getMeshByID(id: string): Nullable<AbstractMesh>;
        getMeshesByID(id: string): Array<AbstractMesh>;
        /**
         * Get the first added transform node found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.TransformNode|null} the transform node found or null if not found at all.
         */
        getTransformNodeByID(id: string): Nullable<TransformNode>;
        getTransformNodesByID(id: string): Array<TransformNode>;
        /**
         * Get a mesh with its auto-generated unique id
         * @param {number} uniqueId - the unique id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getMeshByUniqueID(uniqueId: number): Nullable<AbstractMesh>;
        /**
         * Get a the last added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getLastMeshByID(id: string): Nullable<AbstractMesh>;
        /**
         * Get a the last added node (Mesh, Camera, Light) found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.Node|null} the node found or null if not found at all.
         */
        getLastEntryByID(id: string): Nullable<Node>;
        getNodeByID(id: string): Nullable<Node>;
        getNodeByName(name: string): Nullable<Node>;
        getMeshByName(name: string): Nullable<AbstractMesh>;
        getTransformNodeByName(name: string): Nullable<TransformNode>;
        getSoundByName(name: string): Nullable<Sound>;
        getLastSkeletonByID(id: string): Nullable<Skeleton>;
        getSkeletonById(id: string): Nullable<Skeleton>;
        getSkeletonByName(name: string): Nullable<Skeleton>;
        getMorphTargetManagerById(id: number): Nullable<MorphTargetManager>;
        isActiveMesh(mesh: AbstractMesh): boolean;
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @return The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
        /**
         * Return a unique id as a string which can serve as an identifier for the scene
         */
        readonly uid: string;
        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        addExternalData<T>(key: string, data: T): boolean;
        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        getExternalData<T>(key: string): Nullable<T>;
        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T;
        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        removeExternalData(key: string): boolean;
        private _evaluateSubMesh(subMesh, mesh);
        _isInIntermediateRendering(): boolean;
        private _activeMeshesFrozen;
        /**
         * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
         */
        freezeActiveMeshes(): Scene;
        /**
         * Use this function to restart evaluating active meshes on every frame
         */
        unfreezeActiveMeshes(): this;
        private _evaluateActiveMeshes();
        private _activeMesh(sourceMesh, mesh);
        updateTransformMatrix(force?: boolean): void;
        updateAlternateTransformMatrix(alternateCamera: Camera): void;
        private _renderForCamera(camera);
        private _processSubCameras(camera);
        private _checkIntersections();
        render(): void;
        private _updateAudioParameters();
        audioEnabled: boolean;
        private _disableAudio();
        private _enableAudio();
        headphone: boolean;
        private _switchAudioModeForHeadphones();
        private _switchAudioModeForNormalSpeakers();
        enableDepthRenderer(): DepthRenderer;
        disableDepthRenderer(): void;
        enableGeometryBufferRenderer(ratio?: number): Nullable<GeometryBufferRenderer>;
        disableGeometryBufferRenderer(): void;
        freezeMaterials(): void;
        unfreezeMaterials(): void;
        dispose(): void;
        readonly isDisposed: boolean;
        disposeSounds(): void;
        getWorldExtends(): {
            min: Vector3;
            max: Vector3;
        };
        createOrUpdateSelectionOctree(maxCapacity?: number, maxDepth?: number): Octree<AbstractMesh>;
        createPickingRay(x: number, y: number, world: Matrix, camera: Nullable<Camera>, cameraViewSpace?: boolean): Ray;
        createPickingRayToRef(x: number, y: number, world: Matrix, result: Ray, camera: Nullable<Camera>, cameraViewSpace?: boolean): Scene;
        createPickingRayInCameraSpace(x: number, y: number, camera?: Camera): Ray;
        createPickingRayInCameraSpaceToRef(x: number, y: number, result: Ray, camera?: Camera): Scene;
        private _internalPick(rayFunction, predicate?, fastCheck?);
        private _internalMultiPick(rayFunction, predicate?);
        private _internalPickSprites(ray, predicate?, fastCheck?, camera?);
        private _tempPickingRay;
        /** Launch a ray to try to pick a mesh in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo>;
        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;
        private _cachedRayForTransform;
        /** Use the given ray to pick a mesh in the scene
         * @param ray The ray to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         */
        pickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo>;
        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param x X position on screen
         * @param y Y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        multiPick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, camera?: Camera): Nullable<PickingInfo[]>;
        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param ray Ray to use
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         */
        multiPickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo[]>;
        setPointerOverMesh(mesh: Nullable<AbstractMesh>): void;
        getPointerOverMesh(): Nullable<AbstractMesh>;
        setPointerOverSprite(sprite: Nullable<Sprite>): void;
        getPointerOverSprite(): Nullable<Sprite>;
        getPhysicsEngine(): Nullable<PhysicsEngine>;
        /**
         * Enables physics to the current scene
         * @param {BABYLON.Vector3} [gravity] - the scene's gravity for the physics engine
         * @param {BABYLON.IPhysicsEnginePlugin} [plugin] - The physics engine to be used. defaults to OimoJS.
         * @return {boolean} was the physics engine initialized
         */
        enablePhysics(gravity?: Nullable<Vector3>, plugin?: IPhysicsEnginePlugin): boolean;
        disablePhysicsEngine(): void;
        isPhysicsEnabled(): boolean;
        deleteCompoundImpostor(compound: any): void;
        _rebuildGeometries(): void;
        _rebuildTextures(): void;
        createDefaultCameraOrLight(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;
        createDefaultSkybox(environmentTexture?: BaseTexture, pbr?: boolean, scale?: number, blur?: number): Nullable<Mesh>;
        createDefaultEnvironment(options: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper>;
        createDefaultVRExperience(webVROptions?: WebVROptions): VRExperienceHelper;
        private _getByTags(list, tagsQuery, forEach?);
        getMeshesByTags(tagsQuery: string, forEach?: (mesh: AbstractMesh) => void): Mesh[];
        getCamerasByTags(tagsQuery: string, forEach?: (camera: Camera) => void): Camera[];
        getLightsByTags(tagsQuery: string, forEach?: (light: Light) => void): Light[];
        getMaterialByTags(tagsQuery: string, forEach?: (material: Material) => void): Material[];
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         * @param depth Automatically clears depth between groups if true and autoClear is true.
         * @param stencil Automatically clears stencil between groups if true and autoClear is true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth?: boolean, stencil?: boolean): void;
        /**
         * Will flag all materials as dirty to trigger new shader compilation
         * @param predicate If not null, it will be used to specifiy if a material has to be marked as dirty
         */
        markAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void;
    }
}

declare module BABYLON {
    type Nullable<T> = T | null;
    type float = number;
    type double = number;
    type int = number;
    type FloatArray = number[] | Float32Array;
    type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;
}

declare module BABYLON {
    class Action {
        triggerOptions: any;
        trigger: number;
        _actionManager: ActionManager;
        private _nextActiveAction;
        private _child;
        private _condition?;
        private _triggerParameter;
        onBeforeExecuteObservable: Observable<Action>;
        constructor(triggerOptions: any, condition?: Condition);
        _prepare(): void;
        getTriggerParameter(): any;
        _executeCurrent(evt?: ActionEvent): void;
        execute(evt?: ActionEvent): void;
        skipToNextActiveAction(): void;
        then(action: Action): Action;
        _getProperty(propertyPath: string): string;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        serialize(parent: any): any;
        protected _serialize(serializedAction: any, parent?: any): any;
        static _SerializeValueAsString: (value: any) => string;
        static _GetTargetProperty: (target: Node | Scene) => {
            name: string;
            targetType: string;
            value: string;
        };
    }
}

declare module BABYLON {
    /**
     * ActionEvent is the event beint sent when an action is triggered.
     */
    class ActionEvent {
        source: any;
        pointerX: number;
        pointerY: number;
        meshUnderPointer: Nullable<AbstractMesh>;
        sourceEvent: any;
        additionalData: any;
        /**
         * @param source The mesh or sprite that triggered the action.
         * @param pointerX The X mouse cursor position at the time of the event
         * @param pointerY The Y mouse cursor position at the time of the event
         * @param meshUnderPointer The mesh that is currently pointed at (can be null)
         * @param sourceEvent the original (browser) event that triggered the ActionEvent
         */
        constructor(source: any, pointerX: number, pointerY: number, meshUnderPointer: Nullable<AbstractMesh>, sourceEvent?: any, additionalData?: any);
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source mesh that triggered the event
         * @param evt {Event} The original (browser) event
         */
        static CreateNew(source: AbstractMesh, evt?: Event, additionalData?: any): ActionEvent;
        /**
         * Helper function to auto-create an ActionEvent from a source mesh.
         * @param source The source sprite that triggered the event
         * @param scene Scene associated with the sprite
         * @param evt {Event} The original (browser) event
         */
        static CreateNewFromSprite(source: Sprite, scene: Scene, evt?: Event, additionalData?: any): ActionEvent;
        /**
         * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
         * @param scene the scene where the event occurred
         * @param evt {Event} The original (browser) event
         */
        static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent;
        static CreateNewFromPrimitive(prim: any, pointerPos: Vector2, evt?: Event, additionalData?: any): ActionEvent;
    }
    /**
     * Action Manager manages all events to be triggered on a given mesh or the global scene.
     * A single scene can have many Action Managers to handle predefined actions on specific meshes.
     */
    class ActionManager {
        private static _NothingTrigger;
        private static _OnPickTrigger;
        private static _OnLeftPickTrigger;
        private static _OnRightPickTrigger;
        private static _OnCenterPickTrigger;
        private static _OnPickDownTrigger;
        private static _OnDoublePickTrigger;
        private static _OnPickUpTrigger;
        private static _OnLongPressTrigger;
        private static _OnPointerOverTrigger;
        private static _OnPointerOutTrigger;
        private static _OnEveryFrameTrigger;
        private static _OnIntersectionEnterTrigger;
        private static _OnIntersectionExitTrigger;
        private static _OnKeyDownTrigger;
        private static _OnKeyUpTrigger;
        private static _OnPickOutTrigger;
        static readonly NothingTrigger: number;
        static readonly OnPickTrigger: number;
        static readonly OnLeftPickTrigger: number;
        static readonly OnRightPickTrigger: number;
        static readonly OnCenterPickTrigger: number;
        static readonly OnPickDownTrigger: number;
        static readonly OnDoublePickTrigger: number;
        static readonly OnPickUpTrigger: number;
        static readonly OnPickOutTrigger: number;
        static readonly OnLongPressTrigger: number;
        static readonly OnPointerOverTrigger: number;
        static readonly OnPointerOutTrigger: number;
        static readonly OnEveryFrameTrigger: number;
        static readonly OnIntersectionEnterTrigger: number;
        static readonly OnIntersectionExitTrigger: number;
        static readonly OnKeyDownTrigger: number;
        static readonly OnKeyUpTrigger: number;
        static Triggers: {
            [key: string]: number;
        };
        actions: Action[];
        hoverCursor: string;
        private _scene;
        constructor(scene: Scene);
        dispose(): void;
        getScene(): Scene;
        /**
         * Does this action manager handles actions of any of the given triggers
         * @param {number[]} triggers - the triggers to be tested
         * @return {boolean} whether one (or more) of the triggers is handeled
         */
        hasSpecificTriggers(triggers: number[]): boolean;
        /**
         * Does this action manager handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled
         */
        hasSpecificTrigger(trigger: number): boolean;
        /**
         * Does this action manager has pointer triggers
         * @return {boolean} whether or not it has pointer triggers
         */
        readonly hasPointerTriggers: boolean;
        /**
         * Does this action manager has pick triggers
         * @return {boolean} whether or not it has pick triggers
         */
        readonly hasPickTriggers: boolean;
        /**
         * Does exist one action manager with at least one trigger
         * @return {boolean} whether or not it exists one action manager with one trigger
        **/
        static readonly HasTriggers: boolean;
        /**
         * Does exist one action manager with at least one pick trigger
         * @return {boolean} whether or not it exists one action manager with one pick trigger
        **/
        static readonly HasPickTriggers: boolean;
        /**
         * Does exist one action manager that handles actions of a given trigger
         * @param {number} trigger - the trigger to be tested
         * @return {boolean} whether the trigger is handeled by at least one action manager
        **/
        static HasSpecificTrigger(trigger: number): boolean;
        /**
         * Registers an action to this action manager
         * @param {BABYLON.Action} action - the action to be registered
         * @return {BABYLON.Action} the action amended (prepared) after registration
         */
        registerAction(action: Action): Nullable<Action>;
        /**
         * Process a specific trigger
         * @param {number} trigger - the trigger to process
         * @param evt {BABYLON.ActionEvent} the event details to be processed
         */
        processTrigger(trigger: number, evt?: ActionEvent): void;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        _getProperty(propertyPath: string): string;
        serialize(name: string): any;
        static Parse(parsedActions: any, object: Nullable<AbstractMesh>, scene: Scene): void;
        static GetTriggerName(trigger: number): string;
    }
}

declare module BABYLON {
    class Condition {
        _actionManager: ActionManager;
        _evaluationId: number;
        _currentResult: boolean;
        constructor(actionManager: ActionManager);
        isValid(): boolean;
        _getProperty(propertyPath: string): string;
        _getEffectiveTarget(target: any, propertyPath: string): any;
        serialize(): any;
        protected _serialize(serializedCondition: any): any;
    }
    class ValueCondition extends Condition {
        propertyPath: string;
        value: any;
        operator: number;
        private static _IsEqual;
        private static _IsDifferent;
        private static _IsGreater;
        private static _IsLesser;
        static readonly IsEqual: number;
        static readonly IsDifferent: number;
        static readonly IsGreater: number;
        static readonly IsLesser: number;
        _actionManager: ActionManager;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(actionManager: ActionManager, target: any, propertyPath: string, value: any, operator?: number);
        isValid(): boolean;
        serialize(): any;
        static GetOperatorName(operator: number): string;
    }
    class PredicateCondition extends Condition {
        predicate: () => boolean;
        _actionManager: ActionManager;
        constructor(actionManager: ActionManager, predicate: () => boolean);
        isValid(): boolean;
    }
    class StateCondition extends Condition {
        value: string;
        _actionManager: ActionManager;
        private _target;
        constructor(actionManager: ActionManager, target: any, value: string);
        isValid(): boolean;
        serialize(): any;
    }
}

declare module BABYLON {
    class SwitchBooleanAction extends Action {
        propertyPath: string;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class SetStateAction extends Action {
        value: string;
        private _target;
        constructor(triggerOptions: any, target: any, value: string, condition?: Condition);
        execute(): void;
        serialize(parent: any): any;
    }
    class SetValueAction extends Action {
        propertyPath: string;
        value: any;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class IncrementValueAction extends Action {
        propertyPath: string;
        value: any;
        private _target;
        private _effectiveTarget;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class PlayAnimationAction extends Action {
        from: number;
        to: number;
        loop: boolean | undefined;
        private _target;
        constructor(triggerOptions: any, target: any, from: number, to: number, loop?: boolean | undefined, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class StopAnimationAction extends Action {
        private _target;
        constructor(triggerOptions: any, target: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class DoNothingAction extends Action {
        constructor(triggerOptions?: any, condition?: Condition);
        execute(): void;
        serialize(parent: any): any;
    }
    class CombineAction extends Action {
        children: Action[];
        constructor(triggerOptions: any, children: Action[], condition?: Condition);
        _prepare(): void;
        execute(evt: ActionEvent): void;
        serialize(parent: any): any;
    }
    class ExecuteCodeAction extends Action {
        func: (evt: ActionEvent) => void;
        constructor(triggerOptions: any, func: (evt: ActionEvent) => void, condition?: Condition);
        execute(evt: ActionEvent): void;
    }
    class SetParentAction extends Action {
        private _parent;
        private _target;
        constructor(triggerOptions: any, target: any, parent: any, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class PlaySoundAction extends Action {
        private _sound;
        constructor(triggerOptions: any, sound: Sound, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
    class StopSoundAction extends Action {
        private _sound;
        constructor(triggerOptions: any, sound: Sound, condition?: Condition);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
}

declare module BABYLON {
    class InterpolateValueAction extends Action {
        propertyPath: string;
        value: any;
        duration: number;
        stopOtherAnimations: boolean | undefined;
        onInterpolationDone: (() => void) | undefined;
        private _target;
        private _effectiveTarget;
        private _property;
        onInterpolationDoneObservable: Observable<InterpolateValueAction>;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, duration?: number, condition?: Condition, stopOtherAnimations?: boolean | undefined, onInterpolationDone?: (() => void) | undefined);
        _prepare(): void;
        execute(): void;
        serialize(parent: any): any;
    }
}

declare module BABYLON {
    class Analyser {
        SMOOTHING: number;
        FFT_SIZE: number;
        BARGRAPHAMPLITUDE: number;
        DEBUGCANVASPOS: {
            x: number;
            y: number;
        };
        DEBUGCANVASSIZE: {
            width: number;
            height: number;
        };
        private _byteFreqs;
        private _byteTime;
        private _floatFreqs;
        private _webAudioAnalyser;
        private _debugCanvas;
        private _debugCanvasContext;
        private _scene;
        private _registerFunc;
        private _audioEngine;
        constructor(scene: Scene);
        getFrequencyBinCount(): number;
        getByteFrequencyData(): Uint8Array;
        getByteTimeDomainData(): Uint8Array;
        getFloatFrequencyData(): Uint8Array;
        drawDebugCanvas(): void;
        stopDebugCanvas(): void;
        connectAudioNodes(inputAudioNode: AudioNode, outputAudioNode: AudioNode): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class AudioEngine {
        private _audioContext;
        private _audioContextInitialized;
        canUseWebAudio: boolean;
        masterGain: GainNode;
        private _connectedAnalyser;
        WarnedWebAudioUnsupported: boolean;
        unlocked: boolean;
        onAudioUnlocked: () => any;
        isMP3supported: boolean;
        isOGGsupported: boolean;
        readonly audioContext: Nullable<AudioContext>;
        constructor();
        private _unlockiOSaudio();
        private _initializeAudioContext();
        dispose(): void;
        getGlobalVolume(): number;
        setGlobalVolume(newVolume: number): void;
        connectToAnalyser(analyser: Analyser): void;
    }
}

declare module BABYLON {
    class Sound {
        name: string;
        autoplay: boolean;
        loop: boolean;
        useCustomAttenuation: boolean;
        soundTrackId: number;
        spatialSound: boolean;
        refDistance: number;
        rolloffFactor: number;
        maxDistance: number;
        distanceModel: string;
        private _panningModel;
        onended: () => any;
        private _playbackRate;
        private _streaming;
        private _startTime;
        private _startOffset;
        private _position;
        private _localDirection;
        private _volume;
        private _isLoaded;
        private _isReadyToPlay;
        isPlaying: boolean;
        isPaused: boolean;
        private _isDirectional;
        private _readyToPlayCallback;
        private _audioBuffer;
        private _soundSource;
        private _streamingSource;
        private _soundPanner;
        private _soundGain;
        private _inputAudioNode;
        private _ouputAudioNode;
        private _coneInnerAngle;
        private _coneOuterAngle;
        private _coneOuterGain;
        private _scene;
        private _connectedMesh;
        private _customAttenuationFunction;
        private _registerFunc;
        private _isOutputConnected;
        private _htmlAudioElement;
        private _urlType;
        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel, streaming
        */
        constructor(name: string, urlOrArrayBuffer: any, scene: Scene, readyToPlayCallback?: Nullable<() => void>, options?: any);
        dispose(): void;
        isReady(): boolean;
        private _soundLoaded(audioData);
        setAudioBuffer(audioBuffer: AudioBuffer): void;
        updateOptions(options: any): void;
        private _createSpatialParameters();
        private _updateSpatialParameters();
        switchPanningModelToHRTF(): void;
        switchPanningModelToEqualPower(): void;
        private _switchPanningModel();
        connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode): void;
        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): void;
        setPosition(newPosition: Vector3): void;
        setLocalDirectionToMesh(newLocalDirection: Vector3): void;
        private _updateDirection();
        updateDistanceFromListener(): void;
        setAttenuationFunction(callback: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number): void;
        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        * @param offset (optional) Start the sound setting it at a specific time
        */
        play(time?: number, offset?: number): void;
        private _onended();
        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        stop(time?: number): void;
        pause(): void;
        setVolume(newVolume: number, time?: number): void;
        setPlaybackRate(newPlaybackRate: number): void;
        getVolume(): number;
        attachToMesh(meshToConnectTo: AbstractMesh): void;
        detachFromMesh(): void;
        private _onRegisterAfterWorldMatrixUpdate(connectedMesh);
        clone(): Nullable<Sound>;
        getAudioBuffer(): AudioBuffer | null;
        serialize(): any;
        static Parse(parsedSound: any, scene: Scene, rootUrl: string, sourceSound?: Sound): Sound;
    }
}

declare module BABYLON {
    class SoundTrack {
        private _outputAudioNode;
        private _scene;
        id: number;
        soundCollection: Array<Sound>;
        private _isMainTrack;
        private _connectedAnalyser;
        private _options;
        private _isInitialized;
        constructor(scene: Scene, options?: any);
        private _initializeSoundTrackAudioGraph();
        dispose(): void;
        AddSound(sound: Sound): void;
        RemoveSound(sound: Sound): void;
        setVolume(newVolume: number): void;
        switchPanningModelToHRTF(): void;
        switchPanningModelToEqualPower(): void;
        connectToAnalyser(analyser: Analyser): void;
    }
}

declare module BABYLON {
    class Animatable {
        target: any;
        fromFrame: number;
        toFrame: number;
        loopAnimation: boolean;
        onAnimationEnd: (() => void) | null | undefined;
        private _localDelayOffset;
        private _pausedDelay;
        private _runtimeAnimations;
        private _paused;
        private _scene;
        private _speedRatio;
        animationStarted: boolean;
        speedRatio: number;
        constructor(scene: Scene, target: any, fromFrame?: number, toFrame?: number, loopAnimation?: boolean, speedRatio?: number, onAnimationEnd?: (() => void) | null | undefined, animations?: any);
        getAnimations(): RuntimeAnimation[];
        appendAnimations(target: any, animations: Animation[]): void;
        getAnimationByTargetProperty(property: string): Nullable<Animation>;
        getRuntimeAnimationByTargetProperty(property: string): Nullable<RuntimeAnimation>;
        reset(): void;
        enableBlending(blendingSpeed: number): void;
        disableBlending(): void;
        goToFrame(frame: number): void;
        pause(): void;
        restart(): void;
        stop(animationName?: string): void;
        _animate(delay: number): boolean;
    }
}

declare module BABYLON {
    class AnimationRange {
        name: string;
        from: number;
        to: number;
        constructor(name: string, from: number, to: number);
        clone(): AnimationRange;
    }
    /**
     * Composed of a frame, and an action function
     */
    class AnimationEvent {
        frame: number;
        action: () => void;
        onlyOnce: boolean | undefined;
        isDone: boolean;
        constructor(frame: number, action: () => void, onlyOnce?: boolean | undefined);
    }
    class PathCursor {
        private path;
        private _onchange;
        value: number;
        animations: Animation[];
        constructor(path: Path2);
        getPoint(): Vector3;
        moveAhead(step?: number): PathCursor;
        moveBack(step?: number): PathCursor;
        move(step: number): PathCursor;
        private ensureLimits();
        private raiseOnChange();
        onchange(f: (cursor: PathCursor) => void): PathCursor;
    }
    class Animation {
        name: string;
        targetProperty: string;
        framePerSecond: number;
        dataType: number;
        loopMode: number | undefined;
        enableBlending: boolean | undefined;
        static AllowMatricesInterpolation: boolean;
        private _keys;
        private _easingFunction;
        _runtimeAnimations: RuntimeAnimation[];
        private _events;
        targetPropertyPath: string[];
        blendingSpeed: number;
        private _ranges;
        static _PrepareAnimation(name: string, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction): Nullable<Animation>;
        /**
         * Sets up an animation.
         * @param property the property to animate
         * @param animationType the animation type to apply
         * @param easingFunction the easing function used in the animation
         * @returns The created animation
         */
        static CreateAnimation(property: string, animationType: number, framePerSecond: number, easingFunction: BABYLON.EasingFunction): BABYLON.Animation;
        static CreateAndStartAnimation(name: string, node: Node, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable>;
        static CreateMergeAndStartAnimation(name: string, node: Node, targetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable>;
        /**
         * Transition property of the Camera to the target Value.
         * @param property The property to transition
         * @param targetValue The target Value of the property
         * @param host The object where the property to animate belongs
         * @param scene Scene used to run the animation
         * @param frameRate Framerate (in frame/s) to use
         * @param transition The transition type we want to use
         * @param duration The duration of the animation, in milliseconds
         * @param onAnimationEnd Call back trigger at the end of the animation.
         */
        static TransitionTo(property: string, targetValue: any, host: any, scene: Scene, frameRate: number, transition: Animation, duration: number, onAnimationEnd?: Nullable<() => void>): Nullable<Animatable>;
        /**
         * Return the array of runtime animations currently using this animation
         */
        readonly runtimeAnimations: RuntimeAnimation[];
        readonly hasRunningRuntimeAnimations: boolean;
        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: number, loopMode?: number | undefined, enableBlending?: boolean | undefined);
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * Add an event to this animation.
         */
        addEvent(event: AnimationEvent): void;
        /**
         * Remove all events found at the given frame
         * @param frame
         */
        removeEvents(frame: number): void;
        getEvents(): AnimationEvent[];
        createRange(name: string, from: number, to: number): void;
        deleteRange(name: string, deleteFrames?: boolean): void;
        getRange(name: string): Nullable<AnimationRange>;
        getKeys(): Array<{
            frame: number;
            value: any;
            inTangent?: any;
            outTangent?: any;
        }>;
        getHighestFrame(): number;
        getEasingFunction(): IEasingFunction;
        setEasingFunction(easingFunction: EasingFunction): void;
        floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number;
        floatInterpolateFunctionWithTangents(startValue: number, outTangent: number, endValue: number, inTangent: number, gradient: number): number;
        quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion;
        quaternionInterpolateFunctionWithTangents(startValue: Quaternion, outTangent: Quaternion, endValue: Quaternion, inTangent: Quaternion, gradient: number): Quaternion;
        vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3;
        vector3InterpolateFunctionWithTangents(startValue: Vector3, outTangent: Vector3, endValue: Vector3, inTangent: Vector3, gradient: number): Vector3;
        vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2;
        vector2InterpolateFunctionWithTangents(startValue: Vector2, outTangent: Vector2, endValue: Vector2, inTangent: Vector2, gradient: number): Vector2;
        sizeInterpolateFunction(startValue: Size, endValue: Size, gradient: number): Size;
        color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3;
        matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        clone(): Animation;
        setKeys(values: Array<{
            frame: number;
            value: any;
        }>): void;
        serialize(): any;
        private static _ANIMATIONTYPE_FLOAT;
        private static _ANIMATIONTYPE_VECTOR3;
        private static _ANIMATIONTYPE_QUATERNION;
        private static _ANIMATIONTYPE_MATRIX;
        private static _ANIMATIONTYPE_COLOR3;
        private static _ANIMATIONTYPE_VECTOR2;
        private static _ANIMATIONTYPE_SIZE;
        private static _ANIMATIONLOOPMODE_RELATIVE;
        private static _ANIMATIONLOOPMODE_CYCLE;
        private static _ANIMATIONLOOPMODE_CONSTANT;
        static readonly ANIMATIONTYPE_FLOAT: number;
        static readonly ANIMATIONTYPE_VECTOR3: number;
        static readonly ANIMATIONTYPE_VECTOR2: number;
        static readonly ANIMATIONTYPE_SIZE: number;
        static readonly ANIMATIONTYPE_QUATERNION: number;
        static readonly ANIMATIONTYPE_MATRIX: number;
        static readonly ANIMATIONTYPE_COLOR3: number;
        static readonly ANIMATIONLOOPMODE_RELATIVE: number;
        static readonly ANIMATIONLOOPMODE_CYCLE: number;
        static readonly ANIMATIONLOOPMODE_CONSTANT: number;
        static Parse(parsedAnimation: any): Animation;
        static AppendSerializedAnimations(source: IAnimatable, destination: any): any;
    }
}

declare module BABYLON {
    interface IEasingFunction {
        ease(gradient: number): number;
    }
    class EasingFunction implements IEasingFunction {
        private static _EASINGMODE_EASEIN;
        private static _EASINGMODE_EASEOUT;
        private static _EASINGMODE_EASEINOUT;
        static readonly EASINGMODE_EASEIN: number;
        static readonly EASINGMODE_EASEOUT: number;
        static readonly EASINGMODE_EASEINOUT: number;
        private _easingMode;
        setEasingMode(easingMode: number): void;
        getEasingMode(): number;
        easeInCore(gradient: number): number;
        ease(gradient: number): number;
    }
    class CircleEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class BackEase extends EasingFunction implements IEasingFunction {
        amplitude: number;
        constructor(amplitude?: number);
        easeInCore(gradient: number): number;
    }
    class BounceEase extends EasingFunction implements IEasingFunction {
        bounces: number;
        bounciness: number;
        constructor(bounces?: number, bounciness?: number);
        easeInCore(gradient: number): number;
    }
    class CubicEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class ElasticEase extends EasingFunction implements IEasingFunction {
        oscillations: number;
        springiness: number;
        constructor(oscillations?: number, springiness?: number);
        easeInCore(gradient: number): number;
    }
    class ExponentialEase extends EasingFunction implements IEasingFunction {
        exponent: number;
        constructor(exponent?: number);
        easeInCore(gradient: number): number;
    }
    class PowerEase extends EasingFunction implements IEasingFunction {
        power: number;
        constructor(power?: number);
        easeInCore(gradient: number): number;
    }
    class QuadraticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class QuarticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class QuinticEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class SineEase extends EasingFunction implements IEasingFunction {
        easeInCore(gradient: number): number;
    }
    class BezierCurveEase extends EasingFunction implements IEasingFunction {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        constructor(x1?: number, y1?: number, x2?: number, y2?: number);
        easeInCore(gradient: number): number;
    }
}

declare module BABYLON {
    class RuntimeAnimation {
        currentFrame: number;
        private _animation;
        private _target;
        private _originalBlendValue;
        private _offsetsCache;
        private _highLimitsCache;
        private _stopped;
        private _blendingFactor;
        constructor(target: any, animation: Animation);
        readonly animation: Animation;
        reset(): void;
        isStopped(): boolean;
        dispose(): void;
        private _getKeyValue(value);
        private _interpolate(currentFrame, repeatCount, loopMode?, offsetValue?, highLimitValue?);
        setValue(currentValue: any, blend?: boolean): void;
        goToFrame(frame: number): void;
        _prepareForSpeedRatioChange(newSpeedRatio: number): void;
        private _ratioOffset;
        private _previousDelay;
        private _previousRatio;
        animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, blend?: boolean): boolean;
    }
}

declare module BABYLON {
    interface Behavior<T extends Node> {
        name: string;
        init(): void;
        attach(node: T): void;
        detach(): void;
    }
}

declare module BABYLON {
    class Bone extends Node {
        name: string;
        private static _tmpVecs;
        private static _tmpQuat;
        private static _tmpMats;
        children: Bone[];
        animations: Animation[];
        length: number;
        _index: Nullable<number>;
        private _skeleton;
        private _localMatrix;
        private _restPose;
        private _baseMatrix;
        private _worldTransform;
        private _absoluteTransform;
        private _invertedAbsoluteTransform;
        private _parent;
        private _scaleMatrix;
        private _scaleVector;
        private _negateScaleChildren;
        private _scalingDeterminant;
        _matrix: Matrix;
        constructor(name: string, skeleton: Skeleton, parentBone?: Nullable<Bone>, localMatrix?: Nullable<Matrix>, restPose?: Nullable<Matrix>, baseMatrix?: Nullable<Matrix>, index?: Nullable<number>);
        getSkeleton(): Skeleton;
        getParent(): Nullable<Bone>;
        setParent(parent: Nullable<Bone>, updateDifferenceMatrix?: boolean): void;
        getLocalMatrix(): Matrix;
        getBaseMatrix(): Matrix;
        getRestPose(): Matrix;
        returnToRest(): void;
        getWorldMatrix(): Matrix;
        getInvertedAbsoluteTransform(): Matrix;
        getAbsoluteTransform(): Matrix;
        position: Vector3;
        rotation: Vector3;
        rotationQuaternion: Quaternion;
        scaling: Vector3;
        updateMatrix(matrix: Matrix, updateDifferenceMatrix?: boolean): void;
        _updateDifferenceMatrix(rootMatrix?: Matrix): void;
        markAsDirty(): void;
        copyAnimationRange(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired?: boolean, skelDimensionsRatio?: Nullable<Vector3>): boolean;
        /**
         * Translate the bone in local or world space.
         * @param vec The amount to translate the bone.
         * @param space The space that the translation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        translate(vec: Vector3, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the postion of the bone in local or world space.
         * @param position The position to set the bone.
         * @param space The space that the position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setPosition(position: Vector3, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the absolute postion of the bone (world space).
         * @param position The position to set the bone.
         * @param mesh The mesh that this bone is attached to.
         */
        setAbsolutePosition(position: Vector3, mesh?: AbstractMesh): void;
        /**
         * Set the scale of the bone on the x, y and z axes.
         * @param x The scale of the bone on the x axis.
         * @param x The scale of the bone on the y axis.
         * @param z The scale of the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        setScale(x: number, y: number, z: number, scaleChildren?: boolean): void;
        /**
         * Scale the bone on the x, y and z axes.
         * @param x The amount to scale the bone on the x axis.
         * @param x The amount to scale the bone on the y axis.
         * @param z The amount to scale the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        scale(x: number, y: number, z: number, scaleChildren?: boolean): void;
        /**
         * Set the yaw, pitch, and roll of the bone in local or world space.
         * @param yaw The rotation of the bone on the y axis.
         * @param pitch The rotation of the bone on the x axis.
         * @param roll The rotation of the bone on the z axis.
         * @param space The space that the axes of rotation are in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setYawPitchRoll(yaw: number, pitch: number, roll: number, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Rotate the bone on an axis in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param amount The amount to rotate the bone.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        rotate(axis: Vector3, amount: number, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the rotation of the bone to a particular axis angle in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param angle The angle that the bone should be rotated to.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setAxisAngle(axis: Vector3, angle: number, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the euler rotation of the bone in local of world space.
         * @param rotation The euler rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setRotation(rotation: Vector3, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the quaternion rotation of the bone in local of world space.
         * @param quat The quaternion rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setRotationQuaternion(quat: Quaternion, space?: Space, mesh?: AbstractMesh): void;
        /**
         * Set the rotation matrix of the bone in local of world space.
         * @param rotMat The rotation matrix that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        setRotationMatrix(rotMat: Matrix, space?: Space, mesh?: AbstractMesh): void;
        private _rotateWithMatrix(rmat, space?, mesh?);
        private _getNegativeRotationToRef(rotMatInv, space?, mesh?);
        /**
         * Get the scale of the bone
         * @returns the scale of the bone
         */
        getScale(): Vector3;
        /**
         * Copy the scale of the bone to a vector3.
         * @param result The vector3 to copy the scale to
         */
        getScaleToRef(result: Vector3): void;
        /**
         * Get the position of the bone in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The position of the bone
         */
        getPosition(space?: Space, mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Copy the position of the bone to a vector3 in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 to copy the position to.
         */
        getPositionToRef(space: Space | undefined, mesh: Nullable<AbstractMesh>, result: Vector3): void;
        /**
         * Get the absolute position of the bone (world space).
         * @param mesh The mesh that this bone is attached to.
         * @returns The absolute position of the bone
         */
        getAbsolutePosition(mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Copy the absolute position of the bone (world space) to the result param.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 to copy the absolute position to.
         */
        getAbsolutePositionToRef(mesh: AbstractMesh, result: Vector3): void;
        /**
         * Compute the absolute transforms of this bone and its children.
         */
        computeAbsoluteTransforms(): void;
        private _syncScaleVector();
        /**
         * Get the world direction from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @returns The world direction
         */
        getDirection(localAxis: Vector3, mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Copy the world direction to a vector3 from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world direction will be copied to.
         */
        getDirectionToRef(localAxis: Vector3, mesh: AbstractMesh | null | undefined, result: Vector3): void;
        /**
         * Get the euler rotation of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The euler rotation
         */
        getRotation(space?: Space, mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 that the rotation should be copied to.
         */
        getRotationToRef(space: Space | undefined, mesh: AbstractMesh | null | undefined, result: Vector3): void;
        /**
         * Get the quaternion rotation of the bone in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The quaternion rotation
         */
        getRotationQuaternion(space?: Space, mesh?: Nullable<AbstractMesh>): Quaternion;
        /**
         * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        getRotationQuaternionToRef(space: Space | undefined, mesh: AbstractMesh | null | undefined, result: Quaternion): void;
        /**
         * Get the rotation matrix of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The rotation matrix
         */
        getRotationMatrix(space: Space | undefined, mesh: AbstractMesh): Matrix;
        /**
         * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        getRotationMatrixToRef(space: Space | undefined, mesh: AbstractMesh, result: Matrix): void;
        /**
         * Get the world position of a point that is in the local space of the bone.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @returns The world position
         */
        getAbsolutePositionFromLocal(position: Vector3, mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Get the world position of a point that is in the local space of the bone and copy it to the result param.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world position should be copied to.
         */
        getAbsolutePositionFromLocalToRef(position: Vector3, mesh: AbstractMesh | null | undefined, result: Vector3): void;
        /**
         * Get the local position of a point that is in world space.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @returns The local position
         */
        getLocalPositionFromAbsolute(position: Vector3, mesh?: Nullable<AbstractMesh>): Vector3;
        /**
         * Get the local position of a point that is in world space and copy it to the result param.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the local position should be copied to.
         */
        getLocalPositionFromAbsoluteToRef(position: Vector3, mesh: AbstractMesh | null | undefined, result: Vector3): void;
    }
}

declare module BABYLON {
    class BoneIKController {
        private static _tmpVecs;
        private static _tmpQuat;
        private static _tmpMats;
        targetMesh: AbstractMesh;
        poleTargetMesh: AbstractMesh;
        poleTargetBone: Nullable<Bone>;
        targetPosition: Vector3;
        poleTargetPosition: Vector3;
        poleTargetLocalOffset: Vector3;
        poleAngle: number;
        mesh: AbstractMesh;
        slerpAmount: number;
        private _bone1Quat;
        private _bone1Mat;
        private _bone2Ang;
        private _bone1;
        private _bone2;
        private _bone1Length;
        private _bone2Length;
        private _maxAngle;
        private _maxReach;
        private _rightHandedSystem;
        private _bendAxis;
        private _slerping;
        private _adjustRoll;
        maxAngle: number;
        constructor(mesh: AbstractMesh, bone: Bone, options?: {
            targetMesh?: AbstractMesh;
            poleTargetMesh?: AbstractMesh;
            poleTargetBone?: Bone;
            poleTargetLocalOffset?: Vector3;
            poleAngle?: number;
            bendAxis?: Vector3;
            maxAngle?: number;
            slerpAmount?: number;
        });
        private _setMaxAngle(ang);
        update(): void;
    }
}

declare module BABYLON {
    class BoneLookController {
        private static _tmpVecs;
        private static _tmpQuat;
        private static _tmpMats;
        /**
         * The target Vector3 that the bone will look at.
         */
        target: Vector3;
        /**
         * The mesh that the bone is attached to.
         */
        mesh: AbstractMesh;
        /**
         * The bone that will be looking to the target.
         */
        bone: Bone;
        /**
         * The up axis of the coordinate system that is used when the bone is rotated.
         */
        upAxis: Vector3;
        /**
         * The space that the up axis is in - BABYLON.Space.BONE, BABYLON.Space.LOCAL (default), or BABYLON.Space.WORLD.
         */
        upAxisSpace: Space;
        /**
         * Used to make an adjustment to the yaw of the bone.
         */
        adjustYaw: number;
        /**
         * Used to make an adjustment to the pitch of the bone.
         */
        adjustPitch: number;
        /**
         * Used to make an adjustment to the roll of the bone.
         */
        adjustRoll: number;
        /**
         * The amount to slerp (spherical linear interpolation) to the target.  Set this to a value between 0 and 1 (a value of 1 disables slerp).
         */
        slerpAmount: number;
        private _minYaw;
        private _maxYaw;
        private _minPitch;
        private _maxPitch;
        private _minYawSin;
        private _minYawCos;
        private _maxYawSin;
        private _maxYawCos;
        private _midYawConstraint;
        private _minPitchTan;
        private _maxPitchTan;
        private _boneQuat;
        private _slerping;
        private _transformYawPitch;
        private _transformYawPitchInv;
        private _firstFrameSkipped;
        private _yawRange;
        private _fowardAxis;
        /**
         * Get/set the minimum yaw angle that the bone can look to.
         */
        minYaw: number;
        /**
         * Get/set the maximum yaw angle that the bone can look to.
         */
        maxYaw: number;
        /**
         * Get/set the minimum pitch angle that the bone can look to.
         */
        minPitch: number;
        /**
         * Get/set the maximum pitch angle that the bone can look to.
         */
        maxPitch: number;
        /**
         * Create a BoneLookController
         * @param mesh the mesh that the bone belongs to
         * @param bone the bone that will be looking to the target
         * @param target the target Vector3 to look at
         * @param settings optional settings:
         * - maxYaw: the maximum angle the bone will yaw to
         * - minYaw: the minimum angle the bone will yaw to
         * - maxPitch: the maximum angle the bone will pitch to
         * - minPitch: the minimum angle the bone will yaw to
         * - slerpAmount: set the between 0 and 1 to make the bone slerp to the target.
         * - upAxis: the up axis of the coordinate system
         * - upAxisSpace: the space that the up axis is in - BABYLON.Space.BONE, BABYLON.Space.LOCAL (default), or BABYLON.Space.WORLD.
         * - yawAxis: set yawAxis if the bone does not yaw on the y axis
         * - pitchAxis: set pitchAxis if the bone does not pitch on the x axis
         * - adjustYaw: used to make an adjustment to the yaw of the bone
         * - adjustPitch: used to make an adjustment to the pitch of the bone
         * - adjustRoll: used to make an adjustment to the roll of the bone
         **/
        constructor(mesh: AbstractMesh, bone: Bone, target: Vector3, options?: {
            maxYaw?: number;
            minYaw?: number;
            maxPitch?: number;
            minPitch?: number;
            slerpAmount?: number;
            upAxis?: Vector3;
            upAxisSpace?: Space;
            yawAxis?: Vector3;
            pitchAxis?: Vector3;
            adjustYaw?: number;
            adjustPitch?: number;
            adjustRoll?: number;
        });
        /**
         * Update the bone to look at the target.  This should be called before the scene is rendered (use scene.registerBeforeRender()).
         */
        update(): void;
        private _getAngleDiff(ang1, ang2);
        private _getAngleBetween(ang1, ang2);
        private _isAngleBetween(ang, ang1, ang2);
    }
}

declare module BABYLON {
    class Skeleton implements IAnimatable {
        name: string;
        id: string;
        bones: Bone[];
        dimensionsAtRest: Vector3;
        needInitialSkinMatrix: boolean;
        animations: Array<Animation>;
        private _scene;
        private _isDirty;
        private _transformMatrices;
        private _meshesWithPoseMatrix;
        private _animatables;
        private _identity;
        private _synchronizedWithMesh;
        private _ranges;
        private _lastAbsoluteTransformsUpdateId;
        /**
         * An event triggered before computing the skeleton's matrices
         * @type {BABYLON.Observable}
         */
        onBeforeComputeObservable: Observable<Skeleton>;
        constructor(name: string, id: string, scene: Scene);
        getTransformMatrices(mesh: AbstractMesh): Float32Array;
        getScene(): Scene;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
        * Get bone's index searching by name
        * @param {string} name is bone's name to search for
        * @return {number} Indice of the bone. Returns -1 if not found
        */
        getBoneIndexByName(name: string): number;
        createAnimationRange(name: string, from: number, to: number): void;
        deleteAnimationRange(name: string, deleteFrames?: boolean): void;
        getAnimationRange(name: string): Nullable<AnimationRange>;
        /**
         *  Returns as an Array, all AnimationRanges defined on this skeleton
         */
        getAnimationRanges(): Nullable<AnimationRange>[];
        /**
         *  note: This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
         */
        copyAnimationRange(source: Skeleton, name: string, rescaleAsRequired?: boolean): boolean;
        returnToRest(): void;
        private _getHighestAnimationFrame();
        beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Nullable<Animatable>;
        _markAsDirty(): void;
        _registerMeshWithPoseMatrix(mesh: AbstractMesh): void;
        _unregisterMeshWithPoseMatrix(mesh: AbstractMesh): void;
        _computeTransformMatrices(targetMatrix: Float32Array, initialSkinMatrix: Nullable<Matrix>): void;
        prepare(): void;
        getAnimatables(): IAnimatable[];
        clone(name: string, id: string): Skeleton;
        enableBlending(blendingSpeed?: number): void;
        dispose(): void;
        serialize(): any;
        static Parse(parsedSkeleton: any, scene: Scene): Skeleton;
        computeAbsoluteTransforms(forceUpdate?: boolean): void;
        getPoseMatrix(): Nullable<Matrix>;
        sortBones(): void;
        private _sortBones(index, bones, visited);
    }
}

declare module BABYLON {
    class Collider {
        radius: Vector3;
        retry: number;
        velocity: Vector3;
        basePoint: Vector3;
        epsilon: number;
        collisionFound: boolean;
        velocityWorldLength: number;
        basePointWorld: Vector3;
        velocityWorld: Vector3;
        normalizedVelocity: Vector3;
        initialVelocity: Vector3;
        initialPosition: Vector3;
        nearestDistance: number;
        intersectionPoint: Vector3;
        collidedMesh: Nullable<AbstractMesh>;
        private _collisionPoint;
        private _planeIntersectionPoint;
        private _tempVector;
        private _tempVector2;
        private _tempVector3;
        private _tempVector4;
        private _edge;
        private _baseToVertex;
        private _destinationPoint;
        private _slidePlaneNormal;
        private _displacementVector;
        private _collisionMask;
        collisionMask: number;
        _initialize(source: Vector3, dir: Vector3, e: number): void;
        _checkPointInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean;
        _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean;
        _testTriangle(faceIndex: number, trianglePlaneArray: Array<Plane>, p1: Vector3, p2: Vector3, p3: Vector3, hasMaterial: boolean): void;
        _collide(trianglePlaneArray: Array<Plane>, pts: Vector3[], indices: IndicesArray, indexStart: number, indexEnd: number, decal: number, hasMaterial: boolean): void;
        _getResponse(pos: Vector3, vel: Vector3): void;
    }
}

declare module BABYLON {
    var CollisionWorker: string;
    interface ICollisionCoordinator {
        getNewPosition(position: Vector3, displacement: Vector3, collider: Collider, maximumRetry: number, excludedMesh: Nullable<AbstractMesh>, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh>) => void, collisionIndex: number): void;
        init(scene: Scene): void;
        destroy(): void;
        onMeshAdded(mesh: AbstractMesh): void;
        onMeshUpdated(mesh: AbstractMesh): void;
        onMeshRemoved(mesh: AbstractMesh): void;
        onGeometryAdded(geometry: Geometry): void;
        onGeometryUpdated(geometry: Geometry): void;
        onGeometryDeleted(geometry: Geometry): void;
    }
    interface SerializedMesh {
        id: string;
        name: string;
        uniqueId: number;
        geometryId: Nullable<string>;
        sphereCenter: Array<number>;
        sphereRadius: number;
        boxMinimum: Array<number>;
        boxMaximum: Array<number>;
        worldMatrixFromCache: any;
        subMeshes: Array<SerializedSubMesh>;
        checkCollisions: boolean;
    }
    interface SerializedSubMesh {
        position: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;
        hasMaterial: boolean;
        sphereCenter: Array<number>;
        sphereRadius: number;
        boxMinimum: Array<number>;
        boxMaximum: Array<number>;
    }
    interface SerializedGeometry {
        id: string;
        positions: Float32Array;
        indices: Uint32Array;
        normals: Float32Array;
    }
    interface BabylonMessage {
        taskType: WorkerTaskType;
        payload: InitPayload | CollidePayload | UpdatePayload;
    }
    interface SerializedColliderToWorker {
        position: Array<number>;
        velocity: Array<number>;
        radius: Array<number>;
    }
    enum WorkerTaskType {
        INIT = 0,
        UPDATE = 1,
        COLLIDE = 2,
    }
    interface WorkerReply {
        error: WorkerReplyType;
        taskType: WorkerTaskType;
        payload?: any;
    }
    interface CollisionReplyPayload {
        newPosition: Array<number>;
        collisionId: number;
        collidedMeshUniqueId: number;
    }
    interface InitPayload {
    }
    interface CollidePayload {
        collisionId: number;
        collider: SerializedColliderToWorker;
        maximumRetry: number;
        excludedMeshUniqueId: Nullable<number>;
    }
    interface UpdatePayload {
        updatedMeshes: {
            [n: number]: SerializedMesh;
        };
        updatedGeometries: {
            [s: string]: SerializedGeometry;
        };
        removedMeshes: Array<number>;
        removedGeometries: Array<string>;
    }
    enum WorkerReplyType {
        SUCCESS = 0,
        UNKNOWN_ERROR = 1,
    }
    class CollisionCoordinatorWorker implements ICollisionCoordinator {
        private _scene;
        private _scaledPosition;
        private _scaledVelocity;
        private _collisionsCallbackArray;
        private _init;
        private _runningUpdated;
        private _runningCollisionTask;
        private _worker;
        private _addUpdateMeshesList;
        private _addUpdateGeometriesList;
        private _toRemoveMeshesArray;
        private _toRemoveGeometryArray;
        constructor();
        static SerializeMesh: (mesh: AbstractMesh) => SerializedMesh;
        static SerializeGeometry: (geometry: Geometry) => SerializedGeometry;
        getNewPosition(position: Vector3, displacement: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh>) => void, collisionIndex: number): void;
        init(scene: Scene): void;
        destroy(): void;
        onMeshAdded(mesh: AbstractMesh): void;
        onMeshUpdated: (mesh: AbstractMesh) => void;
        onMeshRemoved(mesh: AbstractMesh): void;
        onGeometryAdded(geometry: Geometry): void;
        onGeometryUpdated: (geometry: Geometry) => void;
        onGeometryDeleted(geometry: Geometry): void;
        private _afterRender;
        private _onMessageFromWorker;
    }
    class CollisionCoordinatorLegacy implements ICollisionCoordinator {
        private _scene;
        private _scaledPosition;
        private _scaledVelocity;
        private _finalPosition;
        getNewPosition(position: Vector3, displacement: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh>) => void, collisionIndex: number): void;
        init(scene: Scene): void;
        destroy(): void;
        onMeshAdded(mesh: AbstractMesh): void;
        onMeshUpdated(mesh: AbstractMesh): void;
        onMeshRemoved(mesh: AbstractMesh): void;
        onGeometryAdded(geometry: Geometry): void;
        onGeometryUpdated(geometry: Geometry): void;
        onGeometryDeleted(geometry: Geometry): void;
        private _collideWithWorld(position, velocity, collider, maximumRetry, finalPosition, excludedMesh?);
    }
}

declare function importScripts(...urls: string[]): void;
declare module BABYLON {
    var WorkerIncluded: boolean;
    class CollisionCache {
        private _meshes;
        private _geometries;
        getMeshes(): {
            [n: number]: SerializedMesh;
        };
        getGeometries(): {
            [s: number]: SerializedGeometry;
        };
        getMesh(id: any): SerializedMesh;
        addMesh(mesh: SerializedMesh): void;
        removeMesh(uniqueId: number): void;
        getGeometry(id: string): SerializedGeometry;
        addGeometry(geometry: SerializedGeometry): void;
        removeGeometry(id: string): void;
    }
    class CollideWorker {
        collider: Collider;
        private _collisionCache;
        private finalPosition;
        private collisionsScalingMatrix;
        private collisionTranformationMatrix;
        constructor(collider: Collider, _collisionCache: CollisionCache, finalPosition: Vector3);
        collideWithWorld(position: Vector3, velocity: Vector3, maximumRetry: number, excludedMeshUniqueId: Nullable<number>): void;
        private checkCollision(mesh);
        private processCollisionsForSubMeshes(transformMatrix, mesh);
        private collideForSubMesh(subMesh, transformMatrix, meshGeometry);
        private checkSubmeshCollision(subMesh);
    }
    interface ICollisionDetector {
        onInit(payload: InitPayload): void;
        onUpdate(payload: UpdatePayload): void;
        onCollision(payload: CollidePayload): void;
    }
    class CollisionDetectorTransferable implements ICollisionDetector {
        private _collisionCache;
        onInit(payload: InitPayload): void;
        onUpdate(payload: UpdatePayload): void;
        onCollision(payload: CollidePayload): void;
    }
}

declare module BABYLON {
    class IntersectionInfo {
        bu: Nullable<number>;
        bv: Nullable<number>;
        distance: number;
        faceId: number;
        subMeshId: number;
        constructor(bu: Nullable<number>, bv: Nullable<number>, distance: number);
    }
    class PickingInfo {
        hit: boolean;
        distance: number;
        pickedPoint: Nullable<Vector3>;
        pickedMesh: Nullable<AbstractMesh>;
        bu: number;
        bv: number;
        faceId: number;
        subMeshId: number;
        pickedSprite: Nullable<Sprite>;
        getNormal(useWorldCoordinates?: boolean, useVerticesNormals?: boolean): Nullable<Vector3>;
        getTextureCoordinates(): Nullable<Vector2>;
    }
}

declare module BABYLON {
    class ArcRotateCamera extends TargetCamera {
        alpha: number;
        beta: number;
        radius: number;
        protected _target: Vector3;
        protected _targetHost: Nullable<AbstractMesh>;
        target: Vector3;
        inertialAlphaOffset: number;
        inertialBetaOffset: number;
        inertialRadiusOffset: number;
        lowerAlphaLimit: Nullable<number>;
        upperAlphaLimit: Nullable<number>;
        lowerBetaLimit: number;
        upperBetaLimit: number;
        lowerRadiusLimit: Nullable<number>;
        upperRadiusLimit: Nullable<number>;
        inertialPanningX: number;
        inertialPanningY: number;
        pinchToPanMaxDistance: number;
        panningDistanceLimit: Nullable<number>;
        panningOriginTarget: Vector3;
        panningInertia: number;
        angularSensibilityX: number;
        angularSensibilityY: number;
        pinchPrecision: number;
        pinchDeltaPercentage: number;
        panningSensibility: number;
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        wheelPrecision: number;
        wheelDeltaPercentage: number;
        zoomOnFactor: number;
        targetScreenOffset: Vector2;
        allowUpsideDown: boolean;
        _viewMatrix: Matrix;
        _useCtrlForPanning: boolean;
        _panningMouseButton: number;
        inputs: ArcRotateCameraInputsManager;
        _reset: () => void;
        panningAxis: Vector3;
        protected _localDirection: Vector3;
        protected _transformedDirection: Vector3;
        private _bouncingBehavior;
        readonly bouncingBehavior: Nullable<BouncingBehavior>;
        useBouncingBehavior: boolean;
        private _framingBehavior;
        readonly framingBehavior: Nullable<FramingBehavior>;
        useFramingBehavior: boolean;
        private _autoRotationBehavior;
        readonly autoRotationBehavior: Nullable<AutoRotationBehavior>;
        useAutoRotationBehavior: boolean;
        onMeshTargetChangedObservable: Observable<AbstractMesh>;
        onCollide: (collidedMesh: AbstractMesh) => void;
        checkCollisions: boolean;
        collisionRadius: Vector3;
        protected _collider: Collider;
        protected _previousPosition: Vector3;
        protected _collisionVelocity: Vector3;
        protected _newPosition: Vector3;
        protected _previousAlpha: number;
        protected _previousBeta: number;
        protected _previousRadius: number;
        protected _collisionTriggered: boolean;
        protected _targetBoundingCenter: Nullable<Vector3>;
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);
        _initCache(): void;
        _updateCache(ignoreParentClass?: boolean): void;
        protected _getTargetPosition(): Vector3;
        /**
         * Store current camera state (fov, position, etc..)
         */
        private _storedAlpha;
        private _storedBeta;
        private _storedRadius;
        private _storedTarget;
        storeState(): Camera;
        /**
         * Restored camera state. You must call storeState() first
         */
        _restoreStateValues(): boolean;
        _isSynchronizedViewMatrix(): boolean;
        attachControl(element: HTMLElement, noPreventDefault?: boolean, useCtrlForPanning?: boolean, panningMouseButton?: number): void;
        detachControl(element: HTMLElement): void;
        _checkInputs(): void;
        protected _checkLimits(): void;
        rebuildAnglesAndRadius(): void;
        setPosition(position: Vector3): void;
        setTarget(target: AbstractMesh | Vector3, toBoundingCenter?: boolean, allowSamePosition?: boolean): void;
        _getViewMatrix(): Matrix;
        protected _onCollisionPositionChange: (collisionId: number, newPosition: Vector3, collidedMesh?: Nullable<AbstractMesh>) => void;
        zoomOn(meshes?: AbstractMesh[], doNotUpdateMaxZ?: boolean): void;
        focusOn(meshesOrMinMaxVectorAndDistance: AbstractMesh[] | {
            min: Vector3;
            max: Vector3;
            distance: number;
        }, doNotUpdateMaxZ?: boolean): void;
        /**
         * @override
         * Override Camera.createRigCamera
         */
        createRigCamera(name: string, cameraIndex: number): Camera;
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        _updateRigCameras(): void;
        dispose(): void;
        getClassName(): string;
    }
}

declare module BABYLON {
    class ArcRotateCameraInputsManager extends CameraInputsManager<ArcRotateCamera> {
        constructor(camera: ArcRotateCamera);
        addMouseWheel(): ArcRotateCameraInputsManager;
        addPointers(): ArcRotateCameraInputsManager;
        addKeyboard(): ArcRotateCameraInputsManager;
        addGamepad(): ArcRotateCameraInputsManager;
        addVRDeviceOrientation(): ArcRotateCameraInputsManager;
    }
}

declare module BABYLON {
    class Camera extends Node {
        inputs: CameraInputsManager<Camera>;
        private static _PERSPECTIVE_CAMERA;
        private static _ORTHOGRAPHIC_CAMERA;
        private static _FOVMODE_VERTICAL_FIXED;
        private static _FOVMODE_HORIZONTAL_FIXED;
        private static _RIG_MODE_NONE;
        private static _RIG_MODE_STEREOSCOPIC_ANAGLYPH;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
        private static _RIG_MODE_STEREOSCOPIC_OVERUNDER;
        private static _RIG_MODE_VR;
        private static _RIG_MODE_WEBVR;
        static readonly PERSPECTIVE_CAMERA: number;
        static readonly ORTHOGRAPHIC_CAMERA: number;
        static readonly FOVMODE_VERTICAL_FIXED: number;
        static readonly FOVMODE_HORIZONTAL_FIXED: number;
        static readonly RIG_MODE_NONE: number;
        static readonly RIG_MODE_STEREOSCOPIC_ANAGLYPH: number;
        static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL: number;
        static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED: number;
        static readonly RIG_MODE_STEREOSCOPIC_OVERUNDER: number;
        static readonly RIG_MODE_VR: number;
        static readonly RIG_MODE_WEBVR: number;
        static ForceAttachControlToAlwaysPreventDefault: boolean;
        static UseAlternateWebVRRendering: boolean;
        position: Vector3;
        upVector: Vector3;
        orthoLeft: Nullable<number>;
        orthoRight: Nullable<number>;
        orthoBottom: Nullable<number>;
        orthoTop: Nullable<number>;
        fov: number;
        minZ: number;
        maxZ: number;
        inertia: number;
        mode: number;
        isIntermediate: boolean;
        viewport: Viewport;
        layerMask: number;
        fovMode: number;
        cameraRigMode: number;
        interaxialDistance: number;
        isStereoscopicSideBySide: boolean;
        _cameraRigParams: any;
        _rigCameras: Camera[];
        _rigPostProcess: Nullable<PostProcess>;
        protected _webvrViewMatrix: Matrix;
        _skipRendering: boolean;
        _alternateCamera: Camera;
        customRenderTargets: RenderTargetTexture[];
        onViewMatrixChangedObservable: Observable<Camera>;
        onProjectionMatrixChangedObservable: Observable<Camera>;
        onAfterCheckInputsObservable: Observable<Camera>;
        onRestoreStateObservable: Observable<Camera>;
        private _computedViewMatrix;
        _projectionMatrix: Matrix;
        private _doNotComputeProjectionMatrix;
        private _worldMatrix;
        _postProcesses: PostProcess[];
        private _transformMatrix;
        _activeMeshes: SmartArray<AbstractMesh>;
        private _globalPosition;
        private _frustumPlanes;
        private _refreshFrustumPlanes;
        constructor(name: string, position: Vector3, scene: Scene);
        private _storedFov;
        private _stateStored;
        /**
         * Store current camera state (fov, position, etc..)
         */
        storeState(): Camera;
        /**
         * Restores the camera state values if it has been stored. You must call storeState() first
         */
        protected _restoreStateValues(): boolean;
        /**
         * Restored camera state. You must call storeState() first
         */
        restoreState(): boolean;
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        readonly globalPosition: Vector3;
        getActiveMeshes(): SmartArray<AbstractMesh>;
        isActiveMesh(mesh: Mesh): boolean;
        _initCache(): void;
        _updateCache(ignoreParentClass?: boolean): void;
        _isSynchronized(): boolean;
        _isSynchronizedViewMatrix(): boolean;
        _isSynchronizedProjectionMatrix(): boolean;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: HTMLElement): void;
        update(): void;
        _checkInputs(): void;
        readonly rigCameras: Camera[];
        readonly rigPostProcess: Nullable<PostProcess>;
        private _cascadePostProcessesToRigCams();
        attachPostProcess(postProcess: PostProcess, insertAt?: Nullable<number>): number;
        detachPostProcess(postProcess: PostProcess): void;
        getWorldMatrix(): Matrix;
        _getViewMatrix(): Matrix;
        getViewMatrix(force?: boolean): Matrix;
        freezeProjectionMatrix(projection?: Matrix): void;
        unfreezeProjectionMatrix(): void;
        getProjectionMatrix(force?: boolean): Matrix;
        getTranformationMatrix(): Matrix;
        private updateFrustumPlanes();
        isInFrustum(target: ICullable): boolean;
        isCompletelyInFrustum(target: ICullable): boolean;
        getForwardRay(length?: number, transform?: Matrix, origin?: Vector3): Ray;
        dispose(): void;
        readonly leftCamera: Nullable<FreeCamera>;
        readonly rightCamera: Nullable<FreeCamera>;
        getLeftTarget(): Nullable<Vector3>;
        getRightTarget(): Nullable<Vector3>;
        setCameraRigMode(mode: number, rigParams: any): void;
        private _getVRProjectionMatrix();
        protected _updateCameraRotationMatrix(): void;
        protected _updateWebVRCameraRotationMatrix(): void;
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRProjectionMatrix(): Matrix;
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRViewMatrix(): Matrix;
        setCameraRigParameter(name: string, value: any): void;
        /**
         * needs to be overridden by children so sub has required properties to be copied
         */
        createRigCamera(name: string, cameraIndex: number): Nullable<Camera>;
        /**
         * May need to be overridden by children
         */
        _updateRigCameras(): void;
        _setupInputs(): void;
        serialize(): any;
        clone(name: string): Camera;
        getDirection(localAxis: Vector3): Vector3;
        getDirectionToRef(localAxis: Vector3, result: Vector3): void;
        static GetConstructorFromName(type: string, name: string, scene: Scene, interaxial_distance?: number, isStereoscopicSideBySide?: boolean): () => Camera;
        static Parse(parsedCamera: any, scene: Scene): Camera;
    }
}

declare module BABYLON {
    var CameraInputTypes: {};
    interface ICameraInput<TCamera extends BABYLON.Camera> {
        camera: Nullable<TCamera>;
        getClassName(): string;
        getSimpleName(): string;
        attachControl: (element: HTMLElement, noPreventDefault?: boolean) => void;
        detachControl: (element: Nullable<HTMLElement>) => void;
        checkInputs?: () => void;
    }
    interface CameraInputsMap<TCamera extends BABYLON.Camera> {
        [name: string]: ICameraInput<TCamera>;
        [idx: number]: ICameraInput<TCamera>;
    }
    class CameraInputsManager<TCamera extends BABYLON.Camera> {
        attached: CameraInputsMap<TCamera>;
        attachedElement: Nullable<HTMLElement>;
        noPreventDefault: boolean;
        camera: TCamera;
        checkInputs: () => void;
        constructor(camera: TCamera);
        add(input: ICameraInput<TCamera>): void;
        remove(inputToRemove: ICameraInput<TCamera>): void;
        removeByType(inputType: string): void;
        private _addCheckInputs(fn);
        attachInput(input: ICameraInput<TCamera>): void;
        attachElement(element: HTMLElement, noPreventDefault?: boolean): void;
        detachElement(element: HTMLElement, disconnect?: boolean): void;
        rebuildInputCheck(): void;
        clear(): void;
        serialize(serializedCamera: any): void;
        parse(parsedCamera: any): void;
    }
}

declare module BABYLON {
    class DeviceOrientationCamera extends FreeCamera {
        private _initialQuaternion;
        private _quaternionCache;
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
        _checkInputs(): void;
        resetToCurrentRotation(axis?: Axis): void;
    }
}

declare module BABYLON {
    class FollowCamera extends TargetCamera {
        radius: number;
        rotationOffset: number;
        heightOffset: number;
        cameraAcceleration: number;
        maxCameraSpeed: number;
        lockedTarget: Nullable<AbstractMesh>;
        constructor(name: string, position: Vector3, scene: Scene, lockedTarget?: Nullable<AbstractMesh>);
        private getRadians(degrees);
        private follow(cameraTarget);
        _checkInputs(): void;
        getClassName(): string;
    }
    class ArcFollowCamera extends TargetCamera {
        alpha: number;
        beta: number;
        radius: number;
        target: Nullable<AbstractMesh>;
        private _cartesianCoordinates;
        constructor(name: string, alpha: number, beta: number, radius: number, target: Nullable<AbstractMesh>, scene: Scene);
        private follow();
        _checkInputs(): void;
        getClassName(): string;
    }
}

declare module BABYLON {
    class FreeCamera extends TargetCamera {
        ellipsoid: Vector3;
        checkCollisions: boolean;
        applyGravity: boolean;
        inputs: FreeCameraInputsManager;
        angularSensibility: number;
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        onCollide: (collidedMesh: AbstractMesh) => void;
        private _collider;
        private _needMoveForGravity;
        private _oldPosition;
        private _diffPosition;
        private _newPosition;
        _localDirection: Vector3;
        _transformedDirection: Vector3;
        constructor(name: string, position: Vector3, scene: Scene);
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: HTMLElement): void;
        private _collisionMask;
        collisionMask: number;
        _collideWithWorld(displacement: Vector3): void;
        private _onCollisionPositionChange;
        _checkInputs(): void;
        _decideIfNeedsToMove(): boolean;
        _updatePosition(): void;
        dispose(): void;
        getClassName(): string;
    }
}

declare module BABYLON {
    class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
        constructor(camera: FreeCamera);
        addKeyboard(): FreeCameraInputsManager;
        addMouse(touchEnabled?: boolean): FreeCameraInputsManager;
        addGamepad(): FreeCameraInputsManager;
        addDeviceOrientation(): FreeCameraInputsManager;
        addTouch(): FreeCameraInputsManager;
        addVirtualJoystick(): FreeCameraInputsManager;
    }
}

declare module BABYLON {
    class GamepadCamera extends UniversalCamera {
        gamepadAngularSensibility: number;
        gamepadMoveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
    }
}

declare module BABYLON {
    class AnaglyphFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class AnaglyphUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicFreeCamera extends FreeCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicGamepadCamera extends GamepadCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
    class StereoscopicUniversalCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, interaxialDistance: number, isStereoscopicSideBySide: boolean, scene: Scene);
        getClassName(): string;
    }
}

declare module BABYLON {
    class TargetCamera extends Camera {
        cameraDirection: Vector3;
        cameraRotation: Vector2;
        rotation: Vector3;
        rotationQuaternion: Quaternion;
        speed: number;
        noRotationConstraint: boolean;
        lockedTarget: any;
        _currentTarget: Vector3;
        _viewMatrix: Matrix;
        _camMatrix: Matrix;
        _cameraTransformMatrix: Matrix;
        _cameraRotationMatrix: Matrix;
        private _rigCamTransformMatrix;
        _referencePoint: Vector3;
        private _defaultUpVector;
        _transformedReferencePoint: Vector3;
        _lookAtTemp: Matrix;
        _tempMatrix: Matrix;
        _reset: () => void;
        constructor(name: string, position: Vector3, scene: Scene);
        getFrontPosition(distance: number): Vector3;
        _getLockedTargetPosition(): Nullable<Vector3>;
        /**
         * Store current camera state (fov, position, etc..)
         */
        private _storedPosition;
        private _storedRotation;
        private _storedRotationQuaternion;
        storeState(): Camera;
        /**
         * Restored camera state. You must call storeState() first
         */
        _restoreStateValues(): boolean;
        _initCache(): void;
        _updateCache(ignoreParentClass?: boolean): void;
        _isSynchronizedViewMatrix(): boolean;
        _computeLocalCameraSpeed(): number;
        setTarget(target: Vector3): void;
        /**
         * Return the current target position of the camera. This value is expressed in local space.
         */
        getTarget(): Vector3;
        _decideIfNeedsToMove(): boolean;
        _updatePosition(): void;
        _checkInputs(): void;
        protected _updateCameraRotationMatrix(): void;
        _getViewMatrix(): Matrix;
        /**
         * @override
         * Override Camera.createRigCamera
         */
        createRigCamera(name: string, cameraIndex: number): Nullable<Camera>;
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        _updateRigCameras(): void;
        private _getRigCamPosition(halfSpace, result);
        getClassName(): string;
    }
}

declare module BABYLON {
    class TouchCamera extends FreeCamera {
        touchAngularSensibility: number;
        touchMoveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
        _setupInputs(): void;
    }
}

declare module BABYLON {
    class UniversalCamera extends TouchCamera {
        gamepadAngularSensibility: number;
        gamepadMoveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
    }
}

declare module BABYLON {
    class VirtualJoysticksCamera extends FreeCamera {
        constructor(name: string, position: Vector3, scene: Scene);
        getClassName(): string;
    }
}

declare module BABYLON {
    class BoundingBox implements ICullable {
        minimum: Vector3;
        maximum: Vector3;
        vectors: Vector3[];
        center: Vector3;
        centerWorld: Vector3;
        extendSize: Vector3;
        extendSizeWorld: Vector3;
        directions: Vector3[];
        vectorsWorld: Vector3[];
        minimumWorld: Vector3;
        maximumWorld: Vector3;
        private _worldMatrix;
        constructor(minimum: Vector3, maximum: Vector3);
        getWorldMatrix(): Matrix;
        setWorldMatrix(matrix: Matrix): BoundingBox;
        _update(world: Matrix): void;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersectsSphere(sphere: BoundingSphere): boolean;
        intersectsMinMax(min: Vector3, max: Vector3): boolean;
        static Intersects(box0: BoundingBox, box1: BoundingBox): boolean;
        static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
        static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
    }
}

declare module BABYLON {
    interface ICullable {
        isInFrustum(frustumPlanes: Plane[]): boolean;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
    }
    class BoundingInfo implements ICullable {
        minimum: Vector3;
        maximum: Vector3;
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;
        private _isLocked;
        constructor(minimum: Vector3, maximum: Vector3);
        isLocked: boolean;
        update(world: Matrix): void;
        /**
         * Recreate the bounding info to be centered around a specific point given a specific extend.
         * @param center New center of the bounding info
         * @param extend New extend of the bounding info
         */
        centerOn(center: Vector3, extend: Vector3): BoundingInfo;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Gets the world distance between the min and max points of the bounding box
         */
        readonly diagonalLength: number;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        _checkCollision(collider: Collider): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;
    }
}

declare module BABYLON {
    class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;
        centerWorld: Vector3;
        radiusWorld: number;
        private _tempRadiusVector;
        constructor(minimum: Vector3, maximum: Vector3);
        _update(world: Matrix): void;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        static Intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
}

declare module BABYLON {
    class Ray {
        origin: Vector3;
        direction: Vector3;
        length: number;
        private _edge1;
        private _edge2;
        private _pvec;
        private _tvec;
        private _qvec;
        private _tmpRay;
        constructor(origin: Vector3, direction: Vector3, length?: number);
        intersectsBoxMinMax(minimum: Vector3, maximum: Vector3): boolean;
        intersectsBox(box: BoundingBox): boolean;
        intersectsSphere(sphere: BoundingSphere): boolean;
        intersectsTriangle(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3): Nullable<IntersectionInfo>;
        intersectsPlane(plane: Plane): Nullable<number>;
        intersectsMesh(mesh: AbstractMesh, fastCheck?: boolean): PickingInfo;
        intersectsMeshes(meshes: Array<AbstractMesh>, fastCheck?: boolean, results?: Array<PickingInfo>): Array<PickingInfo>;
        private _comparePickingInfo(pickingInfoA, pickingInfoB);
        private static smallnum;
        private static rayl;
        /**
         * Intersection test between the ray and a given segment whithin a given tolerance (threshold)
         * @param sega the first point of the segment to test the intersection against
         * @param segb the second point of the segment to test the intersection against
         * @param threshold the tolerance margin, if the ray doesn't intersect the segment but is close to the given threshold, the intersection is successful
         * @return the distance from the ray origin to the intersection point if there's intersection, or -1 if there's no intersection
         */
        intersectionSegment(sega: Vector3, segb: Vector3, threshold: number): number;
        update(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray;
        static Zero(): Ray;
        static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray;
        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        */
        static CreateNewFromTo(origin: Vector3, end: Vector3, world?: Matrix): Ray;
        static Transform(ray: Ray, matrix: Matrix): Ray;
        static TransformToRef(ray: Ray, matrix: Matrix, result: Ray): void;
    }
}

declare module BABYLON.Debug {
    class AxesViewer {
        private _xline;
        private _yline;
        private _zline;
        private _xmesh;
        private _ymesh;
        private _zmesh;
        scene: Nullable<Scene>;
        scaleLines: number;
        constructor(scene: Scene, scaleLines?: number);
        update(position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void;
        dispose(): void;
    }
}

declare module BABYLON.Debug {
    class BoneAxesViewer extends Debug.AxesViewer {
        mesh: Nullable<Mesh>;
        bone: Nullable<Bone>;
        pos: Vector3;
        xaxis: Vector3;
        yaxis: Vector3;
        zaxis: Vector3;
        constructor(scene: Scene, bone: Bone, mesh: Mesh, scaleLines?: number);
        update(): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class DebugLayer {
        private _scene;
        static InspectorURL: string;
        private _inspector;
        private BJSINSPECTOR;
        constructor(scene: Scene);
        /** Creates the inspector window. */
        private _createInspector(config?);
        isVisible(): boolean;
        hide(): void;
        show(config?: {
            popup?: boolean;
            initialTab?: number;
            parentElement?: HTMLElement;
            newColors?: {
                backgroundColor?: string;
                backgroundColorLighter?: string;
                backgroundColorLighter2?: string;
                backgroundColorLighter3?: string;
                color?: string;
                colorTop?: string;
                colorBot?: string;
            };
        }): void;
    }
}

declare module BABYLON.Debug {
    class PhysicsViewer {
        protected _impostors: Array<Nullable<PhysicsImpostor>>;
        protected _meshes: Array<Nullable<AbstractMesh>>;
        protected _scene: Nullable<Scene>;
        protected _numMeshes: number;
        protected _physicsEnginePlugin: Nullable<IPhysicsEnginePlugin>;
        private _renderFunction;
        private _debugBoxMesh;
        private _debugSphereMesh;
        private _debugMaterial;
        constructor(scene: Scene);
        protected _updateDebugMeshes(): void;
        showImpostor(impostor: PhysicsImpostor): void;
        hideImpostor(impostor: Nullable<PhysicsImpostor>): void;
        private _getDebugMaterial(scene);
        private _getDebugBoxMesh(scene);
        private _getDebugSphereMesh(scene);
        private _getDebugMesh(impostor, scene);
        dispose(): void;
    }
}

declare module BABYLON {
    class RayHelper {
        ray: Nullable<Ray>;
        private _renderPoints;
        private _renderLine;
        private _renderFunction;
        private _scene;
        private _updateToMeshFunction;
        private _attachedToMesh;
        private _meshSpaceDirection;
        private _meshSpaceOrigin;
        static CreateAndShow(ray: Ray, scene: Scene, color: Color3): RayHelper;
        constructor(ray: Ray);
        show(scene: Scene, color: Color3): void;
        hide(): void;
        private _render();
        attachToMesh(mesh: AbstractMesh, meshSpaceDirection?: Vector3, meshSpaceOrigin?: Vector3, length?: number): void;
        detachFromMesh(): void;
        private _updateToMesh();
        dispose(): void;
    }
}

declare module BABYLON.Debug {
    /**
    * Demo available here: http://www.babylonjs-playground.com/#1BZJVJ#8
    */
    class SkeletonViewer {
        skeleton: Skeleton;
        mesh: AbstractMesh;
        autoUpdateBonesMatrices: boolean;
        renderingGroupId: number;
        color: Color3;
        private _scene;
        private _debugLines;
        private _debugMesh;
        private _isEnabled;
        private _renderFunction;
        constructor(skeleton: Skeleton, mesh: AbstractMesh, scene: Scene, autoUpdateBonesMatrices?: boolean, renderingGroupId?: number);
        isEnabled: boolean;
        private _getBonePosition(position, bone, meshMat, x?, y?, z?);
        private _getLinesForBonesWithLength(bones, meshMat);
        private _getLinesForBonesNoLength(bones, meshMat);
        update(): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class StickValues {
        x: number;
        y: number;
        constructor(x: number, y: number);
    }
    interface GamepadButtonChanges {
        changed: boolean;
        pressChanged: boolean;
        touchChanged: boolean;
        valueChanged: boolean;
    }
    class Gamepad {
        id: string;
        index: number;
        browserGamepad: any;
        type: number;
        private _leftStick;
        private _rightStick;
        _isConnected: boolean;
        private _leftStickAxisX;
        private _leftStickAxisY;
        private _rightStickAxisX;
        private _rightStickAxisY;
        private _onleftstickchanged;
        private _onrightstickchanged;
        static GAMEPAD: number;
        static GENERIC: number;
        static XBOX: number;
        static POSE_ENABLED: number;
        readonly isConnected: boolean;
        constructor(id: string, index: number, browserGamepad: any, leftStickX?: number, leftStickY?: number, rightStickX?: number, rightStickY?: number);
        onleftstickchanged(callback: (values: StickValues) => void): void;
        onrightstickchanged(callback: (values: StickValues) => void): void;
        leftStick: StickValues;
        rightStick: StickValues;
        update(): void;
        dispose(): void;
    }
    class GenericPad extends Gamepad {
        private _buttons;
        private _onbuttondown;
        private _onbuttonup;
        onButtonDownObservable: Observable<number>;
        onButtonUpObservable: Observable<number>;
        onbuttondown(callback: (buttonPressed: number) => void): void;
        onbuttonup(callback: (buttonReleased: number) => void): void;
        constructor(id: string, index: number, browserGamepad: any);
        private _setButtonValue(newValue, currentValue, buttonIndex);
        update(): void;
    }
}

declare module BABYLON {
    class GamepadManager {
        private _babylonGamepads;
        private _oneGamepadConnected;
        private _isMonitoring;
        private _gamepadEventSupported;
        private _gamepadSupport;
        onGamepadConnectedObservable: Observable<Gamepad>;
        onGamepadDisconnectedObservable: Observable<Gamepad>;
        private _onGamepadConnectedEvent;
        private _onGamepadDisconnectedEvent;
        constructor();
        readonly gamepads: Gamepad[];
        getGamepadByType(type?: number): Nullable<Gamepad>;
        dispose(): void;
        private _addNewGamepad(gamepad);
        private _startMonitoringGamepads();
        private _stopMonitoringGamepads();
        private _checkGamepadsStatus();
        private _updateGamepadObjects();
    }
}

declare module BABYLON {
    enum Xbox360Button {
        A = 0,
        B = 1,
        X = 2,
        Y = 3,
        Start = 4,
        Back = 5,
        LB = 6,
        RB = 7,
        LeftStick = 8,
        RightStick = 9,
    }
    enum Xbox360Dpad {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3,
    }
    class Xbox360Pad extends Gamepad {
        private _leftTrigger;
        private _rightTrigger;
        private _onlefttriggerchanged;
        private _onrighttriggerchanged;
        private _onbuttondown;
        private _onbuttonup;
        private _ondpaddown;
        private _ondpadup;
        onButtonDownObservable: Observable<Xbox360Button>;
        onButtonUpObservable: Observable<Xbox360Button>;
        onPadDownObservable: Observable<Xbox360Dpad>;
        onPadUpObservable: Observable<Xbox360Dpad>;
        private _buttonA;
        private _buttonB;
        private _buttonX;
        private _buttonY;
        private _buttonBack;
        private _buttonStart;
        private _buttonLB;
        private _buttonRB;
        private _buttonLeftStick;
        private _buttonRightStick;
        private _dPadUp;
        private _dPadDown;
        private _dPadLeft;
        private _dPadRight;
        private _isXboxOnePad;
        constructor(id: string, index: number, gamepad: any, xboxOne?: boolean);
        onlefttriggerchanged(callback: (value: number) => void): void;
        onrighttriggerchanged(callback: (value: number) => void): void;
        leftTrigger: number;
        rightTrigger: number;
        onbuttondown(callback: (buttonPressed: Xbox360Button) => void): void;
        onbuttonup(callback: (buttonReleased: Xbox360Button) => void): void;
        ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void): void;
        ondpadup(callback: (dPadReleased: Xbox360Dpad) => void): void;
        private _setButtonValue(newValue, currentValue, buttonType);
        private _setDPadValue(newValue, currentValue, buttonType);
        buttonA: number;
        buttonB: number;
        buttonX: number;
        buttonY: number;
        buttonStart: number;
        buttonBack: number;
        buttonLB: number;
        buttonRB: number;
        buttonLeftStick: number;
        buttonRightStick: number;
        dPadUp: number;
        dPadDown: number;
        dPadLeft: number;
        dPadRight: number;
        update(): void;
    }
}

declare namespace BABYLON {
    /**
     * Represents the different options available during the creation of
     * a Environment helper.
     *
     * This can control the default ground, skybox and image processing setup of your scene.
     */
    interface IEnvironmentHelperOptions {
        /**
         * Specifies wether or not to create a ground.
         * True by default.
         */
        createGround: boolean;
        /**
         * Specifies the ground size.
         * 15 by default.
         */
        groundSize: number;
        /**
         * The texture used on the ground for the main color.
         * Comes from the BabylonJS CDN by default.
         *
         * Remarks: Can be either a texture or a url.
         */
        groundTexture: string | BaseTexture;
        /**
         * The color mixed in the ground texture by default.
         * BabylonJS clearColor by default.
         */
        groundColor: Color3;
        /**
         * Specifies the ground opacity.
         * 1 by default.
         */
        groundOpacity: number;
        /**
         * Enables the ground to receive shadows.
         * True by default.
         */
        enableGroundShadow: boolean;
        /**
         * Helps preventing the shadow to be fully black on the ground.
         * 0.5 by default.
         */
        groundShadowLevel: number;
        /**
         * Creates a mirror texture attach to the ground.
         * false by default.
         */
        enableGroundMirror: boolean;
        /**
         * Specifies the ground mirror size ratio.
         * 0.3 by default as the default kernel is 64.
         */
        groundMirrorSizeRatio: number;
        /**
         * Specifies the ground mirror blur kernel size.
         * 64 by default.
         */
        groundMirrorBlurKernel: number;
        /**
         * Specifies the ground mirror visibility amount.
         * 1 by default
         */
        groundMirrorAmount: number;
        /**
         * Specifies the ground mirror reflectance weight.
         * This uses the standard weight of the background material to setup the fresnel effect
         * of the mirror.
         * 1 by default.
         */
        groundMirrorFresnelWeight: number;
        /**
         * Specifies the ground mirror Falloff distance.
         * This can helps reducing the size of the reflection.
         * 0 by Default.
         */
        groundMirrorFallOffDistance: number;
        /**
         * Specifies the ground mirror texture type.
         * Unsigned Int by Default.
         */
        groundMirrorTextureType: number;
        /**
         * Specifies wether or not to create a skybox.
         * True by default.
         */
        createSkybox: boolean;
        /**
         * Specifies the skybox size.
         * 20 by default.
         */
        skyboxSize: number;
        /**
         * The texture used on the skybox for the main color.
         * Comes from the BabylonJS CDN by default.
         *
         * Remarks: Can be either a texture or a url.
         */
        skyboxTexture: string | BaseTexture;
        /**
         * The color mixed in the skybox texture by default.
         * BabylonJS clearColor by default.
         */
        skyboxColor: Color3;
        /**
         * The background rotation around the Y axis of the scene.
         * This helps aligning the key lights of your scene with the background.
         * 0 by default.
         */
        backgroundYRotation: number;
        /**
         * Compute automatically the size of the elements to best fit with the scene.
         */
        sizeAuto: boolean;
        /**
         * Default position of the rootMesh if autoSize is not true.
         */
        rootPosition: Vector3;
        /**
         * Sets up the image processing in the scene.
         * true by default.
         */
        setupImageProcessing: boolean;
        /**
         * The texture used as your environment texture in the scene.
         * Comes from the BabylonJS CDN by default and in use if setupImageProcessing is true.
         *
         * Remarks: Can be either a texture or a url.
         */
        environmentTexture: string | BaseTexture;
        /**
         * The value of the exposure to apply to the scene.
         * 0.6 by default if setupImageProcessing is true.
         */
        cameraExposure: number;
        /**
         * The value of the contrast to apply to the scene.
         * 1.6 by default if setupImageProcessing is true.
         */
        cameraContrast: number;
        /**
         * Specifies wether or not tonemapping should be enabled in the scene.
         * true by default if setupImageProcessing is true.
         */
        toneMappingEnabled: boolean;
    }
    /**
     * The Environment helper class can be used to add a fully featuread none expensive background to your scene.
     * It includes by default a skybox and a ground relying on the BackgroundMaterial.
     * It also helps with the default setup of your imageProcessing configuration.
     */
    class EnvironmentHelper {
        /**
         * Default ground texture URL.
         */
        private static _groundTextureCDNUrl;
        /**
         * Default skybox texture URL.
         */
        private static _skyboxTextureCDNUrl;
        /**
         * Default environment texture URL.
         */
        private static _environmentTextureCDNUrl;
        /**
         * Creates the default options for the helper.
         */
        private static _getDefaultOptions();
        private _rootMesh;
        /**
         * Gets the root mesh created by the helper.
         */
        readonly rootMesh: Mesh;
        private _skybox;
        /**
         * Gets the skybox created by the helper.
         */
        readonly skybox: Nullable<Mesh>;
        private _skyboxTexture;
        /**
         * Gets the skybox texture created by the helper.
         */
        readonly skyboxTexture: Nullable<BaseTexture>;
        private _skyboxMaterial;
        /**
         * Gets the skybox material created by the helper.
         */
        readonly skyboxMaterial: Nullable<BackgroundMaterial>;
        private _ground;
        /**
         * Gets the ground mesh created by the helper.
         */
        readonly ground: Nullable<Mesh>;
        private _groundTexture;
        /**
         * Gets the ground texture created by the helper.
         */
        readonly groundTexture: Nullable<BaseTexture>;
        private _groundMirror;
        /**
         * Gets the ground mirror created by the helper.
         */
        readonly groundMirror: Nullable<MirrorTexture>;
        /**
         * Gets the ground mirror render list to helps pushing the meshes
         * you wish in the ground reflection.
         */
        readonly groundMirrorRenderList: Nullable<AbstractMesh[]>;
        private _groundMaterial;
        /**
         * Gets the ground material created by the helper.
         */
        readonly groundMaterial: Nullable<BackgroundMaterial>;
        /**
         * Stores the creation options.
         */
        private readonly _options;
        private readonly _scene;
        /**
         * constructor
         * @param options
         * @param scene The scene to add the material to
         */
        constructor(options: Partial<IEnvironmentHelperOptions>, scene: BABYLON.Scene);
        /**
         * Updates the background according to the new options
         * @param options
         */
        updateOptions(options: Partial<IEnvironmentHelperOptions>): void;
        /**
         * Sets the primary color of all the available elements.
         * @param color
         */
        setMainColor(color: Color3): void;
        /**
         * Setup the image processing according to the specified options.
         */
        private _setupImageProcessing();
        /**
         * Setup the environment texture according to the specified options.
         */
        private _setupEnvironmentTexture();
        /**
         * Setup the background according to the specified options.
         */
        private _setupBackground();
        /**
         * Get the scene sizes according to the setup.
         */
        private _getSceneSize();
        /**
         * Setup the ground according to the specified options.
         */
        private _setupGround(sceneSize);
        /**
         * Setup the ground material according to the specified options.
         */
        private _setupGroundMaterial();
        /**
         * Setup the ground diffuse texture according to the specified options.
         */
        private _setupGroundDiffuseTexture();
        /**
         * Setup the ground mirror texture according to the specified options.
         */
        private _setupGroundMirrorTexture(sceneSize);
        /**
         * Setup the ground to receive the mirror texture.
         */
        private _setupMirrorInGroundMaterial();
        /**
         * Setup the skybox according to the specified options.
         */
        private _setupSkybox(sceneSize);
        /**
         * Setup the skybox material according to the specified options.
         */
        private _setupSkyboxMaterial();
        /**
         * Setup the skybox reflection texture according to the specified options.
         */
        private _setupSkyboxReflectionTexture();
        /**
         * Dispose all the elements created by the Helper.
         */
        dispose(): void;
    }
}

declare module BABYLON {
    class InstancingAttributeInfo {
        /**
         * Index/offset of the attribute in the vertex shader
         */
        index: number;
        /**
         * size of the attribute, 1, 2, 3 or 4
         */
        attributeSize: number;
        /**
         * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
         * default is FLOAT
         */
        attribyteType: number;
        /**
         * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
         */
        normalized: boolean;
        /**
         * Offset of the data in the Vertex Buffer acting as the instancing buffer
         */
        offset: number;
        /**
         * Name of the GLSL attribute, for debugging purpose only
         */
        attributeName: string;
    }
    /**
     * Define options used to create a render target texture
     */
    class RenderTargetCreationOptions {
        generateMipMaps?: boolean;
        generateDepthBuffer?: boolean;
        generateStencilBuffer?: boolean;
        type?: number;
        samplingMode?: number;
    }
    /**
     * Regroup several parameters relative to the browser in use
     */
    class EngineCapabilities {
        /** The maximum textures image */
        maxTexturesImageUnits: number;
        maxVertexTextureImageUnits: number;
        /** The maximum texture size */
        maxTextureSize: number;
        maxCubemapTextureSize: number;
        maxRenderTextureSize: number;
        maxVertexAttribs: number;
        maxVaryingVectors: number;
        maxVertexUniformVectors: number;
        maxFragmentUniformVectors: number;
        standardDerivatives: boolean;
        s3tc: Nullable<WEBGL_compressed_texture_s3tc>;
        pvrtc: any;
        etc1: any;
        etc2: any;
        astc: any;
        textureFloat: boolean;
        vertexArrayObject: boolean;
        textureAnisotropicFilterExtension: Nullable<EXT_texture_filter_anisotropic>;
        maxAnisotropy: number;
        instancedArrays: boolean;
        uintIndices: boolean;
        highPrecisionShaderSupported: boolean;
        fragmentDepthSupported: boolean;
        textureFloatLinearFiltering: boolean;
        textureFloatRender: boolean;
        textureHalfFloat: boolean;
        textureHalfFloatLinearFiltering: boolean;
        textureHalfFloatRender: boolean;
        textureLOD: boolean;
        drawBuffersExtension: boolean;
        depthTextureExtension: boolean;
        colorBufferFloat: boolean;
        timerQuery: EXT_disjoint_timer_query;
        canUseTimestampForTimerQuery: boolean;
    }
    interface EngineOptions extends WebGLContextAttributes {
        limitDeviceRatio?: number;
        autoEnableWebVR?: boolean;
        disableWebGL2Support?: boolean;
        audioEngine?: boolean;
        deterministicLockstep?: boolean;
        lockstepMaxSteps?: number;
        doNotHandleContextLost?: boolean;
    }
    interface IDisplayChangedEventArgs {
        vrDisplay: any;
        vrSupported: boolean;
    }
    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
     */
    class Engine {
        static Instances: Engine[];
        static readonly LastCreatedEngine: Nullable<Engine>;
        static readonly LastCreatedScene: Nullable<Scene>;
        /**
         * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
         */
        static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void;
        private static _ALPHA_DISABLE;
        private static _ALPHA_ADD;
        private static _ALPHA_COMBINE;
        private static _ALPHA_SUBTRACT;
        private static _ALPHA_MULTIPLY;
        private static _ALPHA_MAXIMIZED;
        private static _ALPHA_ONEONE;
        private static _ALPHA_PREMULTIPLIED;
        private static _ALPHA_PREMULTIPLIED_PORTERDUFF;
        private static _ALPHA_INTERPOLATE;
        private static _ALPHA_SCREENMODE;
        private static _DELAYLOADSTATE_NONE;
        private static _DELAYLOADSTATE_LOADED;
        private static _DELAYLOADSTATE_LOADING;
        private static _DELAYLOADSTATE_NOTLOADED;
        private static _TEXTUREFORMAT_ALPHA;
        private static _TEXTUREFORMAT_LUMINANCE;
        private static _TEXTUREFORMAT_LUMINANCE_ALPHA;
        private static _TEXTUREFORMAT_RGB;
        private static _TEXTUREFORMAT_RGBA;
        private static _TEXTURETYPE_UNSIGNED_INT;
        private static _TEXTURETYPE_FLOAT;
        private static _TEXTURETYPE_HALF_FLOAT;
        private static _NEVER;
        private static _ALWAYS;
        private static _LESS;
        private static _EQUAL;
        private static _LEQUAL;
        private static _GREATER;
        private static _GEQUAL;
        private static _NOTEQUAL;
        static readonly NEVER: number;
        static readonly ALWAYS: number;
        static readonly LESS: number;
        static readonly EQUAL: number;
        static readonly LEQUAL: number;
        static readonly GREATER: number;
        static readonly GEQUAL: number;
        static readonly NOTEQUAL: number;
        private static _KEEP;
        private static _REPLACE;
        private static _INCR;
        private static _DECR;
        private static _INVERT;
        private static _INCR_WRAP;
        private static _DECR_WRAP;
        static readonly KEEP: number;
        static readonly REPLACE: number;
        static readonly INCR: number;
        static readonly DECR: number;
        static readonly INVERT: number;
        static readonly INCR_WRAP: number;
        static readonly DECR_WRAP: number;
        static readonly ALPHA_DISABLE: number;
        static readonly ALPHA_ONEONE: number;
        static readonly ALPHA_ADD: number;
        static readonly ALPHA_COMBINE: number;
        static readonly ALPHA_SUBTRACT: number;
        static readonly ALPHA_MULTIPLY: number;
        static readonly ALPHA_MAXIMIZED: number;
        static readonly ALPHA_PREMULTIPLIED: number;
        static readonly ALPHA_PREMULTIPLIED_PORTERDUFF: number;
        static readonly ALPHA_INTERPOLATE: number;
        static readonly ALPHA_SCREENMODE: number;
        static readonly DELAYLOADSTATE_NONE: number;
        static readonly DELAYLOADSTATE_LOADED: number;
        static readonly DELAYLOADSTATE_LOADING: number;
        static readonly DELAYLOADSTATE_NOTLOADED: number;
        static readonly TEXTUREFORMAT_ALPHA: number;
        static readonly TEXTUREFORMAT_LUMINANCE: number;
        static readonly TEXTUREFORMAT_LUMINANCE_ALPHA: number;
        static readonly TEXTUREFORMAT_RGB: number;
        static readonly TEXTUREFORMAT_RGBA: number;
        static readonly TEXTURETYPE_UNSIGNED_INT: number;
        static readonly TEXTURETYPE_FLOAT: number;
        static readonly TEXTURETYPE_HALF_FLOAT: number;
        private static _SCALEMODE_FLOOR;
        private static _SCALEMODE_NEAREST;
        private static _SCALEMODE_CEILING;
        static readonly SCALEMODE_FLOOR: number;
        static readonly SCALEMODE_NEAREST: number;
        static readonly SCALEMODE_CEILING: number;
        static readonly Version: string;
        static CollisionsEpsilon: number;
        static CodeRepository: string;
        static ShadersRepository: string;
        forcePOTTextures: boolean;
        isFullscreen: boolean;
        isPointerLock: boolean;
        cullBackFaces: boolean;
        renderEvenInBackground: boolean;
        preventCacheWipeBetweenFrames: boolean;
        enableOfflineSupport: boolean;
        scenes: Scene[];
        postProcesses: PostProcess[];
        /**
         * Observable event triggered each time the rendering canvas is resized
         */
        onResizeObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas loses focus
         */
        onCanvasBlurObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas gains focus
         */
        onCanvasFocusObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas receives pointerout event
         */
        onCanvasPointerOutObservable: Observable<Engine>;
        /**
         * Observable event triggered before each texture is initialized
         */
        onBeforeTextureInitObservable: Observable<Texture>;
        private _vrDisplay;
        private _vrSupported;
        private _oldSize;
        private _oldHardwareScaleFactor;
        private _vrExclusivePointerMode;
        readonly isInVRExclusivePointerMode: boolean;
        disableUniformBuffers: boolean;
        _uniformBuffers: UniformBuffer[];
        readonly supportsUniformBuffers: boolean;
        /**
         * Observable raised when the engine begins a new frame
         */
        onBeginFrameObservable: Observable<Engine>;
        /**
         * Observable raised when the engine ends the current frame
         */
        onEndFrameObservable: Observable<Engine>;
        /**
         * Observable raised when the engine is about to compile a shader
         */
        onBeforeShaderCompilationObservable: Observable<Engine>;
        /**
         * Observable raised when the engine has jsut compiled a shader
         */
        onAfterShaderCompilationObservable: Observable<Engine>;
        private _gl;
        private _renderingCanvas;
        private _windowIsBackground;
        private _webGLVersion;
        readonly needPOTTextures: boolean;
        private _badOS;
        readonly badOS: boolean;
        private _badDesktopOS;
        readonly badDesktopOS: boolean;
        static audioEngine: AudioEngine;
        private _onFocus;
        private _onBlur;
        private _onCanvasPointerOut;
        private _onCanvasBlur;
        private _onCanvasFocus;
        private _onFullscreenChange;
        private _onPointerLockChange;
        private _onVRDisplayPointerRestricted;
        private _onVRDisplayPointerUnrestricted;
        private _onVrDisplayConnect;
        private _onVrDisplayDisconnect;
        private _onVrDisplayPresentChange;
        onVRDisplayChangedObservable: Observable<IDisplayChangedEventArgs>;
        onVRRequestPresentComplete: Observable<boolean>;
        onVRRequestPresentStart: Observable<Engine>;
        private _hardwareScalingLevel;
        protected _caps: EngineCapabilities;
        private _pointerLockRequested;
        private _alphaTest;
        private _isStencilEnable;
        private _colorWrite;
        private _loadingScreen;
        _drawCalls: PerfCounter;
        private _glVersion;
        private _glRenderer;
        private _glVendor;
        private _videoTextureSupported;
        private _renderingQueueLaunched;
        private _activeRenderLoops;
        private _deterministicLockstep;
        private _lockstepMaxSteps;
        onContextLostObservable: Observable<Engine>;
        onContextRestoredObservable: Observable<Engine>;
        private _onContextLost;
        private _onContextRestored;
        private _contextWasLost;
        private _doNotHandleContextLost;
        private _performanceMonitor;
        private _fps;
        private _deltaTime;
        /**
         * Turn this value on if you want to pause FPS computation when in background
         */
        disablePerformanceMonitorInBackground: boolean;
        readonly performanceMonitor: PerformanceMonitor;
        protected _depthCullingState: Internals._DepthCullingState;
        protected _stencilState: Internals._StencilState;
        protected _alphaState: Internals._AlphaState;
        protected _alphaMode: number;
        private _internalTexturesCache;
        protected _activeTextureChannel: number;
        protected _activeTexturesCache: {
            [key: string]: Nullable<WebGLTexture>;
        };
        protected _currentEffect: Nullable<Effect>;
        protected _currentProgram: Nullable<WebGLProgram>;
        private _compiledEffects;
        private _vertexAttribArraysEnabled;
        protected _cachedViewport: Nullable<Viewport>;
        private _cachedVertexArrayObject;
        protected _cachedVertexBuffers: any;
        protected _cachedIndexBuffer: Nullable<WebGLBuffer>;
        protected _cachedEffectForVertexBuffers: Nullable<Effect>;
        protected _currentRenderTarget: Nullable<InternalTexture>;
        private _uintIndicesCurrentlySet;
        private _currentBoundBuffer;
        protected _currentFramebuffer: Nullable<WebGLFramebuffer>;
        private _currentBufferPointers;
        private _currentInstanceLocations;
        private _currentInstanceBuffers;
        private _textureUnits;
        private _workingCanvas;
        private _workingContext;
        private _rescalePostProcess;
        private _dummyFramebuffer;
        private _externalData;
        private _bindedRenderFunction;
        private _vaoRecordInProgress;
        private _mustWipeVertexAttributes;
        private _emptyTexture;
        private _emptyCubeTexture;
        private _emptyTexture3D;
        private _frameHandler;
        private _texturesSupported;
        private _textureFormatInUse;
        readonly texturesSupported: Array<string>;
        readonly textureFormatInUse: Nullable<string>;
        readonly currentViewport: Nullable<Viewport>;
        readonly emptyTexture: InternalTexture;
        readonly emptyTexture3D: InternalTexture;
        readonly emptyCubeTexture: InternalTexture;
        /**
         * @constructor
         * @param {HTMLCanvasElement | WebGLRenderingContext} canvasOrContext - the canvas or the webgl context to be used for rendering
         * @param {boolean} [antialias] - enable antialias
         * @param options - further options to be sent to the getContext function
         */
        constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio?: boolean);
        private _rebuildInternalTextures();
        private _rebuildEffects();
        private _rebuildBuffers();
        private _initGLContext();
        readonly webGLVersion: number;
        /**
         * Returns true if the stencil buffer has been enabled through the creation option of the context.
         */
        readonly isStencilEnable: boolean;
        private _prepareWorkingCanvas();
        resetTextureCache(): void;
        isDeterministicLockStep(): boolean;
        getLockstepMaxSteps(): number;
        getGlInfo(): {
            vendor: string;
            renderer: string;
            version: string;
        };
        getAspectRatio(camera: Camera, useScreen?: boolean): number;
        getRenderWidth(useScreen?: boolean): number;
        getRenderHeight(useScreen?: boolean): number;
        getRenderingCanvas(): Nullable<HTMLCanvasElement>;
        getRenderingCanvasClientRect(): Nullable<ClientRect>;
        setHardwareScalingLevel(level: number): void;
        getHardwareScalingLevel(): number;
        getLoadedTexturesCache(): InternalTexture[];
        getCaps(): EngineCapabilities;
        /** The number of draw calls submitted last frame */
        readonly drawCalls: number;
        readonly drawCallsPerfCounter: Nullable<PerfCounter>;
        getDepthFunction(): Nullable<number>;
        setDepthFunction(depthFunc: number): void;
        setDepthFunctionToGreater(): void;
        setDepthFunctionToGreaterOrEqual(): void;
        setDepthFunctionToLess(): void;
        setDepthFunctionToLessOrEqual(): void;
        getStencilBuffer(): boolean;
        setStencilBuffer(enable: boolean): void;
        getStencilMask(): number;
        setStencilMask(mask: number): void;
        getStencilFunction(): number;
        getStencilFunctionReference(): number;
        getStencilFunctionMask(): number;
        setStencilFunction(stencilFunc: number): void;
        setStencilFunctionReference(reference: number): void;
        setStencilFunctionMask(mask: number): void;
        getStencilOperationFail(): number;
        getStencilOperationDepthFail(): number;
        getStencilOperationPass(): number;
        setStencilOperationFail(operation: number): void;
        setStencilOperationDepthFail(operation: number): void;
        setStencilOperationPass(operation: number): void;
        setDitheringState(value: boolean): void;
        setRasterizerState(value: boolean): void;
        /**
         * stop executing a render loop function and remove it from the execution array
         * @param {Function} [renderFunction] the function to be removed. If not provided all functions will be removed.
         */
        stopRenderLoop(renderFunction?: () => void): void;
        _renderLoop(): void;
        /**
         * Register and execute a render loop. The engine can have more than one render function.
         * @param {Function} renderFunction - the function to continuously execute starting the next render loop.
         * @example
         * engine.runRenderLoop(function () {
         *      scene.render()
         * })
         */
        runRenderLoop(renderFunction: () => void): void;
        /**
         * Toggle full screen mode.
         * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
         * @param {any} options - an options object to be sent to the requestFullscreen function
         */
        switchFullscreen(requestPointerLock: boolean): void;
        clear(color: Nullable<Color4>, backBuffer: boolean, depth: boolean, stencil?: boolean): void;
        scissorClear(x: number, y: number, width: number, height: number, clearColor: Color4): void;
        /**
         * Set the WebGL's viewport
         * @param {BABYLON.Viewport} viewport - the viewport element to be used.
         * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
         * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
         */
        setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void;
        /**
         * Directly set the WebGL Viewport
         * The x, y, width & height are directly passed to the WebGL call
         * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state.
         */
        setDirectViewport(x: number, y: number, width: number, height: number): Nullable<Viewport>;
        beginFrame(): void;
        endFrame(): void;
        /**
         * resize the view according to the canvas' size.
         * @example
         *   window.addEventListener("resize", function () {
         *      engine.resize();
         *   });
         */
        resize(): void;
        /**
         * force a specific size of the canvas
         * @param {number} width - the new canvas' width
         * @param {number} height - the new canvas' height
         */
        setSize(width: number, height: number): void;
        isVRDevicePresent(): boolean;
        getVRDevice(): any;
        initWebVR(): Observable<{
            vrDisplay: any;
            vrSupported: any;
        }>;
        enableVR(): void;
        disableVR(): void;
        private _onVRFullScreenTriggered;
        private _getVRDisplays(callback);
        bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void;
        private bindUnboundFramebuffer(framebuffer);
        unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void): void;
        generateMipMapsForCubemap(texture: InternalTexture): void;
        flushFramebuffer(): void;
        restoreDefaultFramebuffer(): void;
        createUniformBuffer(elements: FloatArray): WebGLBuffer;
        createDynamicUniformBuffer(elements: FloatArray): WebGLBuffer;
        updateUniformBuffer(uniformBuffer: WebGLBuffer, elements: FloatArray, offset?: number, count?: number): void;
        private _resetVertexBufferBinding();
        createVertexBuffer(vertices: FloatArray): WebGLBuffer;
        createDynamicVertexBuffer(vertices: FloatArray): WebGLBuffer;
        updateDynamicIndexBuffer(indexBuffer: WebGLBuffer, indices: IndicesArray, offset?: number): void;
        updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: FloatArray, offset?: number, count?: number): void;
        private _resetIndexBufferBinding();
        createIndexBuffer(indices: IndicesArray, updatable?: boolean): WebGLBuffer;
        bindArrayBuffer(buffer: Nullable<WebGLBuffer>): void;
        bindUniformBuffer(buffer: Nullable<WebGLBuffer>): void;
        bindUniformBufferBase(buffer: WebGLBuffer, location: number): void;
        bindUniformBlock(shaderProgram: WebGLProgram, blockName: string, index: number): void;
        private bindIndexBuffer(buffer);
        private bindBuffer(buffer, target);
        updateArrayBuffer(data: Float32Array): void;
        private vertexAttribPointer(buffer, indx, size, type, normalized, stride, offset);
        private _bindIndexBufferWithCache(indexBuffer);
        private _bindVertexBuffersAttributes(vertexBuffers, effect);
        recordVertexArrayObject(vertexBuffers: {
            [key: string]: VertexBuffer;
        }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): WebGLVertexArrayObject;
        bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<WebGLBuffer>): void;
        bindBuffersDirectly(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void;
        private _unbindVertexArrayObject();
        bindBuffers(vertexBuffers: {
            [key: string]: Nullable<VertexBuffer>;
        }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): void;
        unbindInstanceAttributes(): void;
        releaseVertexArrayObject(vao: WebGLVertexArrayObject): void;
        _releaseBuffer(buffer: WebGLBuffer): boolean;
        createInstancesBuffer(capacity: number): WebGLBuffer;
        deleteInstancesBuffer(buffer: WebGLBuffer): void;
        updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void;
        applyStates(): void;
        draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void;
        drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void;
        drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void;
        _releaseEffect(effect: Effect): void;
        _deleteProgram(program: WebGLProgram): void;
        /**
         * @param baseName The base name of the effect (The name of file without .fragment.fx or .vertex.fx)
         * @param samplers An array of string used to represent textures
         */
        createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect;
        createEffectForParticles(fragmentName: string, uniformsNames?: string[], samplers?: string[], defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect;
        createRawShaderProgram(vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings?: Nullable<string[]>): WebGLProgram;
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings?: Nullable<string[]>): WebGLProgram;
        private _createShaderProgram(vertexShader, fragmentShader, context, transformFeedbackVaryings?);
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): Nullable<WebGLUniformLocation>[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[];
        enableEffect(effect: Nullable<Effect>): void;
        setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setFloatArray(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray2(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray3(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray4(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setArray(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): void;
        setMatrix(uniform: Nullable<WebGLUniformLocation>, matrix: Matrix): void;
        setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void;
        setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void;
        setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): void;
        setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): void;
        setFloat3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): void;
        setBool(uniform: Nullable<WebGLUniformLocation>, bool: number): void;
        setFloat4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: Nullable<WebGLUniformLocation>, color3: Color3): void;
        setColor4(uniform: Nullable<WebGLUniformLocation>, color3: Color3, alpha: number): void;
        setState(culling: boolean, zOffset?: number, force?: boolean, reverseSide?: boolean): void;
        setZOffset(value: number): void;
        getZOffset(): number;
        setDepthBuffer(enable: boolean): void;
        getDepthWrite(): boolean;
        setDepthWrite(enable: boolean): void;
        setColorWrite(enable: boolean): void;
        getColorWrite(): boolean;
        setAlphaConstants(r: number, g: number, b: number, a: number): void;
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;
        getAlphaMode(): number;
        setAlphaTesting(enable: boolean): void;
        getAlphaTesting(): boolean;
        wipeCaches(bruteForce?: boolean): void;
        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param {Array<string>} formatsAvailable- The list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        setTextureFormatToUse(formatsAvailable: Array<string>): Nullable<string>;
        _createTexture(): WebGLTexture;
        /**
         * Usually called from BABYLON.Texture.ts.  Passed information to create a WebGLTexture.
         * @param {string} urlArg- This contains one of the following:
         *                         1. A conventional http URL, e.g. 'http://...' or 'file://...'
         *                         2. A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
         *                         3. An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
         *
         * @param {boolean} noMipmap- When true, no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file.
         * @param {boolean} invertY- When true, image is flipped when loaded.  You probably want true. Ignored for compressed textures.  Must be flipped in the file.
         * @param {Scene} scene- Needed for loading to the correct scene.
         * @param {number} samplingMode- Mode with should be used sample / access the texture.  Default: TRILINEAR
         * @param {callback} onLoad- Optional callback to be called upon successful completion.
         * @param {callback} onError- Optional callback to be called upon failure.
         * @param {ArrayBuffer | HTMLImageElement} buffer- A source of a file previously fetched as either an ArrayBuffer (compressed or image format) or HTMLImageElement (image format)
         * @param {WebGLTexture} fallback- An internal argument in case the function must be called again, due to etc1 not having alpha capabilities.
         * @param {number} format-  Internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures.
         *
         * @returns {WebGLTexture} for assignment back into BABYLON.Texture
         */
        createTexture(urlArg: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<Scene>, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<() => void>, buffer?: Nullable<ArrayBuffer | HTMLImageElement>, fallBack?: Nullable<InternalTexture>, format?: Nullable<number>): InternalTexture;
        private _rescaleTexture(source, destination, scene, internalFormat, onComplete);
        private _getInternalFormat(format);
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression?: Nullable<string>): void;
        createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>): InternalTexture;
        createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture;
        updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void;
        updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha?: boolean, format?: number): void;
        updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
        createRenderTargetTexture(size: number | {
            width: number;
            height: number;
        }, options: boolean | RenderTargetCreationOptions): InternalTexture;
        createMultipleRenderTarget(size: any, options: any): InternalTexture[];
        private _setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height, samples?);
        updateRenderTargetTextureSampleCount(texture: Nullable<InternalTexture>, samples: number): number;
        _uploadDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, format: number, type: number, data: ArrayBufferView): void;
        _uploadCompressedDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, data: ArrayBufferView): void;
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): InternalTexture;
        createPrefilteredCubeTexture(rootUrl: string, scene: Nullable<Scene>, scale: number, offset: number, onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, forcedExtension?: any): InternalTexture;
        createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad?: Nullable<(data?: any) => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, forcedExtension?: any): InternalTexture;
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression?: Nullable<string>, level?: number): void;
        createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>): InternalTexture;
        createRawCubeTextureFromUrl(url: string, scene: Scene, size: number, format: number, type: number, noMipmap: boolean, callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>, mipmmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, samplingMode?: number, invertY?: boolean): InternalTexture;
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression?: Nullable<string>): void;
        createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>): InternalTexture;
        private _prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
        private _prepareWebGLTexture(texture, scene, width, height, invertY, noMipmap, isCompressed, processFunction, samplingMode?);
        private _convertRGBtoRGBATextureData(rgbData, width, height, textureType);
        _releaseFramebufferObjects(texture: InternalTexture): void;
        _releaseTexture(texture: InternalTexture): void;
        private setProgram(program);
        bindSamplers(effect: Effect): void;
        private activateTextureChannel(textureChannel);
        _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>): void;
        _bindTexture(channel: number, texture: Nullable<InternalTexture>): void;
        setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>): void;
        unbindAllTextures(): void;
        setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>): void;
        private _setTexture(channel, texture);
        setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: BaseTexture[]): void;
        _setAnisotropicLevel(key: number, texture: BaseTexture): void;
        readPixels(x: number, y: number, width: number, height: number): Uint8Array;
        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        addExternalData<T>(key: string, data: T): boolean;
        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        getExternalData<T>(key: string): T;
        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T;
        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        removeExternalData(key: string): boolean;
        unbindAllAttributes(): void;
        releaseEffects(): void;
        dispose(): void;
        displayLoadingUI(): void;
        hideLoadingUI(): void;
        loadingScreen: ILoadingScreen;
        loadingUIText: string;
        loadingUIBackgroundColor: string;
        attachContextLostEvent(callback: ((event: WebGLContextEvent) => void)): void;
        attachContextRestoredEvent(callback: ((event: WebGLContextEvent) => void)): void;
        getVertexShaderSource(program: WebGLProgram): Nullable<string>;
        getFragmentShaderSource(program: WebGLProgram): Nullable<string>;
        getError(): number;
        getFps(): number;
        getDeltaTime(): number;
        private _measureFps();
        _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex?: number): ArrayBufferView;
        private _canRenderToFloatFramebuffer();
        private _canRenderToHalfFloatFramebuffer();
        private _canRenderToFramebuffer(type);
        _getWebGLTextureType(type: number): number;
        _getRGBABufferInternalSizedFormat(type: number): number;
        createQuery(): WebGLQuery;
        deleteQuery(query: WebGLQuery): Engine;
        isQueryResultAvailable(query: WebGLQuery): boolean;
        getQueryResult(query: WebGLQuery): number;
        beginOcclusionQuery(algorithmType: number, query: WebGLQuery): Engine;
        endOcclusionQuery(algorithmType: number): Engine;
        private _createTimeQuery();
        private _deleteTimeQuery(query);
        private _getTimeQueryResult(query);
        private _getTimeQueryAvailability(query);
        private _currentNonTimestampToken;
        startTimeQuery(): Nullable<_TimeToken>;
        endTimeQuery(token: _TimeToken): int;
        private getGlAlgorithmType(algorithmType);
        createTransformFeedback(): WebGLTransformFeedback;
        deleteTransformFeedback(value: WebGLTransformFeedback): void;
        bindTransformFeedback(value: Nullable<WebGLTransformFeedback>): void;
        beginTransformFeedback(usePoints?: boolean): void;
        endTransformFeedback(): void;
        setTranformFeedbackVaryings(program: WebGLProgram, value: string[]): void;
        bindTransformFeedbackBuffer(value: Nullable<WebGLBuffer>): void;
        static isSupported(): boolean;
    }
}

declare module BABYLON {
    class NullEngineOptions {
        renderWidth: number;
        renderHeight: number;
        textureSize: number;
    }
    /**
     * The null engine class provides support for headless version of babylon.js.
     * This can be used in server side scenario or for testing purposes
     */
    class NullEngine extends Engine {
        private _options;
        constructor(options?: NullEngineOptions);
        createVertexBuffer(vertices: FloatArray): WebGLBuffer;
        createIndexBuffer(indices: IndicesArray): WebGLBuffer;
        clear(color: Color4, backBuffer: boolean, depth: boolean, stencil?: boolean): void;
        getRenderWidth(useScreen?: boolean): number;
        getRenderHeight(useScreen?: boolean): number;
        setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void;
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: string, context?: WebGLRenderingContext): WebGLProgram;
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[];
        bindSamplers(effect: Effect): void;
        enableEffect(effect: Effect): void;
        setState(culling: boolean, zOffset?: number, force?: boolean, reverseSide?: boolean): void;
        setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void;
        setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void;
        setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void;
        setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void;
        setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): void;
        setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): void;
        setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): void;
        setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): void;
        setArray(uniform: WebGLUniformLocation, array: number[]): void;
        setArray2(uniform: WebGLUniformLocation, array: number[]): void;
        setArray3(uniform: WebGLUniformLocation, array: number[]): void;
        setArray4(uniform: WebGLUniformLocation, array: number[]): void;
        setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void;
        setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void;
        setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void;
        setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void;
        setFloat(uniform: WebGLUniformLocation, value: number): void;
        setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void;
        setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void;
        setBool(uniform: WebGLUniformLocation, bool: number): void;
        setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: WebGLUniformLocation, color3: Color3): void;
        setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void;
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;
        bindBuffers(vertexBuffers: {
            [key: string]: VertexBuffer;
        }, indexBuffer: WebGLBuffer, effect: Effect): void;
        wipeCaches(bruteForce?: boolean): void;
        draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void;
        _createTexture(): WebGLTexture;
        createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<() => void>, buffer?: Nullable<ArrayBuffer | HTMLImageElement>, fallBack?: InternalTexture, format?: number): InternalTexture;
        createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture;
        updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void;
        bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void;
        unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void): void;
        createDynamicVertexBuffer(vertices: FloatArray): WebGLBuffer;
        updateDynamicIndexBuffer(indexBuffer: WebGLBuffer, indices: IndicesArray, offset?: number): void;
        updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: FloatArray, offset?: number, count?: number): void;
        _bindTextureDirectly(target: number, texture: InternalTexture): void;
        _bindTexture(channel: number, texture: InternalTexture): void;
        _releaseBuffer(buffer: WebGLBuffer): boolean;
    }
}

interface WebGLRenderingContext {
    readonly RASTERIZER_DISCARD: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_WRAP_R: number;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView, offset: number): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ImageBitmap | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;
    compressedTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, data: ArrayBufferView, offset?: number, length?: number): void;
    readonly TRANSFORM_FEEDBACK: number;
    readonly INTERLEAVED_ATTRIBS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER: number;
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(transformFeedbac: WebGLTransformFeedback): void;
    bindTransformFeedback(target: number, transformFeedback: BABYLON.Nullable<WebGLTransformFeedback>): void;
    beginTransformFeedback(primitiveMode: number): void;
    endTransformFeedback(): void;
    transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number): void;
}
interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
}
interface WebGLQuery extends WebGLObject {
}
declare var WebGLQuery: {
    prototype: WebGLQuery;
    new (): WebGLQuery;
};
interface WebGLSampler extends WebGLObject {
}
declare var WebGLSampler: {
    prototype: WebGLSampler;
    new (): WebGLSampler;
};
interface WebGLSync extends WebGLObject {
}
declare var WebGLSync: {
    prototype: WebGLSync;
    new (): WebGLSync;
};
interface WebGLTransformFeedback extends WebGLObject {
}
declare var WebGLTransformFeedback: {
    prototype: WebGLTransformFeedback;
    new (): WebGLTransformFeedback;
};
interface WebGLVertexArrayObject extends WebGLObject {
}
declare var WebGLVertexArrayObject: {
    prototype: WebGLVertexArrayObject;
    new (): WebGLVertexArrayObject;
};

declare module BABYLON {
    class KeyboardEventTypes {
        static _KEYDOWN: number;
        static _KEYUP: number;
        static readonly KEYDOWN: number;
        static readonly KEYUP: number;
    }
    class KeyboardInfo {
        type: number;
        event: KeyboardEvent;
        constructor(type: number, event: KeyboardEvent);
    }
    /**
     * This class is used to store keyboard related info for the onPreKeyboardObservable event.
     * Set the skipOnKeyboardObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onKeyboardObservable
     */
    class KeyboardInfoPre extends KeyboardInfo {
        constructor(type: number, event: KeyboardEvent);
        skipOnPointerObservable: boolean;
    }
}

declare module BABYLON {
    class PointerEventTypes {
        static _POINTERDOWN: number;
        static _POINTERUP: number;
        static _POINTERMOVE: number;
        static _POINTERWHEEL: number;
        static _POINTERPICK: number;
        static _POINTERTAP: number;
        static _POINTERDOUBLETAP: number;
        static readonly POINTERDOWN: number;
        static readonly POINTERUP: number;
        static readonly POINTERMOVE: number;
        static readonly POINTERWHEEL: number;
        static readonly POINTERPICK: number;
        static readonly POINTERTAP: number;
        static readonly POINTERDOUBLETAP: number;
    }
    class PointerInfoBase {
        type: number;
        event: PointerEvent | MouseWheelEvent;
        constructor(type: number, event: PointerEvent | MouseWheelEvent);
    }
    /**
     * This class is used to store pointer related info for the onPrePointerObservable event.
     * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
     */
    class PointerInfoPre extends PointerInfoBase {
        constructor(type: number, event: PointerEvent | MouseWheelEvent, localX: number, localY: number);
        localPosition: Vector2;
        skipOnPointerObservable: boolean;
    }
    /**
     * This type contains all the data related to a pointer event in Babylon.js.
     * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
     */
    class PointerInfo extends PointerInfoBase {
        pickInfo: Nullable<PickingInfo>;
        constructor(type: number, event: PointerEvent | MouseWheelEvent, pickInfo: Nullable<PickingInfo>);
    }
}

declare module BABYLON {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    class EngineInstrumentation implements IDisposable {
        engine: Engine;
        private _captureGPUFrameTime;
        private _gpuFrameTimeToken;
        private _gpuFrameTime;
        private _captureShaderCompilationTime;
        private _shaderCompilationTime;
        private _onBeginFrameObserver;
        private _onEndFrameObserver;
        private _onBeforeShaderCompilationObserver;
        private _onAfterShaderCompilationObserver;
        /**
         * Gets the perf counter used for GPU frame time
         */
        readonly gpuFrameTimeCounter: PerfCounter;
        /**
         * Gets the GPU frame time capture status
         */
        /**
         * Enable or disable the GPU frame time capture
         */
        captureGPUFrameTime: boolean;
        /**
         * Gets the perf counter used for shader compilation time
         */
        readonly shaderCompilationTimeCounter: PerfCounter;
        /**
         * Gets the shader compilation time capture status
         */
        /**
         * Enable or disable the shader compilation time capture
         */
        captureShaderCompilationTime: boolean;
        constructor(engine: Engine);
        dispose(): void;
    }
}

declare module BABYLON {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    class SceneInstrumentation implements IDisposable {
        scene: Scene;
        private _captureActiveMeshesEvaluationTime;
        private _activeMeshesEvaluationTime;
        private _captureRenderTargetsRenderTime;
        private _renderTargetsRenderTime;
        private _captureFrameTime;
        private _frameTime;
        private _captureRenderTime;
        private _renderTime;
        private _captureInterFrameTime;
        private _interFrameTime;
        private _captureParticlesRenderTime;
        private _particlesRenderTime;
        private _captureSpritesRenderTime;
        private _spritesRenderTime;
        private _capturePhysicsTime;
        private _physicsTime;
        private _captureAnimationsTime;
        private _animationsTime;
        private _onBeforeActiveMeshesEvaluationObserver;
        private _onAfterActiveMeshesEvaluationObserver;
        private _onBeforeRenderTargetsRenderObserver;
        private _onAfterRenderTargetsRenderObserver;
        private _onAfterRenderObserver;
        private _onBeforeDrawPhaseObserver;
        private _onAfterDrawPhaseObserver;
        private _onBeforeAnimationsObserver;
        private _onBeforeParticlesRenderingObserver;
        private _onAfterParticlesRenderingObserver;
        private _onBeforeSpritesRenderingObserver;
        private _onAfterSpritesRenderingObserver;
        private _onBeforePhysicsObserver;
        private _onAfterPhysicsObserver;
        private _onAfterAnimationsObserver;
        /**
         * Gets the perf counter used for active meshes evaluation time
         */
        readonly activeMeshesEvaluationTimeCounter: PerfCounter;
        /**
         * Gets the active meshes evaluation time capture status
         */
        /**
         * Enable or disable the active meshes evaluation time capture
         */
        captureActiveMeshesEvaluationTime: boolean;
        /**
         * Gets the perf counter used for render targets render time
         */
        readonly renderTargetsRenderTimeCounter: PerfCounter;
        /**
         * Gets the render targets render time capture status
         */
        /**
         * Enable or disable the render targets render time capture
         */
        captureRenderTargetsRenderTime: boolean;
        /**
         * Gets the perf counter used for particles render time
         */
        readonly particlesRenderTimeCounter: PerfCounter;
        /**
         * Gets the particles render time capture status
         */
        /**
         * Enable or disable the particles render time capture
         */
        captureParticlesRenderTime: boolean;
        /**
         * Gets the perf counter used for sprites render time
         */
        readonly spritesRenderTimeCounter: PerfCounter;
        /**
         * Gets the sprites render time capture status
         */
        /**
         * Enable or disable the sprites render time capture
         */
        captureSpritesRenderTime: boolean;
        /**
         * Gets the perf counter used for physics time
         */
        readonly physicsTimeCounter: PerfCounter;
        /**
         * Gets the physics time capture status
         */
        /**
         * Enable or disable the physics time capture
         */
        capturePhysicsTime: boolean;
        /**
         * Gets the perf counter used for animations time
         */
        readonly animationsTimeCounter: PerfCounter;
        /**
         * Gets the animations time capture status
         */
        /**
         * Enable or disable the animations time capture
         */
        captureAnimationsTime: boolean;
        /**
         * Gets the perf counter used for frame time capture
         */
        readonly frameTimeCounter: PerfCounter;
        /**
         * Gets the frame time capture status
         */
        /**
         * Enable or disable the frame time capture
         */
        captureFrameTime: boolean;
        /**
         * Gets the perf counter used for inter-frames time capture
         */
        readonly interFrameTimeCounter: PerfCounter;
        /**
         * Gets the inter-frames time capture status
         */
        /**
         * Enable or disable the inter-frames time capture
         */
        captureInterFrameTime: boolean;
        /**
         * Gets the perf counter used for render time capture
         */
        readonly renderTimeCounter: PerfCounter;
        /**
         * Gets the render time capture status
         */
        /**
         * Enable or disable the render time capture
         */
        captureRenderTime: boolean;
        /**
         * Gets the perf counter used for frame time capture
         */
        readonly drawCallsCounter: PerfCounter;
        constructor(scene: Scene);
        dispose(): void;
    }
}

declare module BABYLON {
    class _TimeToken {
        _startTimeQuery: Nullable<WebGLQuery>;
        _endTimeQuery: Nullable<WebGLQuery>;
        _timeElapsedQuery: Nullable<WebGLQuery>;
        _timeElapsedQueryEnded: boolean;
    }
}

declare module BABYLON {
    class LensFlare {
        size: number;
        position: number;
        color: Color3;
        texture: Nullable<Texture>;
        alphaMode: number;
        private _system;
        static AddFlare(size: number, position: number, color: Color3, imgUrl: string, system: LensFlareSystem): LensFlare;
        constructor(size: number, position: number, color: Color3, imgUrl: string, system: LensFlareSystem);
        dispose(): void;
    }
}

declare module BABYLON {
    class LensFlareSystem {
        name: string;
        lensFlares: LensFlare[];
        borderLimit: number;
        viewportBorder: number;
        meshesSelectionPredicate: (mesh: Mesh) => boolean;
        layerMask: number;
        id: string;
        private _scene;
        private _emitter;
        private _vertexBuffers;
        private _indexBuffer;
        private _effect;
        private _positionX;
        private _positionY;
        private _isEnabled;
        constructor(name: string, emitter: any, scene: Scene);
        isEnabled: boolean;
        getScene(): Scene;
        getEmitter(): any;
        setEmitter(newEmitter: any): void;
        getEmitterPosition(): Vector3;
        computeEffectivePosition(globalViewport: Viewport): boolean;
        _isVisible(): boolean;
        render(): boolean;
        dispose(): void;
        static Parse(parsedLensFlareSystem: any, scene: Scene, rootUrl: string): LensFlareSystem;
        serialize(): any;
    }
}

declare module BABYLON {
    interface ILoadingScreen {
        displayLoadingUI: () => void;
        hideLoadingUI: () => void;
        loadingUIBackgroundColor: string;
        loadingUIText: string;
    }
    class DefaultLoadingScreen implements ILoadingScreen {
        private _renderingCanvas;
        private _loadingText;
        private _loadingDivBackgroundColor;
        private _loadingDiv;
        private _loadingTextDiv;
        constructor(_renderingCanvas: HTMLCanvasElement, _loadingText?: string, _loadingDivBackgroundColor?: string);
        displayLoadingUI(): void;
        hideLoadingUI(): void;
        loadingUIText: string;
        loadingUIBackgroundColor: string;
        private _resizeLoadingUI;
    }
}

declare module BABYLON {
    interface ISceneLoaderPluginExtensions {
        [extension: string]: {
            isBinary: boolean;
        };
    }
    interface ISceneLoaderPluginFactory {
        name: string;
        createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        canDirectLoad?: (data: string) => boolean;
    }
    interface ISceneLoaderPlugin {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void) => boolean;
        load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void) => boolean;
        canDirectLoad?: (data: string) => boolean;
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;
    }
    interface ISceneLoaderPluginAsync {
        name: string;
        extensions: string | ISceneLoaderPluginExtensions;
        importMeshAsync: (meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
        loadAsync: (scene: Scene, data: string, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string, exception?: any) => void) => void;
        canDirectLoad?: (data: string) => boolean;
        rewriteRootURL?: (rootUrl: string, responseURL?: string) => string;
    }
    class SceneLoader {
        private static _ForceFullSceneLoadingForIncremental;
        private static _ShowLoadingScreen;
        private static _CleanBoneMatrixWeights;
        static readonly NO_LOGGING: number;
        static readonly MINIMAL_LOGGING: number;
        static readonly SUMMARY_LOGGING: number;
        static readonly DETAILED_LOGGING: number;
        private static _loggingLevel;
        static ForceFullSceneLoadingForIncremental: boolean;
        static ShowLoadingScreen: boolean;
        static loggingLevel: number;
        static CleanBoneMatrixWeights: boolean;
        static OnPluginActivatedObservable: Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
        private static _registeredPlugins;
        private static _getDefaultPlugin();
        private static _getPluginForExtension(extension);
        private static _getPluginForDirectLoad(data);
        private static _getPluginForFilename(sceneFilename);
        private static _getDirectLoad(sceneFilename);
        private static _loadData(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension?);
        static GetPluginForExtension(extension: string): ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory;
        static RegisterPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync): void;
        /**
        * Import meshes into a scene
        * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with a list of imported meshes, particleSystems, and skeletons when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        static ImportMesh(meshNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onSuccess?: Nullable<(meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void>, onProgress?: Nullable<(event: ProgressEvent) => void>, onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>, pluginExtension?: string): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        static Load(rootUrl: string, sceneFilename: any, engine: Engine, onSuccess?: (scene: Scene) => void, onProgress?: (event: ProgressEvent) => void, onError?: (scene: Scene, message: string, exception?: any) => void, pluginExtension?: string): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        static Append(rootUrl: string, sceneFilename: any, scene: Scene, onSuccess?: (scene: Scene) => void, onProgress?: (event: ProgressEvent) => void, onError?: (scene: Scene, message: string, exception?: any) => void, pluginExtension?: string): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
    }
}

declare module BABYLON {
    /**
     * Highlight layer options. This helps customizing the behaviour
     * of the highlight layer.
     */
    interface IHighlightLayerOptions {
        /**
         * Multiplication factor apply to the canvas size to compute the render target size
         * used to generated the glowing objects (the smaller the faster).
         */
        mainTextureRatio: number;
        /**
         * Enforces a fixed size texture to ensure resize independant blur.
         */
        mainTextureFixedSize?: number;
        /**
         * Multiplication factor apply to the main texture size in the first step of the blur to reduce the size
         * of the picture to blur (the smaller the faster).
         */
        blurTextureSizeRatio: number;
        /**
         * How big in texel of the blur texture is the vertical blur.
         */
        blurVerticalSize: number;
        /**
         * How big in texel of the blur texture is the horizontal blur.
         */
        blurHorizontalSize: number;
        /**
         * Alpha blending mode used to apply the blur. Default is combine.
         */
        alphaBlendingMode: number;
        /**
         * The camera attached to the layer.
         */
        camera: Nullable<Camera>;
    }
    /**
     * The highlight layer Helps adding a glow effect around a mesh.
     *
     * Once instantiated in a scene, simply use the pushMesh or removeMesh method to add or remove
     * glowy meshes to your scene.
     *
     * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
     */
    class HighlightLayer {
        name: string;
        /**
         * The neutral color used during the preparation of the glow effect.
         * This is black by default as the blend operation is a blend operation.
         */
        static neutralColor: Color4;
        /**
         * Stencil value used for glowing meshes.
         */
        static glowingMeshStencilReference: number;
        /**
         * Stencil value used for the other meshes in the scene.
         */
        static normalMeshStencilReference: number;
        private _scene;
        private _engine;
        private _options;
        private _vertexBuffers;
        private _indexBuffer;
        private _downSamplePostprocess;
        private _horizontalBlurPostprocess;
        private _verticalBlurPostprocess;
        private _cachedDefines;
        private _glowMapGenerationEffect;
        private _glowMapMergeEffect;
        private _blurTexture;
        private _mainTexture;
        private _mainTextureDesiredSize;
        private _meshes;
        private _maxSize;
        private _shouldRender;
        private _instanceGlowingMeshStencilReference;
        private _excludedMeshes;
        /**
         * Specifies whether or not the inner glow is ACTIVE in the layer.
         */
        innerGlow: boolean;
        /**
         * Specifies whether or not the outer glow is ACTIVE in the layer.
         */
        outerGlow: boolean;
        /**
         * Specifies wether the highlight layer is enabled or not.
         */
        isEnabled: boolean;
        /**
         * Gets the horizontal size of the blur.
         */
        /**
         * Specifies the horizontal size of the blur.
         */
        blurHorizontalSize: number;
        /**
         * Gets the vertical size of the blur.
         */
        /**
         * Specifies the vertical size of the blur.
         */
        blurVerticalSize: number;
        /**
         * Gets the camera attached to the layer.
         */
        readonly camera: Nullable<Camera>;
        /**
         * An event triggered when the highlight layer has been disposed.
         * @type {BABYLON.Observable}
         */
        onDisposeObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the highlight layer is about rendering the main texture with the glowy parts.
         * @type {BABYLON.Observable}
         */
        onBeforeRenderMainTextureObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the highlight layer is being blurred.
         * @type {BABYLON.Observable}
         */
        onBeforeBlurObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the highlight layer has been blurred.
         * @type {BABYLON.Observable}
         */
        onAfterBlurObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the glowing blurred texture is being merged in the scene.
         * @type {BABYLON.Observable}
         */
        onBeforeComposeObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the glowing blurred texture has been merged in the scene.
         * @type {BABYLON.Observable}
         */
        onAfterComposeObservable: Observable<HighlightLayer>;
        /**
         * An event triggered when the highlight layer changes its size.
         * @type {BABYLON.Observable}
         */
        onSizeChangedObservable: Observable<HighlightLayer>;
        /**
         * Instantiates a new highlight Layer and references it to the scene..
         * @param name The name of the layer
         * @param scene The scene to use the layer in
         * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
         */
        constructor(name: string, scene: Scene, options?: IHighlightLayerOptions);
        private _createIndexBuffer();
        _rebuild(): void;
        /**
         * Creates the render target textures and post processes used in the highlight layer.
         */
        private createTextureAndPostProcesses();
        /**
         * Checks for the readiness of the element composing the layer.
         * @param subMesh the mesh to check for
         * @param useInstances specify wether or not to use instances to render the mesh
         * @param emissiveTexture the associated emissive texture used to generate the glow
         * @return true if ready otherwise, false
         */
        private isReady(subMesh, useInstances, emissiveTexture);
        /**
         * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
         */
        render(): void;
        /**
         * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
         * @param mesh The mesh to exclude from the highlight layer
         */
        addExcludedMesh(mesh: Mesh): void;
        /**
          * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
          * @param mesh The mesh to highlight
          */
        removeExcludedMesh(mesh: Mesh): void;
        /**
         * Add a mesh in the highlight layer in order to make it glow with the chosen color.
         * @param mesh The mesh to highlight
         * @param color The color of the highlight
         * @param glowEmissiveOnly Extract the glow from the emissive texture
         */
        addMesh(mesh: Mesh, color: Color3, glowEmissiveOnly?: boolean): void;
        /**
         * Remove a mesh from the highlight layer in order to make it stop glowing.
         * @param mesh The mesh to highlight
         */
        removeMesh(mesh: Mesh): void;
        /**
         * Returns true if the layer contains information to display, otherwise false.
         */
        shouldRender(): boolean;
        /**
         * Sets the main texture desired size which is the closest power of two
         * of the engine canvas size.
         */
        private setMainTextureSize();
        /**
         * Force the stencil to the normal expected value for none glowing parts
         */
        private defaultStencilReference(mesh);
        /**
         * Dispose only the render target textures and post process.
         */
        private disposeTextureAndPostProcesses();
        /**
         * Dispose the highlight layer and free resources.
         */
        dispose(): void;
    }
}

declare module BABYLON {
    class Layer {
        name: string;
        texture: Nullable<Texture>;
        isBackground: boolean;
        color: Color4;
        scale: Vector2;
        offset: Vector2;
        alphaBlendingMode: number;
        alphaTest: boolean;
        layerMask: number;
        private _scene;
        private _vertexBuffers;
        private _indexBuffer;
        private _effect;
        private _alphaTestEffect;
        /**
        * An event triggered when the layer is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Layer>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
        * An event triggered before rendering the scene
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<Layer>;
        private _onBeforeRenderObserver;
        onBeforeRender: () => void;
        /**
        * An event triggered after rendering the scene
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Layer>;
        private _onAfterRenderObserver;
        onAfterRender: () => void;
        constructor(name: string, imgUrl: Nullable<string>, scene: Nullable<Scene>, isBackground?: boolean, color?: Color4);
        private _createIndexBuffer();
        _rebuild(): void;
        render(): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class DirectionalLight extends ShadowLight {
        private _shadowFrustumSize;
        /**
         * Fix frustum size for the shadow generation. This is disabled if the value is 0.
         */
        /**
         * Specifies a fix frustum size for the shadow generation.
         */
        shadowFrustumSize: number;
        private _shadowOrthoScale;
        shadowOrthoScale: number;
        autoUpdateExtends: boolean;
        private _orthoLeft;
        private _orthoRight;
        private _orthoTop;
        private _orthoBottom;
        /**
         * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).
         * The directional light is emitted from everywhere in the given direction.
         * It can cast shawdows.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, direction: Vector3, scene: Scene);
        /**
         * Returns the string "DirectionalLight".
         */
        getClassName(): string;
        /**
         * Returns the integer 1.
         */
        getTypeID(): number;
        /**
         * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.
         * Returns the DirectionalLight Shadow projection matrix.
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        /**
         * Sets the passed matrix "matrix" as fixed frustum projection matrix for the shadows cast by the light according to the passed view matrix.
         * Returns the DirectionalLight Shadow projection matrix.
         */
        protected _setDefaultFixedFrustumShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix): void;
        /**
         * Sets the passed matrix "matrix" as auto extend projection matrix for the shadows cast by the light according to the passed view matrix.
         * Returns the DirectionalLight Shadow projection matrix.
         */
        protected _setDefaultAutoExtendShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        protected _buildUniformLayout(): void;
        /**
         * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.
         * Returns the DirectionalLight.
         */
        transferToEffect(effect: Effect, lightIndex: string): DirectionalLight;
        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         *
         * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
         * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
         * @param activeCamera
         */
        getDepthMinZ(activeCamera: Camera): number;
        /**
         * Gets the maxZ used for shadow according to both the scene and the light.
         *
         * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
         * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
         * @param activeCamera
         */
        getDepthMaxZ(activeCamera: Camera): number;
    }
}

declare module BABYLON {
    class HemisphericLight extends Light {
        groundColor: Color3;
        direction: Vector3;
        private _worldMatrix;
        /**
         * Creates a HemisphericLight object in the scene according to the passed direction (Vector3).
         * The HemisphericLight simulates the ambient environment light, so the passed direction is the light reflection direction, not the incoming direction.
         * The HemisphericLight can't cast shadows.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, direction: Vector3, scene: Scene);
        protected _buildUniformLayout(): void;
        /**
         * Returns the string "HemisphericLight".
         */
        getClassName(): string;
        /**
         * Sets the HemisphericLight direction towards the passed target (Vector3).
         * Returns the updated direction.
         */
        setDirectionToTarget(target: Vector3): Vector3;
        getShadowGenerator(): Nullable<ShadowGenerator>;
        /**
         * Sets the passed Effect object with the HemisphericLight normalized direction and color and the passed name (string).
         * Returns the HemisphericLight.
         */
        transferToEffect(effect: Effect, lightIndex: string): HemisphericLight;
        _getWorldMatrix(): Matrix;
        /**
         * Returns the integer 3.
         */
        getTypeID(): number;
    }
}

declare module BABYLON {
    class Light extends Node {
        private static _LIGHTMAP_DEFAULT;
        private static _LIGHTMAP_SPECULAR;
        private static _LIGHTMAP_SHADOWSONLY;
        /**
         * If every light affecting the material is in this lightmapMode,
         * material.lightmapTexture adds or multiplies
         * (depends on material.useLightmapAsShadowmap)
         * after every other light calculations.
         */
        static readonly LIGHTMAP_DEFAULT: number;
        /**
         * material.lightmapTexture as only diffuse lighting from this light
         * adds pnly specular lighting from this light
         * adds dynamic shadows
         */
        static readonly LIGHTMAP_SPECULAR: number;
        /**
         * material.lightmapTexture as only lighting
         * no light calculation from this light
         * only adds dynamic shadows from this light
         */
        static readonly LIGHTMAP_SHADOWSONLY: number;
        private static _INTENSITYMODE_AUTOMATIC;
        private static _INTENSITYMODE_LUMINOUSPOWER;
        private static _INTENSITYMODE_LUMINOUSINTENSITY;
        private static _INTENSITYMODE_ILLUMINANCE;
        private static _INTENSITYMODE_LUMINANCE;
        /**
         * Each light type uses the default quantity according to its type:
         *      point/spot lights use luminous intensity
         *      directional lights use illuminance
         */
        static readonly INTENSITYMODE_AUTOMATIC: number;
        /**
         * lumen (lm)
         */
        static readonly INTENSITYMODE_LUMINOUSPOWER: number;
        /**
         * candela (lm/sr)
         */
        static readonly INTENSITYMODE_LUMINOUSINTENSITY: number;
        /**
         * lux (lm/m^2)
         */
        static readonly INTENSITYMODE_ILLUMINANCE: number;
        /**
         * nit (cd/m^2)
         */
        static readonly INTENSITYMODE_LUMINANCE: number;
        private static _LIGHTTYPEID_POINTLIGHT;
        private static _LIGHTTYPEID_DIRECTIONALLIGHT;
        private static _LIGHTTYPEID_SPOTLIGHT;
        private static _LIGHTTYPEID_HEMISPHERICLIGHT;
        /**
         * Light type const id of the point light.
         */
        static readonly LIGHTTYPEID_POINTLIGHT: number;
        /**
         * Light type const id of the directional light.
         */
        static readonly LIGHTTYPEID_DIRECTIONALLIGHT: number;
        /**
         * Light type const id of the spot light.
         */
        static readonly LIGHTTYPEID_SPOTLIGHT: number;
        /**
         * Light type const id of the hemispheric light.
         */
        static readonly LIGHTTYPEID_HEMISPHERICLIGHT: number;
        diffuse: Color3;
        specular: Color3;
        intensity: number;
        range: number;
        /**
         * Cached photometric scale default to 1.0 as the automatic intensity mode defaults to 1.0 for every type
         * of light.
         */
        private _photometricScale;
        private _intensityMode;
        /**
         * Gets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        /**
         * Sets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        intensityMode: number;
        private _radius;
        /**
         * Gets the light radius used by PBR Materials to simulate soft area lights.
         */
        /**
         * sets the light radius used by PBR Materials to simulate soft area lights.
         */
        radius: number;
        /**
         * Defines the rendering priority of the lights. It can help in case of fallback or number of lights
         * exceeding the number allowed of the materials.
         */
        private _renderPriority;
        renderPriority: number;
        /**
         * Defines wether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
         * the current shadow generator.
         */
        shadowEnabled: boolean;
        private _includedOnlyMeshes;
        includedOnlyMeshes: AbstractMesh[];
        private _excludedMeshes;
        excludedMeshes: AbstractMesh[];
        private _excludeWithLayerMask;
        excludeWithLayerMask: number;
        private _includeOnlyWithLayerMask;
        includeOnlyWithLayerMask: number;
        private _lightmapMode;
        lightmapMode: number;
        private _parentedWorldMatrix;
        _shadowGenerator: Nullable<IShadowGenerator>;
        _excludedMeshesIds: string[];
        _includedOnlyMeshesIds: string[];
        _uniformBuffer: UniformBuffer;
        /**
         * Creates a Light object in the scene.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, scene: Scene);
        protected _buildUniformLayout(): void;
        /**
         * Returns the string "Light".
         */
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        setEnabled(value: boolean): void;
        /**
         * Returns the Light associated shadow generator.
         */
        getShadowGenerator(): Nullable<IShadowGenerator>;
        /**
         * Returns a Vector3, the absolute light position in the World.
         */
        getAbsolutePosition(): Vector3;
        transferToEffect(effect: Effect, lightIndex: string): void;
        _getWorldMatrix(): Matrix;
        /**
         * Boolean : True if the light will affect the passed mesh.
         */
        canAffectMesh(mesh: AbstractMesh): boolean;
        /**
         * Returns the light World matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Sort function to order lights for rendering.
         * @param a First Light object to compare to second.
         * @param b Second Light object to compare first.
         * @return -1 to reduce's a's index relative to be, 0 for no change, 1 to increase a's index relative to b.
         */
        static compareLightsPriority(a: Light, b: Light): number;
        /**
         * Disposes the light.
         */
        dispose(): void;
        /**
         * Returns the light type ID (integer).
         */
        getTypeID(): number;
        /**
         * Returns the intensity scaled by the Photometric Scale according to the light type and intensity mode.
         */
        getScaledIntensity(): number;
        /**
         * Returns a new Light object, named "name", from the current one.
         */
        clone(name: string): Nullable<Light>;
        /**
         * Serializes the current light into a Serialization object.
         * Returns the serialized object.
         */
        serialize(): any;
        /**
         * Creates a new typed light from the passed type (integer) : point light = 0, directional light = 1, spot light = 2, hemispheric light = 3.
         * This new light is named "name" and added to the passed scene.
         */
        static GetConstructorFromName(type: number, name: string, scene: Scene): Nullable<() => Light>;
        /**
         * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.
         */
        static Parse(parsedLight: any, scene: Scene): Nullable<Light>;
        private _hookArrayForExcluded(array);
        private _hookArrayForIncludedOnly(array);
        private _resyncMeshes();
        _markMeshesAsLightDirty(): void;
        /**
         * Recomputes the cached photometric scale if needed.
         */
        private _computePhotometricScale();
        /**
         * Returns the Photometric Scale according to the light type and intensity mode.
         */
        private _getPhotometricScale();
        _reorderLightsInScene(): void;
    }
}

declare module BABYLON {
    class PointLight extends ShadowLight {
        private _shadowAngle;
        /**
         * Getter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
         * This specifies what angle the shadow will use to be created.
         *
         * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
         */
        /**
         * Setter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
         * This specifies what angle the shadow will use to be created.
         *
         * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
         */
        shadowAngle: number;
        /**
         * In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
         */
        direction: Vector3;
        /**
         * Creates a PointLight object from the passed name and position (Vector3) and adds it in the scene.
         * A PointLight emits the light in every direction.
         * It can cast shadows.
         * If the scene camera is already defined and you want to set your PointLight at the camera position, just set it :
         * ```javascript
         * var pointLight = new BABYLON.PointLight("pl", camera.position, scene);
         * ```
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, position: Vector3, scene: Scene);
        /**
         * Returns the string "PointLight"
         */
        getClassName(): string;
        /**
         * Returns the integer 0.
         */
        getTypeID(): number;
        /**
         * Specifies wether or not the shadowmap should be a cube texture.
         */
        needCube(): boolean;
        /**
         * Returns a new Vector3 aligned with the PointLight cube system according to the passed cube face index (integer).
         */
        getShadowDirection(faceIndex?: number): Vector3;
        /**
         * Sets the passed matrix "matrix" as a left-handed perspective projection matrix with the following settings :
         * - fov = PI / 2
         * - aspect ratio : 1.0
         * - z-near and far equal to the active camera minZ and maxZ.
         * Returns the PointLight.
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        protected _buildUniformLayout(): void;
        /**
         * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).
         * Returns the PointLight.
         */
        transferToEffect(effect: Effect, lightIndex: string): PointLight;
    }
}

declare module BABYLON {
    interface IShadowLight extends Light {
        id: string;
        position: Vector3;
        direction: Vector3;
        transformedPosition: Vector3;
        transformedDirection: Vector3;
        name: string;
        shadowMinZ: number;
        shadowMaxZ: number;
        computeTransformedInformation(): boolean;
        getScene(): Scene;
        customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;
        setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): IShadowLight;
        getDepthScale(): number;
        needCube(): boolean;
        needProjectionMatrixCompute(): boolean;
        forceProjectionMatrixCompute(): void;
        getShadowDirection(faceIndex?: number): Vector3;
        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera
         */
        getDepthMinZ(activeCamera: Camera): number;
        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera
         */
        getDepthMaxZ(activeCamera: Camera): number;
    }
    abstract class ShadowLight extends Light implements IShadowLight {
        protected abstract _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        position: Vector3;
        protected _direction: Vector3;
        direction: Vector3;
        private _shadowMinZ;
        shadowMinZ: number;
        private _shadowMaxZ;
        shadowMaxZ: number;
        customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;
        transformedPosition: Vector3;
        transformedDirection: Vector3;
        private _worldMatrix;
        private _needProjectionMatrixCompute;
        /**
         * Computes the light transformed position/direction in case the light is parented. Returns true if parented, else false.
         */
        computeTransformedInformation(): boolean;
        /**
         * Return the depth scale used for the shadow map.
         */
        getDepthScale(): number;
        /**
         * Returns the light direction (Vector3) for any passed face index.
         */
        getShadowDirection(faceIndex?: number): Vector3;
        /**
         * Returns the DirectionalLight absolute position in the World.
         */
        getAbsolutePosition(): Vector3;
        /**
         * Sets the DirectionalLight direction toward the passed target (Vector3).
         * Returns the updated DirectionalLight direction (Vector3).
         */
        setDirectionToTarget(target: Vector3): Vector3;
        /**
         * Returns the light rotation (Vector3).
         */
        getRotation(): Vector3;
        /**
         * Boolean : false by default.
         */
        needCube(): boolean;
        /**
         * Specifies wether or not the projection matrix should be recomputed this frame.
         */
        needProjectionMatrixCompute(): boolean;
        /**
         * Forces the shadow generator to recompute the projection matrix even if position and direction did not changed.
         */
        forceProjectionMatrixCompute(): void;
        /**
         * Get the world matrix of the sahdow lights.
         */
        _getWorldMatrix(): Matrix;
        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera
         */
        getDepthMinZ(activeCamera: Camera): number;
        /**
         * Gets the maxZ used for shadow according to both the scene and the light.
         * @param activeCamera
         */
        getDepthMaxZ(activeCamera: Camera): number;
        /**
         * Sets the projection matrix according to the type of light and custom projection matrix definition.
         * Returns the light.
         */
        setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): IShadowLight;
    }
}

declare module BABYLON {
    class SpotLight extends ShadowLight {
        private _angle;
        angle: number;
        private _shadowAngleScale;
        /**
         * Allows scaling the angle of the light for shadow generation only.
         */
        shadowAngleScale: number;
        exponent: number;
        /**
         * Creates a SpotLight object in the scene with the passed parameters :
         * - `position` (Vector3) is the initial SpotLight position,
         * - `direction` (Vector3) is the initial SpotLight direction,
         * - `angle` (float, in radians) is the spot light cone angle,
         * - `exponent` (float) is the light decay speed with the distance from the emission spot.
         * A spot light is a simply light oriented cone.
         * It can cast shadows.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene);
        /**
         * Returns the string "SpotLight".
         */
        getClassName(): string;
        /**
         * Returns the integer 2.
         */
        getTypeID(): number;
        /**
         * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.
         * Returns the SpotLight.
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        protected _buildUniformLayout(): void;
        /**
         * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.
         * Return the SpotLight.
         */
        transferToEffect(effect: Effect, lightIndex: string): SpotLight;
    }
}

declare module BABYLON {
    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    class ColorCurves {
        private _dirty;
        private _tempColor;
        private _globalCurve;
        private _highlightsCurve;
        private _midtonesCurve;
        private _shadowsCurve;
        private _positiveCurve;
        private _negativeCurve;
        private _globalHue;
        private _globalDensity;
        private _globalSaturation;
        private _globalExposure;
        /**
         * Gets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        globalHue: number;
        /**
         * Gets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        globalDensity: number;
        /**
         * Gets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        globalSaturation: number;
        private _highlightsHue;
        private _highlightsDensity;
        private _highlightsSaturation;
        private _highlightsExposure;
        /**
         * Gets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        highlightsHue: number;
        /**
         * Gets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        highlightsDensity: number;
        /**
         * Gets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        highlightsSaturation: number;
        /**
         * Gets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        highlightsExposure: number;
        private _midtonesHue;
        private _midtonesDensity;
        private _midtonesSaturation;
        private _midtonesExposure;
        /**
         * Gets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        midtonesHue: number;
        /**
         * Gets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        midtonesDensity: number;
        /**
         * Gets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        midtonesSaturation: number;
        /**
         * Gets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        midtonesExposure: number;
        private _shadowsHue;
        private _shadowsDensity;
        private _shadowsSaturation;
        private _shadowsExposure;
        /**
         * Gets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        shadowsHue: number;
        /**
         * Gets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        shadowsDensity: number;
        /**
         * Gets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        shadowsSaturation: number;
        /**
         * Gets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        shadowsExposure: number;
        getClassName(): string;
        /**
         * Binds the color curves to the shader.
         * @param colorCurves The color curve to bind
         * @param effect The effect to bind to
         */
        static Bind(colorCurves: ColorCurves, effect: Effect, positiveUniform?: string, neutralUniform?: string, negativeUniform?: string): void;
        /**
         * Prepare the list of uniforms associated with the ColorCurves effects.
         * @param uniformsList The list of uniforms used in the effect
         */
        static PrepareUniforms(uniformsList: string[]): void;
        /**
         * Returns color grading data based on a hue, density, saturation and exposure value.
         * @param filterHue The hue of the color filter.
         * @param filterDensity The density of the color filter.
         * @param saturation The saturation.
         * @param exposure The exposure.
         * @param result The result data container.
         */
        private getColorGradingDataToRef(hue, density, saturation, exposure, result);
        /**
         * Takes an input slider value and returns an adjusted value that provides extra control near the centre.
         * @param value The input slider value in range [-100,100].
         * @returns Adjusted value.
         */
        private static applyColorGradingSliderNonlinear(value);
        /**
         * Returns an RGBA Color4 based on Hue, Saturation and Brightness (also referred to as value, HSV).
         * @param hue The hue (H) input.
         * @param saturation The saturation (S) input.
         * @param brightness The brightness (B) input.
         * @result An RGBA color represented as Vector4.
         */
        private static fromHSBToRef(hue, saturation, brightness, result);
        /**
         * Returns a value clamped between min and max
         * @param value The value to clamp
         * @param min The minimum of value
         * @param max The maximum of value
         * @returns The clamped value.
         */
        private static clamp(value, min, max);
        /**
         * Clones the current color curve instance.
         * @return The cloned curves
         */
        clone(): ColorCurves;
        /**
         * Serializes the current color curve instance to a json representation.
         * @return a JSON representation
         */
        serialize(): any;
        /**
         * Parses the color curve from a json representation.
         * @param source the JSON source to parse
         * @return The parsed curves
         */
        static Parse(source: any): ColorCurves;
    }
}

declare module BABYLON {
    class EffectFallbacks {
        private _defines;
        private _currentRank;
        private _maxRank;
        private _mesh;
        private _meshRank;
        unBindMesh(): void;
        addFallback(rank: number, define: string): void;
        addCPUSkinningFallback(rank: number, mesh: BABYLON.AbstractMesh): void;
        readonly isMoreFallbacks: boolean;
        reduce(currentDefines: string): string;
    }
    class EffectCreationOptions {
        attributes: string[];
        uniformsNames: string[];
        uniformBuffersNames: string[];
        samplers: string[];
        defines: any;
        fallbacks: Nullable<EffectFallbacks>;
        onCompiled: Nullable<(effect: Effect) => void>;
        onError: Nullable<(effect: Effect, errors: string) => void>;
        indexParameters: any;
        maxSimultaneousLights: number;
        transformFeedbackVaryings: Nullable<string[]>;
    }
    class Effect {
        name: any;
        defines: string;
        onCompiled: Nullable<(effect: Effect) => void>;
        onError: Nullable<(effect: Effect, errors: string) => void>;
        onBind: Nullable<(effect: Effect) => void>;
        uniqueId: number;
        onCompileObservable: Observable<Effect>;
        onErrorObservable: Observable<Effect>;
        onBindObservable: Observable<Effect>;
        private static _uniqueIdSeed;
        private _engine;
        private _uniformBuffersNames;
        private _uniformsNames;
        private _samplers;
        private _isReady;
        private _compilationError;
        private _attributesNames;
        private _attributes;
        private _uniforms;
        _key: string;
        private _indexParameters;
        private _fallbacks;
        private _vertexSourceCode;
        private _fragmentSourceCode;
        private _vertexSourceCodeOverride;
        private _fragmentSourceCodeOverride;
        private _transformFeedbackVaryings;
        _program: WebGLProgram;
        private _valueCache;
        private static _baseCache;
        constructor(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: Nullable<string[]>, engine?: Engine, defines?: Nullable<string>, fallbacks?: Nullable<EffectFallbacks>, onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any);
        readonly key: string;
        isReady(): boolean;
        getEngine(): Engine;
        getProgram(): WebGLProgram;
        getAttributesNames(): string[];
        getAttributeLocation(index: number): number;
        getAttributeLocationByName(name: string): number;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): Nullable<WebGLUniformLocation>;
        getSamplers(): string[];
        getCompilationError(): string;
        executeWhenCompiled(func: (effect: Effect) => void): void;
        _loadVertexShader(vertex: any, callback: (data: any) => void): void;
        _loadFragmentShader(fragment: any, callback: (data: any) => void): void;
        private _dumpShadersSource(vertexCode, fragmentCode, defines);
        private _processShaderConversion(sourceCode, isFragment, callback);
        private _processIncludes(sourceCode, callback);
        private _processPrecision(source);
        _rebuildProgram(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void): void;
        _prepareEffect(): void;
        readonly isSupported: boolean;
        _bindTexture(channel: string, texture: InternalTexture): void;
        setTexture(channel: string, texture: Nullable<BaseTexture>): void;
        setTextureArray(channel: string, textures: BaseTexture[]): void;
        setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void;
        _cacheMatrix(uniformName: string, matrix: Matrix): boolean;
        _cacheFloat2(uniformName: string, x: number, y: number): boolean;
        _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean;
        _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean;
        bindUniformBuffer(buffer: WebGLBuffer, name: string): void;
        bindUniformBlock(blockName: string, index: number): void;
        setIntArray(uniformName: string, array: Int32Array): Effect;
        setIntArray2(uniformName: string, array: Int32Array): Effect;
        setIntArray3(uniformName: string, array: Int32Array): Effect;
        setIntArray4(uniformName: string, array: Int32Array): Effect;
        setFloatArray(uniformName: string, array: Float32Array): Effect;
        setFloatArray2(uniformName: string, array: Float32Array): Effect;
        setFloatArray3(uniformName: string, array: Float32Array): Effect;
        setFloatArray4(uniformName: string, array: Float32Array): Effect;
        setArray(uniformName: string, array: number[]): Effect;
        setArray2(uniformName: string, array: number[]): Effect;
        setArray3(uniformName: string, array: number[]): Effect;
        setArray4(uniformName: string, array: number[]): Effect;
        setMatrices(uniformName: string, matrices: Float32Array): Effect;
        setMatrix(uniformName: string, matrix: Matrix): Effect;
        setMatrix3x3(uniformName: string, matrix: Float32Array): Effect;
        setMatrix2x2(uniformName: string, matrix: Float32Array): Effect;
        setFloat(uniformName: string, value: number): Effect;
        setBool(uniformName: string, bool: boolean): Effect;
        setVector2(uniformName: string, vector2: Vector2): Effect;
        setFloat2(uniformName: string, x: number, y: number): Effect;
        setVector3(uniformName: string, vector3: Vector3): Effect;
        setFloat3(uniformName: string, x: number, y: number, z: number): Effect;
        setVector4(uniformName: string, vector4: Vector4): Effect;
        setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect;
        setColor3(uniformName: string, color3: Color3): Effect;
        setColor4(uniformName: string, color3: Color3, alpha: number): Effect;
        static ShadersStore: {
            [key: string]: string;
        };
        static IncludesShadersStore: {
            [key: string]: string;
        };
        static ResetCache(): void;
    }
}

declare module BABYLON {
    class FresnelParameters {
        private _isEnabled;
        isEnabled: boolean;
        leftColor: Color3;
        rightColor: Color3;
        bias: number;
        power: number;
        clone(): FresnelParameters;
        serialize(): any;
        static Parse(parsedFresnelParameters: any): FresnelParameters;
    }
}

declare module BABYLON {
    /**
     * Interface to follow in your material defines to integrate easily the
     * Image proccessing functions.
     */
    interface IImageProcessingConfigurationDefines {
        IMAGEPROCESSING: boolean;
        VIGNETTE: boolean;
        VIGNETTEBLENDMODEMULTIPLY: boolean;
        VIGNETTEBLENDMODEOPAQUE: boolean;
        TONEMAPPING: boolean;
        CONTRAST: boolean;
        EXPOSURE: boolean;
        COLORCURVES: boolean;
        COLORGRADING: boolean;
        COLORGRADING3D: boolean;
        SAMPLER3DGREENDEPTH: boolean;
        SAMPLER3DBGRMAP: boolean;
        IMAGEPROCESSINGPOSTPROCESS: boolean;
    }
    /**
     * This groups together the common properties used for image processing either in direct forward pass
     * or through post processing effect depending on the use of the image processing pipeline in your scene
     * or not.
     */
    class ImageProcessingConfiguration {
        /**
         * Color curves setup used in the effect if colorCurvesEnabled is set to true
         */
        colorCurves: Nullable<ColorCurves>;
        private _colorCurvesEnabled;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        colorCurvesEnabled: boolean;
        /**
         * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
         */
        colorGradingTexture: Nullable<BaseTexture>;
        private _colorGradingEnabled;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Sets wether the color grading effect is enabled.
         */
        colorGradingEnabled: boolean;
        private _colorGradingWithGreenDepth;
        /**
         * Gets wether the color grading effect is using a green depth for the 3d Texture.
         */
        /**
         * Sets wether the color grading effect is using a green depth for the 3d Texture.
         */
        colorGradingWithGreenDepth: boolean;
        private _colorGradingBGR;
        /**
         * Gets wether the color grading texture contains BGR values.
         */
        /**
         * Sets wether the color grading texture contains BGR values.
         */
        colorGradingBGR: boolean;
        _exposure: number;
        /**
         * Gets the Exposure used in the effect.
         */
        /**
         * Sets the Exposure used in the effect.
         */
        exposure: number;
        private _toneMappingEnabled;
        /**
         * Gets wether the tone mapping effect is enabled.
         */
        /**
         * Sets wether the tone mapping effect is enabled.
         */
        toneMappingEnabled: boolean;
        protected _contrast: number;
        /**
         * Gets the contrast used in the effect.
         */
        /**
         * Sets the contrast used in the effect.
         */
        contrast: number;
        /**
         * Vignette stretch size.
         */
        vignetteStretch: number;
        /**
         * Vignette centre X Offset.
         */
        vignetteCentreX: number;
        /**
         * Vignette centre Y Offset.
         */
        vignetteCentreY: number;
        /**
         * Vignette weight or intensity of the vignette effect.
         */
        vignetteWeight: number;
        /**
         * Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
         * if vignetteEnabled is set to true.
         */
        vignetteColor: BABYLON.Color4;
        /**
         * Camera field of view used by the Vignette effect.
         */
        vignetteCameraFov: number;
        private _vignetteBlendMode;
        /**
         * Gets the vignette blend mode allowing different kind of effect.
         */
        /**
         * Sets the vignette blend mode allowing different kind of effect.
         */
        vignetteBlendMode: number;
        private _vignetteEnabled;
        /**
         * Gets wether the vignette effect is enabled.
         */
        /**
         * Sets wether the vignette effect is enabled.
         */
        vignetteEnabled: boolean;
        private _applyByPostProcess;
        /**
         * Gets wether the image processing is applied through a post process or not.
         */
        /**
         * Sets wether the image processing is applied through a post process or not.
         */
        applyByPostProcess: boolean;
        /**
        * An event triggered when the configuration changes and requires Shader to Update some parameters.
        * @type {BABYLON.Observable}
        */
        onUpdateParameters: Observable<ImageProcessingConfiguration>;
        /**
         * Method called each time the image processing information changes requires to recompile the effect.
         */
        protected _updateParameters(): void;
        getClassName(): string;
        /**
         * Prepare the list of uniforms associated with the Image Processing effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param defines the list of defines currently in use
         */
        static PrepareUniforms(uniforms: string[], defines: IImageProcessingConfigurationDefines): void;
        /**
         * Prepare the list of samplers associated with the Image Processing effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param defines the list of defines currently in use
         */
        static PrepareSamplers(samplersList: string[], defines: IImageProcessingConfigurationDefines): void;
        /**
         * Prepare the list of defines associated to the shader.
         * @param defines the list of defines to complete
         */
        prepareDefines(defines: IImageProcessingConfigurationDefines, forPostProcess?: boolean): void;
        /**
         * Returns true if all the image processing information are ready.
         */
        isReady(): boolean;
        /**
         * Binds the image processing to the shader.
         * @param effect The effect to bind to
         */
        bind(effect: Effect, aspectRatio?: number): void;
        /**
         * Clones the current image processing instance.
         * @return The cloned image processing
         */
        clone(): ImageProcessingConfiguration;
        /**
         * Serializes the current image processing instance to a json representation.
         * @return a JSON representation
         */
        serialize(): any;
        /**
         * Parses the image processing from a json representation.
         * @param source the JSON source to parse
         * @return The parsed image processing
         */
        static Parse(source: any): ImageProcessingConfiguration;
        private static _VIGNETTEMODE_MULTIPLY;
        private static _VIGNETTEMODE_OPAQUE;
        /**
         * Used to apply the vignette as a mix with the pixel color.
         */
        static readonly VIGNETTEMODE_MULTIPLY: number;
        /**
         * Used to apply the vignette as a replacement of the pixel color.
         */
        static readonly VIGNETTEMODE_OPAQUE: number;
    }
}

declare module BABYLON {
    class MaterialDefines {
        private _keys;
        private _isDirty;
        _renderId: number;
        _areLightsDirty: boolean;
        _areAttributesDirty: boolean;
        _areTexturesDirty: boolean;
        _areFresnelDirty: boolean;
        _areMiscDirty: boolean;
        _areImageProcessingDirty: boolean;
        _normals: boolean;
        _uvs: boolean;
        _needNormals: boolean;
        _needUVs: boolean;
        readonly isDirty: boolean;
        markAsProcessed(): void;
        markAsUnprocessed(): void;
        markAllAsDirty(): void;
        markAsImageProcessingDirty(): void;
        markAsLightDirty(): void;
        markAsAttributesDirty(): void;
        markAsTexturesDirty(): void;
        markAsFresnelDirty(): void;
        markAsMiscDirty(): void;
        rebuild(): void;
        isEqual(other: MaterialDefines): boolean;
        cloneTo(other: MaterialDefines): void;
        reset(): void;
        toString(): string;
    }
    class Material implements IAnimatable {
        private static _TriangleFillMode;
        private static _WireFrameFillMode;
        private static _PointFillMode;
        static readonly TriangleFillMode: number;
        static readonly WireFrameFillMode: number;
        static readonly PointFillMode: number;
        private static _ClockWiseSideOrientation;
        private static _CounterClockWiseSideOrientation;
        static readonly ClockWiseSideOrientation: number;
        static readonly CounterClockWiseSideOrientation: number;
        private static _TextureDirtyFlag;
        private static _LightDirtyFlag;
        private static _FresnelDirtyFlag;
        private static _AttributesDirtyFlag;
        private static _MiscDirtyFlag;
        static readonly TextureDirtyFlag: number;
        static readonly LightDirtyFlag: number;
        static readonly FresnelDirtyFlag: number;
        static readonly AttributesDirtyFlag: number;
        static readonly MiscDirtyFlag: number;
        id: string;
        name: string;
        checkReadyOnEveryCall: boolean;
        checkReadyOnlyOnce: boolean;
        state: string;
        alpha: number;
        protected _backFaceCulling: boolean;
        backFaceCulling: boolean;
        sideOrientation: number;
        onCompiled: (effect: Effect) => void;
        onError: (effect: Effect, errors: string) => void;
        getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        doNotSerialize: boolean;
        storeEffectOnSubMeshes: boolean;
        animations: Array<Animation>;
        /**
        * An event triggered when the material is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Material>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
        * An event triggered when the material is bound.
        * @type {BABYLON.Observable}
        */
        onBindObservable: Observable<AbstractMesh>;
        private _onBindObserver;
        onBind: (Mesh: AbstractMesh) => void;
        /**
        * An event triggered when the material is unbound.
        * @type {BABYLON.Observable}
        */
        onUnBindObservable: Observable<Material>;
        private _alphaMode;
        alphaMode: number;
        private _needDepthPrePass;
        needDepthPrePass: boolean;
        disableDepthWrite: boolean;
        forceDepthWrite: boolean;
        separateCullingPass: boolean;
        private _fogEnabled;
        fogEnabled: boolean;
        pointSize: number;
        zOffset: number;
        wireframe: boolean;
        pointsCloud: boolean;
        fillMode: number;
        _effect: Nullable<Effect>;
        _wasPreviouslyReady: boolean;
        private _useUBO;
        private _scene;
        private _fillMode;
        private _cachedDepthWriteState;
        protected _uniformBuffer: UniformBuffer;
        constructor(name: string, scene: Scene, doNotAdd?: boolean);
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         * subclasses should override adding information pertainent to themselves
         */
        toString(fullDetails?: boolean): string;
        /**
         * Child classes can use it to update shaders
         */
        getClassName(): string;
        readonly isFrozen: boolean;
        freeze(): void;
        unfreeze(): void;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean;
        getEffect(): Nullable<Effect>;
        getScene(): Scene;
        needAlphaBlending(): boolean;
        needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        markDirty(): void;
        _preBind(effect?: Effect, overrideOrientation?: Nullable<number>): boolean;
        bind(world: Matrix, mesh?: Mesh): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        bindSceneUniformBuffer(effect: Effect, sceneUbo: UniformBuffer): void;
        bindView(effect: Effect): void;
        bindViewProjection(effect: Effect): void;
        protected _afterBind(mesh?: Mesh): void;
        unbind(): void;
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): Nullable<Material>;
        getBindedMeshes(): AbstractMesh[];
        /**
         * Force shader compilation including textures ready check
         */
        forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<{
            alphaTest: Nullable<boolean>;
            clipPlane: boolean;
        }>): void;
        markAsDirty(flag: number): void;
        protected _markAllSubMeshesAsDirty(func: (defines: MaterialDefines) => void): void;
        protected _markAllSubMeshesAsImageProcessingDirty(): void;
        protected _markAllSubMeshesAsTexturesDirty(): void;
        protected _markAllSubMeshesAsFresnelDirty(): void;
        protected _markAllSubMeshesAsLightsDirty(): void;
        protected _markAllSubMeshesAsAttributesDirty(): void;
        protected _markAllSubMeshesAsMiscDirty(): void;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        serialize(): any;
        static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial;
        static Parse(parsedMaterial: any, scene: Scene, rootUrl: string): any;
    }
}

declare module BABYLON {
    class MaterialHelper {
        static BindEyePosition(effect: Effect, scene: Scene): void;
        static PrepareDefinesForMergedUV(texture: BaseTexture, defines: any, key: string): void;
        static BindTextureMatrix(texture: BaseTexture, uniformBuffer: UniformBuffer, key: string): void;
        static PrepareDefinesForMisc(mesh: AbstractMesh, scene: Scene, useLogarithmicDepth: boolean, pointsCloud: boolean, fogEnabled: boolean, defines: any): void;
        static PrepareDefinesForFrameBoundValues(scene: Scene, engine: Engine, defines: any, useInstances: boolean, forceAlphaTest?: boolean): void;
        static PrepareDefinesForAttributes(mesh: AbstractMesh, defines: any, useVertexColor: boolean, useBones: boolean, useMorphTargets?: boolean, useVertexAlpha?: boolean): boolean;
        static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: any, specularSupported: boolean, maxSimultaneousLights?: number, disableLighting?: boolean): boolean;
        static PrepareUniformsAndSamplersList(uniformsListOrOptions: string[] | EffectCreationOptions, samplersList?: string[], defines?: any, maxSimultaneousLights?: number): void;
        static HandleFallbacksForShadows(defines: any, fallbacks: EffectFallbacks, maxSimultaneousLights?: number, rank?: number): number;
        static PrepareAttributesForMorphTargets(attribs: string[], mesh: AbstractMesh, defines: any): void;
        static PrepareAttributesForBones(attribs: string[], mesh: AbstractMesh, defines: any, fallbacks: EffectFallbacks): void;
        static PrepareAttributesForInstances(attribs: string[], defines: any): void;
        static BindLightShadow(light: Light, scene: Scene, mesh: AbstractMesh, lightIndex: string, effect: Effect): void;
        static BindLightProperties(light: Light, effect: Effect, lightIndex: number): void;
        static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: any, maxSimultaneousLights?: number, usePhysicalLightFalloff?: boolean): void;
        static BindFogParameters(scene: Scene, mesh: AbstractMesh, effect: Effect): void;
        static BindBonesParameters(mesh?: AbstractMesh, effect?: Effect): void;
        static BindMorphTargetParameters(abstractMesh: AbstractMesh, effect: Effect): void;
        static BindLogDepth(defines: any, effect: Effect, scene: Scene): void;
        static BindClipPlane(effect: Effect, scene: Scene): void;
    }
}

declare module BABYLON {
    class MultiMaterial extends Material {
        private _subMaterials;
        subMaterials: Nullable<Material>[];
        constructor(name: string, scene: Scene);
        private _hookArray(array);
        getSubMaterial(index: number): Nullable<Material>;
        getActiveTextures(): BaseTexture[];
        getClassName(): string;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean;
        clone(name: string, cloneChildren?: boolean): MultiMaterial;
        serialize(): any;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
    }
}

declare module BABYLON {
    class PushMaterial extends Material {
        protected _activeEffect: Effect;
        constructor(name: string, scene: Scene);
        getEffect(): Effect;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        protected _afterBind(mesh: Mesh, effect?: Nullable<Effect>): void;
        protected _mustRebind(scene: Scene, effect: Effect, visibility?: number): boolean;
    }
}

declare module BABYLON {
    class ShaderMaterial extends Material {
        private _shaderPath;
        private _options;
        private _textures;
        private _textureArrays;
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors3Arrays;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _vectors4;
        private _matrices;
        private _matrices3x3;
        private _matrices2x2;
        private _vectors3Arrays;
        private _cachedWorldViewMatrix;
        private _renderId;
        constructor(name: string, scene: Scene, shaderPath: any, options: any);
        getClassName(): string;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        private _checkUniform(uniformName);
        setTexture(name: string, texture: Texture): ShaderMaterial;
        setTextureArray(name: string, textures: Texture[]): ShaderMaterial;
        setFloat(name: string, value: number): ShaderMaterial;
        setFloats(name: string, value: number[]): ShaderMaterial;
        setColor3(name: string, value: Color3): ShaderMaterial;
        setColor3Array(name: string, value: Color3[]): ShaderMaterial;
        setColor4(name: string, value: Color4): ShaderMaterial;
        setVector2(name: string, value: Vector2): ShaderMaterial;
        setVector3(name: string, value: Vector3): ShaderMaterial;
        setVector4(name: string, value: Vector4): ShaderMaterial;
        setMatrix(name: string, value: Matrix): ShaderMaterial;
        setMatrix3x3(name: string, value: Float32Array): ShaderMaterial;
        setMatrix2x2(name: string, value: Float32Array): ShaderMaterial;
        setArray3(name: string, value: number[]): ShaderMaterial;
        private _checkCache(scene, mesh?, useInstances?);
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): ShaderMaterial;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): ShaderMaterial;
    }
}

declare module BABYLON {
    class StandardMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
        MAINUV1: boolean;
        MAINUV2: boolean;
        DIFFUSE: boolean;
        DIFFUSEDIRECTUV: number;
        AMBIENT: boolean;
        AMBIENTDIRECTUV: number;
        OPACITY: boolean;
        OPACITYDIRECTUV: number;
        OPACITYRGB: boolean;
        REFLECTION: boolean;
        EMISSIVE: boolean;
        EMISSIVEDIRECTUV: number;
        SPECULAR: boolean;
        SPECULARDIRECTUV: number;
        BUMP: boolean;
        BUMPDIRECTUV: number;
        PARALLAX: boolean;
        PARALLAXOCCLUSION: boolean;
        SPECULAROVERALPHA: boolean;
        CLIPPLANE: boolean;
        ALPHATEST: boolean;
        DEPTHPREPASS: boolean;
        ALPHAFROMDIFFUSE: boolean;
        POINTSIZE: boolean;
        FOG: boolean;
        SPECULARTERM: boolean;
        DIFFUSEFRESNEL: boolean;
        OPACITYFRESNEL: boolean;
        REFLECTIONFRESNEL: boolean;
        REFRACTIONFRESNEL: boolean;
        EMISSIVEFRESNEL: boolean;
        FRESNEL: boolean;
        NORMAL: boolean;
        UV1: boolean;
        UV2: boolean;
        VERTEXCOLOR: boolean;
        VERTEXALPHA: boolean;
        NUM_BONE_INFLUENCERS: number;
        BonesPerMesh: number;
        INSTANCES: boolean;
        GLOSSINESS: boolean;
        ROUGHNESS: boolean;
        EMISSIVEASILLUMINATION: boolean;
        LINKEMISSIVEWITHDIFFUSE: boolean;
        REFLECTIONFRESNELFROMSPECULAR: boolean;
        LIGHTMAP: boolean;
        LIGHTMAPDIRECTUV: number;
        USELIGHTMAPASSHADOWMAP: boolean;
        REFLECTIONMAP_3D: boolean;
        REFLECTIONMAP_SPHERICAL: boolean;
        REFLECTIONMAP_PLANAR: boolean;
        REFLECTIONMAP_CUBIC: boolean;
        REFLECTIONMAP_PROJECTION: boolean;
        REFLECTIONMAP_SKYBOX: boolean;
        REFLECTIONMAP_EXPLICIT: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR_FIXED: boolean;
        REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED: boolean;
        INVERTCUBICMAP: boolean;
        LOGARITHMICDEPTH: boolean;
        REFRACTION: boolean;
        REFRACTIONMAP_3D: boolean;
        REFLECTIONOVERALPHA: boolean;
        TWOSIDEDLIGHTING: boolean;
        SHADOWFLOAT: boolean;
        MORPHTARGETS: boolean;
        MORPHTARGETS_NORMAL: boolean;
        MORPHTARGETS_TANGENT: boolean;
        NUM_MORPH_INFLUENCERS: number;
        NONUNIFORMSCALING: boolean;
        PREMULTIPLYALPHA: boolean;
        IMAGEPROCESSING: boolean;
        VIGNETTE: boolean;
        VIGNETTEBLENDMODEMULTIPLY: boolean;
        VIGNETTEBLENDMODEOPAQUE: boolean;
        TONEMAPPING: boolean;
        CONTRAST: boolean;
        COLORCURVES: boolean;
        COLORGRADING: boolean;
        COLORGRADING3D: boolean;
        SAMPLER3DGREENDEPTH: boolean;
        SAMPLER3DBGRMAP: boolean;
        IMAGEPROCESSINGPOSTPROCESS: boolean;
        EXPOSURE: boolean;
        constructor();
        setReflectionMode(modeToEnable: string): void;
    }
    class StandardMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: Nullable<BaseTexture>;
        private _ambientTexture;
        ambientTexture: Nullable<BaseTexture>;
        private _opacityTexture;
        opacityTexture: Nullable<BaseTexture>;
        private _reflectionTexture;
        reflectionTexture: Nullable<BaseTexture>;
        private _emissiveTexture;
        emissiveTexture: Nullable<BaseTexture>;
        private _specularTexture;
        specularTexture: Nullable<BaseTexture>;
        private _bumpTexture;
        bumpTexture: Nullable<BaseTexture>;
        private _lightmapTexture;
        lightmapTexture: Nullable<BaseTexture>;
        private _refractionTexture;
        refractionTexture: Nullable<BaseTexture>;
        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        emissiveColor: Color3;
        specularPower: number;
        private _useAlphaFromDiffuseTexture;
        useAlphaFromDiffuseTexture: boolean;
        private _useEmissiveAsIllumination;
        useEmissiveAsIllumination: boolean;
        private _linkEmissiveWithDiffuse;
        linkEmissiveWithDiffuse: boolean;
        private _useSpecularOverAlpha;
        useSpecularOverAlpha: boolean;
        private _useReflectionOverAlpha;
        useReflectionOverAlpha: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _useParallax;
        useParallax: boolean;
        private _useParallaxOcclusion;
        useParallaxOcclusion: boolean;
        parallaxScaleBias: number;
        private _roughness;
        roughness: number;
        indexOfRefraction: number;
        invertRefractionY: boolean;
        private _useLightmapAsShadowmap;
        useLightmapAsShadowmap: boolean;
        private _diffuseFresnelParameters;
        diffuseFresnelParameters: FresnelParameters;
        private _opacityFresnelParameters;
        opacityFresnelParameters: FresnelParameters;
        private _reflectionFresnelParameters;
        reflectionFresnelParameters: FresnelParameters;
        private _refractionFresnelParameters;
        refractionFresnelParameters: FresnelParameters;
        private _emissiveFresnelParameters;
        emissiveFresnelParameters: FresnelParameters;
        private _useReflectionFresnelFromSpecular;
        useReflectionFresnelFromSpecular: boolean;
        private _useGlossinessFromSpecularMapAlpha;
        useGlossinessFromSpecularMapAlpha: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        private _invertNormalMapX;
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        private _invertNormalMapY;
        invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        private _twoSidedLighting;
        twoSidedLighting: boolean;
        /**
         * Default configuration related to image processing available in the standard Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: number;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: number;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        customShaderNameResolve: (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines) => string;
        protected _renderTargets: SmartArray<RenderTargetTexture>;
        protected _worldViewProjectionMatrix: Matrix;
        protected _globalAmbientColor: Color3;
        protected _useLogarithmicDepth: boolean;
        constructor(name: string, scene: Scene);
        getClassName(): string;
        useLogarithmicDepth: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        protected _shouldUseAlphaFromDiffuseTexture(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        /**
         * Child classes can use it to update shaders
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        buildUniformLayout(): void;
        unbind(): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        clone(name: string): StandardMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial;
        static _DiffuseTextureEnabled: boolean;
        static DiffuseTextureEnabled: boolean;
        static _AmbientTextureEnabled: boolean;
        static AmbientTextureEnabled: boolean;
        static _OpacityTextureEnabled: boolean;
        static OpacityTextureEnabled: boolean;
        static _ReflectionTextureEnabled: boolean;
        static ReflectionTextureEnabled: boolean;
        static _EmissiveTextureEnabled: boolean;
        static EmissiveTextureEnabled: boolean;
        static _SpecularTextureEnabled: boolean;
        static SpecularTextureEnabled: boolean;
        static _BumpTextureEnabled: boolean;
        static BumpTextureEnabled: boolean;
        static _LightmapTextureEnabled: boolean;
        static LightmapTextureEnabled: boolean;
        static _RefractionTextureEnabled: boolean;
        static RefractionTextureEnabled: boolean;
        static _ColorGradingTextureEnabled: boolean;
        static ColorGradingTextureEnabled: boolean;
        static _FresnelEnabled: boolean;
        static FresnelEnabled: boolean;
    }
}

declare module BABYLON {
    class UniformBuffer {
        private _engine;
        private _buffer;
        private _data;
        private _bufferData;
        private _dynamic?;
        private _uniformLocations;
        private _uniformSizes;
        private _uniformLocationPointer;
        private _needSync;
        private _noUBO;
        private _currentEffect;
        private static _MAX_UNIFORM_SIZE;
        private static _tempBuffer;
        /**
         * Wrapper for updateUniform.
         * @method updateMatrix3x3
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        updateMatrix3x3: (name: string, matrix: Float32Array) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        updateMatrix2x2: (name: string, matrix: Float32Array) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         */
        updateFloat: (name: string, x: number) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat2: (name: string, x: number, y: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat3: (name: string, x: number, y: number, z: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {number} w
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} A 4x4 matrix.
         */
        updateMatrix: (name: string, mat: Matrix) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        updateVector3: (name: string, vector: Vector3) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector4} vector
         */
        updateVector4: (name: string, vector: Vector4) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateColor3: (name: string, color: Color3, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateColor4: (name: string, color: Color3, alpha: number, suffix?: string) => void;
        /**
         * Uniform buffer objects.
         *
         * Handles blocks of uniform on the GPU.
         *
         * If WebGL 2 is not available, this class falls back on traditionnal setUniformXXX calls.
         *
         * For more information, please refer to :
         * https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
         */
        constructor(engine: Engine, data?: number[], dynamic?: boolean);
        /**
         * Indicates if the buffer is using the WebGL2 UBO implementation,
         * or just falling back on setUniformXXX calls.
         */
        readonly useUbo: boolean;
        /**
         * Indicates if the WebGL underlying uniform buffer is in sync
         * with the javascript cache data.
         */
        readonly isSync: boolean;
        /**
         * Indicates if the WebGL underlying uniform buffer is dynamic.
         * Also, a dynamic UniformBuffer will disable cache verification and always
         * update the underlying WebGL uniform buffer to the GPU.
         */
        isDynamic(): boolean;
        /**
         * The data cache on JS side.
         */
        getData(): Float32Array;
        /**
         * The underlying WebGL Uniform buffer.
         */
        getBuffer(): Nullable<WebGLBuffer>;
        /**
         * std140 layout specifies how to align data within an UBO structure.
         * See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159
         * for specs.
         */
        private _fillAlignment(size);
        /**
         * Adds an uniform in the buffer.
         * Warning : the subsequents calls of this function must be in the same order as declared in the shader
         * for the layout to be correct !
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number|number[]} size Data size, or data directly.
         */
        addUniform(name: string, size: number | number[]): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} mat A 4x4 matrix.
         */
        addMatrix(name: string, mat: Matrix): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         */
        addFloat2(name: string, x: number, y: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         */
        addFloat3(name: string, x: number, y: number, z: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         */
        addColor3(name: string, color: Color3): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         */
        addColor4(name: string, color: Color3, alpha: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        addVector3(name: string, vector: Vector3): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        addMatrix3x3(name: string): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        addMatrix2x2(name: string): void;
        /**
         * Effectively creates the WebGL Uniform Buffer, once layout is completed with `addUniform`.
         */
        create(): void;
        _rebuild(): void;
        /**
         * Updates the WebGL Uniform Buffer on the GPU.
         * If the `dynamic` flag is set to true, no cache comparison is done.
         * Otherwise, the buffer will be updated only if the cache differs.
         */
        update(): void;
        /**
         * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         * @param {number} size Size of the data.
         */
        updateUniform(uniformName: string, data: FloatArray, size: number): void;
        private _updateMatrix3x3ForUniform(name, matrix);
        private _updateMatrix3x3ForEffect(name, matrix);
        private _updateMatrix2x2ForEffect(name, matrix);
        private _updateMatrix2x2ForUniform(name, matrix);
        private _updateFloatForEffect(name, x);
        private _updateFloatForUniform(name, x);
        private _updateFloat2ForEffect(name, x, y, suffix?);
        private _updateFloat2ForUniform(name, x, y, suffix?);
        private _updateFloat3ForEffect(name, x, y, z, suffix?);
        private _updateFloat3ForUniform(name, x, y, z, suffix?);
        private _updateFloat4ForEffect(name, x, y, z, w, suffix?);
        private _updateFloat4ForUniform(name, x, y, z, w, suffix?);
        private _updateMatrixForEffect(name, mat);
        private _updateMatrixForUniform(name, mat);
        private _updateVector3ForEffect(name, vector);
        private _updateVector3ForUniform(name, vector);
        private _updateVector4ForEffect(name, vector);
        private _updateVector4ForUniform(name, vector);
        private _updateColor3ForEffect(name, color, suffix?);
        private _updateColor3ForUniform(name, color, suffix?);
        private _updateColor4ForEffect(name, color, alpha, suffix?);
        private _updateColor4ForUniform(name, color, alpha, suffix?);
        /**
         * Sets a sampler uniform on the effect.
         * @param {string} name Name of the sampler.
         * @param {Texture} texture
         */
        setTexture(name: string, texture: Nullable<BaseTexture>): void;
        /**
         * Directly updates the value of the uniform in the cache AND on the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         */
        updateUniformDirectly(uniformName: string, data: FloatArray): void;
        /**
         * Binds this uniform buffer to an effect.
         * @param {Effect} effect
         * @param {string} name Name of the uniform block in the shader.
         */
        bindToEffect(effect: Effect, name: string): void;
        /**
         * Disposes the uniform buffer.
         */
        dispose(): void;
    }
}

declare module BABYLON {
    class Scalar {
        /**
         * Two pi constants convenient for computation.
         */
        static TwoPi: number;
        /**
         * Boolean : true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
         */
        static WithinEpsilon(a: number, b: number, epsilon?: number): boolean;
        /**
         * Returns a string : the upper case translation of the number i to hexadecimal.
         */
        static ToHex(i: number): string;
        /**
         * Returns -1 if value is negative and +1 is value is positive.
         * Returns the value itself if it's equal to zero.
         */
        static Sign(value: number): number;
        /**
         * Returns the value itself if it's between min and max.
         * Returns min if the value is lower than min.
         * Returns max if the value is greater than max.
         */
        static Clamp(value: number, min?: number, max?: number): number;
        /**
         * Returns the log2 of value.
         */
        static Log2(value: number): number;
        /**
        * Loops the value, so that it is never larger than length and never smaller than 0.
        *
        * This is similar to the modulo operator but it works with floating point numbers.
        * For example, using 3.0 for t and 2.5 for length, the result would be 0.5.
        * With t = 5 and length = 2.5, the result would be 0.0.
        * Note, however, that the behaviour is not defined for negative numbers as it is for the modulo operator
        */
        static Repeat(value: number, length: number): number;
        /**
        * Normalize the value between 0.0 and 1.0 using min and max values
        */
        static Normalize(value: number, min: number, max: number): number;
        /**
        * Denormalize the value from 0.0 and 1.0 using min and max values
        */
        static Denormalize(normalized: number, min: number, max: number): number;
        /**
        * Calculates the shortest difference between two given angles given in degrees.
        */
        static DeltaAngle(current: number, target: number): number;
        /**
        * PingPongs the value t, so that it is never larger than length and never smaller than 0.
        *
        * The returned value will move back and forth between 0 and length
        */
        static PingPong(tx: number, length: number): number;
        /**
        * Interpolates between min and max with smoothing at the limits.
        *
        * This function interpolates between min and max in a similar way to Lerp. However, the interpolation will gradually speed up
        * from the start and slow down toward the end. This is useful for creating natural-looking animation, fading and other transitions.
        */
        static SmoothStep(from: number, to: number, tx: number): number;
        /**
        * Moves a value current towards target.
        *
        * This is essentially the same as Mathf.Lerp but instead the function will ensure that the speed never exceeds maxDelta.
        * Negative values of maxDelta pushes the value away from target.
        */
        static MoveTowards(current: number, target: number, maxDelta: number): number;
        /**
        * Same as MoveTowards but makes sure the values interpolate correctly when they wrap around 360 degrees.
        *
        * Variables current and target are assumed to be in degrees. For optimization reasons, negative values of maxDelta
        *  are not supported and may cause oscillation. To push current away from a target angle, add 180 to that angle instead.
        */
        static MoveTowardsAngle(current: number, target: number, maxDelta: number): number;
        /**
            * Creates a new scalar with values linearly interpolated of "amount" between the start scalar and the end scalar.
            */
        static Lerp(start: number, end: number, amount: number): number;
        /**
        * Same as Lerp but makes sure the values interpolate correctly when they wrap around 360 degrees.
        * The parameter t is clamped to the range [0, 1]. Variables a and b are assumed to be in degrees.
        */
        static LerpAngle(start: number, end: number, amount: number): number;
        /**
        * Calculates the linear parameter t that produces the interpolant value within the range [a, b].
        */
        static InverseLerp(a: number, b: number, value: number): number;
        /**
         * Returns a new scalar located for "amount" (float) on the Hermite spline defined by the scalars "value1", "value3", "tangent1", "tangent2".
         */
        static Hermite(value1: number, tangent1: number, value2: number, tangent2: number, amount: number): number;
        /**
        * Returns a random float number between and min and max values
        */
        static RandomRange(min: number, max: number): number;
        /**
        * This function returns percentage of a number in a given range.
        *
        * RangeToPercent(40,20,60) will return 0.5 (50%)
        * RangeToPercent(34,0,100) will return 0.34 (34%)
        */
        static RangeToPercent(number: number, min: number, max: number): number;
        /**
        * This function returns number that corresponds to the percentage in a given range.
        *
        * PercentToRange(0.34,0,100) will return 34.
        */
        static PercentToRange(percent: number, min: number, max: number): number;
        /**
         * Returns the angle converted to equivalent value between -Math.PI and Math.PI radians.
         * @param angle The angle to normalize in radian.
         * @return The converted angle.
         */
        static NormalizeRadians(angle: number): number;
    }
}

declare module BABYLON {
    class SIMDHelper {
        private static _isEnabled;
        static readonly IsEnabled: boolean;
        static DisableSIMD(): void;
        static EnableSIMD(): void;
    }
}

declare module BABYLON {
    const ToGammaSpace: number;
    const ToLinearSpace = 2.2;
    const Epsilon = 0.001;
    class Color3 {
        r: number;
        g: number;
        b: number;
        /**
         * Creates a new Color3 object from red, green, blue values, all between 0 and 1.
         */
        constructor(r?: number, g?: number, b?: number);
        /**
         * Returns a string with the Color3 current values.
         */
        toString(): string;
        /**
         * Returns the string "Color3".
         */
        getClassName(): string;
        /**
         * Returns the Color3 hash code.
         */
        getHashCode(): number;
        /**
         * Stores in the passed array from the passed starting index the red, green, blue values as successive elements.
         * Returns the Color3.
         */
        toArray(array: FloatArray, index?: number): Color3;
        /**
         * Returns a new Color4 object from the current Color3 and the passed alpha.
         */
        toColor4(alpha?: number): Color4;
        /**
         * Returns a new array populated with 3 numeric elements : red, green and blue values.
         */
        asArray(): number[];
        /**
         * Returns the luminance value (float).
         */
        toLuminance(): number;
        /**
         * Multiply each Color3 rgb values by the passed Color3 rgb values in a new Color3 object.
         * Returns this new object.
         */
        multiply(otherColor: Color3): Color3;
        /**
         * Multiply the rgb values of the Color3 and the passed Color3 and stores the result in the object "result".
         * Returns the current Color3.
         */
        multiplyToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Boolean : True if the rgb values are equal to the passed ones.
         */
        equals(otherColor: Color3): boolean;
        /**
         * Boolean : True if the rgb values are equal to the passed ones.
         */
        equalsFloats(r: number, g: number, b: number): boolean;
        /**
         * Multiplies in place each rgb value by scale.
         * Returns the updated Color3.
         */
        scale(scale: number): Color3;
        /**
         * Multiplies the rgb values by scale and stores the result into "result".
         * Returns the unmodified current Color3.
         */
        scaleToRef(scale: number, result: Color3): Color3;
        /**
         * Returns a new Color3 set with the added values of the current Color3 and of the passed one.
         */
        add(otherColor: Color3): Color3;
        /**
         * Stores the result of the addition of the current Color3 and passed one rgb values into "result".
         * Returns the unmodified current Color3.
         */
        addToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Returns a new Color3 set with the subtracted values of the passed one from the current Color3 .
         */
        subtract(otherColor: Color3): Color3;
        /**
         * Stores the result of the subtraction of passed one from the current Color3 rgb values into "result".
         * Returns the unmodified current Color3.
         */
        subtractToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Returns a new Color3 copied the current one.
         */
        clone(): Color3;
        /**
         * Copies the rgb values from the source in the current Color3.
         * Returns the updated Color3.
         */
        copyFrom(source: Color3): Color3;
        /**
         * Updates the Color3 rgb values from the passed floats.
         * Returns the Color3.
         */
        copyFromFloats(r: number, g: number, b: number): Color3;
        /**
         * Updates the Color3 rgb values from the passed floats.
         * Returns the Color3.
         */
        set(r: number, g: number, b: number): Color3;
        /**
         * Returns the Color3 hexadecimal code as a string.
         */
        toHexString(): string;
        /**
         * Returns a new Color3 converted to linear space.
         */
        toLinearSpace(): Color3;
        /**
         * Converts the Color3 values to linear space and stores the result in "convertedColor".
         * Returns the unmodified Color3.
         */
        toLinearSpaceToRef(convertedColor: Color3): Color3;
        /**
         * Returns a new Color3 converted to gamma space.
         */
        toGammaSpace(): Color3;
        /**
         * Converts the Color3 values to gamma space and stores the result in "convertedColor".
         * Returns the unmodified Color3.
         */
        toGammaSpaceToRef(convertedColor: Color3): Color3;
        /**
         * Creates a new Color3 from the string containing valid hexadecimal values.
         */
        static FromHexString(hex: string): Color3;
        /**
         * Creates a new Vector3 from the startind index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Color3;
        /**
         * Creates a new Color3 from integer values ( < 256).
         */
        static FromInts(r: number, g: number, b: number): Color3;
        /**
         * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3.
         */
        static Lerp(start: Color3, end: Color3, amount: number): Color3;
        static Red(): Color3;
        static Green(): Color3;
        static Blue(): Color3;
        static Black(): Color3;
        static White(): Color3;
        static Purple(): Color3;
        static Magenta(): Color3;
        static Yellow(): Color3;
        static Gray(): Color3;
        static Teal(): Color3;
        static Random(): Color3;
    }
    class Color4 {
        r: number;
        g: number;
        b: number;
        a: number;
        /**
         * Creates a new Color4 object from the passed float values ( < 1) : red, green, blue, alpha.
         */
        constructor(r?: number, g?: number, b?: number, a?: number);
        /**
         * Adds in place the passed Color4 values to the current Color4.
         * Returns the updated Color4.
         */
        addInPlace(right: Color4): Color4;
        /**
         * Returns a new array populated with 4 numeric elements : red, green, blue, alpha values.
         */
        asArray(): number[];
        /**
         * Stores from the starting index in the passed array the Color4 successive values.
         * Returns the Color4.
         */
        toArray(array: number[], index?: number): Color4;
        /**
         * Returns a new Color4 set with the added values of the current Color4 and of the passed one.
         */
        add(right: Color4): Color4;
        /**
         * Returns a new Color4 set with the subtracted values of the passed one from the current Color4.
         */
        subtract(right: Color4): Color4;
        /**
         * Subtracts the passed ones from the current Color4 values and stores the results in "result".
         * Returns the Color4.
         */
        subtractToRef(right: Color4, result: Color4): Color4;
        /**
         * Creates a new Color4 with the current Color4 values multiplied by scale.
         */
        scale(scale: number): Color4;
        /**
         * Multiplies the current Color4 values by scale and stores the result in "result".
         * Returns the Color4.
         */
        scaleToRef(scale: number, result: Color4): Color4;
        /**
          * Multipy an RGBA Color4 value by another and return a new Color4 object
          * @param color The Color4 (RGBA) value to multiply by
          * @returns A new Color4.
          */
        multiply(color: Color4): Color4;
        /**
         * Multipy an RGBA Color4 value by another and push the result in a reference value
         * @param color The Color4 (RGBA) value to multiply by
         * @param result The Color4 (RGBA) to fill the result in
         * @returns the result Color4.
         */
        multiplyToRef(color: Color4, result: Color4): Color4;
        /**
         * Returns a string with the Color4 values.
         */
        toString(): string;
        /**
         * Returns the string "Color4"
         */
        getClassName(): string;
        /**
         * Return the Color4 hash code as a number.
         */
        getHashCode(): number;
        /**
         * Creates a new Color4 copied from the current one.
         */
        clone(): Color4;
        /**
         * Copies the passed Color4 values into the current one.
         * Returns the updated Color4.
         */
        copyFrom(source: Color4): Color4;
        /**
         * Copies the passed float values into the current one.
         * Returns the updated Color4.
         */
        copyFromFloats(r: number, g: number, b: number, a: number): Color4;
        /**
         * Copies the passed float values into the current one.
         * Returns the updated Color4.
         */
        set(r: number, g: number, b: number, a: number): Color4;
        /**
         * Returns a string containing the hexadecimal Color4 code.
         */
        toHexString(): string;
        /**
         * Returns a new Color4 converted to linear space.
         */
        toLinearSpace(): Color4;
        /**
         * Converts the Color4 values to linear space and stores the result in "convertedColor".
         * Returns the unmodified Color4.
         */
        toLinearSpaceToRef(convertedColor: Color4): Color4;
        /**
         * Returns a new Color4 converted to gamma space.
         */
        toGammaSpace(): Color4;
        /**
         * Converts the Color4 values to gamma space and stores the result in "convertedColor".
         * Returns the unmodified Color4.
         */
        toGammaSpaceToRef(convertedColor: Color4): Color4;
        /**
         * Creates a new Color4 from the valid hexadecimal value contained in the passed string.
         */
        static FromHexString(hex: string): Color4;
        /**
         * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 and the right Color4.
         */
        static Lerp(left: Color4, right: Color4, amount: number): Color4;
        /**
         * Set the passed "result" with the linearly interpolated values of "amount" between the left Color4 and the right Color4.
         */
        static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void;
        /**
         * Creates a new Color4 from the starting index element of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Color4;
        /**
         * Creates a new Color4 from the passed integers ( < 256 ).
         */
        static FromInts(r: number, g: number, b: number, a: number): Color4;
        static CheckColors4(colors: number[], count: number): number[];
    }
    class Vector2 {
        x: number;
        y: number;
        /**
         * Creates a new Vector2 from the passed x and y coordinates.
         */
        constructor(x: number, y: number);
        /**
         * Returns a string with the Vector2 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector2"
         */
        getClassName(): string;
        /**
         * Returns the Vector2 hash code as a number.
         */
        getHashCode(): number;
        /**
         * Sets the Vector2 coordinates in the passed array or Float32Array from the passed index.
         * Returns the Vector2.
         */
        toArray(array: FloatArray, index?: number): Vector2;
        /**
         * Returns a new array with 2 elements : the Vector2 coordinates.
         */
        asArray(): number[];
        /**
         *  Sets the Vector2 coordinates with the passed Vector2 coordinates.
         * Returns the updated Vector2.
         */
        copyFrom(source: Vector2): Vector2;
        /**
         * Sets the Vector2 coordinates with the passed floats.
         * Returns the updated Vector2.
         */
        copyFromFloats(x: number, y: number): Vector2;
        /**
         * Sets the Vector2 coordinates with the passed floats.
         * Returns the updated Vector2.
         */
        set(x: number, y: number): Vector2;
        /**
         * Returns a new Vector2 set with the addition of the current Vector2 and the passed one coordinates.
         */
        add(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the addition of the current Vector2 and the passed one coordinates.
         * Returns the Vector2.
         */
        addToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Set the Vector2 coordinates by adding the passed Vector2 coordinates.
         * Returns the updated Vector2.
         */
        addInPlace(otherVector: Vector2): Vector2;
        /**
         * Returns a new Vector2 by adding the current Vector2 coordinates to the passed Vector3 x, y coordinates.
         */
        addVector3(otherVector: Vector3): Vector2;
        /**
         * Returns a new Vector2 set with the subtracted coordinates of the passed one from the current Vector2.
         */
        subtract(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the subtraction of the passed one from the current Vector2 coordinates.
         * Returns the Vector2.
         */
        subtractToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Sets the current Vector2 coordinates by subtracting from it the passed one coordinates.
         * Returns the updated Vector2.
         */
        subtractInPlace(otherVector: Vector2): Vector2;
        /**
         * Multiplies in place the current Vector2 coordinates by the passed ones.
         * Returns the updated Vector2.
         */
        multiplyInPlace(otherVector: Vector2): Vector2;
        /**
         * Returns a new Vector2 set with the multiplication of the current Vector2 and the passed one coordinates.
         */
        multiply(otherVector: Vector2): Vector2;
        /**
         * Sets "result" coordinates with the multiplication of the current Vector2 and the passed one coordinates.
         * Returns the Vector2.
         */
        multiplyToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Returns a new Vector2 set with the Vector2 coordinates multiplied by the passed floats.
         */
        multiplyByFloats(x: number, y: number): Vector2;
        /**
         * Returns a new Vector2 set with the Vector2 coordinates divided by the passed one coordinates.
         */
        divide(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the Vector2 divided by the passed one coordinates.
         * Returns the Vector2.
         */
        divideToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Returns a new Vector2 with current Vector2 negated coordinates.
         */
        negate(): Vector2;
        /**
         * Multiply the Vector2 coordinates by scale.
         * Returns the updated Vector2.
         */
        scaleInPlace(scale: number): Vector2;
        /**
         * Returns a new Vector2 scaled by "scale" from the current Vector2.
         */
        scale(scale: number): Vector2;
        /**
         * Boolean : True if the passed vector coordinates strictly equal the current Vector2 ones.
         */
        equals(otherVector: Vector2): boolean;
        /**
         * Boolean : True if the passed vector coordinates are close to the current ones by a distance of epsilon.
         */
        equalsWithEpsilon(otherVector: Vector2, epsilon?: number): boolean;
        /**
         * Returns the vector length (float).
         */
        length(): number;
        /**
         * Returns the vector squared length (float);
         */
        lengthSquared(): number;
        /**
         * Normalize the vector.
         * Returns the updated Vector2.
         */
        normalize(): Vector2;
        /**
         * Returns a new Vector2 copied from the Vector2.
         */
        clone(): Vector2;
        /**
         * Returns a new Vector2(0, 0)
         */
        static Zero(): Vector2;
        /**
         * Returns a new Vector2(1, 1)
         */
        static One(): Vector2;
        /**
         * Returns a new Vector2 set from the passed index element of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector2;
        /**
         * Sets "result" from the passed index element of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector2): void;
        /**
         * Retuns a new Vector2 located for "amount" (float) on the CatmullRom  spline defined by the passed four Vector2.
         */
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        /**
         * Returns a new Vector2 set with same the coordinates than "value" ones if the vector "value" is in the square defined by "min" and "max".
         * If a coordinate of "value" is lower than "min" coordinates, the returned Vector2 is given this "min" coordinate.
         * If a coordinate of "value" is greater than "max" coordinates, the returned Vector2 is given this "max" coordinate.
         */
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        /**
         * Returns a new Vector2 located for "amount" (float) on the Hermite spline defined by the vectors "value1", "value3", "tangent1", "tangent2".
         */
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        /**
         * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".
         */
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        /**
         * Returns the dot product (float) of the vector "left" and the vector "right".
         */
        static Dot(left: Vector2, right: Vector2): number;
        /**
         * Returns a new Vector2 equal to the normalized passed vector.
         */
        static Normalize(vector: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the minimal coordinate values from the "left" and "right" vectors.
         */
        static Minimize(left: Vector2, right: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the maximal coordinate values from the "left" and "right" vectors.
         */
        static Maximize(left: Vector2, right: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the transformed coordinates of the passed vector by the passed transformation matrix.
         */
        static Transform(vector: Vector2, transformation: Matrix): Vector2;
        /**
         * Transforms the passed vector coordinates by the passed transformation matrix and stores the result in the vector "result" coordinates.
         */
        static TransformToRef(vector: Vector2, transformation: Matrix, result: Vector2): void;
        /**
         * Boolean : True if the point "p" is in the triangle defined by the vertors "p0", "p1", "p2"
         */
        static PointInTriangle(p: Vector2, p0: Vector2, p1: Vector2, p2: Vector2): boolean;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector2, value2: Vector2): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
        /**
         * Returns a new Vecto2 located at the center of the vectors "value1" and "value2".
         */
        static Center(value1: Vector2, value2: Vector2): Vector2;
        /**
         * Returns the shortest distance (float) between the point "p" and the segment defined by the two points "segA" and "segB".
         */
        static DistanceOfPointFromSegment(p: Vector2, segA: Vector2, segB: Vector2): number;
    }
    class Vector3 {
        x: number;
        y: number;
        z: number;
        /**
         * Creates a new Vector3 object from the passed x, y, z (floats) coordinates.
         * A Vector3 is the main object used in 3D geometry.
         * It can represent etiher the coordinates of a point the space, either a direction.
         */
        constructor(x: number, y: number, z: number);
        /**
         * Returns a string with the Vector3 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector3"
         */
        getClassName(): string;
        /**
         * Returns the Vector hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array with three elements : the coordinates the Vector3.
         */
        asArray(): number[];
        /**
         * Populates the passed array or Float32Array from the passed index with the successive coordinates of the Vector3.
         * Returns the Vector3.
         */
        toArray(array: FloatArray, index?: number): Vector3;
        /**
         * Returns a new Quaternion object, computed from the Vector3 coordinates.
         */
        toQuaternion(): Quaternion;
        /**
         * Adds the passed vector to the current Vector3.
         * Returns the updated Vector3.
         */
        addInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the addition the current Vector3 and the passed vector.
         */
        add(otherVector: Vector3): Vector3;
        /**
         * Adds the current Vector3 to the passed one and stores the result in the vector "result".
         * Returns the current Vector3.
         */
        addToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Subtract the passed vector from the current Vector3.
         * Returns the updated Vector3.
         */
        subtractInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the subtraction of the passed vector from the current Vector3.
         */
        subtract(otherVector: Vector3): Vector3;
        /**
         * Subtracts the passed vector from the current Vector3 and stores the result in the vector "result".
         * Returns the current Vector3.
         */
        subtractToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set with the subtraction of the passed floats from the current Vector3 coordinates.
         */
        subtractFromFloats(x: number, y: number, z: number): Vector3;
        /**
         * Subtracts the passed floats from the current Vector3 coordinates and set the passed vector "result" with this result.
         * Returns the current Vector3.
         */
        subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set with the current Vector3 negated coordinates.
         */
        negate(): Vector3;
        /**
         * Multiplies the Vector3 coordinates by the float "scale".
         * Returns the updated Vector3.
         */
        scaleInPlace(scale: number): Vector3;
        /**
         * Returns a new Vector3 set with the current Vector3 coordinates multiplied by the float "scale".
         */
        scale(scale: number): Vector3;
        /**
         * Multiplies the current Vector3 coordinates by the float "scale" and stores the result in the passed vector "result" coordinates.
         * Returns the current Vector3.
         */
        scaleToRef(scale: number, result: Vector3): Vector3;
        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are strictly equal.
         */
        equals(otherVector: Vector3): boolean;
        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are distant less than epsilon.
         */
        equalsWithEpsilon(otherVector: Vector3, epsilon?: number): boolean;
        /**
         * Boolean : True if the current Vector3 coordinate equal the passed floats.
         */
        equalsToFloats(x: number, y: number, z: number): boolean;
        /**
         * Muliplies the current Vector3 coordinates by the passed ones.
         * Returns the updated Vector3.
         */
        multiplyInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the multiplication of the current Vector3 by the passed vector.
         */
        multiply(otherVector: Vector3): Vector3;
        /**
         * Multiplies the current Vector3 by the passed one and stores the result in the passed vector "result".
         * Returns the current Vector3.
         */
        multiplyToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set witth the result of the mulliplication of the current Vector3 coordinates by the passed floats.
         */
        multiplyByFloats(x: number, y: number, z: number): Vector3;
        /**
         * Returns a new Vector3 set witth the result of the division of the current Vector3 coordinates by the passed ones.
         */
        divide(otherVector: Vector3): Vector3;
        /**
         * Divides the current Vector3 coordinates by the passed ones and stores the result in the passed vector "result".
         * Returns the current Vector3.
         */
        divideToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Updates the current Vector3 with the minimal coordinate values between its and the passed vector ones.
         * Returns the updated Vector3.
         */
        MinimizeInPlace(other: Vector3): Vector3;
        /**
         * Updates the current Vector3 with the maximal coordinate values between its and the passed vector ones.
         * Returns the updated Vector3.
         */
        MaximizeInPlace(other: Vector3): Vector3;
        /**
         * Return true is the vector is non uniform meaning x, y or z are not all the same.
         */
        readonly isNonUniform: boolean;
        /**
         * Returns the length of the Vector3 (float).
         */
        length(): number;
        /**
         * Returns the squared length of the Vector3 (float).
         */
        lengthSquared(): number;
        /**
         * Normalize the current Vector3.
         * Returns the updated Vector3.
         */
        normalize(): Vector3;
        /**
         * Returns a new Vector3 copied from the current Vector3.
         */
        clone(): Vector3;
        /**
         * Copies the passed vector coordinates to the current Vector3 ones.
         * Returns the updated Vector3.
         */
        copyFrom(source: Vector3): Vector3;
        /**
         * Copies the passed floats to the current Vector3 coordinates.
         * Returns the updated Vector3.
         */
        copyFromFloats(x: number, y: number, z: number): Vector3;
        /**
         * Copies the passed floats to the current Vector3 coordinates.
         * Returns the updated Vector3.
         */
        set(x: number, y: number, z: number): Vector3;
        /**
         *
         */
        static GetClipFactor(vector0: Vector3, vector1: Vector3, axis: Vector3, size: number): number;
        /**
         * Returns a new Vector3 set from the index "offset" of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector3;
        /**
         * Returns a new Vector3 set from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArray instead.
         */
        static FromFloatArray(array: Float32Array, offset?: number): Vector3;
        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArrayToRef instead.
         */
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the passed floats.
         */
        static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        /**
         * Returns a new Vector3 set to (0.0, 0.0, 0.0).
         */
        static Zero(): Vector3;
        /**
         * Returns a new Vector3 set to (1.0, 1.0, 1.0).
         */
        static One(): Vector3;
        /**
         * Returns a new Vector3 set to (0.0, 1.0, 0.0)
         */
        static Up(): Vector3;
        /**
         * Returns a new Vector3 set to (0.0, 0.0, 1.0)
         */
        static Forward(): Vector3;
        /**
         * Returns a new Vector3 set to (1.0, 0.0, 0.0)
         */
        static Right(): Vector3;
        /**
         * Returns a new Vector3 set to (-1.0, 0.0, 0.0)
         */
        static Left(): Vector3;
        /**
         * Returns a new Vector3 set with the result of the transformation by the passed matrix of the passed vector.
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3;
        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed vector.
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed floats (x, y, z).
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        /**
         * Returns a new Vector3 set with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormal(vector: Vector3, transformation: Matrix): Vector3;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z).
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        /**
         * Returns a new Vector3 located for "amount" on the CatmullRom interpolation spline defined by the vectors "value1", "value2", "value3", "value4".
         */
        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        /**
         * Returns a new Vector3 set with the coordinates of "value", if the vector "value" is in the cube defined by the vectors "min" and "max".
         * If a coordinate value of "value" is lower than one of the "min" coordinate, then this "value" coordinate is set with the "min" one.
         * If a coordinate value of "value" is greater than one of the "max" coordinate, then this "value" coordinate is set with the "max" one.
         */
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        /**
         * Returns a new Vector3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        /**
         * Returns a new Vector3 located for "amount" (float) on the linear interpolation between the vectors "start" and "end".
         */
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        /**
         * Sets the passed vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end".
         */
        static LerpToRef(start: Vector3, end: Vector3, amount: number, result: Vector3): void;
        /**
         * Returns the dot product (float) between the vectors "left" and "right".
         */
        static Dot(left: Vector3, right: Vector3): number;
        /**
         * Returns a new Vector3 as the cross product of the vectors "left" and "right".
         * The cross product is then orthogonal to both "left" and "right".
         */
        static Cross(left: Vector3, right: Vector3): Vector3;
        /**
         * Sets the passed vector "result" with the cross product of "left" and "right".
         * The cross product is then orthogonal to both "left" and "right".
         */
        static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void;
        /**
         * Returns a new Vector3 as the normalization of the passed vector.
         */
        static Normalize(vector: Vector3): Vector3;
        /**
         * Sets the passed vector "result" with the normalization of the passed first vector.
         */
        static NormalizeToRef(vector: Vector3, result: Vector3): void;
        private static _viewportMatrixCache;
        static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3;
        static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3;
        static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3;
        static UnprojectToRef(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void;
        static UnprojectFloatsToRef(sourceX: float, sourceY: float, sourceZ: float, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void;
        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector3, value2: Vector3): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
        /**
         * Returns a new Vector3 located at the center between "value1" and "value2".
         */
        static Center(value1: Vector3, value2: Vector3): Vector3;
        /**
         * Given three orthogonal normalized left-handed oriented Vector3 axis in space (target system),
         * RotationFromAxis() returns the rotation Euler angles (ex : rotation.x, rotation.y, rotation.z) to apply
         * to something in order to rotate it from its local system to the given target system.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         * Returns a new Vector3.
         */
        static RotationFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3): Vector3;
        /**
         * The same than RotationFromAxis but updates the passed ref Vector3 parameter instead of returning a new Vector3.
         */
        static RotationFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Vector3): void;
    }
    class Vector4 {
        x: number;
        y: number;
        z: number;
        w: number;
        /**
         * Creates a Vector4 object from the passed floats.
         */
        constructor(x: number, y: number, z: number, w: number);
        /**
         * Returns the string with the Vector4 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector4".
         */
        getClassName(): string;
        /**
         * Returns the Vector4 hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array populated with 4 elements : the Vector4 coordinates.
         */
        asArray(): number[];
        /**
         * Populates the passed array from the passed index with the Vector4 coordinates.
         * Returns the Vector4.
         */
        toArray(array: FloatArray, index?: number): Vector4;
        /**
         * Adds the passed vector to the current Vector4.
         * Returns the updated Vector4.
         */
        addInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 as the result of the addition of the current Vector4 and the passed one.
         */
        add(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the result of the addition of the current Vector4 and the passed one.
         * Returns the current Vector4.
         */
        addToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Subtract in place the passed vector from the current Vector4.
         * Returns the updated Vector4.
         */
        subtractInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 with the result of the subtraction of the passed vector from the current Vector4.
         */
        subtract(otherVector: Vector4): Vector4;
        /**
         * Sets the passed vector "result" with the result of the subtraction of the passed vector from the current Vector4.
         * Returns the current Vector4.
         */
        subtractToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the result of the subtraction of the passed floats from the current Vector4 coordinates.
         */
        subtractFromFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Sets the passed vector "result" set with the result of the subtraction of the passed floats from the current Vector4 coordinates.
         * Returns the current Vector4.
         */
        subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the current Vector4 negated coordinates.
         */
        negate(): Vector4;
        /**
         * Multiplies the current Vector4 coordinates by scale (float).
         * Returns the updated Vector4.
         */
        scaleInPlace(scale: number): Vector4;
        /**
         * Returns a new Vector4 set with the current Vector4 coordinates multiplied by scale (float).
         */
        scale(scale: number): Vector4;
        /**
         * Sets the passed vector "result" with the current Vector4 coordinates multiplied by scale (float).
         * Returns the current Vector4.
         */
        scaleToRef(scale: number, result: Vector4): Vector4;
        /**
         * Boolean : True if the current Vector4 coordinates are stricly equal to the passed ones.
         */
        equals(otherVector: Vector4): boolean;
        /**
         * Boolean : True if the current Vector4 coordinates are each beneath the distance "epsilon" from the passed vector ones.
         */
        equalsWithEpsilon(otherVector: Vector4, epsilon?: number): boolean;
        /**
         * Boolean : True if the passed floats are strictly equal to the current Vector4 coordinates.
         */
        equalsToFloats(x: number, y: number, z: number, w: number): boolean;
        /**
         * Multiplies in place the current Vector4 by the passed one.
         * Returns the updated Vector4.
         */
        multiplyInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the multiplication result of the current Vector4 and the passed one.
         */
        multiply(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the multiplication result of the current Vector4 and the passed one.
         * Returns the current Vector4.
         */
        multiplyToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the multiplication result of the passed floats and the current Vector4 coordinates.
         */
        multiplyByFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Returns a new Vector4 set with the division result of the current Vector4 by the passed one.
         */
        divide(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the division result of the current Vector4 by the passed one.
         * Returns the current Vector4.
         */
        divideToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Updates the Vector4 coordinates with the minimum values between its own and the passed vector ones.
         */
        MinimizeInPlace(other: Vector4): Vector4;
        /**
         * Updates the Vector4 coordinates with the maximum values between its own and the passed vector ones.
         */
        MaximizeInPlace(other: Vector4): Vector4;
        /**
         * Returns the Vector4 length (float).
         */
        length(): number;
        /**
         * Returns the Vector4 squared length (float).
         */
        lengthSquared(): number;
        /**
         * Normalizes in place the Vector4.
         * Returns the updated Vector4.
         */
        normalize(): Vector4;
        /**
         * Returns a new Vector3 from the Vector4 (x, y, z) coordinates.
         */
        toVector3(): Vector3;
        /**
         * Returns a new Vector4 copied from the current one.
         */
        clone(): Vector4;
        /**
         * Updates the current Vector4 with the passed one coordinates.
         * Returns the updated Vector4.
         */
        copyFrom(source: Vector4): Vector4;
        /**
         * Updates the current Vector4 coordinates with the passed floats.
         * Returns the updated Vector4.
         */
        copyFromFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Updates the current Vector4 coordinates with the passed floats.
         * Returns the updated Vector4.
         */
        set(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Returns a new Vector4 set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector4;
        /**
         * Updates the passed vector "result" from the starting index of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector4): void;
        /**
         * Updates the passed vector "result" from the starting index of the passed Float32Array.
         */
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void;
        /**
         * Updates the passed vector "result" coordinates from the passed floats.
         */
        static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        /**
         * Returns a new Vector4 set to (0.0, 0.0, 0.0, 0.0)
         */
        static Zero(): Vector4;
        /**
         * Returns a new Vector4 set to (1.0, 1.0, 1.0, 1.0)
         */
        static One(): Vector4;
        /**
         * Returns a new normalized Vector4 from the passed one.
         */
        static Normalize(vector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" from the normalization of the passed one.
         */
        static NormalizeToRef(vector: Vector4, result: Vector4): void;
        static Minimize(left: Vector4, right: Vector4): Vector4;
        static Maximize(left: Vector4, right: Vector4): Vector4;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector4, value2: Vector4): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector4, value2: Vector4): number;
        /**
         * Returns a new Vector4 located at the center between the vectors "value1" and "value2".
         */
        static Center(value1: Vector4, value2: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormal(vector: Vector4, transformation: Matrix): Vector4;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalToRef(vector: Vector4, transformation: Matrix, result: Vector4): void;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z, w).
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, w: number, transformation: Matrix, result: Vector4): void;
    }
    interface ISize {
        width: number;
        height: number;
    }
    class Size implements ISize {
        width: number;
        height: number;
        /**
         * Creates a Size object from the passed width and height (floats).
         */
        constructor(width: number, height: number);
        toString(): string;
        /**
         * Returns the string "Size"
         */
        getClassName(): string;
        /**
         * Returns the Size hash code.
         */
        getHashCode(): number;
        /**
         * Updates the current size from the passed one.
         * Returns the updated Size.
         */
        copyFrom(src: Size): void;
        /**
         * Updates in place the current Size from the passed floats.
         * Returns the updated Size.
         */
        copyFromFloats(width: number, height: number): Size;
        /**
         * Updates in place the current Size from the passed floats.
         * Returns the updated Size.
         */
        set(width: number, height: number): Size;
        /**
         * Returns a new Size set with the multiplication result of the current Size and the passed floats.
         */
        multiplyByFloats(w: number, h: number): Size;
        /**
         * Returns a new Size copied from the passed one.
         */
        clone(): Size;
        /**
         * Boolean : True if the current Size and the passed one width and height are strictly equal.
         */
        equals(other: Size): boolean;
        /**
         * Returns the surface of the Size : width * height (float).
         */
        readonly surface: number;
        /**
         * Returns a new Size set to (0.0, 0.0)
         */
        static Zero(): Size;
        /**
         * Returns a new Size set as the addition result of the current Size and the passed one.
         */
        add(otherSize: Size): Size;
        /**
         * Returns a new Size set as the subtraction result of  the passed one from the current Size.
         */
        subtract(otherSize: Size): Size;
        /**
         * Returns a new Size set at the linear interpolation "amount" between "start" and "end".
         */
        static Lerp(start: Size, end: Size, amount: number): Size;
    }
    class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;
        /**
         * Creates a new Quaternion from the passed floats.
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Returns a string with the Quaternion coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Quaternion".
         */
        getClassName(): string;
        /**
         * Returns the Quaternion hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array populated with 4 elements : the Quaternion coordinates.
         */
        asArray(): number[];
        /**
         * Boolean : True if the current Quaterion and the passed one coordinates are strictly equal.
         */
        equals(otherQuaternion: Quaternion): boolean;
        /**
         * Returns a new Quaternion copied from the current one.
         */
        clone(): Quaternion;
        /**
         * Updates the current Quaternion from the passed one coordinates.
         * Returns the updated Quaterion.
         */
        copyFrom(other: Quaternion): Quaternion;
        /**
         * Updates the current Quaternion from the passed float coordinates.
         * Returns the updated Quaterion.
         */
        copyFromFloats(x: number, y: number, z: number, w: number): Quaternion;
        /**
         * Updates the current Quaternion from the passed float coordinates.
         * Returns the updated Quaterion.
         */
        set(x: number, y: number, z: number, w: number): Quaternion;
        /**
         * Returns a new Quaternion as the addition result of the passed one and the current Quaternion.
         */
        add(other: Quaternion): Quaternion;
        /**
         * Returns a new Quaternion as the subtraction result of the passed one from the current Quaternion.
         */
        subtract(other: Quaternion): Quaternion;
        /**
         * Returns a new Quaternion set by multiplying the current Quaterion coordinates by the float "scale".
         */
        scale(value: number): Quaternion;
        /**
         * Returns a new Quaternion set as the quaternion mulplication result of the current one with the passed one "q1".
         */
        multiply(q1: Quaternion): Quaternion;
        /**
         * Sets the passed "result" as the quaternion mulplication result of the current one with the passed one "q1".
         * Returns the current Quaternion.
         */
        multiplyToRef(q1: Quaternion, result: Quaternion): Quaternion;
        /**
         * Updates the current Quaternion with the quaternion mulplication result of itself with the passed one "q1".
         * Returns the updated Quaternion.
         */
        multiplyInPlace(q1: Quaternion): Quaternion;
        /**
         * Sets the passed "ref" with the conjugation of the current Quaternion.
         * Returns the current Quaternion.
         */
        conjugateToRef(ref: Quaternion): Quaternion;
        /**
         * Conjugates in place the current Quaternion.
         * Returns the updated Quaternion.
         */
        conjugateInPlace(): Quaternion;
        /**
         * Returns a new Quaternion as the conjugate of the current Quaternion.
         */
        conjugate(): Quaternion;
        /**
         * Returns the Quaternion length (float).
         */
        length(): number;
        /**
         * Normalize in place the current Quaternion.
         * Returns the updated Quaternion.
         */
        normalize(): Quaternion;
        /**
         * Returns a new Vector3 set with the Euler angles translated from the current Quaternion.
         */
        toEulerAngles(order?: string): Vector3;
        /**
         * Sets the passed vector3 "result" with the Euler angles translated from the current Quaternion.
         * Returns the current Quaternion.
         */
        toEulerAnglesToRef(result: Vector3, order?: string): Quaternion;
        /**
         * Updates the passed rotation matrix with the current Quaternion values.
         * Returns the current Quaternion.
         */
        toRotationMatrix(result: Matrix): Quaternion;
        /**
         * Updates the current Quaternion from the passed rotation matrix values.
         * Returns the updated Quaternion.
         */
        fromRotationMatrix(matrix: Matrix): Quaternion;
        /**
         * Returns a new Quaternion set from the passed rotation matrix values.
         */
        static FromRotationMatrix(matrix: Matrix): Quaternion;
        /**
         * Updates the passed quaternion "result" with the passed rotation matrix values.
         */
        static FromRotationMatrixToRef(matrix: Matrix, result: Quaternion): void;
        /**
         * Returns a new Quaternion set to (0.0, 0.0, 0.0).
         */
        static Zero(): Quaternion;
        /**
         * Returns a new Quaternion as the inverted current Quaternion.
         */
        static Inverse(q: Quaternion): Quaternion;
        /**
         * Returns the identity Quaternion.
         */
        static Identity(): Quaternion;
        static IsIdentity(quaternion: Quaternion): boolean;
        /**
         * Returns a new Quaternion set from the passed axis (Vector3) and angle in radians (float).
         */
        static RotationAxis(axis: Vector3, angle: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed axis (Vector3) and angle in radians (float).
         */
        static RotationAxisToRef(axis: Vector3, angle: number, result: Quaternion): Quaternion;
        /**
         * Retuns a new Quaternion set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Quaternion;
        /**
         * Returns a new Quaternion set from the passed Euler float angles (y, x, z).
         */
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles (y, x, z).
         */
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion from the passed float Euler angles expressed in z-x-z orientation
         */
        static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles expressed in z-x-z orientation
         */
        static RotationAlphaBetaGammaToRef(alpha: number, beta: number, gamma: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion as the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.
         * cf to Vector3.RotationFromAxis() documentation.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         */
        static RotationQuaternionFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): Quaternion;
        /**
         * Sets the passed quaternion "ref" with the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.
         * cf to Vector3.RotationFromAxis() documentation.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         */
        static RotationQuaternionFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
        static SlerpToRef(left: Quaternion, right: Quaternion, amount: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
        static Hermite(value1: Quaternion, tangent1: Quaternion, value2: Quaternion, tangent2: Quaternion, amount: number): Quaternion;
    }
    class Matrix {
        private static _tempQuaternion;
        private static _xAxis;
        private static _yAxis;
        private static _zAxis;
        private static _updateFlagSeed;
        private static _identityReadOnly;
        private _isIdentity;
        private _isIdentityDirty;
        updateFlag: number;
        m: Float32Array;
        _markAsUpdated(): void;
        constructor();
        /**
         * Boolean : True is the matrix is the identity matrix
         */
        isIdentity(considerAsTextureMatrix?: boolean): boolean;
        /**
         * Returns the matrix determinant (float).
         */
        determinant(): number;
        /**
         * Returns the matrix underlying array.
         */
        toArray(): Float32Array;
        /**
        * Returns the matrix underlying array.
        */
        asArray(): Float32Array;
        /**
         * Inverts in place the Matrix.
         * Returns the Matrix inverted.
         */
        invert(): Matrix;
        /**
         * Sets all the matrix elements to zero.
         * Returns the Matrix.
         */
        reset(): Matrix;
        /**
         * Returns a new Matrix as the addition result of the current Matrix and the passed one.
         */
        add(other: Matrix): Matrix;
        /**
         * Sets the passed matrix "result" with the ddition result of the current Matrix and the passed one.
         * Returns the Matrix.
         */
        addToRef(other: Matrix, result: Matrix): Matrix;
        /**
         * Adds in place the passed matrix to the current Matrix.
         * Returns the updated Matrix.
         */
        addToSelf(other: Matrix): Matrix;
        /**
         * Sets the passed matrix with the current inverted Matrix.
         * Returns the unmodified current Matrix.
         */
        invertToRef(other: Matrix): Matrix;
        /**
         * Inserts the translation vector (using 3 x floats) in the current Matrix.
         * Returns the updated Matrix.
         */
        setTranslationFromFloats(x: number, y: number, z: number): Matrix;
        /**
 * Inserts the translation vector in the current Matrix.
 * Returns the updated Matrix.
 */
        setTranslation(vector3: Vector3): Matrix;
        /**
         * Returns a new Vector3 as the extracted translation from the Matrix.
         */
        getTranslation(): Vector3;
        /**
         * Fill a Vector3 with the extracted translation from the Matrix.
         */
        getTranslationToRef(result: Vector3): Matrix;
        /**
         * Remove rotation and scaling part from the Matrix.
         * Returns the updated Matrix.
         */
        removeRotationAndScaling(): Matrix;
        /**
         * Returns a new Matrix set with the multiplication result of the current Matrix and the passed one.
         */
        multiply(other: Matrix): Matrix;
        /**
         * Updates the current Matrix from the passed one values.
         * Returns the updated Matrix.
         */
        copyFrom(other: Matrix): Matrix;
        /**
         * Populates the passed array from the starting index with the Matrix values.
         * Returns the Matrix.
         */
        copyToArray(array: Float32Array, offset?: number): Matrix;
        /**
         * Sets the passed matrix "result" with the multiplication result of the current Matrix and the passed one.
         */
        multiplyToRef(other: Matrix, result: Matrix): Matrix;
        /**
         * Sets the Float32Array "result" from the passed index "offset" with the multiplication result of the current Matrix and the passed one.
         */
        multiplyToArray(other: Matrix, result: Float32Array, offset: number): Matrix;
        /**
         * Boolean : True is the current Matrix and the passed one values are strictly equal.
         */
        equals(value: Matrix): boolean;
        /**
         * Returns a new Matrix from the current Matrix.
         */
        clone(): Matrix;
        /**
         * Returns the string "Matrix"
         */
        getClassName(): string;
        /**
         * Returns the Matrix hash code.
         */
        getHashCode(): number;
        /**
         * Decomposes the current Matrix into :
         * - a scale vector3 passed as a reference to update,
         * - a rotation quaternion passed as a reference to update,
         * - a translation vector3 passed as a reference to update.
         * Returns the boolean `true`.
         */
        decompose(scale: Vector3, rotation: Quaternion, translation: Vector3): boolean;
        /**
         * Returns a new Matrix as the extracted rotation matrix from the current one.
         */
        getRotationMatrix(): Matrix;
        /**
         * Extracts the rotation matrix from the current one and sets it as the passed "result".
         * Returns the current Matrix.
         */
        getRotationMatrixToRef(result: Matrix): Matrix;
        /**
         * Returns a new Matrix set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Matrix;
        /**
         * Sets the passed "result" matrix from the starting index of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Matrix): void;
        /**
         * Sets the passed "result" matrix from the starting index of the passed Float32Array by multiplying each element by the float "scale".
         */
        static FromFloat32ArrayToRefScaled(array: Float32Array, offset: number, scale: number, result: Matrix): void;
        /**
         * Sets the passed matrix "result" with the 16 passed floats.
         */
        static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void;
        /**
         * Returns the index-th row of the current matrix as a new Vector4.
         */
        getRow(index: number): Nullable<Vector4>;
        /**
         * Sets the index-th row of the current matrix with the passed Vector4 values.
         * Returns the updated Matrix.
         */
        setRow(index: number, row: Vector4): Matrix;
        /**
         * Compute the transpose of the matrix.
         * Returns a new Matrix.
         */
        transpose(): Matrix;
        /**
         * Compute the transpose of the matrix.
         * Returns the current matrix.
         */
        transposeToRef(result: Matrix): Matrix;
        /**
         * Sets the index-th row of the current matrix with the passed 4 x float values.
         * Returns the updated Matrix.
         */
        setRowFromFloats(index: number, x: number, y: number, z: number, w: number): Matrix;
        /**
         * Static identity matrix to be used as readonly matrix
         * Must not be updated.
         */
        static readonly IdentityReadOnly: Matrix;
        /**
         * Returns a new Matrix set from the 16 passed floats.
         */
        static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix;
        /**
         * Returns a new Matrix composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).
         */
        static Compose(scale: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        /**
       * Update a Matrix with values composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).
       */
        static ComposeToRef(scale: Vector3, rotation: Quaternion, translation: Vector3, result: Matrix): void;
        /**
         * Returns a new indentity Matrix.
         */
        static Identity(): Matrix;
        /**
         * Sets the passed "result" as an identity matrix.
         */
        static IdentityToRef(result: Matrix): void;
        /**
         * Returns a new zero Matrix.
         */
        static Zero(): Matrix;
        /**
         * Returns a new rotation matrix for "angle" radians around the X axis.
         */
        static RotationX(angle: number): Matrix;
        /**
         * Returns a new Matrix as the passed inverted one.
         */
        static Invert(source: Matrix): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the X axis.
         */
        static RotationXToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the Y axis.
         */
        static RotationY(angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Y axis.
         */
        static RotationYToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the Z axis.
         */
        static RotationZ(angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Z axis.
         */
        static RotationZToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the passed axis.
         */
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the passed axis.
         */
        static RotationAxisToRef(axis: Vector3, angle: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a rotation matrix from the Euler angles (y, x, z).
         */
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix from the Euler angles (y, x, z).
         */
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a scaling matrix from the passed floats (x, y, z).
         */
        static Scaling(x: number, y: number, z: number): Matrix;
        /**
         * Sets the passed matrix "result" as a scaling matrix from the passed floats (x, y, z).
         */
        static ScalingToRef(x: number, y: number, z: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a translation matrix from the passed floats (x, y, z).
         */
        static Translation(x: number, y: number, z: number): Matrix;
        /**
         * Sets the passed matrix "result" as a translation matrix from the passed floats (x, y, z).
         */
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        /**
         * Returns a new Matrix whose values are the interpolated values for "gradien" (float) between the ones of the matrices "startValue" and "endValue".
         */
        static Lerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        /**
         * Returns a new Matrix whose values are computed by :
         * - decomposing the the "startValue" and "endValue" matrices into their respective scale, rotation and translation matrices,
         * - interpolating for "gradient" (float) the values between each of these decomposed matrices between the start and the end,
         * - recomposing a new matrix from these 3 interpolated scale, rotation and translation matrices.
         */
        static DecomposeLerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Right-Handed system.
         */
        static LookAtRH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtRHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static OrthoLHToRef(width: number, height: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterRH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterRHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed?: boolean): void;
        /**
         * Returns a new Matrix as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovRH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovRHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed?: boolean): void;
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix  for WebVR computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovWebVRToRef(fov: {
            upDegrees: number;
            downDegrees: number;
            leftDegrees: number;
            rightDegrees: number;
        }, znear: number, zfar: number, result: Matrix, rightHanded?: boolean): void;
        /**
         * Returns the final transformation matrix : world * view * projection * viewport
         */
        static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix;
        /**
         * Returns a new Float32Array array with 4 elements : the 2x2 matrix extracted from the passed Matrix.
         */
        static GetAsMatrix2x2(matrix: Matrix): Float32Array;
        /**
         * Returns a new Float32Array array with 9 elements : the 3x3 matrix extracted from the passed Matrix.
         */
        static GetAsMatrix3x3(matrix: Matrix): Float32Array;
        /**
         * Compute the transpose of the passed Matrix.
         * Returns a new Matrix.
         */
        static Transpose(matrix: Matrix): Matrix;
        /**
         * Compute the transpose of the passed Matrix and store it in the result matrix.
         */
        static TransposeToRef(matrix: Matrix, result: Matrix): void;
        /**
         * Returns a new Matrix as the reflection  matrix across the passed plane.
         */
        static Reflection(plane: Plane): Matrix;
        /**
         * Sets the passed matrix "result" as the reflection matrix across the passed plane.
         */
        static ReflectionToRef(plane: Plane, result: Matrix): void;
        /**
         * Sets the passed matrix "mat" as a rotation matrix composed from the 3 passed  left handed axis.
         */
        static FromXYZAxesToRef(xaxis: Vector3, yaxis: Vector3, zaxis: Vector3, result: Matrix): void;
        /**
         * Sets the passed matrix "result" as a rotation matrix according to the passed quaternion.
         */
        static FromQuaternionToRef(quat: Quaternion, result: Matrix): void;
    }
    class Plane {
        normal: Vector3;
        d: number;
        /**
         * Creates a Plane object according to the passed floats a, b, c, d and the plane equation : ax + by + cz + d = 0
         */
        constructor(a: number, b: number, c: number, d: number);
        /**
         * Returns the plane coordinates as a new array of 4 elements [a, b, c, d].
         */
        asArray(): number[];
        /**
         * Returns a new plane copied from the current Plane.
         */
        clone(): Plane;
        /**
         * Returns the string "Plane".
         */
        getClassName(): string;
        /**
         * Returns the Plane hash code.
         */
        getHashCode(): number;
        /**
         * Normalize the current Plane in place.
         * Returns the updated Plane.
         */
        normalize(): Plane;
        /**
         * Returns a new Plane as the result of the transformation of the current Plane by the passed matrix.
         */
        transform(transformation: Matrix): Plane;
        /**
         * Returns the dot product (float) of the point coordinates and the plane normal.
         */
        dotCoordinate(point: Vector3): number;
        /**
         * Updates the current Plane from the plane defined by the three passed points.
         * Returns the updated Plane.
         */
        copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        /**
         * Boolean : True is the vector "direction"  is the same side than the plane normal.
         */
        isFrontFacingTo(direction: Vector3, epsilon: number): boolean;
        /**
         * Returns the signed distance (float) from the passed point to the Plane.
         */
        signedDistanceTo(point: Vector3): number;
        /**
         * Returns a new Plane from the passed array.
         */
        static FromArray(array: ArrayLike<number>): Plane;
        /**
         * Returns a new Plane defined by the three passed points.
         */
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        /**
         * Returns a new Plane the normal vector to this plane at the passed origin point.
         * Note : the vector "normal" is updated because normalized.
         */
        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane;
        /**
         * Returns the signed distance between the plane defined by the normal vector at the "origin"" point and the passed other point.
         */
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number;
    }
    class Viewport {
        x: number;
        y: number;
        width: number;
        height: number;
        /**
         * Creates a Viewport object located at (x, y) and sized (width, height).
         */
        constructor(x: number, y: number, width: number, height: number);
        toGlobal(renderWidthOrEngine: number | Engine, renderHeight: number): Viewport;
        /**
         * Returns a new Viewport copied from the current one.
         */
        clone(): Viewport;
    }
    class Frustum {
        /**
         * Returns a new array of 6 Frustum planes computed by the passed transformation matrix.
         */
        static GetPlanes(transform: Matrix): Plane[];
        static GetNearPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetFarPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetLeftPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetRightPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetTopPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetBottomPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        /**
         * Sets the passed array "frustumPlanes" with the 6 Frustum planes computed by the passed transformation matrix.
         */
        static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void;
    }
    enum Space {
        LOCAL = 0,
        WORLD = 1,
        BONE = 2,
    }
    class Axis {
        static X: Vector3;
        static Y: Vector3;
        static Z: Vector3;
    }
    class BezierCurve {
        /**
         * Returns the cubic Bezier interpolated value (float) at "t" (float) from the passed x1, y1, x2, y2 floats.
         */
        static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number;
    }
    enum Orientation {
        CW = 0,
        CCW = 1,
    }
    class Angle {
        private _radians;
        /**
         * Creates an Angle object of "radians" radians (float).
         */
        constructor(radians: number);
        /**
         * Returns the Angle value in degrees (float).
         */
        degrees: () => number;
        /**
         * Returns the Angle value in radians (float).
         */
        radians: () => number;
        /**
         * Returns a new Angle object valued with the angle value in radians between the two passed vectors.
         */
        static BetweenTwoPoints(a: Vector2, b: Vector2): Angle;
        /**
         * Returns a new Angle object from the passed float in radians.
         */
        static FromRadians(radians: number): Angle;
        /**
         * Returns a new Angle object from the passed float in degrees.
         */
        static FromDegrees(degrees: number): Angle;
    }
    class Arc2 {
        startPoint: Vector2;
        midPoint: Vector2;
        endPoint: Vector2;
        centerPoint: Vector2;
        radius: number;
        angle: Angle;
        startAngle: Angle;
        orientation: Orientation;
        /**
         * Creates an Arc object from the three passed points : start, middle and end.
         */
        constructor(startPoint: Vector2, midPoint: Vector2, endPoint: Vector2);
    }
    class Path2 {
        private _points;
        private _length;
        closed: boolean;
        /**
         * Creates a Path2 object from the starting 2D coordinates x and y.
         */
        constructor(x: number, y: number);
        /**
         * Adds a new segment until the passed coordinates (x, y) to the current Path2.
         * Returns the updated Path2.
         */
        addLineTo(x: number, y: number): Path2;
        /**
         * Adds _numberOfSegments_ segments according to the arc definition (middle point coordinates, end point coordinates, the arc start point being the current Path2 last point) to the current Path2.
         * Returns the updated Path2.
         */
        addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments?: number): Path2;
        /**
         * Closes the Path2.
         * Returns the Path2.
         */
        close(): Path2;
        /**
         * Returns the Path2 total length (float).
         */
        length(): number;
        /**
         * Returns the Path2 internal array of points.
         */
        getPoints(): Vector2[];
        /**
         * Returns a new Vector2 located at a percentage of the Path2 total length on this path.
         */
        getPointAtLengthPosition(normalizedLengthPosition: number): Vector2;
        /**
         * Returns a new Path2 starting at the coordinates (x, y).
         */
        static StartingAt(x: number, y: number): Path2;
    }
    class Path3D {
        path: Vector3[];
        private _curve;
        private _distances;
        private _tangents;
        private _normals;
        private _binormals;
        private _raw;
        /**
        * new Path3D(path, normal, raw)
        * Creates a Path3D. A Path3D is a logical math object, so not a mesh.
        * please read the description in the tutorial :  http://doc.babylonjs.com/tutorials/How_to_use_Path3D
        * path : an array of Vector3, the curve axis of the Path3D
        * normal (optional) : Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
        * raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
        */
        constructor(path: Vector3[], firstNormal?: Nullable<Vector3>, raw?: boolean);
        /**
         * Returns the Path3D array of successive Vector3 designing its curve.
         */
        getCurve(): Vector3[];
        /**
         * Returns an array populated with tangent vectors on each Path3D curve point.
         */
        getTangents(): Vector3[];
        /**
         * Returns an array populated with normal vectors on each Path3D curve point.
         */
        getNormals(): Vector3[];
        /**
         * Returns an array populated with binormal vectors on each Path3D curve point.
         */
        getBinormals(): Vector3[];
        /**
         * Returns an array populated with distances (float) of the i-th point from the first curve point.
         */
        getDistances(): number[];
        /**
         * Forces the Path3D tangent, normal, binormal and distance recomputation.
         * Returns the same object updated.
         */
        update(path: Vector3[], firstNormal?: Nullable<Vector3>): Path3D;
        private _compute(firstNormal);
        private _getFirstNonNullVector(index);
        private _getLastNonNullVector(index);
        private _normalVector(v0, vt, va);
    }
    class Curve3 {
        private _points;
        private _length;
        /**
         * Returns a Curve3 object along a Quadratic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#quadratic-bezier-curve
         * @param v0 (Vector3) the origin point of the Quadratic Bezier
         * @param v1 (Vector3) the control point
         * @param v2 (Vector3) the end point of the Quadratic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateQuadraticBezier(v0: Vector3, v1: Vector3, v2: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a Cubic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#cubic-bezier-curve
         * @param v0 (Vector3) the origin point of the Cubic Bezier
         * @param v1 (Vector3) the first control point
         * @param v2 (Vector3) the second control point
         * @param v3 (Vector3) the end point of the Cubic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateCubicBezier(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a Hermite Spline curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#hermite-spline
         * @param p1 (Vector3) the origin point of the Hermite Spline
         * @param t1 (Vector3) the tangent vector at the origin point
         * @param p2 (Vector3) the end point of the Hermite Spline
         * @param t2 (Vector3) the tangent vector at the end point
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateHermiteSpline(p1: Vector3, t1: Vector3, p2: Vector3, t2: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a CatmullRom Spline curve :
         * @param points (array of Vector3) the points the spline must pass through. At least, four points required.
         * @param nbPoints (integer) the wanted number of points between each curve control points.
         */
        static CreateCatmullRomSpline(points: Vector3[], nbPoints: number): Curve3;
        /**
         * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
         * A Curve3 is designed from a series of successive Vector3.
         * Tuto : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#curve3-object
         */
        constructor(points: Vector3[]);
        /**
         * Returns the Curve3 stored array of successive Vector3
         */
        getPoints(): Vector3[];
        /**
         * Returns the computed length (float) of the curve.
         */
        length(): number;
        /**
         * Returns a new instance of Curve3 object : var curve = curveA.continue(curveB);
         * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.
         * curveA and curveB keep unchanged.
         */
        continue(curve: Curve3): Curve3;
        private _computeLength(path);
    }
    class PositionNormalVertex {
        position: Vector3;
        normal: Vector3;
        constructor(position?: Vector3, normal?: Vector3);
        clone(): PositionNormalVertex;
    }
    class PositionNormalTextureVertex {
        position: Vector3;
        normal: Vector3;
        uv: Vector2;
        constructor(position?: Vector3, normal?: Vector3, uv?: Vector2);
        clone(): PositionNormalTextureVertex;
    }
    class Tmp {
        static Color3: Color3[];
        static Vector2: Vector2[];
        static Vector3: Vector3[];
        static Vector4: Vector4[];
        static Quaternion: Quaternion[];
        static Matrix: Matrix[];
    }
}

declare module BABYLON {
    class SphericalPolynomial {
        x: Vector3;
        y: Vector3;
        z: Vector3;
        xx: Vector3;
        yy: Vector3;
        zz: Vector3;
        xy: Vector3;
        yz: Vector3;
        zx: Vector3;
        addAmbient(color: Color3): void;
        static getSphericalPolynomialFromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial;
        scale(scale: number): void;
    }
    class SphericalHarmonics {
        L00: Vector3;
        L1_1: Vector3;
        L10: Vector3;
        L11: Vector3;
        L2_2: Vector3;
        L2_1: Vector3;
        L20: Vector3;
        L21: Vector3;
        L22: Vector3;
        addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void;
        scale(scale: number): void;
        convertIncidentRadianceToIrradiance(): void;
        convertIrradianceToLambertianRadiance(): void;
        static getsphericalHarmonicsFromPolynomial(polynomial: SphericalPolynomial): SphericalHarmonics;
    }
}

declare module BABYLON {
    class AbstractMesh extends TransformNode implements IDisposable, ICullable, IGetSetVerticesData {
        static OCCLUSION_TYPE_NONE: number;
        static OCCLUSION_TYPE_OPTIMISTIC: number;
        static OCCLUSION_TYPE_STRICT: number;
        static OCCLUSION_ALGORITHM_TYPE_ACCURATE: number;
        static OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE: number;
        static readonly BILLBOARDMODE_NONE: number;
        static readonly BILLBOARDMODE_X: number;
        static readonly BILLBOARDMODE_Y: number;
        static readonly BILLBOARDMODE_Z: number;
        static readonly BILLBOARDMODE_ALL: number;
        private _facetPositions;
        private _facetNormals;
        private _facetPartitioning;
        private _facetNb;
        private _partitioningSubdivisions;
        private _partitioningBBoxRatio;
        private _facetDataEnabled;
        private _facetParameters;
        private _bbSize;
        private _subDiv;
        private _facetDepthSort;
        private _facetDepthSortEnabled;
        private _depthSortedIndices;
        private _depthSortedFacets;
        private _facetDepthSortFunction;
        private _facetDepthSortFrom;
        private _facetDepthSortOrigin;
        private _invertedMatrix;
        /**
         * Read-only : the number of facets in the mesh
         */
        readonly facetNb: number;
        /**
         * The number (integer) of subdivisions per axis in the partioning space
         */
        partitioningSubdivisions: number;
        /**
         * The ratio (float) to apply to the bouding box size to set to the partioning space.
         * Ex : 1.01 (default) the partioning space is 1% bigger than the bounding box.
         */
        partitioningBBoxRatio: number;
        /**
         * Boolean : must the facet be depth sorted on next call to `updateFacetData()` ?
         * Works only for updatable meshes.
         * Doesn't work with multi-materials.
         */
        mustDepthSortFacets: boolean;
        /**
         * The location (Vector3) where the facet depth sort must be computed from.
         * By default, the active camera position.
         * Used only when facet depth sort is enabled.
         */
        facetDepthSortFrom: Vector3;
        /**
         * Read-only boolean : is the feature facetData enabled ?
         */
        readonly isFacetDataEnabled: boolean;
        _updateNonUniformScalingState(value: boolean): boolean;
        /**
        * An event triggered when this mesh collides with another one
        * @type {BABYLON.Observable}
        */
        onCollideObservable: Observable<AbstractMesh>;
        private _onCollideObserver;
        onCollide: () => void;
        /**
        * An event triggered when the collision's position changes
        * @type {BABYLON.Observable}
        */
        onCollisionPositionChangeObservable: Observable<Vector3>;
        private _onCollisionPositionChangeObserver;
        onCollisionPositionChange: () => void;
        /**
        * An event triggered when material is changed
        * @type {BABYLON.Observable}
        */
        onMaterialChangedObservable: Observable<AbstractMesh>;
        definedFacingForward: boolean;
        /**
        * This property determines the type of occlusion query algorithm to run in WebGl, you can use:

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.

        * or

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.

        * for more info check WebGl documentations
        */
        occlusionQueryAlgorithmType: number;
        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used     to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:

        * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query whith the Mesh.

        * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.

            * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         */
        occlusionType: number;
        /**
        * This number indicates the number of allowed retries before stop the occlusion query, this is useful if the        occlusion query is taking long time before to the query result is retireved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decideds to show or hide the object.

        * The default value is -1 which means don't break the query and wait till the result.
        */
        occlusionRetryCount: number;
        private _occlusionInternalRetryCounter;
        protected _isOccluded: boolean;
        /**
        * Property isOccluded : Gets or sets whether the mesh is occluded or not, it is used also to set the intial state of the mesh to be occluded or not.
        */
        isOccluded: boolean;
        private _isOcclusionQueryInProgress;
        /**
        * Flag to check the progress status of the query
        */
        readonly isOcclusionQueryInProgress: boolean;
        private _occlusionQuery;
        visibility: number;
        alphaIndex: number;
        isVisible: boolean;
        isPickable: boolean;
        showBoundingBox: boolean;
        showSubMeshesBoundingBox: boolean;
        isBlocker: boolean;
        enablePointerMoveEvents: boolean;
        renderingGroupId: number;
        private _material;
        material: Nullable<Material>;
        private _receiveShadows;
        receiveShadows: boolean;
        renderOutline: boolean;
        outlineColor: Color3;
        outlineWidth: number;
        renderOverlay: boolean;
        overlayColor: Color3;
        overlayAlpha: number;
        private _hasVertexAlpha;
        hasVertexAlpha: boolean;
        private _useVertexColors;
        useVertexColors: boolean;
        private _computeBonesUsingShaders;
        computeBonesUsingShaders: boolean;
        private _numBoneInfluencers;
        numBoneInfluencers: number;
        private _applyFog;
        applyFog: boolean;
        useOctreeForRenderingSelection: boolean;
        useOctreeForPicking: boolean;
        useOctreeForCollisions: boolean;
        private _layerMask;
        layerMask: number;
        /**
         * True if the mesh must be rendered in any case.
         */
        alwaysSelectAsActiveMesh: boolean;
        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        actionManager: Nullable<ActionManager>;
        physicsImpostor: Nullable<PhysicsImpostor>;
        private _checkCollisions;
        private _collisionMask;
        private _collisionGroup;
        ellipsoid: Vector3;
        ellipsoidOffset: Vector3;
        private _collider;
        private _oldPositionForCollisions;
        private _diffPositionForCollisions;
        collisionMask: number;
        collisionGroup: number;
        edgesWidth: number;
        edgesColor: Color4;
        _edgesRenderer: Nullable<EdgesRenderer>;
        private _collisionsTransformMatrix;
        private _collisionsScalingMatrix;
        _masterMesh: Nullable<AbstractMesh>;
        _boundingInfo: Nullable<BoundingInfo>;
        _isDisposed: boolean;
        _renderId: number;
        subMeshes: SubMesh[];
        _submeshesOctree: Octree<SubMesh>;
        _intersectionsInProgress: AbstractMesh[];
        _unIndexed: boolean;
        _lightSources: Light[];
        readonly _positions: Nullable<Vector3[]>;
        _waitingActions: any;
        _waitingFreezeWorldMatrix: Nullable<boolean>;
        private _skeleton;
        _bonesTransformMatrices: Nullable<Float32Array>;
        skeleton: Nullable<Skeleton>;
        constructor(name: string, scene?: Nullable<Scene>);
        /**
         * Boolean : true if the mesh has been disposed.
         */
        isDisposed(): boolean;
        /**
         * Returns the string "AbstractMesh"
         */
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        _rebuild(): void;
        _resyncLightSources(): void;
        _resyncLighSource(light: Light): void;
        _removeLightSource(light: Light): void;
        private _markSubMeshesAsDirty(func);
        _markSubMeshesAsLightDirty(): void;
        _markSubMeshesAsAttributesDirty(): void;
        _markSubMeshesAsMiscDirty(): void;
        /**
        * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
        * Default : (1.0, 1.0, 1.0)
        */
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
         */
        scaling: Vector3;
        /**
         * Disables the mesh edger rendering mode.
         * Returns the AbstractMesh.
         */
        disableEdgesRendering(): AbstractMesh;
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible.
         * Returns the AbstractMesh.
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): AbstractMesh;
        /**
         * Returns true if the mesh is blocked. Used by the class Mesh.
         * Returns the boolean `false` by default.
         */
        readonly isBlocked: boolean;
        /**
         * Returns the mesh itself by default, used by the class Mesh.
         * Returned type : AbstractMesh
         */
        getLOD(camera: Camera): AbstractMesh;
        /**
         * Returns 0 by default, used by the class Mesh.
         * Returns an integer.
         */
        getTotalVertices(): number;
        /**
         * Returns null by default, used by the class Mesh.
         * Returned type : integer array
         */
        getIndices(): Nullable<IndicesArray>;
        /**
         * Returns the array of the requested vertex data kind. Used by the class Mesh. Returns null here.
         * Returned type : float array or Float32Array
         */
        getVerticesData(kind: string): Nullable<FloatArray>;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): AbstractMesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices: Nullable<number>): AbstractMesh;
        /** Returns false by default, used by the class Mesh.
         *  Returns a boolean
        */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns the mesh BoundingInfo object or creates a new one and returns it if undefined.
         * Returns a BoundingInfo
         */
        getBoundingInfo(): BoundingInfo;
        /**
         * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units).
         * @param includeDescendants Take the hierarchy's bounding box instead of the mesh's bounding box.
         */
        normalizeToUnitCube(includeDescendants?: boolean): AbstractMesh;
        /**
         * Sets a mesh new object BoundingInfo.
         * Returns the AbstractMesh.
         */
        setBoundingInfo(boundingInfo: BoundingInfo): AbstractMesh;
        readonly useBones: boolean;
        _preActivate(): void;
        _preActivateForIntermediateRendering(renderId: number): void;
        _activate(renderId: number): void;
        /**
         * Returns the latest update of the World matrix
         * Returns a Matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         *
         * Returns the AbstractMesh.
         */
        movePOV(amountRight: number, amountUp: number, amountForward: number): AbstractMesh;
        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         *
         * Returns a new Vector3.
         */
        calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3;
        /**
         * Perform relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         *
         * Returns the AbstractMesh.
         */
        rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): AbstractMesh;
        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         *
         * Returns a new Vector3.
         */
        calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3;
        /**
         * Return the minimum and maximum world vectors of the entire hierarchy under current mesh
         * @param includeDescendants Include bounding info from descendants as well (true by default).
         */
        getHierarchyBoundingVectors(includeDescendants?: boolean): {
            min: Vector3;
            max: Vector3;
        };
        /**
         * Updates the mesh BoundingInfo object and all its children BoundingInfo objects also.
         * Returns the AbstractMesh.
         */
        _updateBoundingInfo(): AbstractMesh;
        /**
         * Update a mesh's children BoundingInfo objects only.
         * Returns the AbstractMesh.
         */
        _updateSubMeshesBoundingInfo(matrix: Matrix): AbstractMesh;
        protected _afterComputeWorldMatrix(): void;
        /**
         * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
         * A mesh is in the frustum if its bounding box intersects the frustum.
         * Boolean returned.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.
         * A mesh is completely in the frustum if its bounding box it completely inside the frustum.
         * Boolean returned.
         */
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * True if the mesh intersects another mesh or a SolidParticle object.
         * Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
         * includeDescendants can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
         * Returns a boolean.
         */
        intersectsMesh(mesh: AbstractMesh | SolidParticle, precise?: boolean, includeDescendants?: boolean): boolean;
        /**
         * Returns true if the passed point (Vector3) is inside the mesh bounding box.
         * Returns a boolean.
         */
        intersectsPoint(point: Vector3): boolean;
        getPhysicsImpostor(): Nullable<PhysicsImpostor>;
        getPositionInCameraSpace(camera?: Nullable<Camera>): Vector3;
        /**
         * Returns the distance from the mesh to the active camera.
         * Returns a float.
         */
        getDistanceToCamera(camera?: Nullable<Camera>): number;
        applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh;
        setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): AbstractMesh;
        /**
         * Property checkCollisions : Boolean, whether the camera should check the collisions against the mesh.
         * Default `false`.
         */
        checkCollisions: boolean;
        moveWithCollisions(displacement: Vector3): AbstractMesh;
        private _onCollisionPositionChange;
        /**
        * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
        * Please note that you must have a decent number of submeshes to get performance improvements when using an octree.
        * Returns an Octree of submeshes.
        */
        createOrUpdateSubmeshesOctree(maxCapacity?: number, maxDepth?: number): Octree<SubMesh>;
        _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): AbstractMesh;
        _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): AbstractMesh;
        _checkCollision(collider: Collider): AbstractMesh;
        _generatePointsArray(): boolean;
        /**
         * Checks if the passed Ray intersects with the mesh.
         * Returns an object PickingInfo.
         */
        intersects(ray: Ray, fastCheck?: boolean): PickingInfo;
        /**
         * Clones the mesh, used by the class Mesh.
         * Just returns `null` for an AbstractMesh.
         */
        clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<AbstractMesh>;
        /**
         * Disposes all the mesh submeshes.
         * Returns the AbstractMesh.
         */
        releaseSubMeshes(): AbstractMesh;
        /**
         * Disposes the AbstractMesh.
         * Some internal references are kept for further use.
         * By default, all the mesh children are also disposed unless the parameter `doNotRecurse` is set to `true`.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void;
        /**
         * Adds the passed mesh as a child to the current mesh.
         * Returns the AbstractMesh.
         */
        addChild(mesh: AbstractMesh): AbstractMesh;
        /**
         * Removes the passed mesh from the current mesh children list.
         * Returns the AbstractMesh.
         */
        removeChild(mesh: AbstractMesh): AbstractMesh;
        /**
         *  Initialize the facet data arrays : facetNormals, facetPositions and facetPartitioning.
         * Returns the AbstractMesh.
         */
        private _initFacetData();
        /**
         * Updates the mesh facetData arrays and the internal partitioning when the mesh is morphed or updated.
         * This method can be called within the render loop.
         * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation.
         * Returns the AbstractMesh.
         */
        updateFacetData(): AbstractMesh;
        /**
         * Returns the facetLocalNormals array.
         * The normals are expressed in the mesh local space.
         */
        getFacetLocalNormals(): Vector3[];
        /**
         * Returns the facetLocalPositions array.
         * The facet positions are expressed in the mesh local space.
         */
        getFacetLocalPositions(): Vector3[];
        /**
         * Returns the facetLocalPartioning array.
         */
        getFacetLocalPartitioning(): number[][];
        /**
         * Returns the i-th facet position in the world system.
         * This method allocates a new Vector3 per call.
         */
        getFacetPosition(i: number): Vector3;
        /**
         * Sets the reference Vector3 with the i-th facet position in the world system.
         * Returns the AbstractMesh.
         */
        getFacetPositionToRef(i: number, ref: Vector3): AbstractMesh;
        /**
         * Returns the i-th facet normal in the world system.
         * This method allocates a new Vector3 per call.
         */
        getFacetNormal(i: number): Vector3;
        /**
         * Sets the reference Vector3 with the i-th facet normal in the world system.
         * Returns the AbstractMesh.
         */
        getFacetNormalToRef(i: number, ref: Vector3): this;
        /**
         * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system).
         */
        getFacetsAtLocalCoordinates(x: number, y: number, z: number): Nullable<number[]>;
        /**
         * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found.
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) World projection on the facet.
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position.
         */
        getClosestFacetAtCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace?: boolean, facing?: boolean): Nullable<number>;
        /**
         * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found.
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) local projection on the facet.
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs"  to (x, y, z) are returned : negative dot (x, y, z) * facet position.
         */
        getClosestFacetAtLocalCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace?: boolean, facing?: boolean): Nullable<number>;
        /**
         * Returns the object "parameter" set with all the expected parameters for facetData computation by ComputeNormals()
         */
        getFacetDataParameters(): any;
        /**
         * Disables the feature FacetData and frees the related memory.
         * Returns the AbstractMesh.
         */
        disableFacetData(): AbstractMesh;
        /**
         * Updates the AbstractMesh indices array. Actually, used by the Mesh object.
         * Returns the mesh.
         */
        updateIndices(indices: IndicesArray): AbstractMesh;
        /**
         * The mesh Geometry. Actually used by the Mesh object.
         * Returns a blank geometry object.
         */
        /**
         * Creates new normals data for the mesh.
         * @param updatable.
         */
        createNormals(updatable: boolean): void;
        protected checkOcclusionQuery(): void;
    }
}

declare module BABYLON {
    class Buffer {
        private _engine;
        private _buffer;
        private _data;
        private _updatable;
        private _strideSize;
        private _instanced;
        private _instanceDivisor;
        constructor(engine: any, data: FloatArray, updatable: boolean, stride: number, postponeInternalCreation?: boolean, instanced?: boolean);
        createVertexBuffer(kind: string, offset: number, size: number, stride?: number): VertexBuffer;
        isUpdatable(): boolean;
        getData(): Nullable<FloatArray>;
        getBuffer(): Nullable<WebGLBuffer>;
        getStrideSize(): number;
        getIsInstanced(): boolean;
        instanceDivisor: number;
        create(data?: Nullable<FloatArray>): void;
        _rebuild(): void;
        update(data: FloatArray): void;
        updateDirectly(data: Float32Array, offset: number, vertexCount?: number): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class CSG {
        private polygons;
        matrix: Matrix;
        position: Vector3;
        rotation: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        static FromMesh(mesh: Mesh): CSG;
        private static FromPolygons(polygons);
        clone(): CSG;
        union(csg: CSG): CSG;
        unionInPlace(csg: CSG): void;
        subtract(csg: CSG): CSG;
        subtractInPlace(csg: CSG): void;
        intersect(csg: CSG): CSG;
        intersectInPlace(csg: CSG): void;
        inverse(): CSG;
        inverseInPlace(): void;
        copyTransformAttributes(csg: CSG): CSG;
        buildMeshGeometry(name: string, scene: Scene, keepSubMeshes: boolean): Mesh;
        toMesh(name: string, material: Material, scene: Scene, keepSubMeshes: boolean): Mesh;
    }
}

declare module BABYLON {
    class Geometry implements IGetSetVerticesData {
        id: string;
        delayLoadState: number;
        delayLoadingFile: Nullable<string>;
        onGeometryUpdated: (geometry: Geometry, kind?: string) => void;
        private _scene;
        private _engine;
        private _meshes;
        private _totalVertices;
        private _indices;
        private _vertexBuffers;
        private _isDisposed;
        private _extend;
        private _boundingBias;
        _delayInfo: Array<string>;
        private _indexBuffer;
        private _indexBufferIsUpdatable;
        _boundingInfo: Nullable<BoundingInfo>;
        _delayLoadingFunction: Nullable<(any: any, geometry: Geometry) => void>;
        _softwareSkinningRenderId: number;
        private _vertexArrayObjects;
        private _updatable;
        _positions: Nullable<Vector3[]>;
        /**
         *  The Bias Vector to apply on the bounding elements (box/sphere), the max extend is computed as v += v * bias.x + bias.y, the min is computed as v -= v * bias.x + bias.y
         * @returns The Bias Vector
         */
        boundingBias: Vector2;
        static CreateGeometryForMesh(mesh: Mesh): Geometry;
        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Nullable<Mesh>);
        readonly extend: {
            minimum: Vector3;
            maximum: Vector3;
        };
        getScene(): Scene;
        getEngine(): Engine;
        isReady(): boolean;
        readonly doNotSerialize: boolean;
        _rebuild(): void;
        setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): void;
        removeVerticesData(kind: string): void;
        setVerticesBuffer(buffer: VertexBuffer): void;
        updateVerticesDataDirectly(kind: string, data: Float32Array, offset: number): void;
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean): void;
        private updateBoundingInfo(updateExtends, data);
        _bind(effect: Nullable<Effect>, indexToBind?: Nullable<WebGLBuffer>): void;
        getTotalVertices(): number;
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        /**
         * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVertexBufferUpdatable(kind: string): boolean;
        getVertexBuffer(kind: string): Nullable<VertexBuffer>;
        getVertexBuffers(): Nullable<{
            [key: string]: VertexBuffer;
        }>;
        isVerticesDataPresent(kind: string): boolean;
        getVerticesDataKinds(): string[];
        updateIndices(indices: IndicesArray, offset?: number): void;
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>, updatable?: boolean): void;
        getTotalIndices(): number;
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        getIndexBuffer(): Nullable<WebGLBuffer>;
        _releaseVertexArrayObject(effect?: Nullable<Effect>): void;
        releaseForMesh(mesh: Mesh, shouldDispose?: boolean): void;
        applyToMesh(mesh: Mesh): void;
        private updateExtend(data?, stride?);
        private _applyToMesh(mesh);
        private notifyUpdate(kind?);
        load(scene: Scene, onLoaded?: () => void): void;
        private _queueLoad(scene, onLoaded?);
        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         */
        toLeftHanded(): void;
        _resetPointsArrayCache(): void;
        _generatePointsArray(): boolean;
        isDisposed(): boolean;
        private _disposeVertexArrayObjects();
        dispose(): void;
        copy(id: string): Geometry;
        serialize(): any;
        private toNumberArray(origin);
        serializeVerticeData(): any;
        static ExtractFromMesh(mesh: Mesh, id: string): Nullable<Geometry>;
        /**
         * You should now use Tools.RandomId(), this method is still here for legacy reasons.
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        static RandomId(): string;
        static ImportGeometry(parsedGeometry: any, mesh: Mesh): void;
        private static _CleanMatricesWeights(parsedGeometry, mesh);
        static Parse(parsedVertexData: any, scene: Scene, rootUrl: string): Nullable<Geometry>;
    }
    module Geometry.Primitives {
        class _Primitive extends Geometry {
            private _canBeRegenerated;
            private _beingRegenerated;
            constructor(id: string, scene: Scene, _canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
            canBeRegenerated(): boolean;
            regenerate(): void;
            asNewGeometry(id: string): Geometry;
            setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
            setVerticesData(kind: string, data: FloatArray, updatable?: boolean): void;
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
        }
        class Ribbon extends _Primitive {
            pathArray: Vector3[][];
            closeArray: boolean;
            closePath: boolean;
            offset: number;
            side: number;
            constructor(id: string, scene: Scene, pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, canBeRegenerated?: boolean, mesh?: Mesh, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
        }
        class Box extends _Primitive {
            size: number;
            side: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedBox: any, scene: Scene): Nullable<Box>;
        }
        class Sphere extends _Primitive {
            segments: number;
            diameter: number;
            side: number;
            constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedSphere: any, scene: Scene): Nullable<Geometry.Primitives.Sphere>;
        }
        class Disc extends _Primitive {
            radius: number;
            tessellation: number;
            side: number;
            constructor(id: string, scene: Scene, radius: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
        }
        class Cylinder extends _Primitive {
            height: number;
            diameterTop: number;
            diameterBottom: number;
            tessellation: number;
            subdivisions: number;
            side: number;
            constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedCylinder: any, scene: Scene): Nullable<Geometry.Primitives.Cylinder>;
        }
        class Torus extends _Primitive {
            diameter: number;
            thickness: number;
            tessellation: number;
            side: number;
            constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedTorus: any, scene: Scene): Nullable<Geometry.Primitives.Torus>;
        }
        class Ground extends _Primitive {
            width: number;
            height: number;
            subdivisions: number;
            constructor(id: string, scene: Scene, width: number, height: number, subdivisions: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedGround: any, scene: Scene): Nullable<Geometry.Primitives.Ground>;
        }
        class TiledGround extends _Primitive {
            xmin: number;
            zmin: number;
            xmax: number;
            zmax: number;
            subdivisions: {
                w: number;
                h: number;
            };
            precision: {
                w: number;
                h: number;
            };
            constructor(id: string, scene: Scene, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
                w: number;
                h: number;
            }, precision: {
                w: number;
                h: number;
            }, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
        }
        class Plane extends _Primitive {
            size: number;
            side: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedPlane: any, scene: Scene): Nullable<Geometry.Primitives.Plane>;
        }
        class TorusKnot extends _Primitive {
            radius: number;
            tube: number;
            radialSegments: number;
            tubularSegments: number;
            p: number;
            q: number;
            side: number;
            constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
            _regenerateVertexData(): VertexData;
            copy(id: string): Geometry;
            serialize(): any;
            static Parse(parsedTorusKnot: any, scene: Scene): Nullable<Geometry.Primitives.TorusKnot>;
        }
    }
}

declare module BABYLON {
    class GroundMesh extends Mesh {
        generateOctree: boolean;
        private _heightQuads;
        _subdivisionsX: number;
        _subdivisionsY: number;
        _width: number;
        _height: number;
        _minX: number;
        _maxX: number;
        _minZ: number;
        _maxZ: number;
        constructor(name: string, scene: Scene);
        getClassName(): string;
        readonly subdivisions: number;
        readonly subdivisionsX: number;
        readonly subdivisionsY: number;
        optimize(chunksCount: number, octreeBlocksSize?: number): void;
        /**
         * Returns a height (y) value in the Worl system :
         * the ground altitude at the coordinates (x, z) expressed in the World system.
         * Returns the ground y position if (x, z) are outside the ground surface.
         */
        getHeightAtCoordinates(x: number, z: number): number;
        /**
         * Returns a normalized vector (Vector3) orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Returns Vector3(0.0, 1.0, 0.0) if (x, z) are outside the ground surface.
         */
        getNormalAtCoordinates(x: number, z: number): Vector3;
        /**
         * Updates the Vector3 passed a reference with a normalized vector orthogonal to the ground
         * at the ground coordinates (x, z) expressed in the World system.
         * Doesn't uptade the reference Vector3 if (x, z) are outside the ground surface.
         * Returns the GroundMesh.
         */
        getNormalAtCoordinatesToRef(x: number, z: number, ref: Vector3): GroundMesh;
        /**
        * Force the heights to be recomputed for getHeightAtCoordinates() or getNormalAtCoordinates()
        * if the ground has been updated.
        * This can be used in the render loop.
        * Returns the GroundMesh.
        */
        updateCoordinateHeights(): GroundMesh;
        private _getFacetAt(x, z);
        private _initHeightQuads();
        private _computeHeightQuads();
        serialize(serializationObject: any): void;
        static Parse(parsedMesh: any, scene: Scene): GroundMesh;
    }
}

declare module BABYLON {
    /**
     * Creates an instance based on a source mesh.
     */
    class InstancedMesh extends AbstractMesh {
        private _sourceMesh;
        private _currentLOD;
        constructor(name: string, source: Mesh);
        /**
         * Returns the string "InstancedMesh".
         */
        getClassName(): string;
        readonly receiveShadows: boolean;
        readonly material: Nullable<Material>;
        readonly visibility: number;
        readonly skeleton: Nullable<Skeleton>;
        readonly renderingGroupId: number;
        /**
         * Returns the total number of vertices (integer).
         */
        getTotalVertices(): number;
        readonly sourceMesh: Mesh;
        /**
         * Returns a float array or a Float32Array of the requested kind of data : positons, normals, uvs, etc.
         */
        getVerticesData(kind: string, copyWhenShared?: boolean): Nullable<FloatArray>;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>): Mesh;
        /**
         * Boolean : True if the mesh owns the requested kind of data.
         */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns an array of indices (IndicesArray).
         */
        getIndices(): Nullable<IndicesArray>;
        readonly _positions: Nullable<Vector3[]>;
        /**
         * Sets a new updated BoundingInfo to the mesh.
         * Returns the mesh.
         */
        refreshBoundingInfo(): InstancedMesh;
        _preActivate(): InstancedMesh;
        _activate(renderId: number): InstancedMesh;
        /**
         * Returns the current associated LOD AbstractMesh.
         */
        getLOD(camera: Camera): AbstractMesh;
        _syncSubMeshes(): InstancedMesh;
        _generatePointsArray(): boolean;
        /**
         * Creates a new InstancedMesh from the current mesh.
         * - name (string) : the cloned mesh name
         * - newParent (optional Node) : the optional Node to parent the clone to.
         * - doNotCloneChildren (optional boolean, default `false`) : if `true` the model children aren't cloned.
         *
         * Returns the clone.
         */
        clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh;
        /**
         * Disposes the InstancedMesh.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean): void;
    }
}

declare module BABYLON {
    class LinesMesh extends Mesh {
        useVertexColor: boolean | undefined;
        useVertexAlpha: boolean | undefined;
        color: Color3;
        alpha: number;
        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         * Default value is 0.1
         * @returns the intersection Threshold value.
         */
        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         * @param value the new threshold to apply
         */
        intersectionThreshold: number;
        private _intersectionThreshold;
        private _colorShader;
        constructor(name: string, scene?: Nullable<Scene>, parent?: Nullable<Node>, source?: LinesMesh, doNotCloneChildren?: boolean, useVertexColor?: boolean | undefined, useVertexAlpha?: boolean | undefined);
        /**
         * Returns the string "LineMesh"
         */
        getClassName(): string;
        material: Material;
        readonly checkCollisions: boolean;
        createInstance(name: string): InstancedMesh;
        _bind(subMesh: SubMesh, effect: Effect, fillMode: number): LinesMesh;
        _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): LinesMesh;
        dispose(doNotRecurse?: boolean): void;
        /**
         * Returns a new LineMesh object cloned from the current one.
         */
        clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): LinesMesh;
    }
}

declare module BABYLON {
    class _InstancesBatch {
        mustReturn: boolean;
        visibleInstances: Nullable<InstancedMesh[]>[];
        renderSelf: boolean[];
    }
    class Mesh extends AbstractMesh implements IGetSetVerticesData {
        static _FRONTSIDE: number;
        static _BACKSIDE: number;
        static _DOUBLESIDE: number;
        static _DEFAULTSIDE: number;
        static _NO_CAP: number;
        static _CAP_START: number;
        static _CAP_END: number;
        static _CAP_ALL: number;
        /**
         * Mesh side orientation : usually the external or front surface
         */
        static readonly FRONTSIDE: number;
        /**
         * Mesh side orientation : usually the internal or back surface
         */
        static readonly BACKSIDE: number;
        /**
         * Mesh side orientation : both internal and external or front and back surfaces
         */
        static readonly DOUBLESIDE: number;
        /**
         * Mesh side orientation : by default, `FRONTSIDE`
         */
        static readonly DEFAULTSIDE: number;
        /**
         * Mesh cap setting : no cap
         */
        static readonly NO_CAP: number;
        /**
         * Mesh cap setting : one cap at the beginning of the mesh
         */
        static readonly CAP_START: number;
        /**
         * Mesh cap setting : one cap at the end of the mesh
         */
        static readonly CAP_END: number;
        /**
         * Mesh cap setting : two caps, one at the beginning  and one at the end of the mesh
         */
        static readonly CAP_ALL: number;
        /**
         * An event triggered before rendering the mesh
         * @type {BABYLON.Observable}
         */
        onBeforeRenderObservable: Observable<Mesh>;
        /**
        * An event triggered after rendering the mesh
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Mesh>;
        /**
        * An event triggered before drawing the mesh
        * @type {BABYLON.Observable}
        */
        onBeforeDrawObservable: Observable<Mesh>;
        private _onBeforeDrawObserver;
        onBeforeDraw: () => void;
        delayLoadState: number;
        instances: InstancedMesh[];
        delayLoadingFile: string;
        _binaryInfo: any;
        private _LODLevels;
        onLODLevelSelection: (distance: number, mesh: Mesh, selectedLevel: Mesh) => void;
        private _morphTargetManager;
        morphTargetManager: Nullable<MorphTargetManager>;
        _geometry: Nullable<Geometry>;
        _delayInfo: Array<string>;
        _delayLoadingFunction: (any: any, mesh: Mesh) => void;
        _visibleInstances: any;
        private _renderIdForInstances;
        private _batchCache;
        private _instancesBufferSize;
        private _instancesBuffer;
        private _instancesData;
        private _overridenInstanceCount;
        private _effectiveMaterial;
        _shouldGenerateFlatShading: boolean;
        private _preActivateId;
        _originalBuilderSideOrientation: number;
        overrideMaterialSideOrientation: Nullable<number>;
        private _areNormalsFrozen;
        private _sourcePositions;
        private _sourceNormals;
        private _source;
        readonly source: Nullable<Mesh>;
        /**
         * @constructor
         * @param {string} name The value used by scene.getMeshByName() to do a lookup.
         * @param {Scene} scene The scene to add this mesh to.
         * @param {Node} parent The parent of this mesh, if it has one
         * @param {Mesh} source An optional Mesh from which geometry is shared, cloned.
         * @param {boolean} doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
         *                  When false, achieved by calling a clone(), also passing False.
         *                  This will make creation of children, recursive.
         * @param {boolean} clonePhysicsImpostor When cloning, include cloning mesh physics impostor, default True.
         */
        constructor(name: string, scene?: Nullable<Scene>, parent?: Nullable<Node>, source?: Nullable<Mesh>, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean);
        /**
         * Returns the string "Mesh".
         */
        getClassName(): string;
        /**
         * Returns a string.
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * True if the mesh has some Levels Of Details (LOD).
         * Returns a boolean.
         */
        readonly hasLODLevels: boolean;
        private _sortLODLevels();
        /**
         * Add a mesh as LOD level triggered at the given distance.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {number} distance The distance from the center of the object to show this level
         * @param {Mesh} mesh The mesh to be added as LOD level
         * @return {Mesh} This mesh (for chaining)
         */
        addLODLevel(distance: number, mesh: Mesh): Mesh;
        /**
         * Returns the LOD level mesh at the passed distance or null if not found.
         * It is related to the method `addLODLevel(distance, mesh)`.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * Returns an object Mesh or `null`.
         */
        getLODLevelAtDistance(distance: number): Nullable<Mesh>;
        /**
         * Remove a mesh from the LOD array
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {Mesh} mesh The mesh to be removed.
         * @return {Mesh} This mesh (for chaining)
         */
        removeLODLevel(mesh: Mesh): Mesh;
        /**
         * Returns the registered LOD mesh distant from the parameter `camera` position if any, else returns the current mesh.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         */
        getLOD(camera: Camera, boundingSphere?: BoundingSphere): AbstractMesh;
        /**
         * Returns the mesh internal Geometry object.
         */
        readonly geometry: Nullable<Geometry>;
        /**
         * Returns a positive integer : the total number of vertices within the mesh geometry or zero if the mesh has no geometry.
         */
        getTotalVertices(): number;
        /**
         * Returns an array of integers or floats, or a Float32Array, depending on the requested `kind` (positions, indices, normals, etc).
         * If `copywhenShared` is true (default false) and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * You can force the copy with forceCopy === true
         * Returns null if the mesh has no geometry or no vertex buffer.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        /**
         * Returns the mesh VertexBuffer object from the requested `kind` : positions, indices, normals, etc.
         * Returns `null` if the mesh has no geometry.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVertexBuffer(kind: string): Nullable<VertexBuffer>;
        /**
         * Returns a boolean depending on the existence of the Vertex Data for the requested `kind`.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVertexBufferUpdatable(kind: string): boolean;
        /**
         * Returns a string : the list of existing `kinds` of Vertex Data for this mesh.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVerticesDataKinds(): string[];
        /**
         * Returns a positive integer : the total number of indices in this mesh geometry.
         * Returns zero if the mesh has no geometry.
         */
        getTotalIndices(): number;
        /**
         * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
         * If the parameter `copyWhenShared` is true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * Returns an empty array if the mesh has no geometry.
         */
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        readonly isBlocked: boolean;
        /**
         * Boolean : true once the mesh is ready after all the delayed process (loading, etc) are complete.
         */
        isReady(): boolean;
        /**
         * Boolean : true if the normals aren't to be recomputed on next mesh `positions` array update.
         * This property is pertinent only for updatable parametric shapes.
         */
        readonly areNormalsFrozen: boolean;
        /**
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc.
         * It has no effect at all on other shapes.
         * It prevents the mesh normals from being recomputed on next `positions` array update.
         * Returns the Mesh.
         */
        freezeNormals(): Mesh;
        /**
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc.
         * It has no effect at all on other shapes.
         * It reactivates the mesh normals computation if it was previously frozen.
         * Returns the Mesh.
         */
        unfreezeNormals(): Mesh;
        /**
         * Overrides instance count. Only applicable when custom instanced InterleavedVertexBuffer are used rather than InstancedMeshs
         */
        overridenInstanceCount: number;
        _preActivate(): Mesh;
        _preActivateForIntermediateRendering(renderId: number): Mesh;
        _registerInstanceForRenderId(instance: InstancedMesh, renderId: number): Mesh;
        /**
         * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
         * This means the mesh underlying bounding box and sphere are recomputed.
         * Returns the Mesh.
         */
        refreshBoundingInfo(): Mesh;
        _createGlobalSubMesh(force: boolean): Nullable<SubMesh>;
        subdivide(count: number): void;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh;
        markVerticesDataAsUpdatable(kind: string, updatable?: boolean): void;
        /**
         * Sets the mesh VertexBuffer.
         * Returns the Mesh.
         */
        setVerticesBuffer(buffer: VertexBuffer): Mesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh;
        /**
         * This method updates the vertex positions of an updatable mesh according to the `positionFunction` returned values.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#other-shapes-updatemeshpositions
         * The parameter `positionFunction` is a simple JS function what is passed the mesh `positions` array. It doesn't need to return anything.
         * The parameter `computeNormals` is a boolean (default true) to enable/disable the mesh normal recomputation after the vertex position update.
         * Returns the Mesh.
         */
        updateMeshPositions(positionFunction: (data: FloatArray) => void, computeNormals?: boolean): Mesh;
        /**
         * Creates a un-shared specific occurence of the geometry for the mesh.
         * Returns the Mesh.
         */
        makeGeometryUnique(): Mesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * Type is Uint16Array by default unless the mesh has more than 65536 vertices.
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>, updatable?: boolean): Mesh;
        /**
         * Update the current index buffer
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array)
         * Returns the Mesh.
         */
        updateIndices(indices: IndicesArray, offset?: number): Mesh;
        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         * Returns the Mesh.
         */
        toLeftHanded(): Mesh;
        _bind(subMesh: SubMesh, effect: Effect, fillMode: number): Mesh;
        _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number, alternate?: boolean): Mesh;
        /**
         * Registers for this mesh a javascript function called just before the rendering process.
         * This function is passed the current mesh.
         * Return the Mesh.
         */
        registerBeforeRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Disposes a previously registered javascript function called before the rendering.
         * This function is passed the current mesh.
         * Returns the Mesh.
         */
        unregisterBeforeRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Registers for this mesh a javascript function called just after the rendering is complete.
         * This function is passed the current mesh.
         * Returns the Mesh.
         */
        registerAfterRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Disposes a previously registered javascript function called after the rendering.
         * This function is passed the current mesh.
         * Return the Mesh.
         */
        unregisterAfterRender(func: (mesh: AbstractMesh) => void): Mesh;
        _getInstancesRenderList(subMeshId: number): _InstancesBatch;
        _renderWithInstances(subMesh: SubMesh, fillMode: number, batch: _InstancesBatch, effect: Effect, engine: Engine): Mesh;
        _processRendering(subMesh: SubMesh, effect: Effect, fillMode: number, batch: _InstancesBatch, hardwareInstancedRendering: boolean, onBeforeDraw: (isInstance: boolean, world: Matrix, effectiveMaterial?: Material) => void, effectiveMaterial?: Material): Mesh;
        /**
         * Triggers the draw call for the mesh.
         * Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager.
         * Returns the Mesh.
         */
        render(subMesh: SubMesh, enableAlphaMode: boolean): Mesh;
        private _onBeforeDraw(isInstance, world, effectiveMaterial);
        /**
         * Returns an array populated with ParticleSystem objects whose the mesh is the emitter.
         */
        getEmittedParticleSystems(): IParticleSystem[];
        /**
         * Returns an array populated with ParticleSystem objects whose the mesh or its children are the emitter.
         */
        getHierarchyEmittedParticleSystems(): IParticleSystem[];
        _checkDelayState(): Mesh;
        private _queueLoad(mesh, scene);
        /**
         * Boolean, true is the mesh in the frustum defined by the Plane objects from the `frustumPlanes` array parameter.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Sets the mesh material by the material or multiMaterial `id` property.
         * The material `id` is a string identifying the material or the multiMaterial.
         * This method returns the Mesh.
         */
        setMaterialByID(id: string): Mesh;
        /**
         * Returns as a new array populated with the mesh material and/or skeleton, if any.
         */
        getAnimatables(): IAnimatable[];
        /**
         * Modifies the mesh geometry according to the passed transformation matrix.
         * This method returns nothing but it really modifies the mesh even if it's originally not set as updatable.
         * The mesh normals are modified accordingly the same transformation.
         * tuto : http://doc.babylonjs.com/tutorials/How_Rotations_and_Translations_Work#baking-transform
         * Note that, under the hood, this method sets a new VertexBuffer each call.
         * Returns the Mesh.
         */
        bakeTransformIntoVertices(transform: Matrix): Mesh;
        /**
         * Modifies the mesh geometry according to its own current World Matrix.
         * The mesh World Matrix is then reset.
         * This method returns nothing but really modifies the mesh even if it's originally not set as updatable.
         * tuto : tuto : http://doc.babylonjs.com/tutorials/How_Rotations_and_Translations_Work#baking-transform
         * Note that, under the hood, this method sets a new VertexBuffer each call.
         * Returns the Mesh.
         */
        bakeCurrentTransformIntoVertices(): Mesh;
        readonly _positions: Nullable<Vector3[]>;
        _resetPointsArrayCache(): Mesh;
        _generatePointsArray(): boolean;
        /**
         * Returns a new Mesh object generated from the current mesh properties.
         * This method must not get confused with createInstance().
         * The parameter `name` is a string, the name given to the new mesh.
         * The optional parameter `newParent` can be any Node object (default `null`).
         * The optional parameter `doNotCloneChildren` (default `false`) allows/denies the recursive cloning of the original mesh children if any.
         * The parameter `clonePhysicsImpostor` (default `true`)  allows/denies the cloning in the same time of the original mesh `body` used by the physics engine, if any.
         */
        clone(name: string, newParent?: Node, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean): Mesh;
        /**
         * Disposes the mesh.
         * This also frees the memory allocated under the hood to all the buffers used by WebGL.
         */
        dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void;
        /**
         * Modifies the mesh geometry according to a displacement map.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.
         * The parameter `url` is a string, the URL from the image file is to be downloaded.
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `onSuccess` is an optional Javascript function to be called just after the mesh is modified. It is passed the modified mesh and must return nothing.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.
         *
         * Returns the Mesh.
         */
        applyDisplacementMap(url: string, minHeight: number, maxHeight: number, onSuccess?: (mesh: Mesh) => void, uvOffset?: Vector2, uvScale?: Vector2): Mesh;
        /**
         * Modifies the mesh geometry according to a displacementMap buffer.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.
         * The parameter `buffer` is a `Uint8Array` buffer containing series of `Uint8` lower than 255, the red, green, blue and alpha values of each successive pixel.
         * The parameters `heightMapWidth` and `heightMapHeight` are positive integers to set the width and height of the buffer image.
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.
         *
         * Returns the Mesh.
         */
        applyDisplacementMapFromBuffer(buffer: Uint8Array, heightMapWidth: number, heightMapHeight: number, minHeight: number, maxHeight: number, uvOffset?: Vector2, uvScale?: Vector2): Mesh;
        /**
         * Modify the mesh to get a flat shading rendering.
         * This means each mesh facet will then have its own normals. Usually new vertices are added in the mesh geometry to get this result.
         * This method returns the Mesh.
         * Warning : the mesh is really modified even if not set originally as updatable and, under the hood, a new VertexBuffer is allocated.
         */
        convertToFlatShadedMesh(): Mesh;
        /**
         * This method removes all the mesh indices and add new vertices (duplication) in order to unfold facets into buffers.
         * In other words, more vertices, no more indices and a single bigger VBO.
         * The mesh is really modified even if not set originally as updatable. Under the hood, a new VertexBuffer is allocated.
         * Returns the Mesh.
         */
        convertToUnIndexedMesh(): Mesh;
        /**
         * Inverses facet orientations and inverts also the normals with `flipNormals` (default `false`) if true.
         * This method returns the Mesh.
         * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
         */
        flipFaces(flipNormals?: boolean): Mesh;
        /**
         * Creates a new InstancedMesh object from the mesh model.
         * An instance shares the same properties and the same material than its model.
         * Only these properties of each instance can then be set individually :
         * - position
         * - rotation
         * - rotationQuaternion
         * - setPivotMatrix
         * - scaling
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_Instances
         * Warning : this method is not supported for Line mesh and LineSystem
         */
        createInstance(name: string): InstancedMesh;
        /**
         * Synchronises all the mesh instance submeshes to the current mesh submeshes, if any.
         * After this call, all the mesh instances have the same submeshes than the current mesh.
         * This method returns the Mesh.
         */
        synchronizeInstances(): Mesh;
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async. It returns the Mesh.
         * @param settings a collection of simplification settings.
         * @param parallelProcessing should all levels calculate parallel or one after the other.
         * @param type the type of simplification to run.
         * @param successCallback optional success callback to be called after the simplification finished processing all settings.
         */
        simplify(settings: Array<ISimplificationSettings>, parallelProcessing?: boolean, simplificationType?: SimplificationType, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void): Mesh;
        /**
         * Optimization of the mesh's indices, in case a mesh has duplicated vertices.
         * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.
         * This should be used together with the simplification to avoid disappearing triangles.
         * Returns the Mesh.
         * @param successCallback an optional success callback to be called after the optimization finished.
         */
        optimizeIndices(successCallback?: (mesh?: Mesh) => void): Mesh;
        serialize(serializationObject: any): void;
        _syncGeometryWithMorphTargetManager(): void;
        /**
         * Returns a new Mesh object parsed from the source provided.
         * The parameter `parsedMesh` is the source.
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        static Parse(parsedMesh: any, scene: Scene, rootUrl: string): Mesh;
        /**
         * Creates a ribbon mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The ribbon is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         *
         * Please read this full tutorial to understand how to design a ribbon : http://doc.babylonjs.com/tutorials/Ribbon_Tutorial
         * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.
         * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array.
         * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array.
         * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path.
         * It's the offset to join together the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11.
         * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#ribbon
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateRibbon(name: string, pathArray: Vector3[][], closeArray: boolean | undefined, closePath: boolean, offset: number, scene?: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates a plane polygonal mesh.  By default, this is a disc.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the radius size (float) of the polygon (default 0.5).
         * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDisc(name: string, radius: number, tessellation: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a box mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `size` sets the size (float) of each box side (default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateBox(name: string, size: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a sphere mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `diameter` sets the diameter size (float) of the sphere (default 1).
         * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateSphere(name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a cylinder or a cone mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).
         * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).
         * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.
         * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
         * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene?: Scene, updatable?: any, sideOrientation?: number): Mesh;
        /**
         * Creates a torus mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `diameter` sets the diameter size (float) of the torus (default 1).
         * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5).
         * The parameter `tessellation` sets the number of torus sides (postive integer, default 16).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a torus knot mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the global radius size (float) of the torus knot (default 2).
         * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32).
         * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32).
         * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a line mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLines(name: string, points: Vector3[], scene?: Nullable<Scene>, updatable?: boolean, instance?: Nullable<LinesMesh>): LinesMesh;
        /**
         * Creates a dashed line mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200).
         * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3).
         * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1).
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDashedLines(name: string, points: Vector3[], dashSize: number, gapSize: number, dashNb: number, scene?: Nullable<Scene>, updatable?: boolean, instance?: LinesMesh): LinesMesh;
        /**
         * Creates a polygon mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
         * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
         * You can set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         * Remember you can only change the shape positions, not their number when updating a polygon.
         */
        static CreatePolygon(name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh;
        /**
          * Creates an extruded polygon mesh, with depth in the Y direction.
          * Please consider using the same method from the MeshBuilder class instead.
         */
        static ExtrudePolygon(name: string, shape: Vector3[], depth: number, scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates an extruded shape mesh.
         * The extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         *
         * Please read this full tutorial to understand how to design an extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
         * The parameter `scale` (float, default 1) is the value to scale the shape.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShape(name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, cap: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates an custom extruded shape mesh.
         * The custom extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         *
         * Please read this full tutorial to understand how to design a custom extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var rotationFunction = function(i, distance) {
         *     // do things
         *     return rotationValue; }
         * ```
         * It must returns a float value that will be the rotation in radians applied to the shape on each path point.
         * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var scaleFunction = function(i, distance) {
         *     // do things
         *    return scaleValue;}
         * ```
         * It must returns a float value that will be the scale value applied to the shape on each path point.
         * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`.
         * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShapeCustom(name: string, shape: Vector3[], path: Vector3[], scaleFunction: Function, rotationFunction: Function, ribbonCloseArray: boolean, ribbonClosePath: boolean, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates lathe mesh.
         * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be
         * rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero.
         * The parameter `radius` (positive float, default 1) is the radius value of the lathe.
         * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLathe(name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a plane mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `size` sets the size (float) of both sides of the plane at once (default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a ground mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground.
         * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGround(name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean): Mesh;
        /**
         * Creates a tiled ground mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates.
         * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates.
         * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height. Each subdivision is called a tile.
         * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height of each tile.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTiledGround(name: string, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
            w: number;
            h: number;
        }, precision: {
            w: number;
            h: number;
        }, scene: Scene, updatable?: boolean): Mesh;
        /**
         * Creates a ground mesh from a height map.
         * tuto : http://doc.babylonjs.com/tutorials/14._Height_Map
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `url` sets the URL of the height map image resource.
         * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.
         * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.
         * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.
         * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.
         * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).
         * This function is passed the newly built mesh :
         * ```javascript
         * function(mesh) { // do things
         *     return; }
         * ```
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean, onReady?: (mesh: GroundMesh) => void): GroundMesh;
        /**
         * Creates a tube mesh.
         * The tube is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube.
         * The parameter `radius` (positive float, default 1) sets the tube radius size.
         * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface.
         * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`.
         * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path.
         * It must return a radius value (positive float) :
         * ```javascript
         * var radiusFunction = function(i, distance) {
         *     // do things
         *     return radius; }
         * ```
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#tube
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTube(name: string, path: Vector3[], radius: number, tessellation: number, radiusFunction: {
            (i: number, distance: number): number;
        }, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates a polyhedron mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial
         *  to choose the wanted type.
         * The parameter `size` (positive float, default 1) sets the polygon size.
         * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value).
         * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`.
         * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
         * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`).
         * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors
         * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePolyhedron(name: string, options: {
            type?: number;
            size?: number;
            sizeX?: number;
            sizeY?: number;
            sizeZ?: number;
            custom?: any;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            updatable?: boolean;
            sideOrientation?: number;
        }, scene: Scene): Mesh;
        /**
         * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the radius size (float) of the icosphere (default 1).
         * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`).
         * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size.
         * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateIcoSphere(name: string, options: {
            radius?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            updatable?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a decal mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal.
         * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates.
         * The parameter `normal` (Vector3, default Vector3.Up) sets the normal of the mesh where the decal is applied onto in World coordinates.
         * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling.
         * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal.
         */
        static CreateDecal(name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number): Mesh;
        /**
         * @returns original positions used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        setPositionsForCPUSkinning(): Float32Array;
        /**
         * @returns original normals used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        setNormalsForCPUSkinning(): Float32Array;
        /**
         * Updates the vertex buffer by applying transformation from the bones.
         * Returns the Mesh.
         *
         * @param {skeleton} skeleton to apply
         */
        applySkeleton(skeleton: Skeleton): Mesh;
        /**
         * Returns an object `{min:` Vector3`, max:` Vector3`}`
         * This min and max Vector3 are the minimum and maximum vectors of each mesh bounding box from the passed array, in the World system
         */
        static MinMax(meshes: AbstractMesh[]): {
            min: Vector3;
            max: Vector3;
        };
        /**
         * Returns a Vector3, the center of the `{min:` Vector3`, max:` Vector3`}` or the center of MinMax vector3 computed from a mesh array.
         */
        static Center(meshesOrMinMaxVector: {
            min: Vector3;
            max: Vector3;
        } | AbstractMesh[]): Vector3;
        /**
         * Merge the array of meshes into a single mesh for performance reasons.
         * @param {Array<Mesh>} meshes - The vertices source.  They should all be of the same material.  Entries can empty
         * @param {boolean} disposeSource - When true (default), dispose of the vertices from the source meshes
         * @param {boolean} allow32BitsIndices - When the sum of the vertices > 64k, this must be set to true.
         * @param {Mesh} meshSubclass - When set, vertices inserted into this Mesh.  Meshes can then be merged into a Mesh sub-class.
         * @param {boolean} subdivideWithSubMeshes - When true (false default), subdivide mesh to his subMesh array with meshes source.
         */
        static MergeMeshes(meshes: Array<Mesh>, disposeSource?: boolean, allow32BitsIndices?: boolean, meshSubclass?: Mesh, subdivideWithSubMeshes?: boolean): Nullable<Mesh>;
    }
}

declare module BABYLON {
    interface IGetSetVerticesData {
        isVerticesDataPresent(kind: string): boolean;
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        setVerticesData(kind: string, data: FloatArray, updatable: boolean): void;
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): void;
        setIndices(indices: IndicesArray, totalVertices: Nullable<number>, updatable?: boolean): void;
    }
    class VertexData {
        positions: Nullable<FloatArray>;
        normals: Nullable<FloatArray>;
        tangents: Nullable<FloatArray>;
        uvs: Nullable<FloatArray>;
        uvs2: Nullable<FloatArray>;
        uvs3: Nullable<FloatArray>;
        uvs4: Nullable<FloatArray>;
        uvs5: Nullable<FloatArray>;
        uvs6: Nullable<FloatArray>;
        colors: Nullable<FloatArray>;
        matricesIndices: Nullable<FloatArray>;
        matricesWeights: Nullable<FloatArray>;
        matricesIndicesExtra: Nullable<FloatArray>;
        matricesWeightsExtra: Nullable<FloatArray>;
        indices: Nullable<IndicesArray>;
        set(data: FloatArray, kind: string): void;
        /**
         * Associates the vertexData to the passed Mesh.
         * Sets it as updatable or not (default `false`).
         * Returns the VertexData.
         */
        applyToMesh(mesh: Mesh, updatable?: boolean): VertexData;
        /**
         * Associates the vertexData to the passed Geometry.
         * Sets it as updatable or not (default `false`).
         * Returns the VertexData.
         */
        applyToGeometry(geometry: Geometry, updatable?: boolean): VertexData;
        /**
         * Updates the associated mesh.
         * Returns the VertexData.
         */
        updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): VertexData;
        /**
         * Updates the associated geometry.
         * Returns the VertexData.
         */
        updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): VertexData;
        private _applyTo(meshOrGeometry, updatable?);
        private _update(meshOrGeometry, updateExtends?, makeItUnique?);
        /**
         * Transforms each position and each normal of the vertexData according to the passed Matrix.
         * Returns the VertexData.
         */
        transform(matrix: Matrix): VertexData;
        /**
         * Merges the passed VertexData into the current one.
         * Returns the modified VertexData.
         */
        merge(other: VertexData, options?: {
            tangentLength?: number;
        }): VertexData;
        private _mergeElement(source, other, length?);
        /**
         * Serializes the VertexData.
         * Returns a serialized object.
         */
        serialize(): any;
        /**
         * Returns the object VertexData associated to the passed mesh.
         */
        static ExtractFromMesh(mesh: Mesh, copyWhenShared?: boolean, forceCopy?: boolean): VertexData;
        /**
         * Returns the object VertexData associated to the passed geometry.
         */
        static ExtractFromGeometry(geometry: Geometry, copyWhenShared?: boolean, forceCopy?: boolean): VertexData;
        private static _ExtractFrom(meshOrGeometry, copyWhenShared?, forceCopy?);
        /**
         * Creates the vertexData of the Ribbon.
         */
        static CreateRibbon(options: {
            pathArray: Vector3[][];
            closeArray?: boolean;
            closePath?: boolean;
            offset?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            invertUV?: boolean;
            uvs?: Vector2[];
            colors?: Color4[];
        }): VertexData;
        /**
         * Creates the VertexData of the Box.
         */
        static CreateBox(options: {
            size?: number;
            width?: number;
            height?: number;
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Sphere.
         */
        static CreateSphere(options: {
            segments?: number;
            diameter?: number;
            diameterX?: number;
            diameterY?: number;
            diameterZ?: number;
            arc?: number;
            slice?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Cylinder or Cone.
         */
        static CreateCylinder(options: {
            height?: number;
            diameterTop?: number;
            diameterBottom?: number;
            diameter?: number;
            tessellation?: number;
            subdivisions?: number;
            arc?: number;
            faceColors?: Color4[];
            faceUV?: Vector4[];
            hasRings?: boolean;
            enclose?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Torus.
         */
        static CreateTorus(options: {
            diameter?: number;
            thickness?: number;
            tessellation?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the LineSystem.
         */
        static CreateLineSystem(options: {
            lines: Vector3[][];
            colors?: Nullable<Color4[][]>;
        }): VertexData;
        /**
         * Create the VertexData of the DashedLines.
         */
        static CreateDashedLines(options: {
            points: Vector3[];
            dashSize?: number;
            gapSize?: number;
            dashNb?: number;
        }): VertexData;
        /**
         * Creates the VertexData of the Ground.
         */
        static CreateGround(options: {
            width?: number;
            height?: number;
            subdivisions?: number;
            subdivisionsX?: number;
            subdivisionsY?: number;
        }): VertexData;
        /**
         * Creates the VertexData of the TiledGround.
         */
        static CreateTiledGround(options: {
            xmin: number;
            zmin: number;
            xmax: number;
            zmax: number;
            subdivisions?: {
                w: number;
                h: number;
            };
            precision?: {
                w: number;
                h: number;
            };
        }): VertexData;
        /**
         * Creates the VertexData of the Ground designed from a heightmap.
         */
        static CreateGroundFromHeightMap(options: {
            width: number;
            height: number;
            subdivisions: number;
            minHeight: number;
            maxHeight: number;
            colorFilter: Color3;
            buffer: Uint8Array;
            bufferWidth: number;
            bufferHeight: number;
        }): VertexData;
        /**
         * Creates the VertexData of the Plane.
         */
        static CreatePlane(options: {
            size?: number;
            width?: number;
            height?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Disc or regular Polygon.
         */
        static CreateDisc(options: {
            radius?: number;
            tessellation?: number;
            arc?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Re-creates the VertexData of the Polygon for sideOrientation.
         */
        static CreatePolygon(polygon: Mesh, sideOrientation: number, fUV?: Vector4[], fColors?: Color4[], frontUVs?: Vector4, backUVs?: Vector4): VertexData;
        /**
         * Creates the VertexData of the IcoSphere.
         */
        static CreateIcoSphere(options: {
            radius?: number;
            radiusX?: number;
            radiusY?: number;
            radiusZ?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Polyhedron.
         */
        static CreatePolyhedron(options: {
            type?: number;
            size?: number;
            sizeX?: number;
            sizeY?: number;
            sizeZ?: number;
            custom?: any;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            flat?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Torus Knot.
         */
        static CreateTorusKnot(options: {
            radius?: number;
            tube?: number;
            radialSegments?: number;
            tubularSegments?: number;
            p?: number;
            q?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * @param {any} - positions (number[] or Float32Array)
         * @param {any} - indices   (number[] or Uint16Array)
         * @param {any} - normals   (number[] or Float32Array)
         * options (optional) :
         * facetPositions : optional array of facet positions (vector3)
         * facetNormals : optional array of facet normals (vector3)
         * facetPartitioning : optional partitioning array. facetPositions is required for facetPartitioning computation
         * subDiv : optional partitioning data about subdivsions on  each axis (int), required for facetPartitioning computation
         * ratio : optional partitioning ratio / bounding box, required for facetPartitioning computation
         * bbSize : optional bounding box size data, required for facetPartitioning computation
         * bInfo : optional bounding info, required for facetPartitioning computation
         * useRightHandedSystem: optional boolean to for right handed system computation
         * depthSort : optional boolean to enable the facet depth sort computation
         * distanceTo : optional Vector3 to compute the facet depth from this location
         * depthSortedFacets : optional array of depthSortedFacets to store the facet distances from the reference location
         */
        static ComputeNormals(positions: any, indices: any, normals: any, options?: {
            facetNormals?: any;
            facetPositions?: any;
            facetPartitioning?: any;
            ratio?: number;
            bInfo?: any;
            bbSize?: Vector3;
            subDiv?: any;
            useRightHandedSystem?: boolean;
            depthSort?: boolean;
            distanceTo?: Vector3;
            depthSortedFacets?: any;
        }): void;
        private static _ComputeSides(sideOrientation, positions, indices, normals, uvs, frontUVs?, backUVs?);
        /**
         * Creates a new VertexData from the imported parameters.
         */
        static ImportVertexData(parsedVertexData: any, geometry: Geometry): void;
    }
}

declare module BABYLON {
    class MeshBuilder {
        private static updateSideOrientation(orientation?);
        /**
         * Creates a box mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#box
         * The parameter `size` sets the size (float) of each box side (default 1).
         * You can set some different box dimensions by using the parameters `width`, `height` and `depth` (all by default have the same value than `size`).
         * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 Color3 elements) and `faceUV` (an array of 6 Vector4 elements).
         * Please read this tutorial : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateBox(name: string, options: {
            size?: number;
            width?: number;
            height?: number;
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            updatable?: boolean;
        }, scene?: Nullable<Scene>): Mesh;
        /**
         * Creates a sphere mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#sphere
         * The parameter `diameter` sets the diameter size (float) of the sphere (default 1).
         * You can set some different sphere dimensions, for instance to build an ellipsoid, by using the parameters `diameterX`, `diameterY` and `diameterZ` (all by default have the same value than `diameter`).
         * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32).
         * You can create an unclosed sphere with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference (latitude) : 2 x PI x ratio
         * You can create an unclosed sphere on its height with the parameter `slice` (positive float, default1), valued between 0 and 1, what is the height ratio (longitude).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateSphere(name: string, options: {
            segments?: number;
            diameter?: number;
            diameterX?: number;
            diameterY?: number;
            diameterZ?: number;
            arc?: number;
            slice?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            updatable?: boolean;
        }, scene: any): Mesh;
        /**
         * Creates a plane polygonal mesh.  By default, this is a disc.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#disc
         * The parameter `radius` sets the radius size (float) of the polygon (default 0.5).
         * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc.
         * You can create an unclosed polygon with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference : 2 x PI x ratio
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDisc(name: string, options: {
            radius?: number;
            tessellation?: number;
            arc?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene?: Nullable<Scene>): Mesh;
        /**
         * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#icosphere
         * The parameter `radius` sets the radius size (float) of the icosphere (default 1).
         * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`).
         * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size.
         * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateIcoSphere(name: string, options: {
            radius?: number;
            radiusX?: number;
            radiusY?: number;
            radiusZ?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            updatable?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a ribbon mesh.
         * The ribbon is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         *
         * Please read this full tutorial to understand how to design a ribbon : http://doc.babylonjs.com/tutorials/Ribbon_Tutorial
         * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.
         * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array.
         * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array.
         * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path.
         * It's the offset to join the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11.
         * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#ribbon
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
         * The parameter `uvs` is an optional flat array of `Vector2` to update/set each ribbon vertex with its own custom UV values instead of the computed ones.
         * The parameters `colors` is an optional flat array of `Color4` to set/update each ribbon vertex with its own custom color values.
         * Note that if you use the parameters `uvs` or `colors`, the passed arrays must be populated with the right number of elements, it is to say the number of ribbon vertices. Remember that
         * if you set `closePath` to `true`, there's one extra vertex per path in the geometry.
         * Moreover, you can use the parameter `color` with `instance` (to update the ribbon), only if you previously used it at creation time.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateRibbon(name: string, options: {
            pathArray: Vector3[][];
            closeArray?: boolean;
            closePath?: boolean;
            offset?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            instance?: Mesh;
            invertUV?: boolean;
            uvs?: Vector2[];
            colors?: Color4[];
        }, scene?: Nullable<Scene>): Mesh;
        /**
         * Creates a cylinder or a cone mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#cylinder-or-cone
         * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).
         * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).
         * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.
         * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
         * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).
         * The parameter `hasRings` (boolean, default false) makes the subdivisions independent from each other, so they become different faces.
         * The parameter `enclose`  (boolean, default false) adds two extra faces per subdivision to a sliced cylinder to close it around its height axis.
         * The parameter `arc` (float, default 1) is the ratio (max 1) to apply to the circumference to slice the cylinder.
         * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of n Color3 elements) and `faceUV` (an array of n Vector4 elements).
         * The value of n is the number of cylinder faces. If the cylinder has only 1 subdivisions, n equals : top face + cylinder surface + bottom face = 3
         * Now, if the cylinder has 5 independent subdivisions (hasRings = true), n equals : top face + 5 stripe surfaces + bottom face = 2 + 5 = 7
         * Finally, if the cylinder has 5 independent subdivisions and is enclose, n equals : top face + 5 x (stripe surface + 2 closing faces) + bottom face = 2 + 5 * 3 = 17
         * Each array (color or UVs) is always ordered the same way : the first element is the bottom cap, the last element is the top cap. The other elements are each a ring surface.
         * If `enclose` is false, a ring surface is one element.
         * If `enclose` is true, a ring surface is 3 successive elements in the array : the tubular surface, then the two closing faces.
         * Example how to set colors and textures on a sliced cylinder : http://www.html5gamedevs.com/topic/17945-creating-a-closed-slice-of-a-cylinder/#comment-106379
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateCylinder(name: string, options: {
            height?: number;
            diameterTop?: number;
            diameterBottom?: number;
            diameter?: number;
            tessellation?: number;
            subdivisions?: number;
            arc?: number;
            faceColors?: Color4[];
            faceUV?: Vector4[];
            updatable?: boolean;
            hasRings?: boolean;
            enclose?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: any): Mesh;
        /**
         * Creates a torus mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#torus
         * The parameter `diameter` sets the diameter size (float) of the torus (default 1).
         * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5).
         * The parameter `tessellation` sets the number of torus sides (postive integer, default 16).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorus(name: string, options: {
            diameter?: number;
            thickness?: number;
            tessellation?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: any): Mesh;
        /**
         * Creates a torus knot mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#torus-knot
         * The parameter `radius` sets the global radius size (float) of the torus knot (default 2).
         * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32).
         * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32).
         * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorusKnot(name: string, options: {
            radius?: number;
            tube?: number;
            radialSegments?: number;
            tubularSegments?: number;
            p?: number;
            q?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: any): Mesh;
        /**
         * Creates a line system mesh.
         * A line system is a pool of many lines gathered in a single mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#linesystem
         * A line system mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of lines as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineSystem to this static function.
         * The parameter `lines` is an array of lines, each line being an array of successive Vector3.
         * The optional parameter `instance` is an instance of an existing LineSystem object to be updated with the passed `lines` parameter. The way to update it is the same than for
         * The optional parameter `colors` is an array of line colors, each line colors being an array of successive Color4, one per line point.
         * The optional parameter `useVertexAlpha' is to be set to `true` (default `false`) when the alpha value from the former `Color4` array must be used.
         * updating a simple Line mesh, you just need to update every line in the `lines` array : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only line point positions can change, not the number of points, neither the number of lines.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLineSystem(name: string, options: {
            lines: Vector3[][];
            updatable: boolean;
            instance: Nullable<LinesMesh>;
            colors?: Nullable<Color4[][]>;
            useVertexAlpha?: boolean;
        }, scene: Nullable<Scene>): LinesMesh;
        /**
         * Creates a line mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#lines
         * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * The optional parameter `colors` is an array of successive Color4, one per line point.
         * The optional parameter `useVertexAlpha' is to be set to `true` (default `false`) when the alpha value from the former `Color4` array must be used.
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLines(name: string, options: {
            points: Vector3[];
            updatable: boolean;
            instance: Nullable<LinesMesh>;
            colors?: Color4[];
            useVertexAlpha?: boolean;
        }, scene?: Nullable<Scene>): LinesMesh;
        /**
         * Creates a dashed line mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#dashed-lines
         * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200).
         * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3).
         * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1).
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDashedLines(name: string, options: {
            points: Vector3[];
            dashSize?: number;
            gapSize?: number;
            dashNb?: number;
            updatable?: boolean;
            instance?: LinesMesh;
        }, scene?: Nullable<Scene>): LinesMesh;
        /**
         * Creates an extruded shape mesh.
         * The extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#extruded-shapes
         *
         * Please read this full tutorial to understand how to design an extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
         * The parameter `scale` (float, default 1) is the value to scale the shape.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShape(name: string, options: {
            shape: Vector3[];
            path: Vector3[];
            scale?: number;
            rotation?: number;
            cap?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            instance?: Mesh;
            invertUV?: boolean;
        }, scene?: Nullable<Scene>): Mesh;
        /**
         * Creates an custom extruded shape mesh.
         * The custom extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * tuto :http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#custom-extruded-shapes
         *
         * Please read this full tutorial to understand how to design a custom extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var rotationFunction = function(i, distance) {
         *     // do things
         *     return rotationValue; }
         * ```
         * It must returns a float value that will be the rotation in radians applied to the shape on each path point.
         * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var scaleFunction = function(i, distance) {
         *     // do things
         *     return scaleValue;}
         * ```
         * It must returns a float value that will be the scale value applied to the shape on each path point.
         * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`.
         * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShapeCustom(name: string, options: {
            shape: Vector3[];
            path: Vector3[];
            scaleFunction?: any;
            rotationFunction?: any;
            ribbonCloseArray?: boolean;
            ribbonClosePath?: boolean;
            cap?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            instance?: Mesh;
            invertUV?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates lathe mesh.
         * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#lathe
         *
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be
         * rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero.
         * The parameter `radius` (positive float, default 1) is the radius value of the lathe.
         * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe.
         * The parameter `arc` (positive float, default 1) is the ratio of the lathe. 0.5 builds for instance half a lathe, so an opened shape.
         * The parameter `closed` (boolean, default true) opens/closes the lathe circumference. This should be set to false when used with the parameter "arc".
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLathe(name: string, options: {
            shape: Vector3[];
            radius?: number;
            tessellation?: number;
            arc?: number;
            closed?: boolean;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            cap?: number;
            invertUV?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a plane mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#plane
         * The parameter `size` sets the size (float) of both sides of the plane at once (default 1).
         * You can set some different plane dimensions by using the parameters `width` and `height` (both by default have the same value than `size`).
         * The parameter `sourcePlane` is a Plane instance. It builds a mesh plane from a Math plane.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePlane(name: string, options: {
            size?: number;
            width?: number;
            height?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            updatable?: boolean;
            sourcePlane?: Plane;
        }, scene: Scene): Mesh;
        /**
         * Creates a ground mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#plane
         * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground.
         * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGround(name: string, options: {
            width?: number;
            height?: number;
            subdivisions?: number;
            subdivisionsX?: number;
            subdivisionsY?: number;
            updatable?: boolean;
        }, scene: any): Mesh;
        /**
         * Creates a tiled ground mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#tiled-ground
         * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates.
         * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates.
         * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height. Each subdivision is called a tile.
         * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height of each tile.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTiledGround(name: string, options: {
            xmin: number;
            zmin: number;
            xmax: number;
            zmax: number;
            subdivisions?: {
                w: number;
                h: number;
            };
            precision?: {
                w: number;
                h: number;
            };
            updatable?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a ground mesh from a height map.
         * tuto : http://doc.babylonjs.com/tutorials/14._Height_Map
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#ground-from-a-height-map
         * The parameter `url` sets the URL of the height map image resource.
         * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.
         * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.
         * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.
         * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.
         * The parameter `colorFilter` (optional Color3, default (0.3, 0.59, 0.11) ) is the filter to apply to the image pixel colors to compute the height.
         * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).
         * This function is passed the newly built mesh :
         * ```javascript
         * function(mesh) { // do things
         *     return; }
         * ```
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGroundFromHeightMap(name: string, url: string, options: {
            width?: number;
            height?: number;
            subdivisions?: number;
            minHeight?: number;
            maxHeight?: number;
            colorFilter?: Color3;
            updatable?: boolean;
            onReady?: (mesh: GroundMesh) => void;
        }, scene: Scene): GroundMesh;
        /**
         * Creates a polygon mesh.
         * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
         * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
         * You can set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Remember you can only change the shape positions, not their number when updating a polygon.
         */
        static CreatePolygon(name: string, options: {
            shape: Vector3[];
            holes?: Vector3[][];
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: Scene): Mesh;
        /**
         * Creates an extruded polygon mesh, with depth in the Y direction.
         * You can set different colors and different images to the top, bottom and extruded side by using the parameters `faceColors` (an array of 3 Color3 elements) and `faceUV` (an array of 3 Vector4 elements).
         * Please read this tutorial : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors
        */
        static ExtrudePolygon(name: string, options: {
            shape: Vector3[];
            holes?: Vector3[][];
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: Scene): Mesh;
        /**
         * Creates a tube mesh.
         * The tube is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         *
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#tube
         * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube.
         * The parameter `radius` (positive float, default 1) sets the tube radius size.
         * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface.
         * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`.
         * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path.
         * It must return a radius value (positive float) :
         * ```javascript
         * var radiusFunction = function(i, distance) {
         *     // do things
         *     return radius; }
         * ```
         * The parameter `arc` (positive float, maximum 1, default 1) is the ratio to apply to the tube circumference : 2 x PI x arc.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#tube
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTube(name: string, options: {
            path: Vector3[];
            radius?: number;
            tessellation?: number;
            radiusFunction?: {
                (i: number, distance: number): number;
            };
            cap?: number;
            arc?: number;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            instance?: Mesh;
            invertUV?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a polyhedron mesh.
         *
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#polyhedron
         * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial
         *  to choose the wanted type.
         * The parameter `size` (positive float, default 1) sets the polygon size.
         * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value).
         * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`.
         * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
         * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`).
         * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors
         * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4).
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePolyhedron(name: string, options: {
            type?: number;
            size?: number;
            sizeX?: number;
            sizeY?: number;
            sizeZ?: number;
            custom?: any;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            flat?: boolean;
            updatable?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }, scene: Scene): Mesh;
        /**
         * Creates a decal mesh.
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#decals
         * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal.
         * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates.
         * The parameter `normal` (Vector3, default `Vector3.Up`) sets the normal of the mesh where the decal is applied onto in World coordinates.
         * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling.
         * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal.
         */
        static CreateDecal(name: string, sourceMesh: AbstractMesh, options: {
            position?: Vector3;
            normal?: Vector3;
            size?: Vector3;
            angle?: number;
        }): Mesh;
        private static _ExtrudeShapeGeneric(name, shape, curve, scale, rotation, scaleFunction, rotateFunction, rbCA, rbCP, cap, custom, scene, updtbl, side, instance, invertUV, frontUVs, backUVs);
    }
}

declare module BABYLON.Internals {
    class MeshLODLevel {
        distance: number;
        mesh: Mesh;
        constructor(distance: number, mesh: Mesh);
    }
}

declare module BABYLON {
    /**
     * A simplifier interface for future simplification implementations.
     */
    interface ISimplifier {
        /**
         * Simplification of a given mesh according to the given settings.
         * Since this requires computation, it is assumed that the function runs async.
         * @param settings The settings of the simplification, including quality and distance
         * @param successCallback A callback that will be called after the mesh was simplified.
         * @param errorCallback in case of an error, this callback will be called. optional.
         */
        simplify(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void, errorCallback?: () => void): void;
    }
    /**
     * Expected simplification settings.
     * Quality should be between 0 and 1 (1 being 100%, 0 being 0%);
     */
    interface ISimplificationSettings {
        quality: number;
        distance: number;
        optimizeMesh?: boolean;
    }
    class SimplificationSettings implements ISimplificationSettings {
        quality: number;
        distance: number;
        optimizeMesh: boolean | undefined;
        constructor(quality: number, distance: number, optimizeMesh?: boolean | undefined);
    }
    interface ISimplificationTask {
        settings: Array<ISimplificationSettings>;
        simplificationType: SimplificationType;
        mesh: Mesh;
        successCallback?: () => void;
        parallelProcessing: boolean;
    }
    class SimplificationQueue {
        private _simplificationArray;
        running: boolean;
        constructor();
        addTask(task: ISimplificationTask): void;
        executeNext(): void;
        runSimplification(task: ISimplificationTask): void;
        private getSimplifier(task);
    }
    /**
     * The implemented types of simplification.
     * At the moment only Quadratic Error Decimation is implemented.
     */
    enum SimplificationType {
        QUADRATIC = 0,
    }
    class DecimationTriangle {
        vertices: Array<DecimationVertex>;
        normal: Vector3;
        error: Array<number>;
        deleted: boolean;
        isDirty: boolean;
        borderFactor: number;
        deletePending: boolean;
        originalOffset: number;
        constructor(vertices: Array<DecimationVertex>);
    }
    class DecimationVertex {
        position: Vector3;
        id: number;
        q: QuadraticMatrix;
        isBorder: boolean;
        triangleStart: number;
        triangleCount: number;
        originalOffsets: Array<number>;
        constructor(position: Vector3, id: number);
        updatePosition(newPosition: Vector3): void;
    }
    class QuadraticMatrix {
        data: Array<number>;
        constructor(data?: Array<number>);
        det(a11: number, a12: number, a13: number, a21: number, a22: number, a23: number, a31: number, a32: number, a33: number): number;
        addInPlace(matrix: QuadraticMatrix): void;
        addArrayInPlace(data: Array<number>): void;
        add(matrix: QuadraticMatrix): QuadraticMatrix;
        static FromData(a: number, b: number, c: number, d: number): QuadraticMatrix;
        static DataFromNumbers(a: number, b: number, c: number, d: number): number[];
    }
    class Reference {
        vertexId: number;
        triangleId: number;
        constructor(vertexId: number, triangleId: number);
    }
    /**
     * An implementation of the Quadratic Error simplification algorithm.
     * Original paper : http://www1.cs.columbia.edu/~cs4162/html05s/garland97.pdf
     * Ported mostly from QSlim and http://voxels.blogspot.de/2014/05/quadric-mesh-simplification-with-source.html to babylon JS
     * @author RaananW
     */
    class QuadraticErrorSimplification implements ISimplifier {
        private _mesh;
        private triangles;
        private vertices;
        private references;
        private initialized;
        private _reconstructedMesh;
        syncIterations: number;
        aggressiveness: number;
        decimationIterations: number;
        boundingBoxEpsilon: number;
        constructor(_mesh: Mesh);
        simplify(settings: ISimplificationSettings, successCallback: (simplifiedMesh: Mesh) => void): void;
        private runDecimation(settings, submeshIndex, successCallback);
        private initWithMesh(submeshIndex, callback, optimizeMesh?);
        private init(callback);
        private reconstructMesh(submeshIndex);
        private initDecimatedMesh();
        private isFlipped(vertex1, vertex2, point, deletedArray, borderFactor, delTr);
        private updateTriangles(origVertex, vertex, deletedArray, deletedTriangles);
        private identifyBorder();
        private updateMesh(identifyBorders?);
        private vertexError(q, point);
        private calculateError(vertex1, vertex2, pointResult?, normalResult?, uvResult?, colorResult?);
    }
}

declare module BABYLON {
    class Polygon {
        static Rectangle(xmin: number, ymin: number, xmax: number, ymax: number): Vector2[];
        static Circle(radius: number, cx?: number, cy?: number, numberOfSides?: number): Vector2[];
        static Parse(input: string): Vector2[];
        static StartingAt(x: number, y: number): Path2;
    }
    class PolygonMeshBuilder {
        private _points;
        private _outlinepoints;
        private _holes;
        private _name;
        private _scene;
        private _epoints;
        private _eholes;
        private _addToepoint(points);
        constructor(name: string, contours: Path2, scene: Scene);
        constructor(name: string, contours: Vector2[], scene: Scene);
        addHole(hole: Vector2[]): PolygonMeshBuilder;
        build(updatable?: boolean, depth?: number): Mesh;
        private addSide(positions, normals, uvs, indices, bounds, points, depth, flip);
    }
}

declare module BABYLON {
    class BaseSubMesh {
        _materialDefines: Nullable<MaterialDefines>;
        _materialEffect: Nullable<Effect>;
        readonly effect: Nullable<Effect>;
        setEffect(effect: Nullable<Effect>, defines?: Nullable<MaterialDefines>): void;
    }
    class SubMesh extends BaseSubMesh implements ICullable {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;
        linesIndexCount: number;
        private _mesh;
        private _renderingMesh;
        private _boundingInfo;
        private _linesIndexBuffer;
        _lastColliderWorldVertices: Nullable<Vector3[]>;
        _trianglePlanes: Plane[];
        _lastColliderTransformMatrix: Matrix;
        _renderId: number;
        _alphaIndex: number;
        _distanceToCamera: number;
        _id: number;
        private _currentMaterial;
        static AddToMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean): SubMesh;
        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
        readonly IsGlobal: boolean;
        /**
         * Returns the submesh BoudingInfo object.
         */
        getBoundingInfo(): BoundingInfo;
        /**
         * Sets the submesh BoundingInfo.
         * Return the SubMesh.
         */
        setBoundingInfo(boundingInfo: BoundingInfo): SubMesh;
        /**
         * Returns the mesh of the current submesh.
         */
        getMesh(): AbstractMesh;
        /**
         * Returns the rendering mesh of the submesh.
         */
        getRenderingMesh(): Mesh;
        /**
         * Returns the submesh material.
         */
        getMaterial(): Nullable<Material>;
        /**
         * Sets a new updated BoundingInfo object to the submesh.
         * Returns the SubMesh.
         */
        refreshBoundingInfo(): SubMesh;
        _checkCollision(collider: Collider): boolean;
        /**
         * Updates the submesh BoundingInfo.
         * Returns the Submesh.
         */
        updateBoundingInfo(world: Matrix): SubMesh;
        /**
         * True is the submesh bounding box intersects the frustum defined by the passed array of planes.
         * Boolean returned.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * True is the submesh bounding box is completely inside the frustum defined by the passed array of planes.
         * Boolean returned.
         */
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Renders the submesh.
         * Returns it.
         */
        render(enableAlphaMode: boolean): SubMesh;
        /**
         * Returns a new Index Buffer.
         * Type returned : WebGLBuffer.
         */
        getLinesIndexBuffer(indices: IndicesArray, engine: Engine): WebGLBuffer;
        /**
         * True is the passed Ray intersects the submesh bounding box.
         * Boolean returned.
         */
        canIntersects(ray: Ray): boolean;
        /**
         * Returns an object IntersectionInfo.
         */
        intersects(ray: Ray, positions: Vector3[], indices: IndicesArray, fastCheck?: boolean): Nullable<IntersectionInfo>;
        _rebuild(): void;
        /**
         * Creates a new Submesh from the passed Mesh.
         */
        clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh;
        /**
         * Disposes the Submesh.
         * Returns nothing.
         */
        dispose(): void;
        /**
         * Creates a new Submesh from the passed parameters :
         * - materialIndex (integer) : the index of the main mesh material.
         * - startIndex (integer) : the index where to start the copy in the mesh indices array.
         * - indexCount (integer) : the number of indices to copy then from the startIndex.
         * - mesh (Mesh) : the main mesh to create the submesh from.
         * - renderingMesh (optional Mesh) : rendering mesh.
         */
        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh;
    }
}

declare module BABYLON {
    class TransformNode extends Node {
        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;
        private _rotation;
        private _rotationQuaternion;
        protected _scaling: Vector3;
        protected _isDirty: boolean;
        private _transformToBoneReferal;
        billboardMode: number;
        scalingDeterminant: number;
        infiniteDistance: boolean;
        position: Vector3;
        _poseMatrix: Matrix;
        private _localWorld;
        _worldMatrix: Matrix;
        private _absolutePosition;
        private _pivotMatrix;
        private _pivotMatrixInverse;
        private _postMultiplyPivotMatrix;
        protected _isWorldMatrixFrozen: boolean;
        /**
        * An event triggered after the world matrix is updated
        * @type {BABYLON.Observable}
        */
        onAfterWorldMatrixUpdateObservable: Observable<TransformNode>;
        constructor(name: string, scene?: Nullable<Scene>, isPure?: boolean);
        /**
          * Rotation property : a Vector3 depicting the rotation value in radians around each local axis X, Y, Z.
          * If rotation quaternion is set, this Vector3 will (almost always) be the Zero vector!
          * Default : (0.0, 0.0, 0.0)
          */
        rotation: Vector3;
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
         */
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
        */
        scaling: Vector3;
        /**
         * Rotation Quaternion property : this a Quaternion object depicting the mesh rotation by using a unit quaternion.
         * It's null by default.
         * If set, only the rotationQuaternion is then used to compute the mesh rotation and its property `.rotation\ is then ignored and set to (0.0, 0.0, 0.0)
         */
        rotationQuaternion: Nullable<Quaternion>;
        /**
         * Returns the latest update of the World matrix
         * Returns a Matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Returns directly the latest state of the mesh World matrix.
         * A Matrix is returned.
         */
        readonly worldMatrixFromCache: Matrix;
        /**
         * Copies the paramater passed Matrix into the mesh Pose matrix.
         * Returns the AbstractMesh.
         */
        updatePoseMatrix(matrix: Matrix): TransformNode;
        /**
         * Returns the mesh Pose matrix.
         * Returned object : Matrix
         */
        getPoseMatrix(): Matrix;
        _isSynchronized(): boolean;
        _initCache(): void;
        markAsDirty(property: string): TransformNode;
        /**
         * Returns the current mesh absolute position.
         * Retuns a Vector3.
         */
        readonly absolutePosition: Vector3;
        /**
         * Sets a new pivot matrix to the mesh.
         * Returns the AbstractMesh.
        */
        setPivotMatrix(matrix: Matrix, postMultiplyPivotMatrix?: boolean): TransformNode;
        /**
         * Returns the mesh pivot matrix.
         * Default : Identity.
         * A Matrix is returned.
         */
        getPivotMatrix(): Matrix;
        /**
         * Prevents the World matrix to be computed any longer.
         * Returns the AbstractMesh.
         */
        freezeWorldMatrix(): TransformNode;
        /**
         * Allows back the World matrix computation.
         * Returns the AbstractMesh.
         */
        unfreezeWorldMatrix(): this;
        /**
         * True if the World matrix has been frozen.
         * Returns a boolean.
         */
        readonly isWorldMatrixFrozen: boolean;
        /**
            * Retuns the mesh absolute position in the World.
            * Returns a Vector3.
            */
        getAbsolutePosition(): Vector3;
        /**
         * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
         * Returns the AbstractMesh.
         */
        setAbsolutePosition(absolutePosition: Vector3): TransformNode;
        /**
           * Sets the mesh position in its local space.
           * Returns the AbstractMesh.
           */
        setPositionWithLocalVector(vector3: Vector3): TransformNode;
        /**
         * Returns the mesh position in the local space from the current World matrix values.
         * Returns a new Vector3.
         */
        getPositionExpressedInLocalSpace(): Vector3;
        /**
         * Translates the mesh along the passed Vector3 in its local space.
         * Returns the AbstractMesh.
         */
        locallyTranslate(vector3: Vector3): TransformNode;
        private static _lookAtVectorCache;
        lookAt(targetPoint: Vector3, yawCor?: number, pitchCor?: number, rollCor?: number, space?: Space): TransformNode;
        /**
          * Returns a new Vector3 what is the localAxis, expressed in the mesh local space, rotated like the mesh.
          * This Vector3 is expressed in the World space.
          */
        getDirection(localAxis: Vector3): Vector3;
        /**
         * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
         * localAxis is expressed in the mesh local space.
         * result is computed in the Wordl space from the mesh World matrix.
         * Returns the AbstractMesh.
         */
        getDirectionToRef(localAxis: Vector3, result: Vector3): TransformNode;
        setPivotPoint(point: Vector3, space?: Space): TransformNode;
        /**
         * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
         */
        getPivotPoint(): Vector3;
        /**
         * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
         * Returns the AbstractMesh.
         */
        getPivotPointToRef(result: Vector3): TransformNode;
        /**
         * Returns a new Vector3 set with the mesh pivot point World coordinates.
         */
        getAbsolutePivotPoint(): Vector3;
        /**
         * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
         * Returns the AbstractMesh.
         */
        getAbsolutePivotPointToRef(result: Vector3): TransformNode;
        /**
         * Defines the passed mesh as the parent of the current mesh.
         * Returns the AbstractMesh.
         */
        setParent(mesh: Nullable<AbstractMesh>): TransformNode;
        private _nonUniformScaling;
        readonly nonUniformScaling: boolean;
        _updateNonUniformScalingState(value: boolean): boolean;
        /**
         * Attach the current TransformNode to another TransformNode associated with a bone
         * @param bone Bone affecting the TransformNode
         * @param affectedTransformNode TransformNode associated with the bone
         */
        attachToBone(bone: Bone, affectedTransformNode: TransformNode): TransformNode;
        detachFromBone(): TransformNode;
        private static _rotationAxisCache;
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized.
         * Returns the AbstractMesh.
         */
        rotate(axis: Vector3, amount: number, space?: Space): TransformNode;
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized.
         * Returns the AbstractMesh.
         * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
         */
        rotateAround(point: Vector3, axis: Vector3, amount: number): TransformNode;
        /**
         * Translates the mesh along the axis vector for the passed distance in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Returns the AbstractMesh.
         */
        translate(axis: Vector3, distance: number, space?: Space): TransformNode;
        /**
         * Adds a rotation step to the mesh current rotation.
         * x, y, z are Euler angles expressed in radians.
         * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
         * This means this rotation is made in the mesh local space only.
         * It's useful to set a custom rotation order different from the BJS standard one YXZ.
         * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
         * ```javascript
         * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
         * ```
         * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
         * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
         * Returns the AbstractMesh.
         */
        addRotation(x: number, y: number, z: number): TransformNode;
        /**
         * Computes the mesh World matrix and returns it.
         * If the mesh world matrix is frozen, this computation does nothing more than returning the last frozen values.
         * If the parameter `force` is let to `false` (default), the current cached World matrix is returned.
         * If the parameter `force`is set to `true`, the actual computation is done.
         * Returns the mesh World Matrix.
         */
        computeWorldMatrix(force?: boolean): Matrix;
        protected _afterComputeWorldMatrix(): void;
        /**
        * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
        * @param func: callback function to add
        *
        * Returns the TransformNode.
        */
        registerAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode;
        /**
         * Removes a registered callback function.
         * Returns the TransformNode.
         */
        unregisterAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode;
        clone(name: string, newParent: Node): Nullable<TransformNode>;
        serialize(serializationObject?: any): any;
        /**
         * Returns a new TransformNode object parsed from the source provided.
         * The parameter `parsedMesh` is the source.
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        static Parse(parsedTransformNode: any, scene: Scene, rootUrl: string): TransformNode;
    }
}

declare module BABYLON {
    class VertexBuffer {
        private _buffer;
        private _kind;
        private _offset;
        private _size;
        private _stride;
        private _ownsBuffer;
        constructor(engine: any, data: FloatArray | Buffer, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean, offset?: number, size?: number);
        _rebuild(): void;
        /**
         * Returns the kind of the VertexBuffer (string).
         */
        getKind(): string;
        /**
         * Boolean : is the VertexBuffer updatable ?
         */
        isUpdatable(): boolean;
        /**
         * Returns an array of numbers or a Float32Array containing the VertexBuffer data.
         */
        getData(): Nullable<FloatArray>;
        /**
         * Returns the WebGLBuffer associated to the VertexBuffer.
         */
        getBuffer(): Nullable<WebGLBuffer>;
        /**
         * Returns the stride of the VertexBuffer (integer).
         */
        getStrideSize(): number;
        /**
         * Returns the offset (integer).
         */
        getOffset(): number;
        /**
         * Returns the VertexBuffer total size (integer).
         */
        getSize(): number;
        /**
         * Boolean : is the WebGLBuffer of the VertexBuffer instanced now ?
         */
        getIsInstanced(): boolean;
        /**
         * Returns the instancing divisor, zero for non-instanced (integer).
         */
        getInstanceDivisor(): number;
        /**
         * Creates the underlying WebGLBuffer from the passed numeric array or Float32Array.
         * Returns the created WebGLBuffer.
         */
        create(data?: FloatArray): void;
        /**
         * Updates the underlying WebGLBuffer according to the passed numeric array or Float32Array.
         * Returns the updated WebGLBuffer.
         */
        update(data: FloatArray): void;
        /**
         * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.
         * Returns the directly updated WebGLBuffer.
         */
        updateDirectly(data: Float32Array, offset: number): void;
        /**
         * Disposes the VertexBuffer and the underlying WebGLBuffer.
         */
        dispose(): void;
        private static _PositionKind;
        private static _NormalKind;
        private static _TangentKind;
        private static _UVKind;
        private static _UV2Kind;
        private static _UV3Kind;
        private static _UV4Kind;
        private static _UV5Kind;
        private static _UV6Kind;
        private static _ColorKind;
        private static _MatricesIndicesKind;
        private static _MatricesWeightsKind;
        private static _MatricesIndicesExtraKind;
        private static _MatricesWeightsExtraKind;
        static readonly PositionKind: string;
        static readonly NormalKind: string;
        static readonly TangentKind: string;
        static readonly UVKind: string;
        static readonly UV2Kind: string;
        static readonly UV3Kind: string;
        static readonly UV4Kind: string;
        static readonly UV5Kind: string;
        static readonly UV6Kind: string;
        static readonly ColorKind: string;
        static readonly MatricesIndicesKind: string;
        static readonly MatricesWeightsKind: string;
        static readonly MatricesIndicesExtraKind: string;
        static readonly MatricesWeightsExtraKind: string;
    }
}

declare module BABYLON {
    class MorphTarget {
        name: string;
        animations: Animation[];
        private _positions;
        private _normals;
        private _tangents;
        private _influence;
        onInfluenceChanged: Observable<boolean>;
        influence: number;
        constructor(name: string, influence?: number);
        readonly hasPositions: boolean;
        readonly hasNormals: boolean;
        readonly hasTangents: boolean;
        setPositions(data: Nullable<FloatArray>): void;
        getPositions(): Nullable<FloatArray>;
        setNormals(data: Nullable<FloatArray>): void;
        getNormals(): Nullable<FloatArray>;
        setTangents(data: Nullable<FloatArray>): void;
        getTangents(): Nullable<FloatArray>;
        /**
         * Serializes the current target into a Serialization object.
         * Returns the serialized object.
         */
        serialize(): any;
        static Parse(serializationObject: any): MorphTarget;
        static FromMesh(mesh: AbstractMesh, name?: string, influence?: number): MorphTarget;
    }
}

declare module BABYLON {
    class MorphTargetManager {
        private _targets;
        private _targetObservable;
        private _activeTargets;
        private _scene;
        private _influences;
        private _supportsNormals;
        private _supportsTangents;
        private _vertexCount;
        private _uniqueId;
        private _tempInfluences;
        constructor(scene?: Nullable<Scene>);
        readonly uniqueId: number;
        readonly vertexCount: number;
        readonly supportsNormals: boolean;
        readonly supportsTangents: boolean;
        readonly numTargets: number;
        readonly numInfluencers: number;
        readonly influences: Float32Array;
        getActiveTarget(index: number): MorphTarget;
        getTarget(index: number): MorphTarget;
        addTarget(target: MorphTarget): void;
        removeTarget(target: MorphTarget): void;
        /**
         * Serializes the current manager into a Serialization object.
         * Returns the serialized object.
         */
        serialize(): any;
        private _syncActiveTargets(needUpdate);
        static Parse(serializationObject: any, scene: Scene): MorphTargetManager;
    }
}

declare module BABYLON {
    class GPUParticleSystem implements IDisposable, IParticleSystem {
        name: string;
        id: string;
        emitter: Nullable<AbstractMesh | Vector3>;
        renderingGroupId: number;
        layerMask: number;
        private _capacity;
        private _renderEffect;
        private _updateEffect;
        private _updateBuffer;
        private _updateVAO;
        private _updateVertexBuffers;
        private _renderBuffer;
        private _renderVAO;
        private _renderVertexBuffers;
        private _sourceVAO;
        private _targetVAO;
        private _sourceBuffer;
        private _targetBuffer;
        private _scene;
        private _engine;
        private _currentRenderId;
        private _started;
        /**
        * An event triggered when the system is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<GPUParticleSystem>;
        isStarted(): boolean;
        start(): void;
        stop(): void;
        constructor(name: string, capacity: number, scene: Scene);
        animate(): void;
        private _initialize();
        render(): number;
        rebuild(): void;
        dispose(): void;
        clone(name: string, newEmitter: any): Nullable<GPUParticleSystem>;
        serialize(): any;
    }
}

declare module BABYLON {
    class Particle {
        private particleSystem;
        position: Vector3;
        direction: Vector3;
        color: Color4;
        colorStep: Color4;
        lifeTime: number;
        age: number;
        size: number;
        angle: number;
        angularSpeed: number;
        private _currentFrameCounter;
        cellIndex: number;
        constructor(particleSystem: ParticleSystem);
        updateCellIndex: (scaledUpdateSpeed: number) => void;
        private updateCellIndexWithSpeedCalculated(scaledUpdateSpeed);
        private updateCellIndexWithCustomSpeed();
        copyTo(other: Particle): void;
    }
}

declare module BABYLON {
    interface IParticleSystem {
        id: string;
        name: string;
        emitter: Nullable<AbstractMesh | Vector3>;
        renderingGroupId: number;
        layerMask: number;
        isStarted(): boolean;
        animate(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): Nullable<IParticleSystem>;
        serialize(): any;
        rebuild(): void;
    }
    class ParticleSystem implements IDisposable, IAnimatable, IParticleSystem {
        name: string;
        private _isAnimationSheetEnabled;
        static BLENDMODE_ONEONE: number;
        static BLENDMODE_STANDARD: number;
        animations: Animation[];
        id: string;
        renderingGroupId: number;
        emitter: Nullable<AbstractMesh | Vector3>;
        emitRate: number;
        manualEmitCount: number;
        updateSpeed: number;
        targetStopDuration: number;
        disposeOnStop: boolean;
        minEmitPower: number;
        maxEmitPower: number;
        minLifeTime: number;
        maxLifeTime: number;
        minSize: number;
        maxSize: number;
        minAngularSpeed: number;
        maxAngularSpeed: number;
        particleTexture: Nullable<Texture>;
        layerMask: number;
        customShader: any;
        preventAutoStart: boolean;
        private _epsilon;
        /**
        * An event triggered when the system is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<ParticleSystem>;
        private _onDisposeObserver;
        onDispose: () => void;
        updateFunction: (particles: Particle[]) => void;
        onAnimationEnd: Nullable<() => void>;
        blendMode: number;
        forceDepthWrite: boolean;
        gravity: Vector3;
        direction1: Vector3;
        direction2: Vector3;
        minEmitBox: Vector3;
        maxEmitBox: Vector3;
        color1: Color4;
        color2: Color4;
        colorDead: Color4;
        textureMask: Color4;
        startDirectionFunction: (emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle) => void;
        startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle) => void;
        private particles;
        private _capacity;
        private _scene;
        private _stockParticles;
        private _newPartsExcess;
        private _vertexData;
        private _vertexBuffer;
        private _vertexBuffers;
        private _indexBuffer;
        private _effect;
        private _customEffect;
        private _cachedDefines;
        private _scaledColorStep;
        private _colorDiff;
        private _scaledDirection;
        private _scaledGravity;
        private _currentRenderId;
        private _alive;
        private _started;
        private _stopped;
        private _actualFrame;
        private _scaledUpdateSpeed;
        startSpriteCellID: number;
        endSpriteCellID: number;
        spriteCellLoop: boolean;
        spriteCellChangeSpeed: number;
        spriteCellWidth: number;
        spriteCellHeight: number;
        private _vertexBufferSize;
        readonly isAnimationSheetEnabled: Boolean;
        constructor(name: string, capacity: number, scene: Scene, customEffect?: Nullable<Effect>, _isAnimationSheetEnabled?: boolean, epsilon?: number);
        private _createIndexBuffer();
        recycleParticle(particle: Particle): void;
        getCapacity(): number;
        isAlive(): boolean;
        isStarted(): boolean;
        start(): void;
        stop(): void;
        _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void;
        _appendParticleVertexWithAnimation(index: number, particle: Particle, offsetX: number, offsetY: number): void;
        private _update(newParticles);
        private _getEffect();
        animate(): void;
        appendParticleVertexes: Nullable<(offset: number, particle: Particle) => void>;
        private appenedParticleVertexesWithSheet(offset, particle);
        private appenedParticleVertexesNoSheet(offset, particle);
        rebuild(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): ParticleSystem;
        serialize(): any;
        static Parse(parsedParticleSystem: any, scene: Scene, rootUrl: string): ParticleSystem;
    }
}

declare module BABYLON {
    class SolidParticle {
        idx: number;
        color: Nullable<Color4>;
        position: Vector3;
        rotation: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        uvs: Vector4;
        velocity: Vector3;
        pivot: Vector3;
        alive: boolean;
        isVisible: boolean;
        _pos: number;
        _ind: number;
        _model: ModelShape;
        shapeId: number;
        idxInShape: number;
        _modelBoundingInfo: BoundingInfo;
        _boundingInfo: BoundingInfo;
        _sps: SolidParticleSystem;
        _stillInvisible: boolean;
        /**
         * Creates a Solid Particle object.
         * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
         * `particleIndex` (integer) is the particle index in the Solid Particle System pool. It's also the particle identifier.
         * `positionIndex` (integer) is the starting index of the particle vertices in the SPS "positions" array.
         * `indiceIndex` (integer) is the starting index of the particle indices in the SPS "indices" array.
         * `model` (ModelShape) is a reference to the model shape on what the particle is designed.
         * `shapeId` (integer) is the model shape identifier in the SPS.
         * `idxInShape` (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
         * `modelBoundingInfo` is the reference to the model BoundingInfo used for intersection computations.
         */
        constructor(particleIndex: number, positionIndex: number, indiceIndex: number, model: Nullable<ModelShape>, shapeId: number, idxInShape: number, sps: SolidParticleSystem, modelBoundingInfo?: Nullable<BoundingInfo>);
        /**
         * legacy support, changed scale to scaling
         */
        scale: Vector3;
        /**
         * legacy support, changed quaternion to rotationQuaternion
         */
        quaternion: Nullable<Quaternion>;
        /**
         * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
         * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
         * `target` is the object (solid particle or mesh) what the intersection is computed against.
         */
        intersectsMesh(target: Mesh | SolidParticle): boolean;
    }
    class ModelShape {
        shapeID: number;
        _shape: Vector3[];
        _shapeUV: number[];
        _indicesLength: number;
        _positionFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>;
        _vertexFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>;
        /**
         * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
         * SPS internal tool, don't use it manually.
         */
        constructor(id: number, shape: Vector3[], indicesLength: number, shapeUV: number[], posFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>, vtxFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>);
    }
    class DepthSortedParticle {
        ind: number;
        indicesLength: number;
        sqDistance: number;
    }
}

declare module BABYLON {
    /**
    * Full documentation here : http://doc.babylonjs.com/overviews/Solid_Particle_System
    */
    class SolidParticleSystem implements IDisposable {
        /**
        *  The SPS array of Solid Particle objects. Just access each particle as with any classic array.
        *  Example : var p = SPS.particles[i];
        */
        particles: SolidParticle[];
        /**
        * The SPS total number of particles. Read only. Use SPS.counter instead if you need to set your own value.
        */
        nbParticles: number;
        /**
        * If the particles must ever face the camera (default false). Useful for planar particles.
        */
        billboard: boolean;
        /**
         * Recompute normals when adding a shape
         */
        recomputeNormals: boolean;
        /**
        * This a counter ofr your own usage. It's not set by any SPS functions.
        */
        counter: number;
        /**
        * The SPS name. This name is also given to the underlying mesh.
        */
        name: string;
        /**
        * The SPS mesh. It's a standard BJS Mesh, so all the methods from the Mesh class are avalaible.
        */
        mesh: Mesh;
        /**
        * This empty object is intended to store some SPS specific or temporary values in order to lower the Garbage Collector activity.
        * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#garbage-collector-concerns
        */
        vars: any;
        /**
        * This array is populated when the SPS is set as 'pickable'.
        * Each key of this array is a `faceId` value that you can get from a pickResult object.
        * Each element of this array is an object `{idx: int, faceId: int}`.
        * `idx` is the picked particle index in the `SPS.particles` array
        * `faceId` is the picked face index counted within this particle.
        * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#pickable-particles
        */
        pickedParticles: {
            idx: number;
            faceId: number;
        }[];
        /**
        * This array is populated when `enableDepthSort` is set to true.
        * Each element of this array is an instance of the class DepthSortedParticle.
        */
        depthSortedParticles: DepthSortedParticle[];
        private _scene;
        private _positions;
        private _indices;
        private _normals;
        private _colors;
        private _uvs;
        private _indices32;
        private _positions32;
        private _normals32;
        private _fixedNormal32;
        private _colors32;
        private _uvs32;
        private _index;
        private _updatable;
        private _pickable;
        private _isVisibilityBoxLocked;
        private _alwaysVisible;
        private _depthSort;
        private _shapeCounter;
        private _copy;
        private _shape;
        private _shapeUV;
        private _color;
        private _computeParticleColor;
        private _computeParticleTexture;
        private _computeParticleRotation;
        private _computeParticleVertex;
        private _computeBoundingBox;
        private _depthSortParticles;
        private _cam_axisZ;
        private _cam_axisY;
        private _cam_axisX;
        private _axisZ;
        private _camera;
        private _particle;
        private _camDir;
        private _camInvertedPosition;
        private _rotMatrix;
        private _invertMatrix;
        private _rotated;
        private _quaternion;
        private _vertex;
        private _normal;
        private _yaw;
        private _pitch;
        private _roll;
        private _halfroll;
        private _halfpitch;
        private _halfyaw;
        private _sinRoll;
        private _cosRoll;
        private _sinPitch;
        private _cosPitch;
        private _sinYaw;
        private _cosYaw;
        private _mustUnrotateFixedNormals;
        private _minimum;
        private _maximum;
        private _minBbox;
        private _maxBbox;
        private _particlesIntersect;
        private _depthSortFunction;
        private _needs32Bits;
        _bSphereOnly: boolean;
        _bSphereRadiusFactor: number;
        /**
        * Creates a SPS (Solid Particle System) object.
        * `name` (String) is the SPS name, this will be the underlying mesh name.
        * `scene` (Scene) is the scene in which the SPS is added.
        * `updatable` (optional boolean, default true) : if the SPS must be updatable or immutable.
        * `isPickable` (optional boolean, default false) : if the solid particles must be pickable.
        * `enableDepthSort` (optional boolean, default false) : if the solid particles must be sorted in the geometry according to their distance to the camera.
        * `particleIntersection` (optional boolean, default false) : if the solid particle intersections must be computed.
        * `boundingSphereOnly` (optional boolean, default false) : if the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster).
        * `bSphereRadiusFactor` (optional float, default 1.0) : a number to multiply the boundind sphere radius by in order to reduce it for instance.
        *  Example : bSphereRadiusFactor = 1.0 / Math.sqrt(3.0) => the bounding sphere exactly matches a spherical mesh.
        */
        constructor(name: string, scene: Scene, options?: {
            updatable?: boolean;
            isPickable?: boolean;
            enableDepthSort?: boolean;
            particleIntersection?: boolean;
            boundingSphereOnly?: boolean;
            bSphereRadiusFactor?: number;
        });
        /**
        * Builds the SPS underlying mesh. Returns a standard Mesh.
        * If no model shape was added to the SPS, the returned mesh is just a single triangular plane.
        */
        buildMesh(): Mesh;
        /**
        * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.
        * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
        * Thus the particles generated from `digest()` have their property `position` set yet.
        * `mesh` ( Mesh ) is the mesh to be digested
        * `facetNb` (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
        * `delta` (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
        * `number` (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
        */
        digest(mesh: Mesh, options?: {
            facetNb?: number;
            number?: number;
            delta?: number;
        }): SolidParticleSystem;
        private _unrotateFixedNormals();
        private _resetCopy();
        private _meshBuilder(p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, meshNor, normals, idx, idxInShape, options);
        private _posToShape(positions);
        private _uvsToShapeUV(uvs);
        private _addParticle(idx, idxpos, idxind, model, shapeId, idxInShape, bInfo?);
        /**
        * Adds some particles to the SPS from the model shape. Returns the shape id.
        * Please read the doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#create-an-immutable-sps
        * `mesh` is any Mesh object that will be used as a model for the solid particles.
        * `nb` (positive integer) the number of particles to be created from this model
        * `positionFunction` is an optional javascript function to called for each particle on SPS creation.
        * `vertexFunction` is an optional javascript function to called for each vertex of each particle on SPS creation
        */
        addShape(mesh: Mesh, nb: number, options?: {
            positionFunction?: any;
            vertexFunction?: any;
        }): number;
        private _rebuildParticle(particle);
        /**
        * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
        * Returns the SPS.
        */
        rebuildMesh(): SolidParticleSystem;
        /**
        *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
        *  This method calls `updateParticle()` for each particle of the SPS.
        *  For an animated SPS, it is usually called within the render loop.
        * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
        * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
        * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
        * Returns the SPS.
        */
        setParticles(start?: number, end?: number, update?: boolean): SolidParticleSystem;
        private _quaternionRotationYPR();
        private _quaternionToRotationMatrix();
        /**
        * Disposes the SPS.
        * Returns nothing.
        */
        dispose(): void;
        /**
        * Visibilty helper : Recomputes the visible size according to the mesh bounding box
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        * Returns the SPS.
        */
        refreshVisibleSize(): SolidParticleSystem;
        /**
        * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
        * @param size the size (float) of the visibility box
        * note : this doesn't lock the SPS mesh bounding box.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        setVisibilityBox(size: number): void;
        /**
        * Sets the SPS as always visible or not
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        isAlwaysVisible: boolean;
        /**
        * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        isVisibilityBoxLocked: boolean;
        /**
        * Tells to `setParticles()` to compute the particle rotations or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
        */
        computeParticleRotation: boolean;
        /**
        * Tells to `setParticles()` to compute the particle colors or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
        */
        computeParticleColor: boolean;
        /**
        * Tells to `setParticles()` to compute the particle textures or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
        */
        computeParticleTexture: boolean;
        /**
        * Tells to `setParticles()` to call the vertex function for each vertex of each particle, or not.
        * Default value : false. The SPS is faster when it's set to false.
        * Note : the particle custom vertex positions aren't stored values.
        */
        computeParticleVertex: boolean;
        /**
        * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
        */
        computeBoundingBox: boolean;
        /**
        * Tells to `setParticles()` to sort or not the distance between each particle and the camera.
        * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
        * Default : `true`
        */
        depthSortParticles: boolean;
        /**
        * This function does nothing. It may be overwritten to set all the particle first values.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        initParticles(): void;
        /**
        * This function does nothing. It may be overwritten to recycle a particle.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        recycleParticle(particle: SolidParticle): SolidParticle;
        /**
        * Updates a particle : this function should  be overwritten by the user.
        * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        * ex : just set a particle position or velocity and recycle conditions
        */
        updateParticle(particle: SolidParticle): SolidParticle;
        /**
        * Updates a vertex of a particle : it can be overwritten by the user.
        * This will be called on each vertex particle by `setParticles()` if `computeParticleVertex` is set to true only.
        * @param particle the current particle
        * @param vertex the current index of the current particle
        * @param pt the index of the current vertex in the particle shape
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#update-each-particle-shape
        * ex : just set a vertex particle position
        */
        updateParticleVertex(particle: SolidParticle, vertex: Vector3, pt: number): Vector3;
        /**
        * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void;
        /**
        * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
        * This will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        afterUpdateParticles(start?: number, stop?: number, update?: boolean): void;
    }
}

declare module BABYLON {
    interface PhysicsImpostorJoint {
        mainImpostor: PhysicsImpostor;
        connectedImpostor: PhysicsImpostor;
        joint: PhysicsJoint;
    }
    class PhysicsEngine {
        private _physicsPlugin;
        gravity: Vector3;
        constructor(gravity: Nullable<Vector3>, _physicsPlugin?: IPhysicsEnginePlugin);
        setGravity(gravity: Vector3): void;
        /**
         * Set the time step of the physics engine.
         * default is 1/60.
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param {number} newTimeStep the new timestep to apply to this world.
         */
        setTimeStep(newTimeStep?: number): void;
        /**
         * Get the time step of the physics engine.
         */
        getTimeStep(): number;
        dispose(): void;
        getPhysicsPluginName(): string;
        static Epsilon: number;
        private _impostors;
        private _joints;
        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param {PhysicsImpostor} impostor the impostor to add
         */
        addImpostor(impostor: PhysicsImpostor): void;
        /**
         * Remove an impostor from the engine.
         * This impostor and its mesh will not longer be updated by the physics engine.
         * @param {PhysicsImpostor} impostor the impostor to remove
         */
        removeImpostor(impostor: PhysicsImpostor): void;
        /**
         * Add a joint to the physics engine
         * @param {PhysicsImpostor} mainImpostor the main impostor to which the joint is added.
         * @param {PhysicsImpostor} connectedImpostor the impostor that is connected to the main impostor using this joint
         * @param {PhysicsJoint} the joint that will connect both impostors.
         */
        addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;
        removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;
        /**
         * Called by the scene. no need to call it.
         */
        _step(delta: number): void;
        getPhysicsPlugin(): IPhysicsEnginePlugin;
        getImpostorForPhysicsObject(object: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;
        getImpostorWithPhysicsBody(body: any): Nullable<PhysicsImpostor>;
    }
    interface IPhysicsEnginePlugin {
        world: any;
        name: string;
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(joint: PhysicsImpostorJoint): void;
        removeJoint(joint: PhysicsImpostorJoint): void;
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        dispose(): void;
    }
}

declare module BABYLON {
    interface PhysicsImpostorParameters {
        mass: number;
        friction?: number;
        restitution?: number;
        nativeOptions?: any;
        ignoreParent?: boolean;
        disableBidirectionalTransformation?: boolean;
    }
    interface IPhysicsEnabledObject {
        position: Vector3;
        rotationQuaternion: Nullable<Quaternion>;
        scaling: Vector3;
        rotation?: Vector3;
        parent?: any;
        getBoundingInfo(): BoundingInfo;
        computeWorldMatrix(force: boolean): Matrix;
        getWorldMatrix?(): Matrix;
        getChildMeshes?(directDescendantsOnly?: boolean): Array<AbstractMesh>;
        getVerticesData(kind: string): Nullable<Array<number> | Float32Array>;
        getIndices?(): Nullable<IndicesArray>;
        getScene?(): Scene;
        getAbsolutePosition(): Vector3;
        getAbsolutePivotPoint(): Vector3;
        rotate(axis: Vector3, amount: number, space?: Space): TransformNode;
        translate(axis: Vector3, distance: number, space?: Space): TransformNode;
        setAbsolutePosition(absolutePosition: Vector3): TransformNode;
    }
    class PhysicsImpostor {
        object: IPhysicsEnabledObject;
        type: number;
        private _options;
        private _scene;
        static DEFAULT_OBJECT_SIZE: Vector3;
        static IDENTITY_QUATERNION: Quaternion;
        private _physicsEngine;
        private _physicsBody;
        private _bodyUpdateRequired;
        private _onBeforePhysicsStepCallbacks;
        private _onAfterPhysicsStepCallbacks;
        private _onPhysicsCollideCallbacks;
        private _deltaPosition;
        private _deltaRotation;
        private _deltaRotationConjugated;
        private _parent;
        private _isDisposed;
        private static _tmpVecs;
        private static _tmpQuat;
        readonly isDisposed: boolean;
        mass: number;
        friction: number;
        restitution: number;
        uniqueId: number;
        private _joints;
        constructor(object: IPhysicsEnabledObject, type: number, _options?: PhysicsImpostorParameters, _scene?: Scene | undefined);
        /**
         * This function will completly initialize this impostor.
         * It will create a new body - but only if this mesh has no parent.
         * If it has, this impostor will not be used other than to define the impostor
         * of the child mesh.
         */
        _init(): void;
        private _getPhysicsParent();
        /**
         * Should a new body be generated.
         */
        isBodyInitRequired(): boolean;
        setScalingUpdated(updated: boolean): void;
        /**
         * Force a regeneration of this or the parent's impostor's body.
         * Use under cautious - This will remove all joints already implemented.
         */
        forceUpdate(): void;
        /**
         * Gets the body that holds this impostor. Either its own, or its parent.
         */
        /**
         * Set the physics body. Used mainly by the physics engine/plugin
         */
        physicsBody: any;
        parent: Nullable<PhysicsImpostor>;
        resetUpdateFlags(): void;
        getObjectExtendSize(): Vector3;
        getObjectCenter(): Vector3;
        /**
         * Get a specific parametes from the options parameter.
         */
        getParam(paramName: string): any;
        /**
         * Sets a specific parameter in the options given to the physics plugin
         */
        setParam(paramName: string, value: number): void;
        /**
         * Specifically change the body's mass option. Won't recreate the physics body object
         */
        setMass(mass: number): void;
        getLinearVelocity(): Nullable<Vector3>;
        setLinearVelocity(velocity: Nullable<Vector3>): void;
        getAngularVelocity(): Nullable<Vector3>;
        setAngularVelocity(velocity: Nullable<Vector3>): void;
        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        executeNativeFunction(func: (world: any, physicsBody: any) => void): void;
        /**
         * Register a function that will be executed before the physics world is stepping forward.
         */
        registerBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        unregisterBeforePhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        /**
         * Register a function that will be executed after the physics step
         */
        registerAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        unregisterAfterPhysicsStep(func: (impostor: PhysicsImpostor) => void): void;
        /**
         * register a function that will be executed when this impostor collides against a different body.
         */
        registerOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor) => void): void;
        unregisterOnPhysicsCollide(collideAgainst: PhysicsImpostor | Array<PhysicsImpostor>, func: (collider: PhysicsImpostor, collidedAgainst: PhysicsImpostor | Array<PhysicsImpostor>) => void): void;
        private _tmpQuat;
        private _tmpQuat2;
        getParentsRotation(): Quaternion;
        /**
         * this function is executed by the physics engine.
         */
        beforeStep: () => void;
        /**
         * this function is executed by the physics engine.
         */
        afterStep: () => void;
        /**
         * Legacy collision detection event support
         */
        onCollideEvent: Nullable<(collider: BABYLON.PhysicsImpostor, collidedWith: BABYLON.PhysicsImpostor) => void>;
        onCollide: (e: {
            body: any;
        }) => void;
        /**
         * Apply a force
         */
        applyForce(force: Vector3, contactPoint: Vector3): PhysicsImpostor;
        /**
         * Apply an impulse
         */
        applyImpulse(force: Vector3, contactPoint: Vector3): PhysicsImpostor;
        /**
         * A help function to create a joint.
         */
        createJoint(otherImpostor: PhysicsImpostor, jointType: number, jointData: PhysicsJointData): PhysicsImpostor;
        /**
         * Add a joint to this impostor with a different impostor.
         */
        addJoint(otherImpostor: PhysicsImpostor, joint: PhysicsJoint): PhysicsImpostor;
        /**
         * Will keep this body still, in a sleep mode.
         */
        sleep(): PhysicsImpostor;
        /**
         * Wake the body up.
         */
        wakeUp(): PhysicsImpostor;
        clone(newObject: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;
        dispose(): void;
        setDeltaPosition(position: Vector3): void;
        setDeltaRotation(rotation: Quaternion): void;
        getBoxSizeToRef(result: Vector3): PhysicsImpostor;
        getRadius(): number;
        /**
         * Sync a bone with this impostor
         * @param bone The bone to sync to the impostor.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         */
        syncBoneWithImpostor(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion): void;
        /**
         * Sync impostor to a bone
         * @param bone The bone that the impostor will be synced to.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         * @param boneAxis Optional vector3 axis the bone is aligned with
         */
        syncImpostorWithBone(bone: Bone, boneMesh: AbstractMesh, jointPivot: Vector3, distToJoint?: number, adjustRotation?: Quaternion, boneAxis?: Vector3): void;
        static NoImpostor: number;
        static SphereImpostor: number;
        static BoxImpostor: number;
        static PlaneImpostor: number;
        static MeshImpostor: number;
        static CylinderImpostor: number;
        static ParticleImpostor: number;
        static HeightmapImpostor: number;
    }
}

declare module BABYLON {
    interface PhysicsJointData {
        mainPivot?: Vector3;
        connectedPivot?: Vector3;
        mainAxis?: Vector3;
        connectedAxis?: Vector3;
        collision?: boolean;
        nativeParams?: any;
    }
    /**
     * This is a holder class for the physics joint created by the physics plugin.
     * It holds a set of functions to control the underlying joint.
     */
    class PhysicsJoint {
        type: number;
        jointData: PhysicsJointData;
        private _physicsJoint;
        protected _physicsPlugin: IPhysicsEnginePlugin;
        constructor(type: number, jointData: PhysicsJointData);
        physicsJoint: any;
        physicsPlugin: IPhysicsEnginePlugin;
        /**
         * Execute a function that is physics-plugin specific.
         * @param {Function} func the function that will be executed.
         *                        It accepts two parameters: the physics world and the physics joint.
         */
        executeNativeFunction(func: (world: any, physicsJoint: any) => void): void;
        static DistanceJoint: number;
        static HingeJoint: number;
        static BallAndSocketJoint: number;
        static WheelJoint: number;
        static SliderJoint: number;
        static PrismaticJoint: number;
        static UniversalJoint: number;
        static Hinge2Joint: number;
        static PointToPointJoint: number;
        static SpringJoint: number;
        static LockJoint: number;
    }
    /**
     * A class representing a physics distance joint.
     */
    class DistanceJoint extends PhysicsJoint {
        constructor(jointData: DistanceJointData);
        /**
         * Update the predefined distance.
         */
        updateDistance(maxDistance: number, minDistance?: number): void;
    }
    class MotorEnabledJoint extends PhysicsJoint implements IMotorEnabledJoint {
        constructor(type: number, jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        setMotor(force?: number, maxForce?: number): void;
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        setLimit(upperLimit: number, lowerLimit?: number): void;
    }
    /**
     * This class represents a single hinge physics joint
     */
    class HingeJoint extends MotorEnabledJoint {
        constructor(jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        setMotor(force?: number, maxForce?: number): void;
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        setLimit(upperLimit: number, lowerLimit?: number): void;
    }
    /**
     * This class represents a dual hinge physics joint (same as wheel joint)
     */
    class Hinge2Joint extends MotorEnabledJoint {
        constructor(jointData: PhysicsJointData);
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        setMotor(force?: number, maxForce?: number, motorIndex?: number): void;
        /**
         * Set the motor limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} upperLimit the upper limit
         * @param {number} lowerLimit lower limit
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    }
    interface IMotorEnabledJoint {
        physicsJoint: any;
        setMotor(force?: number, maxForce?: number, motorIndex?: number): void;
        setLimit(upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    }
    interface DistanceJointData extends PhysicsJointData {
        maxDistance: number;
    }
    interface SpringJointData extends PhysicsJointData {
        length: number;
        stiffness: number;
        damping: number;
    }
}

declare module BABYLON {
    class ReflectionProbe {
        name: string;
        private _scene;
        private _renderTargetTexture;
        private _projectionMatrix;
        private _viewMatrix;
        private _target;
        private _add;
        private _attachedMesh;
        invertYAxis: boolean;
        position: Vector3;
        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean);
        samples: number;
        refreshRate: number;
        getScene(): Scene;
        readonly cubeTexture: RenderTargetTexture;
        readonly renderList: Nullable<AbstractMesh[]>;
        attachToMesh(mesh: AbstractMesh): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class AnaglyphPostProcess extends PostProcess {
        private _passedProcess;
        constructor(name: string, options: number | PostProcessOptions, rigCameras: Camera[], samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    class BlackAndWhitePostProcess extends PostProcess {
        degree: number;
        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    class BlurPostProcess extends PostProcess {
        direction: Vector2;
        protected _kernel: number;
        protected _idealKernel: number;
        protected _packedFloat: boolean;
        /**
         * Gets the length in pixels of the blur sample region
         */
        /**
         * Sets the length in pixels of the blur sample region
         */
        kernel: number;
        /**
         * Gets wether or not the blur is unpacking/repacking floats
         */
        /**
         * Sets wether or not the blur needs to unpack/repack floats
         */
        packedFloat: boolean;
        constructor(name: string, direction: Vector2, kernel: number, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType?: number);
        protected _updateParameters(): void;
        /**
         * Best kernels are odd numbers that when divided by 2, their integer part is even, so 5, 9 or 13.
         * Other odd kernels optimize correctly but require proportionally more samples, even kernels are
         * possible but will produce minor visual artifacts. Since each new kernel requires a new shader we
         * want to minimize kernel changes, having gaps between physical kernels is helpful in that regard.
         * The gaps between physical kernels are compensated for in the weighting of the samples
         * @param idealKernel Ideal blur kernel.
         * @return Nearest best kernel.
         */
        protected _nearestBestKernel(idealKernel: number): number;
        /**
         * Calculates the value of a Gaussian distribution with sigma 3 at a given point.
         * @param x The point on the Gaussian distribution to sample.
         * @return the value of the Gaussian function at x.
         */
        protected _gaussianWeight(x: number): number;
        /**
          * Generates a string that can be used as a floating point number in GLSL.
          * @param x Value to print.
          * @param decimalFigures Number of decimal places to print the number to (excluding trailing 0s).
          * @return GLSL float string.
          */
        protected _glslFloat(x: number, decimalFigures?: number): string;
    }
}

declare module BABYLON {
    class ColorCorrectionPostProcess extends PostProcess {
        private _colorTableTexture;
        constructor(name: string, colorTableUrl: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    class ConvolutionPostProcess extends PostProcess {
        kernel: number[];
        constructor(name: string, kernel: number[], options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        static EdgeDetect0Kernel: number[];
        static EdgeDetect1Kernel: number[];
        static EdgeDetect2Kernel: number[];
        static SharpenKernel: number[];
        static EmbossKernel: number[];
        static GaussianKernel: number[];
    }
}

declare module BABYLON {
    class DisplayPassPostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    class FilterPostProcess extends PostProcess {
        kernelMatrix: Matrix;
        constructor(name: string, kernelMatrix: Matrix, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    class FxaaPostProcess extends PostProcess {
        texelWidth: number;
        texelHeight: number;
        constructor(name: string, options: number | PostProcessOptions, camera?: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType?: number);
    }
}

declare module BABYLON {
    class HighlightsPostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType?: number);
    }
}

declare module BABYLON {
    class ImageProcessingPostProcess extends PostProcess {
        /**
         * Default configuration related to image processing available in the PBR Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>, doNotBuild?: boolean): void;
        /**
         * Gets Color curves setup used in the effect if colorCurvesEnabled is set to true .
         */
        /**
         * Sets Color curves setup used in the effect if colorCurvesEnabled is set to true .
         */
        colorCurves: Nullable<ColorCurves>;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        colorCurvesEnabled: boolean;
        /**
         * Gets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
         */
        /**
         * Sets Color grading LUT texture used in the effect if colorGradingEnabled is set to true.
         */
        colorGradingTexture: Nullable<BaseTexture>;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        colorGradingEnabled: boolean;
        /**
         * Gets exposure used in the effect.
         */
        /**
         * Sets exposure used in the effect.
         */
        exposure: number;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        toneMappingEnabled: boolean;
        /**
         * Gets contrast used in the effect.
         */
        /**
         * Sets contrast used in the effect.
         */
        contrast: number;
        /**
         * Gets Vignette stretch size.
         */
        /**
         * Sets Vignette stretch size.
         */
        vignetteStretch: number;
        /**
         * Gets Vignette centre X Offset.
         */
        /**
         * Sets Vignette centre X Offset.
         */
        vignetteCentreX: number;
        /**
         * Gets Vignette centre Y Offset.
         */
        /**
         * Sets Vignette centre Y Offset.
         */
        vignetteCentreY: number;
        /**
         * Gets Vignette weight or intensity of the vignette effect.
         */
        /**
         * Sets Vignette weight or intensity of the vignette effect.
         */
        vignetteWeight: number;
        /**
         * Gets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
         * if vignetteEnabled is set to true.
         */
        /**
         * Sets Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
         * if vignetteEnabled is set to true.
         */
        vignetteColor: Color4;
        /**
         * Gets Camera field of view used by the Vignette effect.
         */
        /**
         * Sets Camera field of view used by the Vignette effect.
         */
        vignetteCameraFov: number;
        /**
         * Gets the vignette blend mode allowing different kind of effect.
         */
        /**
         * Sets the vignette blend mode allowing different kind of effect.
         */
        vignetteBlendMode: number;
        /**
         * Gets wether the vignette effect is enabled.
         */
        /**
         * Sets wether the vignette effect is enabled.
         */
        vignetteEnabled: boolean;
        private _fromLinearSpace;
        /**
         * Gets wether the input of the processing is in Gamma or Linear Space.
         */
        /**
         * Sets wether the input of the processing is in Gamma or Linear Space.
         */
        fromLinearSpace: boolean;
        /**
         * Defines cache preventing GC.
         */
        private _defines;
        constructor(name: string, options: number | PostProcessOptions, camera?: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType?: number);
        getClassName(): string;
        protected _updateParameters(): void;
        dispose(camera?: Camera): void;
    }
}

declare module BABYLON {
    class PassPostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType?: number);
    }
}

declare module BABYLON {
    type PostProcessOptions = {
        width: number;
        height: number;
    };
    class PostProcess {
        name: string;
        width: number;
        height: number;
        renderTargetSamplingMode: number;
        clearColor: Color4;
        autoClear: boolean;
        alphaMode: number;
        alphaConstants: Color4;
        enablePixelPerfectMode: boolean;
        scaleMode: number;
        alwaysForcePOT: boolean;
        samples: number;
        adaptScaleToCurrentViewport: boolean;
        private _camera;
        private _scene;
        private _engine;
        private _options;
        private _reusable;
        private _textureType;
        _textures: SmartArray<InternalTexture>;
        _currentRenderTextureInd: number;
        private _effect;
        private _samplers;
        private _fragmentUrl;
        private _vertexUrl;
        private _parameters;
        private _scaleRatio;
        protected _indexParameters: any;
        private _shareOutputWithPostProcess;
        private _texelSize;
        private _forcedOutputTexture;
        /**
        * An event triggered when the postprocess is activated.
        * @type {BABYLON.Observable}
        */
        onActivateObservable: Observable<Camera>;
        private _onActivateObserver;
        onActivate: Nullable<(camera: Camera) => void>;
        /**
        * An event triggered when the postprocess changes its size.
        * @type {BABYLON.Observable}
        */
        onSizeChangedObservable: Observable<PostProcess>;
        private _onSizeChangedObserver;
        onSizeChanged: (postProcess: PostProcess) => void;
        /**
        * An event triggered when the postprocess applies its effect.
        * @type {BABYLON.Observable}
        */
        onApplyObservable: Observable<Effect>;
        private _onApplyObserver;
        onApply: (effect: Effect) => void;
        /**
        * An event triggered before rendering the postprocess
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<Effect>;
        private _onBeforeRenderObserver;
        onBeforeRender: (effect: Effect) => void;
        /**
        * An event triggered after rendering the postprocess
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Effect>;
        private _onAfterRenderObserver;
        onAfterRender: (efect: Effect) => void;
        outputTexture: InternalTexture;
        getCamera(): Camera;
        readonly texelSize: Vector2;
        constructor(name: string, fragmentUrl: string, parameters: Nullable<string[]>, samplers: Nullable<string[]>, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, defines?: Nullable<string>, textureType?: number, vertexUrl?: string, indexParameters?: any, blockCompilation?: boolean);
        getEngine(): Engine;
        getEffect(): Effect;
        shareOutputWith(postProcess: PostProcess): PostProcess;
        updateEffect(defines?: Nullable<string>, uniforms?: Nullable<string[]>, samplers?: Nullable<string[]>, indexParameters?: any, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): void;
        isReusable(): boolean;
        /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
        markTextureDirty(): void;
        activate(camera: Camera, sourceTexture?: Nullable<InternalTexture>, forceDepthStencil?: boolean): void;
        readonly isSupported: boolean;
        readonly aspectRatio: number;
        apply(): Nullable<Effect>;
        private _disposeTextures();
        dispose(camera?: Camera): void;
    }
}

declare module BABYLON {
    class PostProcessManager {
        private _scene;
        private _indexBuffer;
        private _vertexBuffers;
        constructor(scene: Scene);
        private _prepareBuffers();
        private _buildIndexBuffer();
        _rebuild(): void;
        _prepareFrame(sourceTexture?: Nullable<InternalTexture>, postProcesses?: Nullable<PostProcess[]>): boolean;
        directRender(postProcesses: PostProcess[], targetTexture?: Nullable<InternalTexture>, forceFullscreenViewport?: boolean): void;
        _finalizeFrame(doNotPresent?: boolean, targetTexture?: InternalTexture, faceIndex?: number, postProcesses?: PostProcess[], forceFullscreenViewport?: boolean): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class RefractionPostProcess extends PostProcess {
        color: Color3;
        depth: number;
        colorLevel: number;
        private _refRexture;
        constructor(name: string, refractionTextureUrl: string, color: Color3, depth: number, colorLevel: number, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        dispose(camera: Camera): void;
    }
}

declare module BABYLON {
    class StereoscopicInterlacePostProcess extends PostProcess {
        private _stepSize;
        private _passedProcess;
        constructor(name: string, rigCameras: Camera[], isStereoscopicHoriz: boolean, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}

declare module BABYLON {
    enum TonemappingOperator {
        Hable = 0,
        Reinhard = 1,
        HejiDawson = 2,
        Photographic = 3,
    }
    class TonemapPostProcess extends PostProcess {
        private _operator;
        exposureAdjustment: number;
        constructor(name: string, _operator: TonemappingOperator, exposureAdjustment: number, camera: Camera, samplingMode?: number, engine?: Engine, textureFormat?: number);
    }
}

declare module BABYLON {
    class VolumetricLightScatteringPostProcess extends PostProcess {
        private _volumetricLightScatteringPass;
        private _volumetricLightScatteringRTT;
        private _viewPort;
        private _screenCoordinates;
        private _cachedDefines;
        /**
        * If not undefined, the mesh position is computed from the attached node position
        * @type {{position: Vector3}}
        */
        attachedNode: {
            position: Vector3;
        };
        /**
        * Custom position of the mesh. Used if "useCustomMeshPosition" is set to "true"
        * @type {Vector3}
        */
        customMeshPosition: Vector3;
        /**
        * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
        * @type {boolean}
        */
        useCustomMeshPosition: boolean;
        /**
        * If the post-process should inverse the light scattering direction
        * @type {boolean}
        */
        invert: boolean;
        /**
        * The internal mesh used by the post-process
        * @type {boolean}
        */
        mesh: Mesh;
        useDiffuseColor: boolean;
        /**
        * Array containing the excluded meshes not rendered in the internal pass
        */
        excludedMeshes: AbstractMesh[];
        /**
        * Controls the overall intensity of the post-process
        * @type {number}
        */
        exposure: number;
        /**
        * Dissipates each sample's contribution in range [0, 1]
        * @type {number}
        */
        decay: number;
        /**
        * Controls the overall intensity of each sample
        * @type {number}
        */
        weight: number;
        /**
        * Controls the density of each sample
        * @type {number}
        */
        density: number;
        /**
         * @constructor
         * @param {string} name - The post-process name
         * @param {any} ratio - The size of the post-process and/or internal pass (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera} camera - The camera that the post-process will be attached to
         * @param {BABYLON.Mesh} mesh - The mesh used to create the light scattering
         * @param {number} samples - The post-process quality, default 100
         * @param {number} samplingMode - The post-process filtering mode
         * @param {BABYLON.Engine} engine - The babylon engine
         * @param {boolean} reusable - If the post-process is reusable
         * @param {BABYLON.Scene} scene - The constructor needs a scene reference to initialize internal components. If "camera" is null (RenderPipelineà, "scene" must be provided
         */
        constructor(name: string, ratio: any, camera: Camera, mesh?: Mesh, samples?: number, samplingMode?: number, engine?: Engine, reusable?: boolean, scene?: Scene);
        getClassName(): string;
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        setCustomMeshPosition(position: Vector3): void;
        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        getCustomMeshPosition(): Vector3;
        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        dispose(camera: Camera): void;
        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        getPass(): RenderTargetTexture;
        private _meshExcluded(mesh);
        private _createPass(scene, ratio);
        private _updateMeshScreenCoordinates(scene);
        /**
        * Creates a default mesh for the Volumeric Light Scattering post-process
        * @param {string} The mesh name
        * @param {BABYLON.Scene} The scene where to create the mesh
        * @return {BABYLON.Mesh} the default mesh
        */
        static CreateDefaultMesh(name: string, scene: Scene): Mesh;
    }
}

declare module BABYLON {
    class VRDistortionCorrectionPostProcess extends PostProcess {
        aspectRatio: number;
        private _isRightEye;
        private _distortionFactors;
        private _postProcessScaleFactor;
        private _lensCenterOffset;
        private _scaleIn;
        private _scaleFactor;
        private _lensCenter;
        constructor(name: string, camera: Camera, isRightEye: boolean, vrMetrics: VRCameraMetrics);
    }
}

declare module BABYLON {
    class BoundingBoxRenderer {
        frontColor: Color3;
        backColor: Color3;
        showBackLines: boolean;
        renderList: SmartArray<BoundingBox>;
        private _scene;
        private _colorShader;
        private _vertexBuffers;
        private _indexBuffer;
        constructor(scene: Scene);
        private _prepareRessources();
        private _createIndexBuffer();
        _rebuild(): void;
        reset(): void;
        render(): void;
        renderOcclusionBoundingBox(mesh: AbstractMesh): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class DepthRenderer {
        private _scene;
        private _depthMap;
        private _effect;
        private _cachedDefines;
        constructor(scene: Scene, type?: number);
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        getDepthMap(): RenderTargetTexture;
        dispose(): void;
    }
}

declare module BABYLON {
    class EdgesRenderer {
        edgesWidthScalerForOrthographic: number;
        edgesWidthScalerForPerspective: number;
        private _source;
        private _linesPositions;
        private _linesNormals;
        private _linesIndices;
        private _epsilon;
        private _indicesCount;
        private _lineShader;
        private _ib;
        private _buffers;
        private _checkVerticesInsteadOfIndices;
        constructor(source: AbstractMesh, epsilon?: number, checkVerticesInsteadOfIndices?: boolean);
        private _prepareRessources();
        _rebuild(): void;
        dispose(): void;
        private _processEdgeForAdjacencies(pa, pb, p0, p1, p2);
        private _processEdgeForAdjacenciesWithVertices(pa, pb, p0, p1, p2);
        private _checkEdge(faceIndex, edge, faceNormals, p0, p1);
        _generateEdgesLines(): void;
        render(): void;
    }
}

declare module BABYLON {
    class GeometryBufferRenderer {
        private _scene;
        private _multiRenderTarget;
        private _effect;
        private _ratio;
        private _cachedDefines;
        private _enablePosition;
        renderList: Mesh[];
        readonly isSupported: boolean;
        enablePosition: boolean;
        constructor(scene: Scene, ratio?: number);
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        getGBuffer(): MultiRenderTarget;
        dispose(): void;
        private _createRenderTargets();
    }
}

declare module BABYLON {
    class OutlineRenderer {
        private _scene;
        private _effect;
        private _cachedDefines;
        zOffset: number;
        constructor(scene: Scene);
        render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay?: boolean): void;
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
    }
}

declare module BABYLON {
    class RenderingGroup {
        index: number;
        private _scene;
        private _opaqueSubMeshes;
        private _transparentSubMeshes;
        private _alphaTestSubMeshes;
        private _depthOnlySubMeshes;
        private _particleSystems;
        private _spriteManagers;
        private _opaqueSortCompareFn;
        private _alphaTestSortCompareFn;
        private _transparentSortCompareFn;
        private _renderOpaque;
        private _renderAlphaTest;
        private _renderTransparent;
        private _edgesRenderers;
        onBeforeTransparentRendering: () => void;
        /**
         * Set the opaque sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Set the alpha test sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Set the transparent sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Creates a new rendering group.
         * @param index The rendering group index
         * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
         * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
         * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
         */
        constructor(index: number, scene: Scene, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>);
        /**
         * Render all the sub meshes contained in the group.
         * @param customRenderFunction Used to override the default render behaviour of the group.
         * @returns true if rendered some submeshes.
         */
        render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>, renderSprites: boolean, renderParticles: boolean, activeMeshes: Nullable<AbstractMesh[]>): void;
        /**
         * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderOpaqueSorted(subMeshes);
        /**
         * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderAlphaTestSorted(subMeshes);
        /**
         * Renders the opaque submeshes in the order from the transparentSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderTransparentSorted(subMeshes);
        /**
         * Renders the submeshes in a specified order.
         * @param subMeshes The submeshes to sort before render
         * @param sortCompareFn The comparison function use to sort
         * @param cameraPosition The camera position use to preprocess the submeshes to help sorting
         * @param transparent Specifies to activate blending if true
         */
        private static renderSorted(subMeshes, sortCompareFn, camera, transparent);
        /**
         * Renders the submeshes in the order they were dispatched (no sort applied).
         * @param subMeshes The submeshes to render
         */
        private static renderUnsorted(subMeshes);
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front if in the same alpha index.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static defaultTransparentSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static backToFrontSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered front to back (prevent overdraw).
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static frontToBackSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Resets the different lists of submeshes to prepare a new frame.
         */
        prepare(): void;
        dispose(): void;
        /**
         * Inserts the submesh in its correct queue depending on its material.
         * @param subMesh The submesh to dispatch
         */
        dispatch(subMesh: SubMesh): void;
        dispatchSprites(spriteManager: SpriteManager): void;
        dispatchParticles(particleSystem: IParticleSystem): void;
        private _renderParticles(activeMeshes);
        private _renderSprites();
    }
}

declare module BABYLON {
    class RenderingManager {
        /**
         * The max id used for rendering groups (not included)
         */
        static MAX_RENDERINGGROUPS: number;
        /**
         * The min id used for rendering groups (included)
         */
        static MIN_RENDERINGGROUPS: number;
        /**
         * Used to globally prevent autoclearing scenes.
         */
        static AUTOCLEAR: boolean;
        private _scene;
        private _renderingGroups;
        private _depthStencilBufferAlreadyCleaned;
        private _currentIndex;
        private _autoClearDepthStencil;
        private _customOpaqueSortCompareFn;
        private _customAlphaTestSortCompareFn;
        private _customTransparentSortCompareFn;
        private _renderinGroupInfo;
        constructor(scene: Scene);
        private _clearDepthStencilBuffer(depth?, stencil?);
        render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>, activeMeshes: Nullable<AbstractMesh[]>, renderParticles: boolean, renderSprites: boolean): void;
        reset(): void;
        dispose(): void;
        private _prepareRenderingGroup(renderingGroupId);
        dispatchSprites(spriteManager: SpriteManager): void;
        dispatchParticles(particleSystem: IParticleSystem): void;
        dispatch(subMesh: SubMesh): void;
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         * @param depth Automatically clears depth between groups if true and autoClear is true.
         * @param stencil Automatically clears stencil between groups if true and autoClear is true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth?: boolean, stencil?: boolean): void;
    }
}

declare module BABYLON {
    class Sprite {
        name: string;
        position: Vector3;
        color: Color4;
        width: number;
        height: number;
        angle: number;
        cellIndex: number;
        invertU: number;
        invertV: number;
        disposeWhenFinishedAnimating: boolean;
        animations: Animation[];
        isPickable: boolean;
        actionManager: ActionManager;
        private _animationStarted;
        private _loopAnimation;
        private _fromIndex;
        private _toIndex;
        private _delay;
        private _direction;
        private _manager;
        private _time;
        private _onAnimationEnd;
        size: number;
        constructor(name: string, manager: SpriteManager);
        playAnimation(from: number, to: number, loop: boolean, delay: number, onAnimationEnd: () => void): void;
        stopAnimation(): void;
        _animate(deltaTime: number): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class SpriteManager {
        name: string;
        sprites: Sprite[];
        renderingGroupId: number;
        layerMask: number;
        fogEnabled: boolean;
        isPickable: boolean;
        cellWidth: number;
        cellHeight: number;
        /**
        * An event triggered when the manager is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<SpriteManager>;
        private _onDisposeObserver;
        onDispose: () => void;
        private _capacity;
        private _spriteTexture;
        private _epsilon;
        private _scene;
        private _vertexData;
        private _buffer;
        private _vertexBuffers;
        private _indexBuffer;
        private _effectBase;
        private _effectFog;
        texture: Texture;
        constructor(name: string, imgUrl: string, capacity: number, cellSize: any, scene: Scene, epsilon?: number, samplingMode?: number);
        private _appendSpriteVertex(index, sprite, offsetX, offsetY, rowSize);
        intersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean): Nullable<PickingInfo>;
        render(): void;
        dispose(): void;
    }
}

declare module BABYLON.Internals {
    class _AlphaState {
        private _isAlphaBlendDirty;
        private _isBlendFunctionParametersDirty;
        private _isBlendEquationParametersDirty;
        private _isBlendConstantsDirty;
        private _alphaBlend;
        private _blendFunctionParameters;
        private _blendEquationParameters;
        private _blendConstants;
        /**
         * Initializes the state.
         */
        constructor();
        readonly isDirty: boolean;
        alphaBlend: boolean;
        setAlphaBlendConstants(r: number, g: number, b: number, a: number): void;
        setAlphaBlendFunctionParameters(value0: number, value1: number, value2: number, value3: number): void;
        setAlphaEquationParameters(rgb: number, alpha: number): void;
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module BABYLON.Internals {
    class _DepthCullingState {
        private _isDepthTestDirty;
        private _isDepthMaskDirty;
        private _isDepthFuncDirty;
        private _isCullFaceDirty;
        private _isCullDirty;
        private _isZOffsetDirty;
        private _depthTest;
        private _depthMask;
        private _depthFunc;
        private _cull;
        private _cullFace;
        private _zOffset;
        /**
         * Initializes the state.
         */
        constructor();
        readonly isDirty: boolean;
        zOffset: number;
        cullFace: Nullable<number>;
        cull: Nullable<boolean>;
        depthFunc: Nullable<number>;
        depthMask: boolean;
        depthTest: boolean;
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module BABYLON.Internals {
    class _StencilState {
        private _isStencilTestDirty;
        private _isStencilMaskDirty;
        private _isStencilFuncDirty;
        private _isStencilOpDirty;
        private _stencilTest;
        private _stencilMask;
        private _stencilFunc;
        private _stencilFuncRef;
        private _stencilFuncMask;
        private _stencilOpStencilFail;
        private _stencilOpDepthFail;
        private _stencilOpStencilDepthPass;
        readonly isDirty: boolean;
        stencilFunc: number;
        stencilFuncRef: number;
        stencilFuncMask: number;
        stencilOpStencilFail: number;
        stencilOpDepthFail: number;
        stencilOpStencilDepthPass: number;
        stencilMask: number;
        stencilTest: boolean;
        constructor();
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module BABYLON.Internals {
    class AndOrNotEvaluator {
        static Eval(query: string, evaluateCallback: (val: any) => boolean): boolean;
        private static _HandleParenthesisContent(parenthesisContent, evaluateCallback);
        private static _SimplifyNegation(booleanString);
    }
}

declare module BABYLON {
    enum AssetTaskState {
        INIT = 0,
        RUNNING = 1,
        DONE = 2,
        ERROR = 3,
    }
    interface IAssetTask<T extends AbstractAssetTask> {
        onSuccess: (task: T) => void;
        onError: (task: T, message?: string, exception?: any) => void;
        isCompleted: boolean;
        name: string;
        taskState: AssetTaskState;
        errorObject: {
            message?: string;
            exception?: any;
        };
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    abstract class AbstractAssetTask implements IAssetTask<AbstractAssetTask> {
        name: string;
        constructor(name: string);
        onSuccess: (task: this) => void;
        onError: (task: this, message?: string, exception?: any) => void;
        isCompleted: boolean;
        taskState: AssetTaskState;
        errorObject: {
            message?: string;
            exception?: any;
        };
        run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
        private onErrorCallback(onError, message?, exception?);
        private onDoneCallback(onSuccess, onError);
    }
    interface IAssetsProgressEvent {
        remainingCount: number;
        totalCount: number;
        task: AbstractAssetTask;
    }
    class AssetsProgressEvent implements IAssetsProgressEvent {
        remainingCount: number;
        totalCount: number;
        task: AbstractAssetTask;
        constructor(remainingCount: number, totalCount: number, task: AbstractAssetTask);
    }
    class MeshAssetTask extends AbstractAssetTask implements IAssetTask<MeshAssetTask> {
        name: string;
        meshesNames: any;
        rootUrl: string;
        sceneFilename: string;
        loadedMeshes: Array<AbstractMesh>;
        loadedParticleSystems: Array<ParticleSystem>;
        loadedSkeletons: Array<Skeleton>;
        constructor(name: string, meshesNames: any, rootUrl: string, sceneFilename: string);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class TextFileAssetTask extends AbstractAssetTask implements IAssetTask<TextFileAssetTask> {
        name: string;
        url: string;
        text: string;
        constructor(name: string, url: string);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class BinaryFileAssetTask extends AbstractAssetTask implements IAssetTask<BinaryFileAssetTask> {
        name: string;
        url: string;
        data: ArrayBuffer;
        constructor(name: string, url: string);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class ImageAssetTask extends AbstractAssetTask implements IAssetTask<ImageAssetTask> {
        name: string;
        url: string;
        image: HTMLImageElement;
        constructor(name: string, url: string);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    interface ITextureAssetTask<TEX extends BaseTexture, T extends AbstractAssetTask> extends IAssetTask<T> {
        texture: TEX;
    }
    class TextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<Texture, TextureAssetTask> {
        name: string;
        url: string;
        noMipmap: boolean | undefined;
        invertY: boolean | undefined;
        samplingMode: number;
        texture: Texture;
        constructor(name: string, url: string, noMipmap?: boolean | undefined, invertY?: boolean | undefined, samplingMode?: number);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class CubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<CubeTexture, CubeTextureAssetTask> {
        name: string;
        url: string;
        extensions: string[] | undefined;
        noMipmap: boolean | undefined;
        files: string[] | undefined;
        texture: CubeTexture;
        constructor(name: string, url: string, extensions?: string[] | undefined, noMipmap?: boolean | undefined, files?: string[] | undefined);
        runTask(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class HDRCubeTextureAssetTask extends AbstractAssetTask implements ITextureAssetTask<HDRCubeTexture, HDRCubeTextureAssetTask> {
        name: string;
        url: string;
        size: number | undefined;
        noMipmap: boolean;
        generateHarmonics: boolean;
        useInGammaSpace: boolean;
        usePMREMGenerator: boolean;
        texture: HDRCubeTexture;
        constructor(name: string, url: string, size?: number | undefined, noMipmap?: boolean, generateHarmonics?: boolean, useInGammaSpace?: boolean, usePMREMGenerator?: boolean);
        run(scene: Scene, onSuccess: () => void, onError: (message?: string, exception?: any) => void): void;
    }
    class AssetsManager {
        private _scene;
        protected tasks: AbstractAssetTask[];
        protected waitingTasksCount: number;
        onFinish: (tasks: IAssetTask<AbstractAssetTask>[]) => void;
        onTaskSuccess: (task: IAssetTask<AbstractAssetTask>) => void;
        onTaskError: (task: IAssetTask<AbstractAssetTask>) => void;
        onProgress: (remainingCount: number, totalCount: number, task: IAssetTask<AbstractAssetTask>) => void;
        onTaskSuccessObservable: Observable<IAssetTask<AbstractAssetTask>>;
        onTaskErrorObservable: Observable<IAssetTask<AbstractAssetTask>>;
        onTasksDoneObservable: Observable<IAssetTask<AbstractAssetTask>[]>;
        onProgressObservable: Observable<IAssetsProgressEvent>;
        useDefaultLoadingScreen: boolean;
        constructor(scene: Scene);
        addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): MeshAssetTask;
        addTextFileTask(taskName: string, url: string): TextFileAssetTask;
        addBinaryFileTask(taskName: string, url: string): BinaryFileAssetTask;
        addImageTask(taskName: string, url: string): ImageAssetTask;
        addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number): TextureAssetTask;
        addCubeTextureTask(name: string, url: string, extensions?: string[], noMipmap?: boolean, files?: string[]): CubeTextureAssetTask;
        addHDRCubeTextureTask(name: string, url: string, size?: number, noMipmap?: boolean, generateHarmonics?: boolean, useInGammaSpace?: boolean, usePMREMGenerator?: boolean): HDRCubeTextureAssetTask;
        private _decreaseWaitingTasksCount(task);
        private _runTask(task);
        reset(): AssetsManager;
        load(): AssetsManager;
    }
}

declare module BABYLON {
    class Database {
        private callbackManifestChecked;
        private currentSceneUrl;
        private db;
        private _enableSceneOffline;
        private _enableTexturesOffline;
        private manifestVersionFound;
        private mustUpdateRessources;
        private hasReachedQuota;
        private isSupported;
        private idbFactory;
        static IsUASupportingBlobStorage: boolean;
        static IDBStorageEnabled: boolean;
        readonly enableSceneOffline: boolean;
        readonly enableTexturesOffline: boolean;
        constructor(urlToScene: string, callbackManifestChecked: (checked: boolean) => any);
        static parseURL: (url: string) => string;
        static ReturnFullUrlLocation: (url: string) => string;
        checkManifestFile(): void;
        openAsync(successCallback: () => void, errorCallback: () => void): void;
        loadImageFromDB(url: string, image: HTMLImageElement): void;
        private _loadImageFromDBAsync(url, image, notInDBCallback);
        private _saveImageIntoDBAsync(url, image);
        private _checkVersionFromDB(url, versionLoaded);
        private _loadVersionFromDBAsync(url, callback, updateInDBCallback);
        private _saveVersionIntoDBAsync(url, callback);
        loadFileFromDB(url: string, sceneLoaded: (data: any) => void, progressCallBack?: (data: any) => void, errorCallback?: () => void, useArrayBuffer?: boolean): void;
        private _loadFileFromDBAsync(url, callback, notInDBCallback, useArrayBuffer?);
        private _saveFileIntoDBAsync(url, callback, progressCallback?, useArrayBuffer?);
    }
}

declare module BABYLON.Internals {
    interface DDSInfo {
        width: number;
        height: number;
        mipmapCount: number;
        isFourCC: boolean;
        isRGB: boolean;
        isLuminance: boolean;
        isCube: boolean;
        isCompressed: boolean;
        dxgiFormat: number;
        textureType: number;
    }
    class DDSTools {
        static StoreLODInAlphaChannel: boolean;
        static GetDDSInfo(arrayBuffer: any): DDSInfo;
        private static _FloatView;
        private static _Int32View;
        private static _ToHalfFloat(value);
        private static _FromHalfFloat(value);
        private static _GetHalfFloatAsFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, lod);
        private static _GetHalfFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, lod);
        private static _GetFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, lod);
        private static _GetFloatAsUIntRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, lod);
        private static _GetHalfFloatAsUIntRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, lod);
        private static _GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static _GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static _GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        static UploadDDSLevels(engine: Engine, gl: WebGLRenderingContext, arrayBuffer: any, info: DDSInfo, loadMipmaps: boolean, faces: number, lodIndex?: number): void;
    }
}

declare module BABYLON {
    function expandToProperty(callback: string, targetKey?: Nullable<string>): (target: any, propertyKey: string) => void;
    function serialize(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsTexture(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColor3(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsFresnelParameters(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsVector2(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsVector3(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsMeshReference(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColorCurves(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColor4(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsImageProcessingConfiguration(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    class SerializationHelper {
        static Serialize<T>(entity: T, serializationObject?: any): any;
        static Parse<T>(creationFunction: () => T, source: any, scene: Nullable<Scene>, rootUrl?: Nullable<string>): T;
        static Clone<T>(creationFunction: () => T, source: T): T;
        static Instanciate<T>(creationFunction: () => T, source: T): T;
    }
}

declare module Earcut {
    /**
     * The fastest and smallest JavaScript polygon triangulation library for your WebGL apps
     * @param data is a flat array of vertice coordinates like [x0, y0, x1, y1, x2, y2, ...].
     * @param holeIndices is an array of hole indices if any (e.g. [5, 8] for a 12- vertice input would mean one hole with vertices 5–7 and another with 8–11).
     * @param dim is the number of coordinates per vertice in the input array (2 by default).
     */
    function earcut(data: number[], holeIndices: number[], dim: number): Array<number>;
    /**
     * return a percentage difference between the polygon area and its triangulation area;
     * used to verify correctness of triangulation
     */
    function deviation(data: number[], holeIndices: number[], dim: number, triangles: number[]): number;
    /**
     *  turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
     */
    function flatten(data: number[][][]): {
        vertices: number[];
        holes: number[];
        dimensions: number;
    };
}

declare module BABYLON {
    class FilesInput {
        static FilesToLoad: {
            [key: string]: File;
        };
        onProcessFileCallback: (file: File, name: string, extension: string) => true;
        private _engine;
        private _currentScene;
        private _sceneLoadedCallback;
        private _progressCallback;
        private _additionalRenderLoopLogicCallback;
        private _textureLoadingCallback;
        private _startingProcessingFilesCallback;
        private _onReloadCallback;
        private _errorCallback;
        private _elementToMonitor;
        private _sceneFileToLoad;
        private _filesToLoad;
        constructor(engine: Engine, scene: Scene, sceneLoadedCallback: (sceneFile: File, scene: Scene) => void, progressCallback: (progress: ProgressEvent) => void, additionalRenderLoopLogicCallback: () => void, textureLoadingCallback: (remaining: number) => void, startingProcessingFilesCallback: () => void, onReloadCallback: (sceneFile: File) => void, errorCallback: (sceneFile: File, scene: Scene, message: string) => void);
        private _dragEnterHandler;
        private _dragOverHandler;
        private _dropHandler;
        monitorElementForDragNDrop(elementToMonitor: HTMLElement): void;
        dispose(): void;
        private renderFunction();
        private drag(e);
        private drop(eventDrop);
        private _traverseFolder(folder, files, remaining, callback);
        private _processFiles(files);
        loadFiles(event: any): void;
        reload(): void;
    }
}

declare module BABYLON.Internals {
    /**
     * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
     * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
     */
    class KhronosTextureContainer {
        arrayBuffer: any;
        static HEADER_LEN: number;
        static COMPRESSED_2D: number;
        static COMPRESSED_3D: number;
        static TEX_2D: number;
        static TEX_3D: number;
        glType: number;
        glTypeSize: number;
        glFormat: number;
        glInternalFormat: number;
        glBaseInternalFormat: number;
        pixelWidth: number;
        pixelHeight: number;
        pixelDepth: number;
        numberOfArrayElements: number;
        numberOfFaces: number;
        numberOfMipmapLevels: number;
        bytesOfKeyValueData: number;
        loadType: number;
        /**
         * @param {ArrayBuffer} arrayBuffer- contents of the KTX container file
         * @param {number} facesExpected- should be either 1 or 6, based whether a cube texture or or
         * @param {boolean} threeDExpected- provision for indicating that data should be a 3D texture, not implemented
         * @param {boolean} textureArrayExpected- provision for indicating that data should be a texture array, not implemented
         */
        constructor(arrayBuffer: any, facesExpected: number, threeDExpected?: boolean, textureArrayExpected?: boolean);
        switchEndainness(val: number): number;
        /**
         * It is assumed that the texture has already been created & is currently bound
         */
        uploadLevels(gl: WebGLRenderingContext, loadMipmaps: boolean): void;
        private _upload2DCompressedLevels(gl, loadMipmaps);
    }
}

declare module BABYLON {
    /**
     * A class serves as a medium between the observable and its observers
     */
    class EventState {
        /**
        * If the callback of a given Observer set skipNextObservers to true the following observers will be ignored
        */
        constructor(mask: number, skipNextObservers?: boolean, target?: any, currentTarget?: any);
        initalize(mask: number, skipNextObservers?: boolean, target?: any, currentTarget?: any): EventState;
        /**
         * An Observer can set this property to true to prevent subsequent observers of being notified
         */
        skipNextObservers: boolean;
        /**
         * Get the mask value that were used to trigger the event corresponding to this EventState object
         */
        mask: number;
        /**
         * The object that originally notified the event
         */
        target?: any;
        /**
         * The current object in the bubbling phase
         */
        currentTarget?: any;
    }
    /**
     * Represent an Observer registered to a given Observable object.
     */
    class Observer<T> {
        callback: (eventData: Nullable<T>, eventState: EventState) => void;
        mask: number;
        scope: any;
        constructor(callback: (eventData: Nullable<T>, eventState: EventState) => void, mask: number, scope?: any);
    }
    /**
     * Represent a list of observers registered to multiple Observables object.
     */
    class MultiObserver<T> {
        private _observers;
        private _observables;
        dispose(): void;
        static Watch<T>(observables: Observable<T>[], callback: (eventData: T, eventState: EventState) => void, mask?: number, scope?: any): MultiObserver<T>;
    }
    /**
     * The Observable class is a simple implementation of the Observable pattern.
     * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
     * This enable a more fine grained execution without having to rely on multiple different Observable objects.
     * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
     * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
     */
    class Observable<T> {
        _observers: Observer<T>[];
        private _eventState;
        private _onObserverAdded;
        constructor(onObserverAdded?: (observer: Observer<T>) => void);
        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         * @param mask the mask used to filter observers
         * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
         * @param scope optional scope for the callback to be called from
         */
        add(callback: (eventData: T, eventState: EventState) => void, mask?: number, insertFirst?: boolean, scope?: any): Nullable<Observer<T>>;
        /**
         * Remove an Observer from the Observable object
         * @param observer the instance of the Observer to remove. If it doesn't belong to this Observable, false will be returned.
         */
        remove(observer: Nullable<Observer<T>>): boolean;
        /**
         * Remove a callback from the Observable object
         * @param callback the callback to remove. If it doesn't belong to this Observable, false will be returned.
        */
        removeCallback(callback: (eventData: T, eventState: EventState) => void): boolean;
        /**
         * Notify all Observers by calling their respective callback with the given data
         * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
         * @param eventData
         * @param mask
         */
        notifyObservers(eventData: Nullable<T>, mask?: number, target?: any, currentTarget?: any): boolean;
        /**
         * Notify a specific observer
         * @param eventData
         * @param mask
         */
        notifyObserver(observer: Observer<T>, eventData: T, mask?: number): void;
        /**
         * return true is the Observable has at least one Observer registered
         */
        hasObservers(): boolean;
        /**
        * Clear the list of observers
        */
        clear(): void;
        /**
        * Clone the current observable
        */
        clone(): Observable<T>;
        /**
         * Does this observable handles observer registered with a given mask
         * @param {number} trigger - the mask to be tested
         * @return {boolean} whether or not one observer registered with the given mask is handeled
        **/
        hasSpecificMask(mask?: number): boolean;
    }
}

declare namespace BABYLON {
    /**
     * Performance monitor tracks rolling average frame-time and frame-time variance over a user defined sliding-window
     */
    class PerformanceMonitor {
        private _enabled;
        private _rollingFrameTime;
        private _lastFrameTimeMs;
        private _lastChangeTimeMs;
        /**
         * constructor
         * @param frameSampleSize The number of samples required to saturate the sliding window
         */
        constructor(frameSampleSize?: number);
        /**
         * Samples current frame
         * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
         */
        sampleFrame(timeMs?: number): void;
        /**
         * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
         * @return Average frame time in milliseconds
         */
        readonly averageFrameTime: number;
        /**
         * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
         * @return Frame time variance in milliseconds squared
         */
        readonly averageFrameTimeVariance: number;
        /**
         * Returns the frame time of the most recent frame
         * @return Frame time in milliseconds
         */
        readonly instantaneousFrameTime: number;
        /**
         * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
         * @return Framerate in frames per second
         */
        readonly averageFPS: number;
        /**
         * Returns the average framerate in frames per second using the most recent frame time
         * @return Framerate in frames per second
         */
        readonly instantaneousFPS: number;
        /**
         * Returns true if enough samples have been taken to completely fill the sliding window
         * @return true if saturated
         */
        readonly isSaturated: boolean;
        /**
         * Enables contributions to the sliding window sample set
         */
        enable(): void;
        /**
         * Disables contributions to the sliding window sample set
         * Samples will not be interpolated over the disabled period
         */
        disable(): void;
        /**
         * Returns true if sampling is enabled
         * @return true if enabled
         */
        readonly isEnabled: boolean;
        /**
         * Resets performance monitor
         */
        reset(): void;
    }
    /**
     * RollingAverage
     *
     * Utility to efficiently compute the rolling average and variance over a sliding window of samples
     */
    class RollingAverage {
        /**
         * Current average
         */
        average: number;
        /**
         * Current variance
         */
        variance: number;
        protected _samples: Array<number>;
        protected _sampleCount: number;
        protected _pos: number;
        protected _m2: number;
        /**
         * constructor
         * @param length The number of samples required to saturate the sliding window
         */
        constructor(length: number);
        /**
         * Adds a sample to the sample set
         * @param v The sample value
         */
        add(v: number): void;
        /**
         * Returns previously added values or null if outside of history or outside the sliding window domain
         * @param i Index in history. For example, pass 0 for the most recent value and 1 for the value before that
         * @return Value previously recorded with add() or null if outside of range
         */
        history(i: number): number;
        /**
         * Returns true if enough samples have been taken to completely fill the sliding window
         * @return true if sample-set saturated
         */
        isSaturated(): boolean;
        /**
         * Resets the rolling average (equivalent to 0 samples taken so far)
         */
        reset(): void;
        /**
         * Wraps a value around the sample range boundaries
         * @param i Position in sample range, for example if the sample length is 5, and i is -3, then 2 will be returned.
         * @return Wrapped position in sample range
         */
        protected _wrapPosition(i: number): number;
    }
}

declare module BABYLON {
    class SceneOptimization {
        priority: number;
        apply: (scene: Scene) => boolean;
        constructor(priority?: number);
    }
    class TextureOptimization extends SceneOptimization {
        priority: number;
        maximumSize: number;
        constructor(priority?: number, maximumSize?: number);
        apply: (scene: Scene) => boolean;
    }
    class HardwareScalingOptimization extends SceneOptimization {
        priority: number;
        maximumScale: number;
        private _currentScale;
        constructor(priority?: number, maximumScale?: number);
        apply: (scene: Scene) => boolean;
    }
    class ShadowsOptimization extends SceneOptimization {
        apply: (scene: Scene) => boolean;
    }
    class PostProcessesOptimization extends SceneOptimization {
        apply: (scene: Scene) => boolean;
    }
    class LensFlaresOptimization extends SceneOptimization {
        apply: (scene: Scene) => boolean;
    }
    class ParticlesOptimization extends SceneOptimization {
        apply: (scene: Scene) => boolean;
    }
    class RenderTargetsOptimization extends SceneOptimization {
        apply: (scene: Scene) => boolean;
    }
    class MergeMeshesOptimization extends SceneOptimization {
        static _UpdateSelectionTree: boolean;
        static UpdateSelectionTree: boolean;
        private _canBeMerged;
        apply: (scene: Scene, updateSelectionTree?: boolean | undefined) => boolean;
    }
    class SceneOptimizerOptions {
        targetFrameRate: number;
        trackerDuration: number;
        optimizations: SceneOptimization[];
        constructor(targetFrameRate?: number, trackerDuration?: number);
        static LowDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
    }
    class SceneOptimizer {
        static _CheckCurrentState(scene: Scene, options: SceneOptimizerOptions, currentPriorityLevel: number, onSuccess?: () => void, onFailure?: () => void): void;
        static OptimizeAsync(scene: Scene, options?: SceneOptimizerOptions, onSuccess?: () => void, onFailure?: () => void): void;
    }
}

declare module BABYLON {
    class SceneSerializer {
        static ClearCache(): void;
        static Serialize(scene: Scene): any;
        static SerializeMesh(toSerialize: any, withParents?: boolean, withChildren?: boolean): any;
    }
}

declare module BABYLON {
    class SmartArray<T> {
        data: Array<T>;
        length: number;
        protected _id: number;
        [index: number]: T;
        constructor(capacity: number);
        push(value: T): void;
        forEach(func: (content: T) => void): void;
        sort(compareFn: (a: T, b: T) => number): void;
        reset(): void;
        dispose(): void;
        concat(array: any): void;
        indexOf(value: T): number;
        contains(value: T): boolean;
        private static _GlobalId;
    }
    class SmartArrayNoDuplicate<T> extends SmartArray<T> {
        private _duplicateId;
        [index: number]: T;
        push(value: T): void;
        pushNoDuplicate(value: T): boolean;
        reset(): void;
        concatWithNoDuplicate(array: any): void;
    }
}

declare module BABYLON {
    /**
     * This class implement a typical dictionary using a string as key and the generic type T as value.
     * The underlying implementation relies on an associative array to ensure the best performances.
     * The value can be anything including 'null' but except 'undefined'
     */
    class StringDictionary<T> {
        /**
         * This will clear this dictionary and copy the content from the 'source' one.
         * If the T value is a custom object, it won't be copied/cloned, the same object will be used
         * @param source the dictionary to take the content from and copy to this dictionary
         */
        copyFrom(source: StringDictionary<T>): void;
        /**
         * Get a value based from its key
         * @param key the given key to get the matching value from
         * @return the value if found, otherwise undefined is returned
         */
        get(key: string): T | undefined;
        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matching value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        getOrAddWithFactory(key: string, factory: (key: string) => T): T;
        /**
         * Get a value from its key if present in the dictionary otherwise add it
         * @param key the key to get the value from
         * @param val if there's no such key/value pair in the dictionary add it with this value
         * @return the value corresponding to the key
         */
        getOrAdd(key: string, val: T): T;
        /**
         * Check if there's a given key in the dictionary
         * @param key the key to check for
         * @return true if the key is present, false otherwise
         */
        contains(key: string): boolean;
        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        add(key: string, value: T): boolean;
        set(key: string, value: T): boolean;
        /**
         * Get the element of the given key and remove it from the dictionary
         * @param key
         */
        getAndRemove(key: string): Nullable<T>;
        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        remove(key: string): boolean;
        /**
         * Clear the whole content of the dictionary
         */
        clear(): void;
        readonly count: number;
        /**
         * Execute a callback on each key/val of the dictionary.
         * Note that you can remove any element in this dictionary in the callback implementation
         * @param callback the callback to execute on a given key/value pair
         */
        forEach(callback: (key: string, val: T) => void): void;
        /**
         * Execute a callback on every occurrence of the dictionary until it returns a valid TRes object.
         * If the callback returns null or undefined the method will iterate to the next key/value pair
         * Note that you can remove any element in this dictionary in the callback implementation
         * @param callback the callback to execute, if it return a valid T instanced object the enumeration will stop and the object will be returned
         */
        first<TRes>(callback: (key: string, val: T) => TRes): TRes | null;
        private _count;
        private _data;
    }
}

declare module BABYLON {
    class Tags {
        static EnableFor(obj: any): void;
        static DisableFor(obj: any): void;
        static HasTags(obj: any): boolean;
        static GetTags(obj: any, asString?: boolean): any;
        static AddTagsTo(obj: any, tagsString: string): void;
        static _AddTagTo(obj: any, tag: string): void;
        static RemoveTagsFrom(obj: any, tagsString: string): void;
        static _RemoveTagFrom(obj: any, tag: string): void;
        static MatchesQuery(obj: any, tagsQuery: string): boolean;
    }
}

declare module BABYLON {
    class TextureTools {
        /**
         * Uses the GPU to create a copy texture rescaled at a given size
         * @param texture Texture to copy from
         * @param width Desired width
         * @param height Desired height
         * @return Generated texture
         */
        static CreateResizedCopy(texture: BABYLON.Texture, width: number, height: number, useBilinearMode?: boolean): BABYLON.Texture;
        static GetEnvironmentBRDFTexture(scene: Scene): BaseTexture;
        private static _environmentBRDFBase64Texture;
    }
}

declare module BABYLON.Internals {
    class TGATools {
        private static _TYPE_INDEXED;
        private static _TYPE_RGB;
        private static _TYPE_GREY;
        private static _TYPE_RLE_INDEXED;
        private static _TYPE_RLE_RGB;
        private static _TYPE_RLE_GREY;
        private static _ORIGIN_MASK;
        private static _ORIGIN_SHIFT;
        private static _ORIGIN_BL;
        private static _ORIGIN_BR;
        private static _ORIGIN_UL;
        private static _ORIGIN_UR;
        static GetTGAHeader(data: Uint8Array): any;
        static UploadContent(gl: WebGLRenderingContext, data: Uint8Array): void;
        static _getImageData8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData24bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData32bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
    }
}

declare module BABYLON {
    interface IAnimatable {
        animations: Array<Animation>;
    }
    class Tools {
        static BaseUrl: string;
        static CorsBehavior: any;
        static UseFallbackTexture: boolean;
        /**
         * Use this object to register external classes like custom textures or material
         * to allow the laoders to instantiate them
         */
        static RegisteredExternalClasses: {
            [key: string]: Object;
        };
        static fallbackTexture: string;
        /**
         * Interpolates between a and b via alpha
         * @param a The lower value (returned when alpha = 0)
         * @param b The upper value (returned when alpha = 1)
         * @param alpha The interpolation-factor
         * @return The mixed value
         */
        static Mix(a: number, b: number, alpha: number): number;
        static Instantiate(className: string): any;
        static SetImmediate(action: () => void): void;
        static IsExponentOfTwo(value: number): boolean;
        /**
         * Find the next highest power of two.
         * @param x Number to start search from.
         * @return Next highest power of two.
         */
        static CeilingPOT(x: number): number;
        /**
         * Find the next lowest power of two.
         * @param x Number to start search from.
         * @return Next lowest power of two.
         */
        static FloorPOT(x: number): number;
        /**
         * Find the nearest power of two.
         * @param x Number to start search from.
         * @return Next nearest power of two.
         */
        static NearestPOT(x: number): number;
        static GetExponentOfTwo(value: number, max: number, mode?: number): number;
        static GetFilename(path: string): string;
        static GetFolderPath(uri: string): string;
        static GetDOMTextContent(element: HTMLElement): string;
        static ToDegrees(angle: number): number;
        static ToRadians(angle: number): number;
        static EncodeArrayBufferTobase64(buffer: ArrayBuffer): string;
        static ExtractMinAndMaxIndexed(positions: FloatArray, indices: IndicesArray, indexStart: number, indexCount: number, bias?: Nullable<Vector2>): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static ExtractMinAndMax(positions: FloatArray, start: number, count: number, bias?: Nullable<Vector2>, stride?: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static Vector2ArrayFeeder(array: Array<Vector2> | Float32Array): (i: number) => Nullable<Vector2>;
        static ExtractMinAndMaxVector2(feeder: (index: number) => Vector2, bias?: Nullable<Vector2>): {
            minimum: Vector2;
            maximum: Vector2;
        };
        static MakeArray(obj: any, allowsNullUndefined?: boolean): Nullable<Array<any>>;
        static GetPointerPrefix(): string;
        /**
         * @param func - the function to be called
         * @param requester - the object that will request the next frame. Falls back to window.
         */
        static QueueNewFrame(func: () => void, requester?: any): number;
        static RequestFullscreen(element: HTMLElement): void;
        static ExitFullscreen(): void;
        static SetCorsBehavior(url: string, img: HTMLImageElement): void;
        static CleanUrl(url: string): string;
        static PreprocessUrl: (url: string) => string;
        static LoadImage(url: any, onLoad: (img: HTMLImageElement) => void, onError: (message?: string, exception?: any) => void, database: Nullable<Database>): HTMLImageElement;
        static LoadFile(url: string, callback: (data: any, responseURL?: string) => void, progressCallBack?: (data: any) => void, database?: Database, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): Nullable<XMLHttpRequest>;
        /**
         * Load a script (identified by an url). When the url returns, the
         * content of this file is added into a new script element, attached to the DOM (body element)
         */
        static LoadScript(scriptUrl: string, onSuccess: () => void, onError?: (message?: string, exception?: any) => void): void;
        static ReadFileAsDataURL(fileToLoad: Blob, callback: (data: any) => void, progressCallback: (this: MSBaseReader, ev: ProgressEvent) => any): void;
        static ReadFile(fileToLoad: File, callback: (data: any) => void, progressCallBack?: (this: MSBaseReader, ev: ProgressEvent) => any, useArrayBuffer?: boolean): void;
        static FileAsURL(content: string): string;
        static Format(value: number, decimals?: number): string;
        static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void;
        static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void;
        static IsEmpty(obj: any): boolean;
        static RegisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static UnregisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static DumpFramebuffer(width: number, height: number, engine: Engine, successCallback?: (data: string) => void, mimeType?: string, fileName?: string): void;
        static EncodeScreenshotCanvasData(successCallback?: (data: string) => void, mimeType?: string, fileName?: string): void;
        static CreateScreenshot(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType?: string): void;
        static CreateScreenshotUsingRenderTarget(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType?: string, samples?: number, antialiasing?: boolean, fileName?: string): void;
        static ValidateXHRData(xhr: XMLHttpRequest, dataType?: number): boolean;
        /**
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        static RandomId(): string;
        private static _NoneLogLevel;
        private static _MessageLogLevel;
        private static _WarningLogLevel;
        private static _ErrorLogLevel;
        private static _LogCache;
        static errorsCount: number;
        static OnNewCacheEntry: (entry: string) => void;
        static readonly NoneLogLevel: number;
        static readonly MessageLogLevel: number;
        static readonly WarningLogLevel: number;
        static readonly ErrorLogLevel: number;
        static readonly AllLogLevel: number;
        private static _AddLogEntry(entry);
        private static _FormatMessage(message);
        private static _LogDisabled(message);
        private static _LogEnabled(message);
        private static _WarnDisabled(message);
        private static _WarnEnabled(message);
        private static _ErrorDisabled(message);
        private static _ErrorEnabled(message);
        static Log: (message: string) => void;
        static Warn: (message: string) => void;
        static Error: (message: string) => void;
        static readonly LogCache: string;
        static ClearLogCache(): void;
        static LogLevels: number;
        static IsWindowObjectExist(): boolean;
        private static _PerformanceNoneLogLevel;
        private static _PerformanceUserMarkLogLevel;
        private static _PerformanceConsoleLogLevel;
        private static _performance;
        static readonly PerformanceNoneLogLevel: number;
        static readonly PerformanceUserMarkLogLevel: number;
        static readonly PerformanceConsoleLogLevel: number;
        static PerformanceLogLevel: number;
        static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _StartUserMark(counterName: string, condition?: boolean): void;
        static _EndUserMark(counterName: string, condition?: boolean): void;
        static _StartPerformanceConsole(counterName: string, condition?: boolean): void;
        static _EndPerformanceConsole(counterName: string, condition?: boolean): void;
        static StartPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static EndPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static readonly Now: number;
        /**
         * This method will return the name of the class used to create the instance of the given object.
         * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator.
         * @param object the object to get the class name from
         * @return the name of the class, will be "object" for a custom data type not using the @className decorator
         */
        static GetClassName(object: any, isType?: boolean): string;
        static First<T>(array: Array<T>, predicate: (item: T) => boolean): Nullable<T>;
        /**
         * This method will return the name of the full name of the class, including its owning module (if any).
         * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator or implementing a method getClassName():string (in which case the module won't be specified).
         * @param object the object to get the class name from
         * @return a string that can have two forms: "moduleName.className" if module was specified when the class' Name was registered or "className" if there was not module specified.
         */
        static getFullClassName(object: any, isType?: boolean): Nullable<string>;
        /**
         * This method can be used with hashCodeFromStream when your input is an array of values that are either: number, string, boolean or custom type implementing the getHashCode():number method.
         * @param array
         */
        static arrayOrStringFeeder(array: any): (i: number) => number;
        /**
         * Compute the hashCode of a stream of number
         * To compute the HashCode on a string or an Array of data types implementing the getHashCode() method, use the arrayOrStringFeeder method.
         * @param feeder a callback that will be called until it returns null, each valid returned values will be used to compute the hash code.
         * @return the hash code computed
         */
        static hashCodeFromStream(feeder: (index: number) => number): number;
    }
    /**
     * This class is used to track a performance counter which is number based.
     * The user has access to many properties which give statistics of different nature
     *
     * The implementer can track two kinds of Performance Counter: time and count
     * For time you can optionally call fetchNewFrame() to notify the start of a new frame to monitor, then call beginMonitoring() to start and endMonitoring() to record the lapsed time. endMonitoring takes a newFrame parameter for you to specify if the monitored time should be set for a new frame or accumulated to the current frame being monitored.
     * For count you first have to call fetchNewFrame() to notify the start of a new frame to monitor, then call addCount() how many time required to increment the count value you monitor.
     */
    class PerfCounter {
        static Enabled: boolean;
        /**
         * Returns the smallest value ever
         */
        readonly min: number;
        /**
         * Returns the biggest value ever
         */
        readonly max: number;
        /**
         * Returns the average value since the performance counter is running
         */
        readonly average: number;
        /**
         * Returns the average value of the last second the counter was monitored
         */
        readonly lastSecAverage: number;
        /**
         * Returns the current value
         */
        readonly current: number;
        readonly total: number;
        readonly count: number;
        constructor();
        /**
         * Call this method to start monitoring a new frame.
         * This scenario is typically used when you accumulate monitoring time many times for a single frame, you call this method at the start of the frame, then beginMonitoring to start recording and endMonitoring(false) to accumulated the recorded time to the PerfCounter or addCount() to accumulate a monitored count.
         */
        fetchNewFrame(): void;
        /**
         * Call this method to monitor a count of something (e.g. mesh drawn in viewport count)
         * @param newCount the count value to add to the monitored count
         * @param fetchResult true when it's the last time in the frame you add to the counter and you wish to update the statistics properties (min/max/average), false if you only want to update statistics.
         */
        addCount(newCount: number, fetchResult: boolean): void;
        /**
         * Start monitoring this performance counter
         */
        beginMonitoring(): void;
        /**
         * Compute the time lapsed since the previous beginMonitoring() call.
         * @param newFrame true by default to fetch the result and monitor a new frame, if false the time monitored will be added to the current frame counter
         */
        endMonitoring(newFrame?: boolean): void;
        private _fetchResult();
        private _startMonitoringTime;
        private _min;
        private _max;
        private _average;
        private _current;
        private _totalValueCount;
        private _totalAccumulated;
        private _lastSecAverage;
        private _lastSecAccumulated;
        private _lastSecTime;
        private _lastSecValueCount;
    }
    /**
     * Use this className as a decorator on a given class definition to add it a name and optionally its module.
     * You can then use the Tools.getClassName(obj) on an instance to retrieve its class name.
     * This method is the only way to get it done in all cases, even if the .js file declaring the class is minified
     * @param name The name of the class, case should be preserved
     * @param module The name of the Module hosting the class, optional, but strongly recommended to specify if possible. Case should be preserved.
     */
    function className(name: string, module?: string): (target: Object) => void;
    /**
    * An implementation of a loop for asynchronous functions.
    */
    class AsyncLoop {
        iterations: number;
        private _fn;
        private _successCallback;
        index: number;
        private _done;
        /**
         * Constroctor.
         * @param iterations the number of iterations.
         * @param _fn the function to run each iteration
         * @param _successCallback the callback that will be called upon succesful execution
         * @param offset starting offset.
         */
        constructor(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number);
        /**
         * Execute the next iteration. Must be called after the last iteration was finished.
         */
        executeNext(): void;
        /**
         * Break the loop and run the success callback.
         */
        breakLoop(): void;
        /**
         * Helper function
         */
        static Run(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number): AsyncLoop;
        /**
         * A for-loop that will run a given number of iterations synchronous and the rest async.
         * @param iterations total number of iterations
         * @param syncedIterations number of synchronous iterations in each async iteration.
         * @param fn the function to call each iteration.
         * @param callback a success call back that will be called when iterating stops.
         * @param breakFunction a break condition (optional)
         * @param timeout timeout settings for the setTimeout function. default - 0.
         * @constructor
         */
        static SyncAsyncForLoop(iterations: number, syncedIterations: number, fn: (iteration: number) => void, callback: () => void, breakFunction?: () => boolean, timeout?: number): void;
    }
}

declare module BABYLON {
    enum JoystickAxis {
        X = 0,
        Y = 1,
        Z = 2,
    }
    class VirtualJoystick {
        reverseLeftRight: boolean;
        reverseUpDown: boolean;
        deltaPosition: Vector3;
        pressed: boolean;
        private static _globalJoystickIndex;
        private static vjCanvas;
        private static vjCanvasContext;
        private static vjCanvasWidth;
        private static vjCanvasHeight;
        private static halfWidth;
        private static halfHeight;
        private _action;
        private _axisTargetedByLeftAndRight;
        private _axisTargetedByUpAndDown;
        private _joystickSensibility;
        private _inversedSensibility;
        private _rotationSpeed;
        private _inverseRotationSpeed;
        private _rotateOnAxisRelativeToMesh;
        private _joystickPointerID;
        private _joystickColor;
        private _joystickPointerPos;
        private _joystickPreviousPointerPos;
        private _joystickPointerStartPos;
        private _deltaJoystickVector;
        private _leftJoystick;
        private _joystickIndex;
        private _touches;
        private _onPointerDownHandlerRef;
        private _onPointerMoveHandlerRef;
        private _onPointerUpHandlerRef;
        private _onPointerOutHandlerRef;
        private _onResize;
        constructor(leftJoystick?: boolean);
        setJoystickSensibility(newJoystickSensibility: number): void;
        private _onPointerDown(e);
        private _onPointerMove(e);
        private _onPointerUp(e);
        /**
        * Change the color of the virtual joystick
        * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
        */
        setJoystickColor(newColor: string): void;
        setActionOnTouch(action: () => any): void;
        setAxisForLeftRight(axis: JoystickAxis): void;
        setAxisForUpDown(axis: JoystickAxis): void;
        private _drawVirtualJoystick();
        releaseCanvas(): void;
    }
}

declare module BABYLON {
    class AutoRotationBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        private _zoomStopsAnimation;
        private _idleRotationSpeed;
        private _idleRotationWaitTime;
        private _idleRotationSpinupTime;
        /**
        * Gets the flag that indicates if user zooming should stop animation.
        */
        /**
        * Sets the flag that indicates if user zooming should stop animation.
        */
        zoomStopsAnimation: boolean;
        /**
        * Gets the default speed at which the camera rotates around the model.
        */
        /**
        * Sets the default speed at which the camera rotates around the model.
        */
        idleRotationSpeed: number;
        /**
        * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
        */
        /**
        * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
        */
        idleRotationWaitTime: number;
        /**
        * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
        */
        /**
        * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
        */
        idleRotationSpinupTime: number;
        /**
         * Gets a value indicating if the camera is currently rotating because of this behavior
         */
        readonly rotationInProgress: boolean;
        private _onPrePointerObservableObserver;
        private _onAfterCheckInputsObserver;
        private _attachedCamera;
        private _isPointerDown;
        private _lastFrameTime;
        private _lastInteractionTime;
        private _cameraRotationSpeed;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        /**
         * Returns true if user is scrolling.
         * @return true if user is scrolling.
         */
        private _userIsZooming();
        private _lastFrameRadius;
        private _shouldAnimationStopForInteraction();
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        private _applyUserInteraction();
        private _userIsMoving();
    }
}

declare module BABYLON {
    /**
     * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
     */
    class BouncingBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        /**
         * The easing function used by animations
         */
        static EasingFunction: BackEase;
        /**
         * The easing mode used by animations
         */
        static EasingMode: number;
        /**
         * The duration of the animation, in milliseconds
         */
        transitionDuration: number;
        /**
         * Length of the distance animated by the transition when lower radius is reached
         */
        lowerRadiusTransitionRange: number;
        /**
         * Length of the distance animated by the transition when upper radius is reached
         */
        upperRadiusTransitionRange: number;
        private _autoTransitionRange;
        /**
         * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
         */
        /**
         * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
         * Transition ranges will be set to 5% of the bounding box diagonal in world space
         */
        autoTransitionRange: boolean;
        private _attachedCamera;
        private _onAfterCheckInputsObserver;
        private _onMeshTargetChangedObserver;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        private _radiusIsAnimating;
        private _radiusBounceTransition;
        private _animatables;
        private _cachedWheelPrecision;
        /**
         * Checks if the camera radius is at the specified limit. Takes into account animation locks.
         * @param radiusLimit The limit to check against.
         * @return Bool to indicate if at limit.
         */
        private _isRadiusAtLimit(radiusLimit);
        /**
         * Applies an animation to the radius of the camera, extending by the radiusDelta.
         * @param radiusDelta The delta by which to animate to. Can be negative.
         */
        private _applyBoundRadiusAnimation(radiusDelta);
        /**
         * Removes all animation locks. Allows new animations to be added to any of the camera properties.
         */
        protected _clearAnimationLocks(): void;
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        stopAllAnimations(): void;
    }
}

declare module BABYLON {
    class FramingBehavior implements Behavior<ArcRotateCamera> {
        readonly name: string;
        private _mode;
        private _radiusScale;
        private _positionScale;
        private _defaultElevation;
        private _elevationReturnTime;
        private _elevationReturnWaitTime;
        private _zoomStopsAnimation;
        private _framingTime;
        /**
         * The easing function used by animations
         */
        static EasingFunction: ExponentialEase;
        /**
         * The easing mode used by animations
         */
        static EasingMode: number;
        /**
         * Gets current mode used by the behavior.
         */
        /**
         * Sets the current mode used by the behavior
         */
        mode: number;
        /**
         * Gets the scale applied to the radius
         */
        /**
         * Sets the scale applied to the radius (1 by default)
         */
        radiusScale: number;
        /**
         * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
         */
        /**
         * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
         */
        positionScale: number;
        /**
        * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
        * behaviour is triggered, in radians.
        */
        /**
        * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
        * behaviour is triggered, in radians.
        */
        defaultElevation: number;
        /**
         * Gets the time (in milliseconds) taken to return to the default beta position.
         * Negative value indicates camera should not return to default.
         */
        /**
         * Sets the time (in milliseconds) taken to return to the default beta position.
         * Negative value indicates camera should not return to default.
         */
        elevationReturnTime: number;
        /**
         * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
         */
        /**
         * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
         */
        elevationReturnWaitTime: number;
        /**
        * Gets the flag that indicates if user zooming should stop animation.
        */
        /**
        * Sets the flag that indicates if user zooming should stop animation.
        */
        zoomStopsAnimation: boolean;
        /**
         * Gets the transition time when framing the mesh, in milliseconds
        */
        /**
         * Sets the transition time when framing the mesh, in milliseconds
        */
        framingTime: number;
        private _onPrePointerObservableObserver;
        private _onAfterCheckInputsObserver;
        private _onMeshTargetChangedObserver;
        private _attachedCamera;
        private _isPointerDown;
        private _lastInteractionTime;
        init(): void;
        attach(camera: ArcRotateCamera): void;
        detach(): void;
        private _animatables;
        private _betaIsAnimating;
        private _betaTransition;
        private _radiusTransition;
        private _vectorTransition;
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMesh(mesh: AbstractMesh, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given mesh with its children and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMeshHierarchy(mesh: AbstractMesh, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given meshes with their children and updates zoom level accordingly.
         * @param meshes  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnMeshesHierarchy(meshes: AbstractMesh[], focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        zoomOnBoundingInfo(minimumWorld: Vector3, maximumWorld: Vector3, focusOnOriginXZ?: boolean, onAnimationEnd?: Nullable<() => void>): void;
        /**
         * Calculates the lowest radius for the camera based on the bounding box of the mesh.
         * @param mesh The mesh on which to base the calculation. mesh boundingInfo used to estimate necessary
         *			  frustum width.
         * @return The minimum distance from the primary mesh's center point at which the camera must be kept in order
         *		 to fully enclose the mesh in the viewing frustum.
         */
        protected _calculateLowerRadiusFromModelBoundingSphere(minimumWorld: Vector3, maximumWorld: Vector3): number;
        /**
         * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
         * is automatically returned to its default position (expected to be above ground plane).
         */
        private _maintainCameraAboveGround();
        /**
         * Returns the frustum slope based on the canvas ratio and camera FOV
         * @returns The frustum slope represented as a Vector2 with X and Y slopes
         */
        private _getFrustumSlope();
        /**
         * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
         */
        private _clearAnimationLocks();
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        private _applyUserInteraction();
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        stopAllAnimations(): void;
        /**
         * Gets a value indicating if the user is moving the camera
         */
        readonly isUserIsMoving: boolean;
        /**
         * The camera can move all the way towards the mesh.
         */
        static IgnoreBoundsSizeMode: number;
        /**
         * The camera is not allowed to zoom closer to the mesh than the point at which the adjusted bounding sphere touches the frustum sides
         */
        static FitFrustumSidesMode: number;
    }
}

declare module BABYLON {
    class VRCameraMetrics {
        hResolution: number;
        vResolution: number;
        hScreenSize: number;
        vScreenSize: number;
        vScreenCenter: number;
        eyeToScreenDistance: number;
        lensSeparationDistance: number;
        interpupillaryDistance: number;
        distortionK: number[];
        chromaAbCorrection: number[];
        postProcessScaleFactor: number;
        lensCenterOffset: number;
        compensateDistortion: boolean;
        readonly aspectRatio: number;
        readonly aspectRatioFov: number;
        readonly leftHMatrix: Matrix;
        readonly rightHMatrix: Matrix;
        readonly leftPreViewMatrix: Matrix;
        readonly rightPreViewMatrix: Matrix;
        static GetDefault(): VRCameraMetrics;
    }
}

declare module BABYLON {
    class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {
        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
    class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {
        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
    class VRDeviceOrientationArcRotateCamera extends ArcRotateCamera {
        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene, compensateDistortion?: boolean, vrCameraMetrics?: VRCameraMetrics);
        getClassName(): string;
    }
}

declare module BABYLON {
    interface VRTeleportationOptions {
        floorMeshName?: string;
    }
    class VRExperienceHelper {
        webVROptions: WebVROptions;
        private _scene;
        private _position;
        private _btnVR;
        private _webVRsupported;
        private _webVRready;
        private _webVRrequesting;
        private _webVRpresenting;
        private _fullscreenVRpresenting;
        private _canvas;
        private _webVRCamera;
        private _vrDeviceOrientationCamera;
        private _deviceOrientationCamera;
        private _onKeyDown;
        private _onVrDisplayPresentChange;
        private _onVRDisplayChanged;
        private _onVRRequestPresentStart;
        private _onVRRequestPresentComplete;
        onEnteringVR: () => void;
        onExitingVR: () => void;
        onControllerMeshLoaded: (controller: WebVRController) => void;
        private _useCustomVRButton;
        private _teleportationRequested;
        private _teleportationEnabledOnLeftController;
        private _teleportationEnabledOnRightController;
        private _leftControllerReady;
        private _rightControllerReady;
        private _floorMeshName;
        private _teleportationAllowed;
        private _rotationAllowed;
        private _teleportationRequestInitiated;
        private _xboxGamepadTeleportationRequestInitiated;
        private _rotationRightAsked;
        private _rotationLeftAsked;
        private _teleportationCircle;
        private _postProcessMove;
        private _teleportationFillColor;
        private _teleportationBorderColor;
        private _rotationAngle;
        private _haloCenter;
        private _rayHelper;
        meshSelectionPredicate: (mesh: BABYLON.Mesh) => boolean;
        readonly deviceOrientationCamera: DeviceOrientationCamera;
        readonly currentVRCamera: FreeCamera;
        readonly webVRCamera: WebVRFreeCamera;
        readonly vrDeviceOrientationCamera: VRDeviceOrientationFreeCamera;
        constructor(scene: Scene, webVROptions?: WebVROptions);
        private _onDefaultMeshLoaded(webVRController);
        private _onFullscreenChange();
        private isInVRMode();
        private onVrDisplayPresentChange();
        private onVRDisplayChanged(eventArgs);
        private updateButtonVisibility();
        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        enterVR(): void;
        /**
         * Attempt to exit VR, or fullscreen.
         */
        exitVR(): void;
        position: Vector3;
        enableTeleportation(vrTeleportationOptions?: VRTeleportationOptions): void;
        private _enableTeleportationOnController(webVRController);
        private _createTeleportationCircles();
        private _displayTeleportationCircle();
        private _hideTeleportationCircle();
        private _rotateCamera(right);
        private _moveTeleportationSelectorTo(coordinates);
        private _teleportCamera();
        private _castRayAndSelectObject();
        dispose(): void;
        getClassName(): string;
    }
}

declare var HMDVRDevice: any;
declare var VRDisplay: any;
declare var VRFrameData: any;
declare module BABYLON {
    /**
     * This is a copy of VRPose.
     * IMPORTANT!! The data is right-hand data.
     * @export
     * @interface DevicePose
     */
    interface DevicePose {
        readonly position?: Float32Array;
        readonly linearVelocity?: Float32Array;
        readonly linearAcceleration?: Float32Array;
        readonly orientation?: Float32Array;
        readonly angularVelocity?: Float32Array;
        readonly angularAcceleration?: Float32Array;
    }
    interface PoseControlled {
        position: Vector3;
        rotationQuaternion: Quaternion;
        devicePosition?: Vector3;
        deviceRotationQuaternion: Quaternion;
        rawPose: Nullable<DevicePose>;
        deviceScaleFactor: number;
        updateFromDevice(poseData: DevicePose): void;
    }
    interface WebVROptions {
        trackPosition?: boolean;
        positionScale?: number;
        displayName?: string;
        controllerMeshes?: boolean;
        defaultLightingOnControllers?: boolean;
        useCustomVRButton?: boolean;
        customVRButton?: HTMLButtonElement;
    }
    class WebVRFreeCamera extends FreeCamera implements PoseControlled {
        private webVROptions;
        _vrDevice: any;
        rawPose: Nullable<DevicePose>;
        private _onVREnabled;
        private _specsVersion;
        private _attached;
        private _frameData;
        protected _descendants: Array<Node>;
        devicePosition: Vector3;
        deviceRotationQuaternion: Quaternion;
        deviceScaleFactor: number;
        controllers: Array<WebVRController>;
        onControllersAttachedObservable: Observable<WebVRController[]>;
        onControllerMeshLoadedObservable: Observable<WebVRController>;
        rigParenting: boolean;
        private _lightOnControllers;
        constructor(name: string, position: Vector3, scene: Scene, webVROptions?: WebVROptions);
        dispose(): void;
        getControllerByName(name: string): Nullable<WebVRController>;
        private _leftController;
        readonly leftController: Nullable<WebVRController>;
        private _rightController;
        readonly rightController: Nullable<WebVRController>;
        getForwardRay(length?: number): Ray;
        _checkInputs(): void;
        updateFromDevice(poseData: DevicePose): void;
        /**
         * WebVR's attach control will start broadcasting frames to the device.
         * Note that in certain browsers (chrome for example) this function must be called
         * within a user-interaction callback. Example:
         * <pre> scene.onPointerDown = function() { camera.attachControl(canvas); }</pre>
         *
         * @param {HTMLElement} element
         * @param {boolean} [noPreventDefault]
         *
         * @memberOf WebVRFreeCamera
         */
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: HTMLElement): void;
        getClassName(): string;
        resetToCurrentRotation(): void;
        _updateRigCameras(): void;
        /**
         * This function is called by the two RIG cameras.
         * 'this' is the left or right camera (and NOT (!!!) the WebVRFreeCamera instance)
         */
        protected _getWebVRViewMatrix(): Matrix;
        protected _getWebVRProjectionMatrix(): Matrix;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        initControllers(): void;
    }
}

declare module BABYLON {
    class ArcRotateCameraGamepadInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        gamepad: Nullable<Gamepad>;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        gamepadRotationSensibility: number;
        gamepadMoveSensibility: number;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        private _keys;
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        keysReset: number[];
        panningSensibility: number;
        zoomingSensibility: number;
        useAltToZoom: boolean;
        private _ctrlPressed;
        private _altPressed;
        private _onCanvasBlurObserver;
        private _onKeyboardObserver;
        private _engine;
        private _scene;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        private _wheel;
        private _observer;
        wheelPrecision: number;
        /**
         * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
         * It defines the percentage of current camera.radius to use as delta when wheel is used.
         */
        wheelDeltaPercentage: number;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class ArcRotateCameraPointersInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        buttons: number[];
        angularSensibilityX: number;
        angularSensibilityY: number;
        pinchPrecision: number;
        /**
         * pinchDeltaPercentage will be used instead of pinchPrecision if different from 0.
         * It defines the percentage of current camera.radius to use as delta when pinch zoom is used.
         */
        pinchDeltaPercentage: number;
        panningSensibility: number;
        multiTouchPanning: boolean;
        multiTouchPanAndZoom: boolean;
        private _isPanClick;
        pinchInwards: boolean;
        private _pointerInput;
        private _observer;
        private _onMouseMove;
        private _onGestureStart;
        private _onGesture;
        private _MSGestureHandler;
        private _onLostFocus;
        private _onContextMenu;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class ArcRotateCameraVRDeviceOrientationInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        alphaCorrection: number;
        betaCorrection: number;
        gammaCorrection: number;
        private _alpha;
        private _beta;
        private _gamma;
        private _dirty;
        private _deviceOrientationHandler;
        constructor();
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        _onOrientationEvent(evt: DeviceOrientationEvent): void;
        checkInputs(): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraDeviceOrientationInput implements ICameraInput<FreeCamera> {
        private _camera;
        private _screenOrientationAngle;
        private _constantTranform;
        private _screenQuaternion;
        private _alpha;
        private _beta;
        private _gamma;
        constructor();
        camera: FreeCamera;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        private _orientationChanged;
        private _deviceOrientation;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraGamepadInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        gamepad: Nullable<Gamepad>;
        private _onGamepadConnectedObserver;
        private _onGamepadDisconnectedObserver;
        gamepadAngularSensibility: number;
        gamepadMoveSensibility: number;
        private _cameraTransform;
        private _deltaTransform;
        private _vector3;
        private _vector2;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraKeyboardMoveInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        private _keys;
        private _onCanvasBlurObserver;
        private _onKeyboardObserver;
        private _engine;
        private _scene;
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        _onLostFocus(e: FocusEvent): void;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
        touchEnabled: boolean;
        camera: FreeCamera;
        buttons: number[];
        angularSensibility: number;
        private _pointerInput;
        private _onMouseMove;
        private _observer;
        private previousPosition;
        constructor(touchEnabled?: boolean);
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraTouchInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        private _offsetX;
        private _offsetY;
        private _pointerCount;
        private _pointerPressed;
        private _pointerInput;
        private _observer;
        private _onLostFocus;
        touchAngularSensibility: number;
        touchMoveSensibility: number;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        checkInputs(): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    class FreeCameraVirtualJoystickInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        private _leftjoystick;
        private _rightjoystick;
        getLeftJoystick(): VirtualJoystick;
        getRightJoystick(): VirtualJoystick;
        checkInputs(): void;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: Nullable<HTMLElement>): void;
        getClassName(): string;
        getSimpleName(): string;
    }
}

declare module BABYLON {
    interface IOctreeContainer<T> {
        blocks: Array<OctreeBlock<T>>;
    }
    class Octree<T> {
        maxDepth: number;
        blocks: Array<OctreeBlock<T>>;
        dynamicContent: T[];
        private _maxBlockCapacity;
        private _selectionContent;
        private _creationFunc;
        constructor(creationFunc: (entry: T, block: OctreeBlock<T>) => void, maxBlockCapacity?: number, maxDepth?: number);
        update(worldMin: Vector3, worldMax: Vector3, entries: T[]): void;
        addMesh(entry: T): void;
        select(frustumPlanes: Plane[], allowDuplicate?: boolean): SmartArray<T>;
        intersects(sphereCenter: Vector3, sphereRadius: number, allowDuplicate?: boolean): SmartArray<T>;
        intersectsRay(ray: Ray): SmartArray<T>;
        static _CreateBlocks<T>(worldMin: Vector3, worldMax: Vector3, entries: T[], maxBlockCapacity: number, currentDepth: number, maxDepth: number, target: IOctreeContainer<T>, creationFunc: (entry: T, block: OctreeBlock<T>) => void): void;
        static CreationFuncForMeshes: (entry: AbstractMesh, block: OctreeBlock<AbstractMesh>) => void;
        static CreationFuncForSubMeshes: (entry: SubMesh, block: OctreeBlock<SubMesh>) => void;
    }
}

declare module BABYLON {
    class OctreeBlock<T> {
        entries: T[];
        blocks: Array<OctreeBlock<T>>;
        private _depth;
        private _maxDepth;
        private _capacity;
        private _minPoint;
        private _maxPoint;
        private _boundingVectors;
        private _creationFunc;
        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number, depth: number, maxDepth: number, creationFunc: (entry: T, block: OctreeBlock<T>) => void);
        readonly capacity: number;
        readonly minPoint: Vector3;
        readonly maxPoint: Vector3;
        addEntry(entry: T): void;
        addEntries(entries: T[]): void;
        select(frustumPlanes: Plane[], selection: SmartArrayNoDuplicate<T>, allowDuplicate?: boolean): void;
        intersects(sphereCenter: Vector3, sphereRadius: number, selection: SmartArrayNoDuplicate<T>, allowDuplicate?: boolean): void;
        intersectsRay(ray: Ray, selection: SmartArrayNoDuplicate<T>): void;
        createInnerBlocks(): void;
    }
}

declare module BABYLON {
    class GenericController extends WebVRController {
        static readonly MODEL_BASE_URL: string;
        static readonly MODEL_FILENAME: string;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module BABYLON {
    class OculusTouchController extends WebVRController {
        private static readonly MODEL_BASE_URL;
        private static readonly MODEL_LEFT_FILENAME;
        private static readonly MODEL_RIGHT_FILENAME;
        onSecondaryTriggerStateChangedObservable: Observable<ExtendedGamepadButton>;
        onThumbRestChangedObservable: Observable<ExtendedGamepadButton>;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        readonly onAButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onBButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onXButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onYButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module BABYLON {
    enum PoseEnabledControllerType {
        VIVE = 0,
        OCULUS = 1,
        WINDOWS = 2,
        GENERIC = 3,
    }
    interface MutableGamepadButton {
        value: number;
        touched: boolean;
        pressed: boolean;
    }
    interface ExtendedGamepadButton extends GamepadButton {
        readonly pressed: boolean;
        readonly touched: boolean;
        readonly value: number;
    }
    class PoseEnabledControllerHelper {
        static InitiateController(vrGamepad: any): OculusTouchController | WindowsMotionController | ViveController | GenericController;
    }
    class PoseEnabledController extends Gamepad implements PoseControlled {
        devicePosition: Vector3;
        deviceRotationQuaternion: Quaternion;
        deviceScaleFactor: number;
        position: Vector3;
        rotationQuaternion: Quaternion;
        controllerType: PoseEnabledControllerType;
        private _calculatedPosition;
        private _calculatedRotation;
        rawPose: DevicePose;
        _mesh: Nullable<AbstractMesh>;
        private _poseControlledCamera;
        private _leftHandSystemQuaternion;
        constructor(browserGamepad: any);
        update(): void;
        updateFromDevice(poseData: DevicePose): void;
        attachToMesh(mesh: AbstractMesh): void;
        attachToPoseControlledCamera(camera: TargetCamera): void;
        dispose(): void;
        readonly mesh: Nullable<AbstractMesh>;
        getForwardRay(length?: number): Ray;
    }
}

declare module BABYLON {
    class ViveController extends WebVRController {
        private static readonly MODEL_BASE_URL;
        private static readonly MODEL_FILENAME;
        constructor(vrGamepad: any);
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        readonly onLeftButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onRightButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onMenuButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        /**
         * Vive mapping:
         * 0: touchpad
         * 1: trigger
         * 2: left AND right buttons
         * 3: menu button
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
    }
}

declare module BABYLON {
    abstract class WebVRController extends PoseEnabledController {
        protected _defaultModel: AbstractMesh;
        onTriggerStateChangedObservable: Observable<ExtendedGamepadButton>;
        onMainButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        onSecondaryButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        onPadStateChangedObservable: Observable<ExtendedGamepadButton>;
        onPadValuesChangedObservable: Observable<StickValues>;
        protected _buttons: Array<MutableGamepadButton>;
        private _onButtonStateChange;
        onButtonStateChange(callback: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void): void;
        pad: StickValues;
        hand: string;
        readonly defaultModel: AbstractMesh;
        constructor(vrGamepad: any);
        update(): void;
        protected abstract handleButtonChange(buttonIdx: number, value: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
        abstract initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;
        private _setButtonValue(newState, currentState, buttonIndex);
        private _changes;
        private _checkChanges(newState, currentState);
        dispose(): void;
    }
}

declare module BABYLON {
    class WindowsMotionController extends WebVRController {
        private static readonly MODEL_BASE_URL;
        private static readonly MODEL_LEFT_FILENAME;
        private static readonly MODEL_RIGHT_FILENAME;
        static readonly GAMEPAD_ID_PREFIX: string;
        private static readonly GAMEPAD_ID_PATTERN;
        private _loadedMeshInfo;
        private readonly _mapping;
        onTrackpadChangedObservable: Observable<ExtendedGamepadButton>;
        constructor(vrGamepad: any);
        readonly onTriggerButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onMenuButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onGripButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onThumbstickButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        readonly onTouchpadButtonStateChangedObservable: Observable<ExtendedGamepadButton>;
        /**
         * Called once per frame by the engine.
         */
        update(): void;
        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges): void;
        protected lerpButtonTransform(buttonName: string, buttonValue: number): void;
        protected lerpAxisTransform(axis: number, axisValue: number): void;
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void, forceDefault?: boolean): void;
        /**
         * Takes a list of meshes (as loaded from the glTF file) and finds the root node, as well as nodes that
         * can be transformed by button presses and axes values, based on this._mapping.
         *
         * @param scene scene in which the meshes exist
         * @param meshes list of meshes that make up the controller model to process
         * @return structured view of the given meshes, with mapping of buttons and axes to meshes that can be transformed.
         */
        private processModel(scene, meshes);
        private createMeshInfo(rootNode);
        getForwardRay(length?: number): Ray;
        dispose(): void;
    }
}

declare module BABYLON.Internals {
}

declare module BABYLON {
    /**
     * Interface to implement to create a shadow generator compatible with BJS.
     */
    interface IShadowGenerator {
        getShadowMap(): Nullable<RenderTargetTexture>;
        getShadowMapForRendering(): Nullable<RenderTargetTexture>;
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        prepareDefines(defines: MaterialDefines, lightIndex: number): void;
        bindShadowLight(lightIndex: string, effect: Effect): void;
        getTransformMatrix(): Matrix;
        recreateShadowMap(): void;
        forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{
            useInstances: boolean;
        }>): void;
        serialize(): any;
        dispose(): void;
    }
    class ShadowGenerator implements IShadowGenerator {
        private static _FILTER_NONE;
        private static _FILTER_EXPONENTIALSHADOWMAP;
        private static _FILTER_POISSONSAMPLING;
        private static _FILTER_BLUREXPONENTIALSHADOWMAP;
        private static _FILTER_CLOSEEXPONENTIALSHADOWMAP;
        private static _FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
        static readonly FILTER_NONE: number;
        static readonly FILTER_POISSONSAMPLING: number;
        static readonly FILTER_EXPONENTIALSHADOWMAP: number;
        static readonly FILTER_BLUREXPONENTIALSHADOWMAP: number;
        static readonly FILTER_CLOSEEXPONENTIALSHADOWMAP: number;
        static readonly FILTER_BLURCLOSEEXPONENTIALSHADOWMAP: number;
        private _bias;
        bias: number;
        private _blurBoxOffset;
        blurBoxOffset: number;
        private _blurScale;
        blurScale: number;
        private _blurKernel;
        blurKernel: number;
        private _useKernelBlur;
        useKernelBlur: boolean;
        private _depthScale;
        depthScale: number;
        private _filter;
        filter: number;
        usePoissonSampling: boolean;
        useVarianceShadowMap: boolean;
        useBlurVarianceShadowMap: boolean;
        useExponentialShadowMap: boolean;
        useBlurExponentialShadowMap: boolean;
        useCloseExponentialShadowMap: boolean;
        useBlurCloseExponentialShadowMap: boolean;
        private _darkness;
        /**
         * Returns the darkness value (float).
         */
        getDarkness(): number;
        /**
         * Sets the ShadowGenerator darkness value (float <= 1.0).
         * Returns the ShadowGenerator.
         */
        setDarkness(darkness: number): ShadowGenerator;
        private _transparencyShadow;
        /**
         * Sets the ability to have transparent shadow (boolean).
         * Returns the ShadowGenerator.
         */
        setTransparencyShadow(hasShadow: boolean): ShadowGenerator;
        private _shadowMap;
        private _shadowMap2;
        /**
         * Returns a RenderTargetTexture object : the shadow map texture.
         */
        getShadowMap(): Nullable<RenderTargetTexture>;
        /**
         * Returns the most ready computed shadow map as a RenderTargetTexture object.
         */
        getShadowMapForRendering(): Nullable<RenderTargetTexture>;
        /**
         * Helper function to add a mesh and its descendants to the list of shadow casters
         * @param mesh Mesh to add
         * @param includeDescendants boolean indicating if the descendants should be added. Default to true
         */
        addShadowCaster(mesh: AbstractMesh, includeDescendants?: boolean): ShadowGenerator;
        /**
         * Helper function to remove a mesh and its descendants from the list of shadow casters
         * @param mesh Mesh to remove
         * @param includeDescendants boolean indicating if the descendants should be removed. Default to true
         */
        removeShadowCaster(mesh: AbstractMesh, includeDescendants?: boolean): ShadowGenerator;
        /**
         * Controls the extent to which the shadows fade out at the edge of the frustum
         * Used only by directionals and spots
         */
        frustumEdgeFalloff: number;
        private _light;
        /**
         * Returns the associated light object.
         */
        getLight(): IShadowLight;
        forceBackFacesOnly: boolean;
        private _scene;
        private _lightDirection;
        private _effect;
        private _viewMatrix;
        private _projectionMatrix;
        private _transformMatrix;
        private _cachedPosition;
        private _cachedDirection;
        private _cachedDefines;
        private _currentRenderID;
        private _downSamplePostprocess;
        private _boxBlurPostprocess;
        private _kernelBlurXPostprocess;
        private _kernelBlurYPostprocess;
        private _blurPostProcesses;
        private _mapSize;
        private _currentFaceIndex;
        private _currentFaceIndexCache;
        private _textureType;
        private _defaultTextureMatrix;
        /**
         * Creates a ShadowGenerator object.
         * A ShadowGenerator is the required tool to use the shadows.
         * Each light casting shadows needs to use its own ShadowGenerator.
         * Required parameters :
         * - `mapSize` (integer): the size of the texture what stores the shadows. Example : 1024.
         * - `light`: the light object generating the shadows.
         * - `useFullFloatFirst`: by default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
         * Documentation : http://doc.babylonjs.com/tutorials/shadows
         */
        constructor(mapSize: number, light: IShadowLight, useFullFloatFirst?: boolean);
        private _initializeGenerator();
        private _initializeShadowMap();
        private _initializeBlurRTTAndPostProcesses();
        private _renderForShadowMap(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes);
        private _renderSubMeshForShadowMap(subMesh);
        private _applyFilterValues();
        /**
         * Force shader compilation including textures ready check
         */
        forceCompilation(onCompiled?: (generator: ShadowGenerator) => void, options?: Partial<{
            useInstances: boolean;
        }>): void;
        /**
         * Boolean : true when the ShadowGenerator is finally computed.
         */
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        /**
         * This creates the defines related to the standard BJS materials.
         */
        prepareDefines(defines: any, lightIndex: number): void;
        /**
         * This binds shadow lights related to the standard BJS materials.
         * It implies the unifroms available on the materials are the standard BJS ones.
         */
        bindShadowLight(lightIndex: string, effect: Effect): void;
        /**
         * Returns a Matrix object : the updated transformation matrix.
         */
        getTransformMatrix(): Matrix;
        recreateShadowMap(): void;
        private _disposeBlurPostProcesses();
        private _disposeRTTandPostProcesses();
        /**
         * Disposes the ShadowGenerator.
         * Returns nothing.
         */
        dispose(): void;
        /**
         * Serializes the ShadowGenerator and returns a serializationObject.
         */
        serialize(): any;
        /**
         * Parses a serialized ShadowGenerator and returns a new ShadowGenerator.
         */
        static Parse(parsedShadowGenerator: any, scene: Scene): ShadowGenerator;
    }
}

declare module BABYLON {
    /**
     * The Physically based material base class of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    abstract class PBRBaseMaterial extends PushMaterial {
        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        protected _directIntensity: number;
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        protected _emissiveIntensity: number;
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the refelction for shiny ones.
         */
        protected _environmentIntensity: number;
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        protected _specularIntensity: number;
        private _lightingInfos;
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        protected _disableBumpMap: boolean;
        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        protected _albedoTexture: BaseTexture;
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        protected _ambientTexture: BaseTexture;
        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        protected _ambientTextureStrength: number;
        protected _opacityTexture: BaseTexture;
        protected _reflectionTexture: BaseTexture;
        protected _refractionTexture: BaseTexture;
        protected _emissiveTexture: BaseTexture;
        /**
         * AKA Specular texture in other nomenclature.
         */
        protected _reflectivityTexture: BaseTexture;
        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        protected _metallicTexture: BaseTexture;
        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        protected _metallic: number;
        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        protected _roughness: number;
        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        protected _microSurfaceTexture: BaseTexture;
        protected _bumpTexture: BaseTexture;
        protected _lightmapTexture: BaseTexture;
        protected _ambientColor: Color3;
        /**
         * AKA Diffuse Color in other nomenclature.
         */
        protected _albedoColor: Color3;
        /**
         * AKA Specular Color in other nomenclature.
         */
        protected _reflectivityColor: Color3;
        protected _reflectionColor: Color3;
        protected _emissiveColor: Color3;
        /**
         * AKA Glossiness in other nomenclature.
         */
        protected _microSurface: number;
        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        protected _indexOfRefraction: number;
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        protected _invertRefractionY: boolean;
        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        protected _linkRefractionWithTransparency: boolean;
        protected _useLightmapAsShadowmap: boolean;
        /**
         * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
         */
        protected _useAlphaFromAlbedoTexture: boolean;
        /**
         * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
         */
        protected _useSpecularOverAlpha: boolean;
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        protected _useMicroSurfaceFromReflectivityMapAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        protected _useRoughnessFromMetallicTextureAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         */
        protected _useRoughnessFromMetallicTextureGreen: boolean;
        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        protected _useMetallnessFromMetallicTextureBlue: boolean;
        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        protected _useAmbientOcclusionFromMetallicTextureRed: boolean;
        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        protected _useAmbientInGrayScale: boolean;
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        protected _useAutoMicroSurfaceFromReflectivityMap: boolean;
        /**
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        protected _usePhysicalLightFalloff: boolean;
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        protected _useRadianceOverAlpha: boolean;
        /**
         * Allows using the bump map in parallax mode.
         */
        protected _useParallax: boolean;
        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        protected _useParallaxOcclusion: boolean;
        /**
         * Controls the scale bias of the parallax mode.
         */
        protected _parallaxScaleBias: number;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        protected _disableLighting: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        protected _maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will be inverted (x = 1.0 - x).
         */
        protected _invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will be inverted (y = 1.0 - y).
         */
        protected _invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        protected _twoSidedLighting: boolean;
        /**
         * Defines the alpha limits in alpha test mode.
         */
        protected _alphaCutOff: number;
        /**
         * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
         */
        protected _forceAlphaTest: boolean;
        /**
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part.
         */
        protected _useAlphaFresnel: boolean;
        /**
         * The transparency mode of the material.
         */
        protected _transparencyMode: Nullable<number>;
        /**
         * Specifies the environment BRDF texture used to comput the scale and offset roughness values
         * from cos thetav and roughness:
         * http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
         */
        protected _environmentBRDFTexture: Nullable<BaseTexture>;
        /**
         * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
         */
        protected _forceIrradianceInFragment: boolean;
        /**
         * Force normal to face away from face.
         * (Temporary internal fix to remove before 3.1)
         */
        protected _forceNormalForward: boolean;
        /**
         * Default configuration related to image processing available in the PBR Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        private _renderTargets;
        private _globalAmbientColor;
        private _useLogarithmicDepth;
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        getClassName(): string;
        useLogarithmicDepth: boolean;
        /**
         * Gets the current transparency mode.
         */
        /**
         * Sets the transparency mode of the material.
         */
        transparencyMode: Nullable<number>;
        /**
         * Returns true if alpha blending should be disabled.
         */
        private readonly _disableAlphaBlending;
        /**
         * Specifies whether or not this material should be rendered in alpha blend mode.
         */
        needAlphaBlending(): boolean;
        /**
         * Specifies whether or not this material should be rendered in alpha blend mode for the given mesh.
         */
        needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
        /**
         * Specifies whether or not this material should be rendered in alpha test mode.
         */
        needAlphaTesting(): boolean;
        /**
         * Specifies whether or not the alpha value of the albedo texture should be used for alpha blending.
         */
        protected _shouldUseAlphaFromAlbedoTexture(): boolean;
        getAlphaTestTexture(): BaseTexture;
        private static _scaledReflectivity;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        buildUniformLayout(): void;
        unbind(): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        private _getReflectionTexture();
        private _getRefractionTexture();
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
    }
}

declare module BABYLON.Internals {
    /**
     * The Physically based simple base material of BJS.
     *
     * This enables better naming and convention enforcements on top of the pbrMaterial.
     * It is used as the base class for both the specGloss and metalRough conventions.
     */
    abstract class PBRBaseSimpleMaterial extends PBRBaseMaterial {
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        maxSimultaneousLights: number;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        disableLighting: boolean;
        /**
         * Environment Texture used in the material (this is use for both reflection and environment lighting).
         */
        environmentTexture: BaseTexture;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        invertNormalMapY: boolean;
        /**
         * Normal map used in the model.
         */
        normalTexture: BaseTexture;
        /**
         * Emissivie color used to self-illuminate the model.
         */
        emissiveColor: Color3;
        /**
         * Emissivie texture used to self-illuminate the model.
         */
        emissiveTexture: BaseTexture;
        /**
         * Occlusion Channel Strenght.
         */
        occlusionStrength: number;
        /**
         * Occlusion Texture of the material (adding extra occlusion effects).
         */
        occlusionTexture: BaseTexture;
        /**
         * Defines the alpha limits in alpha test mode.
         */
        alphaCutOff: number;
        /**
         * Gets the current double sided mode.
         */
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        doubleSided: boolean;
        /**
         * Return the active textures of the material.
         */
        getActiveTextures(): BaseTexture[];
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        getClassName(): string;
    }
}

declare module BABYLON {
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    class PBRMaterial extends PBRBaseMaterial {
        private static _PBRMATERIAL_OPAQUE;
        /**
         * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
         */
        static readonly PBRMATERIAL_OPAQUE: number;
        private static _PBRMATERIAL_ALPHATEST;
        /**
         * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
         */
        static readonly PBRMATERIAL_ALPHATEST: number;
        private static _PBRMATERIAL_ALPHABLEND;
        /**
         * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
         */
        static readonly PBRMATERIAL_ALPHABLEND: number;
        private static _PBRMATERIAL_ALPHATESTANDBLEND;
        /**
         * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
         * They are also discarded below the alpha cutoff threshold to improve performances.
         */
        static readonly PBRMATERIAL_ALPHATESTANDBLEND: number;
        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        directIntensity: number;
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        emissiveIntensity: number;
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the refelction for shiny ones.
         */
        environmentIntensity: number;
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        specularIntensity: number;
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        disableBumpMap: boolean;
        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        albedoTexture: BaseTexture;
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        ambientTexture: BaseTexture;
        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        ambientTextureStrength: number;
        opacityTexture: BaseTexture;
        reflectionTexture: Nullable<BaseTexture>;
        emissiveTexture: BaseTexture;
        /**
         * AKA Specular texture in other nomenclature.
         */
        reflectivityTexture: BaseTexture;
        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        metallicTexture: BaseTexture;
        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        metallic: number;
        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        roughness: number;
        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        microSurfaceTexture: BaseTexture;
        bumpTexture: BaseTexture;
        lightmapTexture: BaseTexture;
        refractionTexture: BaseTexture;
        ambientColor: Color3;
        /**
         * AKA Diffuse Color in other nomenclature.
         */
        albedoColor: Color3;
        /**
         * AKA Specular Color in other nomenclature.
         */
        reflectivityColor: Color3;
        reflectionColor: Color3;
        emissiveColor: Color3;
        /**
         * AKA Glossiness in other nomenclature.
         */
        microSurface: number;
        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        indexOfRefraction: number;
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        invertRefractionY: boolean;
        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        linkRefractionWithTransparency: boolean;
        useLightmapAsShadowmap: boolean;
        /**
         * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
         */
        useAlphaFromAlbedoTexture: boolean;
        /**
         * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
         */
        forceAlphaTest: boolean;
        /**
         * Defines the alpha limits in alpha test mode.
         */
        alphaCutOff: number;
        /**
         * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
         */
        useSpecularOverAlpha: boolean;
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        useMicroSurfaceFromReflectivityMapAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        useRoughnessFromMetallicTextureAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         */
        useRoughnessFromMetallicTextureGreen: boolean;
        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        useMetallnessFromMetallicTextureBlue: boolean;
        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        useAmbientOcclusionFromMetallicTextureRed: boolean;
        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        useAmbientInGrayScale: boolean;
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        useAutoMicroSurfaceFromReflectivityMap: boolean;
        /**
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        usePhysicalLightFalloff: boolean;
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        useRadianceOverAlpha: boolean;
        /**
         * Allows using the bump map in parallax mode.
         */
        useParallax: boolean;
        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        useParallaxOcclusion: boolean;
        /**
         * Controls the scale bias of the parallax mode.
         */
        parallaxScaleBias: number;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        disableLighting: boolean;
        /**
         * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
         */
        forceIrradianceInFragment: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        twoSidedLighting: boolean;
        /**
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part.
         */
        useAlphaFresnel: boolean;
        /**
         * A fresnel is applied to the alpha of the model to ensure grazing angles edges are not alpha tested.
         * And/Or occlude the blended part.
         */
        environmentBRDFTexture: Nullable<BaseTexture>;
        /**
         * Force normal to face away from face.
         * (Temporary internal fix to remove before 3.1)
         */
        forceNormalForward: boolean;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: number;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: number;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        getClassName(): string;
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): PBRMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial;
    }
}

declare module BABYLON {
    /**
     * The PBR material of BJS following the metal roughness convention.
     *
     * This fits to the PBR convention in the GLTF definition:
     * https://github.com/KhronosGroup/glTF/tree/2.0/specification/2.0
     */
    class PBRMetallicRoughnessMaterial extends Internals.PBRBaseSimpleMaterial {
        /**
         * The base color has two different interpretations depending on the value of metalness.
         * When the material is a metal, the base color is the specific measured reflectance value
         * at normal incidence (F0). For a non-metal the base color represents the reflected diffuse color
         * of the material.
         */
        baseColor: Color3;
        /**
         * Base texture of the metallic workflow. It contains both the baseColor information in RGB as
         * well as opacity information in the alpha channel.
         */
        baseTexture: BaseTexture;
        /**
         * Specifies the metallic scalar value of the material.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        metallic: number;
        /**
         * Specifies the roughness scalar value of the material.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        roughness: number;
        /**
         * Texture containing both the metallic value in the B channel and the
         * roughness value in the G channel to keep better precision.
         */
        metallicRoughnessTexture: BaseTexture;
        /**
         * Instantiates a new PBRMetalRoughnessMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        /**
         * Return the currrent class name of the material.
         */
        getClassName(): string;
        /**
         * Return the active textures of the material.
         */
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): PBRMetallicRoughnessMaterial;
        /**
         * Serialize the material to a parsable JSON object.
         */
        serialize(): any;
        /**
         * Parses a JSON object correponding to the serialize function.
         */
        static Parse(source: any, scene: Scene, rootUrl: string): PBRMetallicRoughnessMaterial;
    }
}

declare module BABYLON {
    /**
     * The PBR material of BJS following the specular glossiness convention.
     *
     * This fits to the PBR convention in the GLTF definition:
     * https://github.com/KhronosGroup/glTF/tree/2.0/extensions/Khronos/KHR_materials_pbrSpecularGlossiness
     */
    class PBRSpecularGlossinessMaterial extends Internals.PBRBaseSimpleMaterial {
        /**
         * Specifies the diffuse color of the material.
         */
        diffuseColor: Color3;
        /**
         * Specifies the diffuse texture of the material. This can also contains the opcity value in its alpha
         * channel.
         */
        diffuseTexture: BaseTexture;
        /**
         * Specifies the specular color of the material. This indicates how reflective is the material (none to mirror).
         */
        specularColor: Color3;
        /**
         * Specifies the glossiness of the material. This indicates "how sharp is the reflection".
         */
        glossiness: number;
        /**
         * Specifies both the specular color RGB and the glossiness A of the material per pixels.
         */
        specularGlossinessTexture: BaseTexture;
        /**
         * Instantiates a new PBRSpecularGlossinessMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        /**
         * Return the currrent class name of the material.
         */
        getClassName(): string;
        /**
         * Return the active textures of the material.
         */
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): PBRSpecularGlossinessMaterial;
        /**
         * Serialize the material to a parsable JSON object.
         */
        serialize(): any;
        /**
         * Parses a JSON object correponding to the serialize function.
         */
        static Parse(source: any, scene: Scene, rootUrl: string): PBRSpecularGlossinessMaterial;
    }
}

declare namespace BABYLON {
    /**
     * Background material used to create an efficient environement around your scene.
     */
    class BackgroundMaterial extends BABYLON.PushMaterial {
        /**
         * Standard reflectance value at parallel view angle.
         */
        static standardReflectance0: number;
        /**
         * Standard reflectance value at grazing angle.
         */
        static standardReflectance90: number;
        /**
         * Key light Color (multiply against the R channel of the environement texture)
         */
        protected _primaryColor: Color3;
        primaryColor: Color3;
        /**
         * Key light Level (allowing HDR output of the background)
         */
        protected _primaryLevel: float;
        primaryLevel: float;
        /**
         * Secondary light Color (multiply against the G channel of the environement texture)
         */
        protected _secondaryColor: Color3;
        secondaryColor: Color3;
        /**
         * Secondary light Level (allowing HDR output of the background)
         */
        protected _secondaryLevel: float;
        secondaryLevel: float;
        /**
         * Tertiary light Color (multiply against the B channel of the environement texture)
         */
        protected _tertiaryColor: Color3;
        tertiaryColor: Color3;
        /**
         * Tertiary light Level (allowing HDR output of the background)
         */
        protected _tertiaryLevel: float;
        tertiaryLevel: float;
        /**
         * Reflection Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _reflectionTexture: Nullable<BaseTexture>;
        reflectionTexture: Nullable<BaseTexture>;
        /**
         * Reflection Texture level of blur.
         *
         * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the
         * texture twice.
         */
        protected _reflectionBlur: float;
        reflectionBlur: float;
        /**
         * Diffuse Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _diffuseTexture: Nullable<BaseTexture>;
        diffuseTexture: Nullable<BaseTexture>;
        /**
         * Specify the list of lights casting shadow on the material.
         * All scene shadow lights will be included if null.
         */
        protected _shadowLights: Nullable<IShadowLight[]>;
        shadowLights: Nullable<IShadowLight[]>;
        /**
         * For the lights having a blurred shadow generator, this can add a second blur pass in order to reach
         * soft lighting on the background.
         */
        protected _shadowBlurScale: int;
        shadowBlurScale: int;
        /**
         * Helps adjusting the shadow to a softer level if required.
         * 0 means black shadows and 1 means no shadows.
         */
        protected _shadowLevel: float;
        shadowLevel: float;
        /**
         * In case of opacity Fresnel or reflection falloff, this is use as a scene center.
         * It is usually zero but might be interesting to modify according to your setup.
         */
        protected _sceneCenter: Vector3;
        sceneCenter: Vector3;
        /**
         * This helps specifying that the material is falling off to the sky box at grazing angle.
         * This helps ensuring a nice transition when the camera goes under the ground.
         */
        protected _opacityFresnel: boolean;
        opacityFresnel: boolean;
        /**
         * This helps specifying that the material is falling off from diffuse to the reflection texture at grazing angle.
         * This helps adding a mirror texture on the ground.
         */
        protected _reflectionFresnel: boolean;
        reflectionFresnel: boolean;
        /**
         * This helps specifying the falloff radius off the reflection texture from the sceneCenter.
         * This helps adding a nice falloff effect to the reflection if used as a mirror for instance.
         */
        protected _reflectionFalloffDistance: number;
        reflectionFalloffDistance: number;
        /**
         * This specifies the weight of the reflection against the background in case of reflection Fresnel.
         */
        protected _reflectionAmount: number;
        reflectionAmount: number;
        /**
         * This specifies the weight of the reflection at grazing angle.
         */
        protected _reflectionReflectance0: number;
        reflectionReflectance0: number;
        /**
         * This specifies the weight of the reflection at a perpendicular point of view.
         */
        protected _reflectionReflectance90: number;
        reflectionReflectance90: number;
        /**
         * Sets the reflection reflectance fresnel values according to the default standard
         * empirically know to work well :-)
         */
        reflectionStandardFresnelWeight: number;
        /**
         * Helps to directly use the maps channels instead of their level.
         */
        protected _useRGBColor: boolean;
        useRGBColor: boolean;
        /**
         * This helps reducing the banding effect that could occur on the background.
         */
        protected _enableNoise: boolean;
        enableNoise: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        private _maxSimultaneousLights;
        maxSimultaneousLights: int;
        /**
         * Default configuration related to image processing available in the Background Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration (if null the scene configuration will be use)
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: float;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: float;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        private _renderTargets;
        private _reflectionControls;
        /**
         * constructor
         * @param name The name of the material
         * @param scene The scene to add the material to
         */
        constructor(name: string, scene: BABYLON.Scene);
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        needAlphaTesting(): boolean;
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns true if blending is enable
         */
        needAlphaBlending(): boolean;
        /**
         * Checks wether the material is ready to be rendered for a given mesh.
         * @param mesh The mesh to render
         * @param subMesh The submesh to check against
         * @param useInstances Specify wether or not the material is used with instances
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        /**
         * Build the uniform buffer used in the material.
         */
        buildUniformLayout(): void;
        /**
         * Unbind the material.
         */
        unbind(): void;
        /**
         * Bind only the world matrix to the material.
         * @param world The world matrix to bind.
         */
        bindOnlyWorldMatrix(world: Matrix): void;
        /**
         * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
         * @param world The world matrix to bind.
         * @param subMesh The submesh to bind for.
         */
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        /**
         * Dispose the material.
         * @forceDisposeEffect Force disposal of the associated effect.
         * @forceDisposeTextures Force disposal of the associated textures.
         */
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        /**
         * Clones the material.
         * @name The cloned name.
         * @returns The cloned material.
         */
        clone(name: string): BackgroundMaterial;
        /**
         * Serializes the current material to its JSON representation.
         * @returns The JSON representation.
         */
        serialize(): any;
        /**
         * Gets the class name of the material
         * @returns "BackgroundMaterial"
         */
        getClassName(): string;
        /**
         * Parse a JSON input to create back a background material.
         * @param source
         * @param scene
         * @param rootUrl
         * @returns the instantiated BackgroundMaterial.
         */
        static Parse(source: any, scene: Scene, rootUrl: string): BackgroundMaterial;
    }
}

declare module BABYLON {
    class BaseTexture {
        static DEFAULT_ANISOTROPIC_FILTERING_LEVEL: number;
        name: string;
        private _hasAlpha;
        hasAlpha: boolean;
        getAlphaFromRGB: boolean;
        level: number;
        coordinatesIndex: number;
        private _coordinatesMode;
        coordinatesMode: number;
        wrapU: number;
        wrapV: number;
        wrapR: number;
        anisotropicFilteringLevel: number;
        isCube: boolean;
        is3D: boolean;
        gammaSpace: boolean;
        invertZ: boolean;
        lodLevelInAlpha: boolean;
        lodGenerationOffset: number;
        lodGenerationScale: number;
        isRenderTarget: boolean;
        readonly uid: string;
        toString(): string;
        getClassName(): string;
        animations: Animation[];
        /**
        * An event triggered when the texture is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<BaseTexture>;
        private _onDisposeObserver;
        onDispose: () => void;
        delayLoadState: number;
        private _scene;
        _texture: Nullable<InternalTexture>;
        private _uid;
        readonly isBlocking: boolean;
        constructor(scene: Nullable<Scene>);
        getScene(): Nullable<Scene>;
        getTextureMatrix(): Matrix;
        getReflectionTextureMatrix(): Matrix;
        getInternalTexture(): Nullable<InternalTexture>;
        isReadyOrNotBlocking(): boolean;
        isReady(): boolean;
        getSize(): ISize;
        getBaseSize(): ISize;
        scale(ratio: number): void;
        readonly canRescale: boolean;
        _getFromCache(url: Nullable<string>, noMipmap: boolean, sampling?: number): Nullable<InternalTexture>;
        _rebuild(): void;
        delayLoad(): void;
        clone(): Nullable<BaseTexture>;
        readonly textureType: number;
        readonly textureFormat: number;
        readPixels(faceIndex?: number): Nullable<ArrayBufferView>;
        releaseInternalTexture(): void;
        sphericalPolynomial: Nullable<SphericalPolynomial>;
        readonly _lodTextureHigh: Nullable<BaseTexture>;
        readonly _lodTextureMid: Nullable<BaseTexture>;
        readonly _lodTextureLow: Nullable<BaseTexture>;
        dispose(): void;
        serialize(): any;
        static WhenAllReady(textures: BaseTexture[], callback: () => void): void;
    }
}

declare module BABYLON {
    /**
     * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
     * It can help converting any input color in a desired output one. This can then be used to create effects
     * from sepia, black and white to sixties or futuristic rendering...
     *
     * The only supported format is currently 3dl.
     * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table/
     */
    class ColorGradingTexture extends BaseTexture {
        /**
         * The current texture matrix. (will always be identity in color grading texture)
         */
        private _textureMatrix;
        /**
         * The texture URL.
         */
        url: string;
        /**
         * Empty line regex stored for GC.
         */
        private static _noneEmptyLineRegex;
        private _engine;
        /**
         * Instantiates a ColorGradingTexture from the following parameters.
         *
         * @param url The location of the color gradind data (currently only supporting 3dl)
         * @param scene The scene the texture will be used in
         */
        constructor(url: string, scene: Scene);
        /**
         * Returns the texture matrix used in most of the material.
         * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
         */
        getTextureMatrix(): Matrix;
        /**
         * Occurs when the file being loaded is a .3dl LUT file.
         */
        private load3dlTexture();
        /**
         * Starts the loading process of the texture.
         */
        private loadTexture();
        /**
         * Clones the color gradind texture.
         */
        clone(): ColorGradingTexture;
        /**
         * Called during delayed load for textures.
         */
        delayLoad(): void;
        /**
         * Parses a color grading texture serialized by Babylon.
         * @param parsedTexture The texture information being parsedTexture
         * @param scene The scene to load the texture in
         * @param rootUrl The root url of the data assets to load
         * @return A color gradind texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<ColorGradingTexture>;
        /**
         * Serializes the LUT texture to json format.
         */
        serialize(): any;
    }
}

declare module BABYLON {
    class CubeTexture extends BaseTexture {
        url: string;
        coordinatesMode: number;
        private _noMipmap;
        private _files;
        private _extensions;
        private _textureMatrix;
        private _format;
        private _prefiltered;
        static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean): CubeTexture;
        static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension?: any): CubeTexture;
        constructor(rootUrl: string, scene: Scene, extensions?: Nullable<string[]>, noMipmap?: boolean, files?: Nullable<string[]>, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, prefiltered?: boolean, forcedExtension?: any);
        delayLoad(): void;
        getReflectionTextureMatrix(): Matrix;
        setReflectionTextureMatrix(value: Matrix): void;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture;
        clone(): CubeTexture;
    }
}

declare module BABYLON {
    class DynamicTexture extends Texture {
        private _generateMipMaps;
        private _canvas;
        private _context;
        private _engine;
        constructor(name: string, options: any, scene: Scene | null | undefined, generateMipMaps: boolean, samplingMode?: number, format?: number);
        readonly canRescale: boolean;
        private _recreate(textureSize);
        scale(ratio: number): void;
        scaleTo(width: number, height: number): void;
        getContext(): CanvasRenderingContext2D;
        clear(): void;
        update(invertY?: boolean): void;
        drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean, update?: boolean): void;
        clone(): DynamicTexture;
        _rebuild(): void;
    }
}

declare module BABYLON {
    /**
     * This represents a texture coming from an HDR input.
     *
     * The only supported format is currently panorama picture stored in RGBE format.
     * Example of such files can be found on HDRLib: http://hdrlib.com/
     */
    class HDRCubeTexture extends BaseTexture {
        private static _facesMapping;
        private _useInGammaSpace;
        private _generateHarmonics;
        private _noMipmap;
        private _textureMatrix;
        private _size;
        private _usePMREMGenerator;
        private _isBABYLONPreprocessed;
        private _onLoad;
        private _onError;
        /**
         * The texture URL.
         */
        url: string;
        /**
         * The texture coordinates mode. As this texture is stored in a cube format, please modify carefully.
         */
        coordinatesMode: number;
        /**
         * Specifies wether the texture has been generated through the PMREMGenerator tool.
         * This is usefull at run time to apply the good shader.
         */
        isPMREM: boolean;
        protected _isBlocking: boolean;
        /**
         * Gets wether or not the texture is blocking during loading.
         */
        /**
         * Sets wether or not the texture is blocking during loading.
         */
        isBlocking: boolean;
        /**
         * Instantiates an HDRTexture from the following parameters.
         *
         * @param url The location of the HDR raw data (Panorama stored in RGBE format)
         * @param scene The scene the texture will be used in
         * @param size The cubemap desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
         * @param noMipmap Forces to not generate the mipmap if true
         * @param generateHarmonics Specifies wether you want to extract the polynomial harmonics during the generation process
         * @param useInGammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
         * @param usePMREMGenerator Specifies wether or not to generate the CubeMap through CubeMapGen to avoid seams issue at run time.
         */
        constructor(url: string, scene: Scene, size?: number, noMipmap?: boolean, generateHarmonics?: boolean, useInGammaSpace?: boolean, usePMREMGenerator?: boolean, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>);
        /**
         * Occurs when the file is a preprocessed .babylon.hdr file.
         */
        private loadBabylonTexture();
        /**
         * Occurs when the file is raw .hdr file.
         */
        private loadHDRTexture();
        /**
         * Starts the loading process of the texture.
         */
        private loadTexture();
        clone(): HDRCubeTexture;
        delayLoad(): void;
        getReflectionTextureMatrix(): Matrix;
        setReflectionTextureMatrix(value: Matrix): void;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<HDRCubeTexture>;
        serialize(): any;
        /**
         * Saves as a file the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        static generateBabylonHDROnDisk(url: string, size: number, onError?: Nullable<(() => void)>): void;
        /**
         * Serializes the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        static generateBabylonHDR(url: string, size: number, callback: ((ArrayBuffer: ArrayBuffer) => void), onError?: Nullable<(() => void)>): void;
    }
}

declare module BABYLON {
    class InternalTexture {
        static DATASOURCE_UNKNOWN: number;
        static DATASOURCE_URL: number;
        static DATASOURCE_TEMP: number;
        static DATASOURCE_RAW: number;
        static DATASOURCE_DYNAMIC: number;
        static DATASOURCE_RENDERTARGET: number;
        static DATASOURCE_MULTIRENDERTARGET: number;
        static DATASOURCE_CUBE: number;
        static DATASOURCE_CUBERAW: number;
        static DATASOURCE_CUBEPREFILTERED: number;
        static DATASOURCE_RAW3D: number;
        isReady: boolean;
        isCube: boolean;
        is3D: boolean;
        url: string;
        samplingMode: number;
        generateMipMaps: boolean;
        samples: number;
        type: number;
        format: number;
        onLoadedObservable: Observable<InternalTexture>;
        width: number;
        height: number;
        depth: number;
        baseWidth: number;
        baseHeight: number;
        baseDepth: number;
        invertY: boolean;
        _dataSource: number;
        _buffer: Nullable<ArrayBuffer | HTMLImageElement>;
        _bufferView: Nullable<ArrayBufferView>;
        _bufferViewArray: Nullable<ArrayBufferView[]>;
        _size: number;
        _extension: string;
        _files: Nullable<string[]>;
        _workingCanvas: HTMLCanvasElement;
        _workingContext: CanvasRenderingContext2D;
        _framebuffer: Nullable<WebGLFramebuffer>;
        _depthStencilBuffer: Nullable<WebGLRenderbuffer>;
        _MSAAFramebuffer: Nullable<WebGLFramebuffer>;
        _MSAARenderBuffer: Nullable<WebGLRenderbuffer>;
        _cachedCoordinatesMode: Nullable<number>;
        _cachedWrapU: Nullable<number>;
        _cachedWrapV: Nullable<number>;
        _cachedWrapR: Nullable<number>;
        _cachedAnisotropicFilteringLevel: Nullable<number>;
        _isDisabled: boolean;
        _compression: Nullable<string>;
        _generateStencilBuffer: boolean;
        _generateDepthBuffer: boolean;
        _sphericalPolynomial: Nullable<SphericalPolynomial>;
        _lodGenerationScale: number;
        _lodGenerationOffset: number;
        _lodTextureHigh: BaseTexture;
        _lodTextureMid: BaseTexture;
        _lodTextureLow: BaseTexture;
        _webGLTexture: Nullable<WebGLTexture>;
        _references: number;
        private _engine;
        readonly dataSource: number;
        constructor(engine: Engine, dataSource: number);
        incrementReferences(): void;
        updateSize(width: int, height: int, depth?: int): void;
        _rebuild(): void;
        private _swapAndDie(target);
        dispose(): void;
    }
}

declare module BABYLON {
    class MirrorTexture extends RenderTargetTexture {
        mirrorPlane: Plane;
        private _transformMatrix;
        private _mirrorMatrix;
        private _savedViewMatrix;
        private _blurX;
        private _blurY;
        private _adaptiveBlurKernel;
        private _blurKernelX;
        private _blurKernelY;
        private _blurRatio;
        blurRatio: number;
        adaptiveBlurKernel: number;
        blurKernel: number;
        blurKernelX: number;
        blurKernelY: number;
        private _autoComputeBlurKernel();
        protected _onRatioRescale(): void;
        constructor(name: string, size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }, scene: Scene, generateMipMaps?: boolean, type?: number, samplingMode?: number, generateDepthBuffer?: boolean);
        private _preparePostProcesses();
        clone(): MirrorTexture;
        serialize(): any;
    }
}

declare module BABYLON {
    interface IMultiRenderTargetOptions {
        generateMipMaps: boolean;
        types: number[];
        samplingModes: number[];
        generateDepthBuffer: boolean;
        generateStencilBuffer: boolean;
        generateDepthTexture: boolean;
        textureCount: number;
    }
    class MultiRenderTarget extends RenderTargetTexture {
        private _internalTextures;
        private _textures;
        private _count;
        readonly isSupported: boolean;
        private _multiRenderTargetOptions;
        readonly textures: Texture[];
        readonly depthTexture: Texture;
        wrapU: number;
        wrapV: number;
        constructor(name: string, size: any, count: number, scene: Scene, options?: any);
        _rebuild(): void;
        private _createInternalTextures();
        private _createTextures();
        samples: number;
        resize(size: any): void;
        dispose(): void;
        releaseInternalTextures(): void;
    }
}

declare module BABYLON {
    class RawTexture extends Texture {
        format: number;
        private _engine;
        constructor(data: ArrayBufferView, width: number, height: number, format: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number);
        update(data: ArrayBufferView): void;
        static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
    }
}

declare module BABYLON {
    /**
    * Creates a refraction texture used by refraction channel of the standard material.
    * @param name the texture name
    * @param size size of the underlying texture
    * @param scene root scene
    */
    class RefractionTexture extends RenderTargetTexture {
        refractionPlane: Plane;
        depth: number;
        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean);
        clone(): RefractionTexture;
        serialize(): any;
    }
}

declare module BABYLON {
    class RenderTargetTexture extends Texture {
        isCube: boolean;
        static _REFRESHRATE_RENDER_ONCE: number;
        static _REFRESHRATE_RENDER_ONEVERYFRAME: number;
        static _REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number;
        static readonly REFRESHRATE_RENDER_ONCE: number;
        static readonly REFRESHRATE_RENDER_ONEVERYFRAME: number;
        static readonly REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number;
        /**
        * Use this predicate to dynamically define the list of mesh you want to render.
        * If set, the renderList property will be overwritten.
        */
        renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;
        /**
        * Use this list to define the list of mesh you want to render.
        */
        renderList: Nullable<Array<AbstractMesh>>;
        renderParticles: boolean;
        renderSprites: boolean;
        coordinatesMode: number;
        activeCamera: Nullable<Camera>;
        customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        useCameraPostProcesses: boolean;
        ignoreCameraViewport: boolean;
        private _postProcessManager;
        private _postProcesses;
        private _resizeObserver;
        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        onBeforeBindObservable: Observable<RenderTargetTexture>;
        /**
        * An event triggered when the texture is unbind.
        * @type {BABYLON.Observable}
        */
        onAfterUnbindObservable: Observable<RenderTargetTexture>;
        private _onAfterUnbindObserver;
        onAfterUnbind: () => void;
        /**
        * An event triggered before rendering the texture
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<number>;
        private _onBeforeRenderObserver;
        onBeforeRender: (faceIndex: number) => void;
        /**
        * An event triggered after rendering the texture
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<number>;
        private _onAfterRenderObserver;
        onAfterRender: (faceIndex: number) => void;
        /**
        * An event triggered after the texture clear
        * @type {BABYLON.Observable}
        */
        onClearObservable: Observable<Engine>;
        private _onClearObserver;
        onClear: (Engine: Engine) => void;
        clearColor: Color4;
        protected _size: number | {
            width: number;
            height: number;
        };
        protected _initialSizeParameter: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
        protected _sizeRatio: Nullable<number>;
        _generateMipMaps: boolean;
        protected _renderingManager: RenderingManager;
        _waitingRenderList: string[];
        protected _doNotChangeAspectRatio: boolean;
        protected _currentRefreshId: number;
        protected _refreshRate: number;
        protected _textureMatrix: Matrix;
        protected _samples: number;
        protected _renderTargetOptions: RenderTargetCreationOptions;
        readonly renderTargetOptions: RenderTargetCreationOptions;
        protected _engine: Engine;
        protected _onRatioRescale(): void;
        constructor(name: string, size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }, scene: Nullable<Scene>, generateMipMaps?: boolean, doNotChangeAspectRatio?: boolean, type?: number, isCube?: boolean, samplingMode?: number, generateDepthBuffer?: boolean, generateStencilBuffer?: boolean, isMulti?: boolean);
        private _processSizeParameter(size);
        samples: number;
        resetRefreshCounter(): void;
        refreshRate: number;
        addPostProcess(postProcess: PostProcess): void;
        clearPostProcesses(dispose?: boolean): void;
        removePostProcess(postProcess: PostProcess): void;
        _shouldRender(): boolean;
        getRenderSize(): number;
        getRenderWidth(): number;
        getRenderHeight(): number;
        readonly canRescale: boolean;
        scale(ratio: number): void;
        getReflectionTextureMatrix(): Matrix;
        resize(size: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        }): void;
        render(useCameraPostProcess?: boolean, dumpForDebug?: boolean): void;
        private _bestReflectionRenderTargetDimension(renderDimension, scale);
        private renderToTarget(faceIndex, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void;
        clone(): RenderTargetTexture;
        serialize(): any;
        disposeFramebufferObjects(): void;
        dispose(): void;
        _rebuild(): void;
    }
}

declare module BABYLON {
    class Texture extends BaseTexture {
        static NEAREST_SAMPLINGMODE: number;
        static NEAREST_NEAREST_MIPLINEAR: number;
        static BILINEAR_SAMPLINGMODE: number;
        static LINEAR_LINEAR_MIPNEAREST: number;
        static TRILINEAR_SAMPLINGMODE: number;
        static LINEAR_LINEAR_MIPLINEAR: number;
        static NEAREST_NEAREST_MIPNEAREST: number;
        static NEAREST_LINEAR_MIPNEAREST: number;
        static NEAREST_LINEAR_MIPLINEAR: number;
        static NEAREST_LINEAR: number;
        static NEAREST_NEAREST: number;
        static LINEAR_NEAREST_MIPNEAREST: number;
        static LINEAR_NEAREST_MIPLINEAR: number;
        static LINEAR_LINEAR: number;
        static LINEAR_NEAREST: number;
        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;
        static SKYBOX_MODE: number;
        static INVCUBIC_MODE: number;
        static EQUIRECTANGULAR_MODE: number;
        static FIXED_EQUIRECTANGULAR_MODE: number;
        static FIXED_EQUIRECTANGULAR_MIRRORED_MODE: number;
        static CLAMP_ADDRESSMODE: number;
        static WRAP_ADDRESSMODE: number;
        static MIRROR_ADDRESSMODE: number;
        url: Nullable<string>;
        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        readonly noMipmap: boolean;
        private _noMipmap;
        _invertY: boolean;
        private _rowGenerationMatrix;
        private _cachedTextureMatrix;
        private _projectionModeMatrix;
        private _t0;
        private _t1;
        private _t2;
        private _cachedUOffset;
        private _cachedVOffset;
        private _cachedUScale;
        private _cachedVScale;
        private _cachedUAng;
        private _cachedVAng;
        private _cachedWAng;
        private _cachedProjectionMatrixId;
        private _cachedCoordinatesMode;
        _samplingMode: number;
        private _buffer;
        private _deleteBuffer;
        protected _format: Nullable<number>;
        private _delayedOnLoad;
        private _delayedOnError;
        private _onLoadObservable;
        protected _isBlocking: boolean;
        isBlocking: boolean;
        readonly samplingMode: number;
        constructor(url: Nullable<string>, scene: Nullable<Scene>, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, esception?: any) => void>, buffer?: any, deleteBuffer?: boolean, format?: number);
        updateURL(url: string): void;
        delayLoad(): void;
        updateSamplingMode(samplingMode: number): void;
        private _prepareRowForTextureGeneration(x, y, z, t);
        getTextureMatrix(): Matrix;
        getReflectionTextureMatrix(): Matrix;
        clone(): Texture;
        readonly onLoadObservable: Observable<Texture>;
        serialize(): any;
        getClassName(): string;
        dispose(): void;
        static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<() => void>, format?: number): Texture;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<BaseTexture>;
        static LoadFromDataString(name: string, buffer: any, scene: Scene, deleteBuffer?: boolean, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number): Texture;
    }
}

declare module BABYLON {
    class VideoTexture extends Texture {
        video: HTMLVideoElement;
        private _autoLaunch;
        private _lastUpdate;
        private _generateMipMaps;
        private _setTextureReady;
        private _engine;
        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/tutorials/01._Advanced_Texturing
         * @param {Array} urlsOrVideo can be used to provide an array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         */
        constructor(name: string, urlsOrVideo: string[] | HTMLVideoElement, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number);
        private __setTextureReady();
        private _createTexture();
        _rebuild(): void;
        update(): boolean;
        dispose(): void;
        static CreateFromWebCam(scene: Scene, onReady: (videoTexture: VideoTexture) => void, constraints: {
            minWidth: number;
            maxWidth: number;
            minHeight: number;
            maxHeight: number;
            deviceId: string;
        }): void;
    }
}

declare module BABYLON {
    class CannonJSPlugin implements IPhysicsEnginePlugin {
        private _useDeltaForWorldStep;
        world: any;
        name: string;
        private _physicsMaterials;
        private _fixedTimeStep;
        BJSCANNON: any;
        constructor(_useDeltaForWorldStep?: boolean, iterations?: number);
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        private _processChildMeshes(mainImpostor);
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(impostorJoint: PhysicsImpostorJoint): void;
        removeJoint(impostorJoint: PhysicsImpostorJoint): void;
        private _addMaterial(name, friction, restitution);
        private _checkWithEpsilon(value);
        private _createShape(impostor);
        private _createHeightmap(object, pointDepth?);
        private _minus90X;
        private _plus90X;
        private _tmpPosition;
        private _tmpDeltaPosition;
        private _tmpUnityRotation;
        private _updatePhysicsBodyTransformation(impostor);
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        isSupported(): boolean;
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed?: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class OimoJSPlugin implements IPhysicsEnginePlugin {
        world: any;
        name: string;
        BJSOIMO: any;
        constructor(iterations?: number);
        setGravity(gravity: Vector3): void;
        setTimeStep(timeStep: number): void;
        getTimeStep(): number;
        private _tmpImpostorsArray;
        executeStep(delta: number, impostors: Array<PhysicsImpostor>): void;
        applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
        generatePhysicsBody(impostor: PhysicsImpostor): void;
        private _tmpPositionVector;
        removePhysicsBody(impostor: PhysicsImpostor): void;
        generateJoint(impostorJoint: PhysicsImpostorJoint): void;
        removeJoint(impostorJoint: PhysicsImpostorJoint): void;
        isSupported(): boolean;
        setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
        setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
        private _getLastShape(body);
        setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3): void;
        getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
        setBodyMass(impostor: PhysicsImpostor, mass: number): void;
        getBodyMass(impostor: PhysicsImpostor): number;
        getBodyFriction(impostor: PhysicsImpostor): number;
        setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
        getBodyRestitution(impostor: PhysicsImpostor): number;
        setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
        sleepBody(impostor: PhysicsImpostor): void;
        wakeUpBody(impostor: PhysicsImpostor): void;
        updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
        setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
        setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
        syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
        getRadius(impostor: PhysicsImpostor): number;
        getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class PostProcessRenderEffect {
        private _engine;
        private _postProcesses;
        private _getPostProcess;
        private _singleInstance;
        private _cameras;
        private _indicesForCamera;
        private _renderPasses;
        private _renderEffectAsPasses;
        _name: string;
        applyParameters: (postProcess: PostProcess) => void;
        constructor(engine: Engine, name: string, getPostProcess: () => Nullable<PostProcess>, singleInstance?: boolean);
        readonly isSupported: boolean;
        _update(): void;
        addPass(renderPass: PostProcessRenderPass): void;
        removePass(renderPass: PostProcessRenderPass): void;
        addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void;
        getPass(passName: string): Nullable<PostProcessRenderPass>;
        emptyPasses(): void;
        _attachCameras(cameras: Camera): void;
        _attachCameras(cameras: Camera[]): void;
        _detachCameras(cameras: Camera): void;
        _detachCameras(cameras: Camera[]): void;
        _enable(cameras: Camera): void;
        _enable(cameras: Nullable<Camera[]>): void;
        _disable(cameras: Camera): void;
        _disable(cameras: Nullable<Camera[]>): void;
        getPostProcess(camera?: Camera): Nullable<PostProcess>;
        private _linkParameters();
        private _linkTextures(effect);
    }
}

declare module BABYLON {
    class PostProcessRenderPass {
        private _renderList;
        private _renderTexture;
        private _scene;
        private _refCount;
        _name: string;
        constructor(scene: Scene, name: string, size: number, renderList: Mesh[], beforeRender: () => void, afterRender: () => void);
        _incRefCount(): number;
        _decRefCount(): number;
        _update(): void;
        setRenderList(renderList: Mesh[]): void;
        getRenderTexture(): RenderTargetTexture;
    }
}

declare module BABYLON {
    class PostProcessRenderPipeline {
        private _engine;
        private _renderEffects;
        private _renderEffectsForIsolatedPass;
        protected _cameras: Camera[];
        _name: string;
        private static PASS_EFFECT_NAME;
        private static PASS_SAMPLER_NAME;
        constructor(engine: Engine, name: string);
        getClassName(): string;
        readonly isSupported: boolean;
        addEffect(renderEffect: PostProcessRenderEffect): void;
        _rebuild(): void;
        _enableEffect(renderEffectName: string, cameras: Camera): void;
        _enableEffect(renderEffectName: string, cameras: Camera[]): void;
        _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
        _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
        _attachCameras(cameras: Camera, unique: boolean): void;
        _attachCameras(cameras: Camera[], unique: boolean): void;
        _detachCameras(cameras: Camera): void;
        _detachCameras(cameras: Nullable<Camera[]>): void;
        _enableDisplayOnlyPass(passName: string, cameras: Camera): void;
        _enableDisplayOnlyPass(passName: string, cameras: Nullable<Camera[]>): void;
        _disableDisplayOnlyPass(cameras: Camera): void;
        _disableDisplayOnlyPass(cameras: Camera[]): void;
        _update(): void;
        _reset(): void;
        dispose(): void;
    }
}

declare module BABYLON {
    class PostProcessRenderPipelineManager {
        private _renderPipelines;
        constructor();
        addPipeline(renderPipeline: PostProcessRenderPipeline): void;
        attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera, unique?: boolean): void;
        attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[], unique?: boolean): void;
        detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera): void;
        detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[]): void;
        enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): void;
        enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): void;
        disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): void;
        disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): void;
        enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera): void;
        enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera[]): void;
        disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera): void;
        disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera[]): void;
        update(): void;
        _rebuild(): void;
        dispose(): void;
    }
}

declare module BABYLON.Internals {
    /**
     * Helper class dealing with the extraction of spherical polynomial dataArray
     * from a cube map.
     */
    class CubeMapToSphericalPolynomialTools {
        private static FileFaces;
        /**
         * Converts a texture to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param texture The texture to extract the information from.
         * @return The Spherical Polynomial data.
         */
        static ConvertCubeMapTextureToSphericalPolynomial(texture: BaseTexture): Nullable<SphericalPolynomial>;
        /**
         * Converts a cubemap to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param cubeInfo The Cube map to extract the information from.
         * @return The Spherical Polynomial data.
         */
        static ConvertCubeMapToSphericalPolynomial(cubeInfo: CubeMapInfo): SphericalPolynomial;
    }
}

declare module BABYLON.Internals {
    /**
     * Header information of HDR texture files.
     */
    interface HDRInfo {
        /**
         * The height of the texture in pixels.
         */
        height: number;
        /**
         * The width of the texture in pixels.
         */
        width: number;
        /**
         * The index of the beginning of the data in the binary file.
         */
        dataPosition: number;
    }
    /**
     * This groups tools to convert HDR texture to native colors array.
     */
    class HDRTools {
        private static Ldexp(mantissa, exponent);
        private static Rgbe2float(float32array, red, green, blue, exponent, index);
        private static readStringLine(uint8array, startIndex);
        /**
         * Reads header information from an RGBE texture stored in a native array.
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param uint8array The binary file stored in  native array.
         * @return The header information.
         */
        static RGBE_ReadHeader(uint8array: Uint8Array): HDRInfo;
        /**
         * Returns the cubemap information (each faces texture data) extracted from an RGBE texture.
         * This RGBE texture needs to store the information as a panorama.
         *
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param buffer The binary file stored in an array buffer.
         * @param size The expected size of the extracted cubemap.
         * @return The Cube Map information.
         */
        static GetCubeMapTextureData(buffer: ArrayBuffer, size: number): CubeMapInfo;
        /**
         * Returns the pixels data extracted from an RGBE texture.
         * This pixels will be stored left to right up to down in the R G B order in one array.
         *
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param uint8array The binary file stored in an array buffer.
         * @param hdrInfo The header information of the file.
         * @return The pixels data in RGB right to left up to down order.
         */
        static RGBE_ReadPixels(uint8array: Uint8Array, hdrInfo: HDRInfo): Float32Array;
        private static RGBE_ReadPixels_RLE(uint8array, hdrInfo);
    }
}

declare module BABYLON.Internals {
    /**
     * CubeMap information grouping all the data for each faces as well as the cubemap size.
     */
    interface CubeMapInfo {
        /**
         * The pixel array for the front face.
         * This is stored in format, left to right, up to down format.
         */
        front: Nullable<ArrayBufferView>;
        /**
         * The pixel array for the back face.
         * This is stored in format, left to right, up to down format.
         */
        back: Nullable<ArrayBufferView>;
        /**
         * The pixel array for the left face.
         * This is stored in format, left to right, up to down format.
         */
        left: Nullable<ArrayBufferView>;
        /**
         * The pixel array for the right face.
         * This is stored in format, left to right, up to down format.
         */
        right: Nullable<ArrayBufferView>;
        /**
         * The pixel array for the up face.
         * This is stored in format, left to right, up to down format.
         */
        up: Nullable<ArrayBufferView>;
        /**
         * The pixel array for the down face.
         * This is stored in format, left to right, up to down format.
         */
        down: Nullable<ArrayBufferView>;
        /**
         * The size of the cubemap stored.
         *
         * Each faces will be size * size pixels.
         */
        size: number;
        /**
         * The format of the texture.
         *
         * RGBA, RGB.
         */
        format: number;
        /**
         * The type of the texture data.
         *
         * UNSIGNED_INT, FLOAT.
         */
        type: number;
        /**
         * Specifies whether the texture is in gamma space.
         */
        gammaSpace: boolean;
    }
    /**
     * Helper class usefull to convert panorama picture to their cubemap representation in 6 faces.
     */
    class PanoramaToCubeMapTools {
        private static FACE_FRONT;
        private static FACE_BACK;
        private static FACE_RIGHT;
        private static FACE_LEFT;
        private static FACE_DOWN;
        private static FACE_UP;
        /**
         * Converts a panorma stored in RGB right to left up to down format into a cubemap (6 faces).
         *
         * @param float32Array The source data.
         * @param inputWidth The width of the input panorama.
         * @param inputhHeight The height of the input panorama.
         * @param size The willing size of the generated cubemap (each faces will be size * size pixels)
         * @return The cubemap data
         */
        static ConvertPanoramaToCubemap(float32Array: Float32Array, inputWidth: number, inputHeight: number, size: number): CubeMapInfo;
        private static CreateCubemapTexture(texSize, faceData, float32Array, inputWidth, inputHeight);
        private static CalcProjectionSpherical(vDir, float32Array, inputWidth, inputHeight);
    }
}

declare module BABYLON {
    class CustomProceduralTexture extends ProceduralTexture {
        private _animate;
        private _time;
        private _config;
        private _texturePath;
        constructor(name: string, texturePath: any, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        private loadJson(jsonUrl);
        isReady(): boolean;
        render(useCameraPostProcess?: boolean): void;
        updateTextures(): void;
        updateShaderUniforms(): void;
        animate: boolean;
    }
}

declare module BABYLON {
    class ProceduralTexture extends Texture {
        isCube: boolean;
        private _size;
        _generateMipMaps: boolean;
        isEnabled: boolean;
        private _currentRefreshId;
        private _refreshRate;
        onGenerated: () => void;
        private _vertexBuffers;
        private _indexBuffer;
        private _effect;
        private _uniforms;
        private _samplers;
        private _fragment;
        _textures: {
            [key: string]: Texture;
        };
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _matrices;
        private _fallbackTexture;
        private _fallbackTextureUsed;
        private _engine;
        constructor(name: string, size: any, fragment: any, scene: Scene, fallbackTexture?: Nullable<Texture>, generateMipMaps?: boolean, isCube?: boolean);
        private _createIndexBuffer();
        _rebuild(): void;
        reset(): void;
        isReady(): boolean;
        resetRefreshCounter(): void;
        setFragment(fragment: any): void;
        refreshRate: number;
        _shouldRender(): boolean;
        getRenderSize(): number;
        resize(size: number, generateMipMaps: boolean): void;
        private _checkUniform(uniformName);
        setTexture(name: string, texture: Texture): ProceduralTexture;
        setFloat(name: string, value: number): ProceduralTexture;
        setFloats(name: string, value: number[]): ProceduralTexture;
        setColor3(name: string, value: Color3): ProceduralTexture;
        setColor4(name: string, value: Color4): ProceduralTexture;
        setVector2(name: string, value: Vector2): ProceduralTexture;
        setVector3(name: string, value: Vector3): ProceduralTexture;
        setMatrix(name: string, value: Matrix): ProceduralTexture;
        render(useCameraPostProcess?: boolean): void;
        clone(): ProceduralTexture;
        dispose(): void;
    }
}

declare module BABYLON {
    class DefaultRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        private _scene;
        readonly PassPostProcessId: string;
        readonly HighLightsPostProcessId: string;
        readonly BlurXPostProcessId: string;
        readonly BlurYPostProcessId: string;
        readonly CopyBackPostProcessId: string;
        readonly ImageProcessingPostProcessId: string;
        readonly FxaaPostProcessId: string;
        readonly FinalMergePostProcessId: string;
        pass: BABYLON.PassPostProcess;
        highlights: BABYLON.HighlightsPostProcess;
        blurX: BABYLON.BlurPostProcess;
        blurY: BABYLON.BlurPostProcess;
        copyBack: BABYLON.PassPostProcess;
        fxaa: FxaaPostProcess;
        imageProcessing: ImageProcessingPostProcess;
        finalMerge: BABYLON.PassPostProcess;
        animations: Animation[];
        private _bloomEnabled;
        private _fxaaEnabled;
        private _imageProcessingEnabled;
        private _defaultPipelineTextureType;
        private _bloomScale;
        private _buildAllowed;
        /**
         * Specifies the size of the bloom blur kernel, relative to the final output size
         */
        bloomKernel: number;
        /**
         * Specifies the weight of the bloom in the final rendering
         */
        private _bloomWeight;
        private _hdr;
        bloomWeight: number;
        bloomScale: number;
        bloomEnabled: boolean;
        fxaaEnabled: boolean;
        imageProcessingEnabled: boolean;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         * @param {boolean} automaticBuild - if false, you will have to manually call prepare() to update the pipeline
         */
        constructor(name: string, hdr: boolean, scene: Scene, cameras?: Camera[], automaticBuild?: boolean);
        /**
         * Force the compilation of the entire pipeline.
         */
        prepare(): void;
        private _buildPipeline();
        private _disposePostProcesses();
        dispose(): void;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): DefaultRenderingPipeline;
    }
}

declare module BABYLON {
    class LensRenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The chromatic aberration PostProcess id in the pipeline
        * @type {string}
        */
        LensChromaticAberrationEffect: string;
        /**
        * The highlights enhancing PostProcess id in the pipeline
        * @type {string}
        */
        HighlightsEnhancingEffect: string;
        /**
        * The depth-of-field PostProcess id in the pipeline
        * @type {string}
        */
        LensDepthOfFieldEffect: string;
        private _scene;
        private _depthTexture;
        private _grainTexture;
        private _chromaticAberrationPostProcess;
        private _highlightsPostProcess;
        private _depthOfFieldPostProcess;
        private _edgeBlur;
        private _grainAmount;
        private _chromaticAberration;
        private _distortion;
        private _highlightsGain;
        private _highlightsThreshold;
        private _dofDistance;
        private _dofAperture;
        private _dofDarken;
        private _dofPentagon;
        private _blurNoise;
        /**
         * @constructor
         *
         * Effect parameters are as follow:
         * {
         *      chromatic_aberration: number;       // from 0 to x (1 for realism)
         *      edge_blur: number;                  // from 0 to x (1 for realism)
         *      distortion: number;                 // from 0 to x (1 for realism)
         *      grain_amount: number;               // from 0 to 1
         *      grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
         *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
         *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
         *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
         *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
         *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
         *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
         *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
         * }
         * Note: if an effect parameter is unset, effect is disabled
         *
         * @param {string} name - The rendering pipeline name
         * @param {object} parameters - An object containing all parameters (see above)
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, parameters: any, scene: Scene, ratio?: number, cameras?: Camera[]);
        setEdgeBlur(amount: number): void;
        disableEdgeBlur(): void;
        setGrainAmount(amount: number): void;
        disableGrain(): void;
        setChromaticAberration(amount: number): void;
        disableChromaticAberration(): void;
        setEdgeDistortion(amount: number): void;
        disableEdgeDistortion(): void;
        setFocusDistance(amount: number): void;
        disableDepthOfField(): void;
        setAperture(amount: number): void;
        setDarkenOutOfFocus(amount: number): void;
        enablePentagonBokeh(): void;
        disablePentagonBokeh(): void;
        enableNoiseBlur(): void;
        disableNoiseBlur(): void;
        setHighlightsGain(amount: number): void;
        setHighlightsThreshold(amount: number): void;
        disableHighlights(): void;
        /**
         * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
         */
        dispose(disableDepthRender?: boolean): void;
        private _createChromaticAberrationPostProcess(ratio);
        private _createHighlightsPostProcess(ratio);
        private _createDepthOfFieldPostProcess(ratio);
        private _createGrainTexture();
    }
}

declare module BABYLON {
    class SSAO2RenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        SSAOOriginalSceneColorEffect: string;
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        SSAORenderEffect: string;
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurHRenderEffect: string;
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurVRenderEffect: string;
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        SSAOCombineRenderEffect: string;
        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        totalStrength: number;
        /**
        * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
        * @type {number}
        */
        maxZ: number;
        /**
        * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much
        * @type {number}
        */
        minZAspect: number;
        /**
        * Number of samples used for the SSAO calculations. Default value is 8
        * @type {number}
        */
        private _samples;
        /**
        * Dynamically generated sphere sampler.
        * @type {number[]}
        */
        private _sampleSphere;
        /**
        * Blur filter offsets
        * @type {number[]}
        */
        private _samplerOffsets;
        samples: number;
        /**
        * Are we using bilateral blur ?
        * @type {boolean}
        */
        private _expensiveBlur;
        expensiveBlur: boolean;
        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
        * @type {number}
        */
        radius: number;
        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        base: number;
        /**
        *  Support test.
        * @type {boolean}
        */
        static readonly IsSupported: boolean;
        private _scene;
        private _depthTexture;
        private _normalTexture;
        private _randomTexture;
        private _originalColorPostProcess;
        private _ssaoPostProcess;
        private _blurHPostProcess;
        private _blurVPostProcess;
        private _ssaoCombinePostProcess;
        private _firstUpdate;
        private _ratio;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]);
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        dispose(disableGeometryBufferRenderer?: boolean): void;
        private _createBlurPostProcess(ssaoRatio, blurRatio);
        _rebuild(): void;
        private _generateHemisphere();
        private _createSSAOPostProcess(ratio);
        private _createSSAOCombinePostProcess(ratio);
        private _createRandomTexture();
    }
}

declare module BABYLON {
    class SSAORenderingPipeline extends PostProcessRenderPipeline {
        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        SSAOOriginalSceneColorEffect: string;
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        SSAORenderEffect: string;
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurHRenderEffect: string;
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        SSAOBlurVRenderEffect: string;
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        SSAOCombineRenderEffect: string;
        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        totalStrength: number;
        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
        * @type {number}
        */
        radius: number;
        /**
        * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to fallOff and superior to fallOff.
        * Default value is 0.975
        * @type {number}
        */
        area: number;
        /**
        * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to area and inferior to area.
        * Default value is 0.0
        * @type {number}
        */
        fallOff: number;
        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        base: number;
        private _scene;
        private _depthTexture;
        private _randomTexture;
        private _originalColorPostProcess;
        private _ssaoPostProcess;
        private _blurHPostProcess;
        private _blurVPostProcess;
        private _ssaoCombinePostProcess;
        private _firstUpdate;
        private _ratio;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]);
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        dispose(disableDepthRender?: boolean): void;
        private _createBlurPostProcess(ratio);
        _rebuild(): void;
        private _createSSAOPostProcess(ratio);
        private _createSSAOCombinePostProcess(ratio);
        private _createRandomTexture();
    }
}

declare module BABYLON {
    class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        /**
        * Public members
        */
        originalPostProcess: Nullable<PostProcess>;
        downSampleX4PostProcess: Nullable<PostProcess>;
        brightPassPostProcess: Nullable<PostProcess>;
        blurHPostProcesses: PostProcess[];
        blurVPostProcesses: PostProcess[];
        textureAdderPostProcess: Nullable<PostProcess>;
        volumetricLightPostProcess: Nullable<PostProcess>;
        volumetricLightSmoothXPostProcess: Nullable<BlurPostProcess>;
        volumetricLightSmoothYPostProcess: Nullable<BlurPostProcess>;
        volumetricLightMergePostProces: Nullable<PostProcess>;
        volumetricLightFinalPostProcess: Nullable<PostProcess>;
        luminancePostProcess: Nullable<PostProcess>;
        luminanceDownSamplePostProcesses: PostProcess[];
        hdrPostProcess: Nullable<PostProcess>;
        textureAdderFinalPostProcess: Nullable<PostProcess>;
        lensFlareFinalPostProcess: Nullable<PostProcess>;
        hdrFinalPostProcess: Nullable<PostProcess>;
        lensFlarePostProcess: Nullable<PostProcess>;
        lensFlareComposePostProcess: Nullable<PostProcess>;
        motionBlurPostProcess: Nullable<PostProcess>;
        depthOfFieldPostProcess: Nullable<PostProcess>;
        brightThreshold: number;
        blurWidth: number;
        horizontalBlur: boolean;
        exposure: number;
        lensTexture: Nullable<Texture>;
        volumetricLightCoefficient: number;
        volumetricLightPower: number;
        volumetricLightBlurScale: number;
        sourceLight: Nullable<SpotLight | DirectionalLight>;
        hdrMinimumLuminance: number;
        hdrDecreaseRate: number;
        hdrIncreaseRate: number;
        lensColorTexture: Nullable<Texture>;
        lensFlareStrength: number;
        lensFlareGhostDispersal: number;
        lensFlareHaloWidth: number;
        lensFlareDistortionStrength: number;
        lensStarTexture: Nullable<Texture>;
        lensFlareDirtTexture: Nullable<Texture>;
        depthOfFieldDistance: number;
        depthOfFieldBlurWidth: number;
        motionStrength: number;
        animations: Animation[];
        /**
        * Private members
        */
        private _scene;
        private _currentDepthOfFieldSource;
        private _basePostProcess;
        private _hdrCurrentLuminance;
        private _floatTextureType;
        private _ratio;
        private _bloomEnabled;
        private _depthOfFieldEnabled;
        private _vlsEnabled;
        private _lensFlareEnabled;
        private _hdrEnabled;
        private _motionBlurEnabled;
        private _motionBlurSamples;
        private _volumetricLightStepsCount;
        BloomEnabled: boolean;
        DepthOfFieldEnabled: boolean;
        LensFlareEnabled: boolean;
        HDREnabled: boolean;
        VLSEnabled: boolean;
        MotionBlurEnabled: boolean;
        volumetricLightStepsCount: number;
        motionBlurSamples: number;
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.PostProcess} originalPostProcess - the custom original color post-process. Must be "reusable". Can be null.
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: number, originalPostProcess?: Nullable<PostProcess>, cameras?: Camera[]);
        private _buildPipeline();
        private _createDownSampleX4PostProcess(scene, ratio);
        private _createBrightPassPostProcess(scene, ratio);
        private _createBlurPostProcesses(scene, ratio, indice, blurWidthKey?);
        private _createTextureAdderPostProcess(scene, ratio);
        private _createVolumetricLightPostProcess(scene, ratio);
        private _createLuminancePostProcesses(scene, textureType);
        private _createHdrPostProcess(scene, ratio);
        private _createLensFlarePostProcess(scene, ratio);
        private _createDepthOfFieldPostProcess(scene, ratio);
        private _createMotionBlurPostProcess(scene, ratio);
        private _getDepthTexture();
        private _disposePostProcesses();
        dispose(): void;
        serialize(): any;
        /**
         * Static members
         */
        static Parse(source: any, scene: Scene, rootUrl: string): StandardRenderingPipeline;
        static LuminanceSteps: number;
    }
}
