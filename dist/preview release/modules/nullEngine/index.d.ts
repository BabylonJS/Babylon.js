declare module 'babylonjs/nullEngine' {
    class NullEngineOptions {
        renderWidth: number;
        renderHeight: number;
        textureSize: number;
        deterministicLockstep: boolean;
        lockstepMaxSteps: number;
    }
    /**
     * The null engine class provides support for headless version of babylon.js.
     * This can be used in server side scenario or for testing purposes
     */
    class NullEngine extends Engine {
        private _options;
        isDeterministicLockStep(): boolean;
        getLockstepMaxSteps(): number;
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
        drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void;
        drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void;
        _createTexture(): WebGLTexture;
        createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message: string, exception: any) => void>, buffer?: Nullable<ArrayBuffer | HTMLImageElement>, fallBack?: InternalTexture, format?: number): InternalTexture;
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

export interface WebGLRenderingContext {
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
    bindTransformFeedback(target: number, transformFeedback: WebGLTransformFeedback | null): void;
    beginTransformFeedback(primitiveMode: number): void;
    endTransformFeedback(): void;
    transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number): void;
}
export interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
}
export interface WebGLQuery extends WebGLObject {
}
declare var WebGLQuery: {
    prototype: WebGLQuery;
    new (): WebGLQuery;
};
export interface WebGLSampler extends WebGLObject {
}
declare var WebGLSampler: {
    prototype: WebGLSampler;
    new (): WebGLSampler;
};
export interface WebGLSync extends WebGLObject {
}
declare var WebGLSync: {
    prototype: WebGLSync;
    new (): WebGLSync;
};
export interface WebGLTransformFeedback extends WebGLObject {
}
declare var WebGLTransformFeedback: {
    prototype: WebGLTransformFeedback;
    new (): WebGLTransformFeedback;
};
export interface WebGLVertexArrayObject extends WebGLObject {
}
declare var WebGLVertexArrayObject: {
    prototype: WebGLVertexArrayObject;
    new (): WebGLVertexArrayObject;
};

export interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    webkitURL: typeof URL;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
    oRequestAnimationFrame(callback: FrameRequestCallback): number;
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
    mozURL: typeof URL;
    msURL: typeof URL;
    VRFrameData: any;
}
export interface WebGLRenderingContext {
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    createVertexArray(): any;
    bindVertexArray(vao?: WebGLVertexArrayObject | null): void;
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
export interface Document {
    mozCancelFullScreen(): void;
    msCancelFullScreen(): void;
    mozFullScreen: boolean;
    msIsFullScreen: boolean;
    fullscreen: boolean;
    mozPointerLockElement: HTMLElement;
    msPointerLockElement: HTMLElement;
    webkitPointerLockElement: HTMLElement;
}
export interface HTMLCanvasElement {
    msRequestPointerLock?(): void;
    mozRequestPointerLock?(): void;
    webkitRequestPointerLock?(): void;
}
export interface CanvasRenderingContext2D {
    msImageSmoothingEnabled: boolean;
}
export interface WebGLBuffer {
    references: number;
    capacity: number;
    is32Bits: boolean;
}
export interface WebGLProgram {
    transformFeedback?: WebGLTransformFeedback | null;
    __SPECTOR_rebuildProgram?: ((vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) => void) | null;
}
export interface MouseEvent {
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}
export interface Navigator {
    getVRDisplays: () => any;
    mozGetVRDevices: (any: any) => any;
    webkitGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    mozGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    msGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    webkitGetGamepads(): Gamepad[];
    msGetGamepads(): Gamepad[];
    webkitGamepads(): Gamepad[];
}
export interface HTMLVideoElement {
    mozSrcObject: any;
}
export interface Screen {
    orientation: string;
    mozOrientation: string;
}
export interface Math {
    fround(x: number): number;
    imul(a: number, b: number): number;
}
export interface SIMDglobal {
    SIMD: SIMD;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
}
export interface SIMD {
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
export interface GamepadPose {
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
export interface EXT_disjoint_timer_query {
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

import {EffectFallbacks,EffectCreationOptions,Effect,Nullable,float,double,int,FloatArray,IndicesArray,KeyboardEventTypes,KeyboardInfo,KeyboardInfoPre,PointerEventTypes,PointerInfoBase,PointerInfoPre,PointerInfo,ToGammaSpace,ToLinearSpace,Epsilon,Color3,Color4,Vector2,Vector3,Vector4,ISize,Size,Quaternion,Matrix,Plane,Viewport,Frustum,Space,Axis,BezierCurve,Orientation,Angle,Arc2,Path2,Path3D,Curve3,PositionNormalVertex,PositionNormalTextureVertex,Tmp,Scalar,expandToProperty,serialize,serializeAsTexture,serializeAsColor3,serializeAsFresnelParameters,serializeAsVector2,serializeAsVector3,serializeAsMeshReference,serializeAsColorCurves,serializeAsColor4,serializeAsImageProcessingConfiguration,serializeAsQuaternion,SerializationHelper,EventState,Observer,MultiObserver,Observable,SmartArray,SmartArrayNoDuplicate,IAnimatable,LoadFileError,RetryStrategy,IFileRequest,Tools,PerfCounter,className,AsyncLoop,_AlphaState,_DepthCullingState,_StencilState,InstancingAttributeInfo,RenderTargetCreationOptions,EngineCapabilities,EngineOptions,IDisplayChangedEventArgs,Engine,Node,BoundingSphere,BoundingBox,ICullable,BoundingInfo,TransformNode,AbstractMesh,Light,Camera,RenderingManager,RenderingGroup,IDisposable,IActiveMeshCandidateProvider,RenderingGroupInfo,Scene,Buffer,VertexBuffer,InternalTexture,BaseTexture,Texture,_InstancesBatch,Mesh,BaseSubMesh,SubMesh,MaterialDefines,Material,UniformBuffer,IGetSetVerticesData,VertexData,Geometry,_PrimitiveGeometry,RibbonGeometry,BoxGeometry,SphereGeometry,DiscGeometry,CylinderGeometry,TorusGeometry,GroundGeometry,TiledGroundGeometry,PlaneGeometry,TorusKnotGeometry,PostProcessManager,PerformanceMonitor,RollingAverage,IImageProcessingConfigurationDefines,ImageProcessingConfiguration,ColorGradingTexture,ColorCurves,Behavior,MaterialHelper,PushMaterial,StandardMaterialDefines,StandardMaterial} from 'babylonjs/core';
import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
import {FramingBehavior,BouncingBehavior,AutoRotationBehavior} from 'babylonjs/cameraBehaviors';
import {TextureTools} from 'babylonjs/textureTools';
import {SolidParticle,ModelShape,DepthSortedParticle,SolidParticleSystem} from 'babylonjs/solidParticles';
import {Collider,CollisionWorker,ICollisionCoordinator,SerializedMesh,SerializedSubMesh,SerializedGeometry,BabylonMessage,SerializedColliderToWorker,WorkerTaskType,WorkerReply,CollisionReplyPayload,InitPayload,CollidePayload,UpdatePayload,WorkerReplyType,CollisionCoordinatorWorker,CollisionCoordinatorLegacy} from 'babylonjs/collisions';
import {IntersectionInfo,PickingInfo,Ray} from 'babylonjs/picking';
import {SpriteManager,Sprite} from 'babylonjs/sprites';
import {AnimationRange,AnimationEvent,PathCursor,Animation,TargetedAnimation,AnimationGroup,RuntimeAnimation,Animatable,IEasingFunction,EasingFunction,CircleEase,BackEase,BounceEase,CubicEase,ElasticEase,ExponentialEase,PowerEase,QuadraticEase,QuarticEase,QuinticEase,SineEase,BezierCurveEase} from 'babylonjs/animations';
import {Condition,ValueCondition,PredicateCondition,StateCondition,Action,ActionEvent,ActionManager,InterpolateValueAction,SwitchBooleanAction,SetStateAction,SetValueAction,IncrementValueAction,PlayAnimationAction,StopAnimationAction,DoNothingAction,CombineAction,ExecuteCodeAction,SetParentAction,PlaySoundAction,StopSoundAction} from 'babylonjs/actions';
import {GroundMesh,InstancedMesh,LinesMesh} from 'babylonjs/additionalMeshes';
import {ShaderMaterial} from 'babylonjs/shaderMaterial';
import {MeshBuilder} from 'babylonjs/meshBuilder';
import {PBRBaseMaterial,PBRBaseSimpleMaterial,PBRMaterial,PBRMetallicRoughnessMaterial,PBRSpecularGlossinessMaterial} from 'babylonjs/pbrMaterial';
import {CameraInputTypes,ICameraInput,CameraInputsMap,CameraInputsManager,TargetCamera} from 'babylonjs/targetCamera';
import {ArcRotateCameraKeyboardMoveInput,ArcRotateCameraMouseWheelInput,ArcRotateCameraPointersInput,ArcRotateCameraInputsManager,ArcRotateCamera} from 'babylonjs/arcRotateCamera';
import {FreeCameraMouseInput,FreeCameraKeyboardMoveInput,FreeCameraInputsManager,FreeCamera} from 'babylonjs/freeCamera';
import {HemisphericLight} from 'babylonjs/hemisphericLight';
import {IShadowLight,ShadowLight,PointLight} from 'babylonjs/pointLight';
import {DirectionalLight} from 'babylonjs/directionalLight';
import {SpotLight} from 'babylonjs/spotLight';
import {CubeTexture,RenderTargetTexture,IMultiRenderTargetOptions,MultiRenderTarget,MirrorTexture,RefractionTexture,DynamicTexture,VideoTexture,RawTexture} from 'babylonjs/additionalTextures';
import {AudioEngine,Sound,SoundTrack,Analyser} from 'babylonjs/audio';
import {ILoadingScreen,DefaultLoadingScreen,SceneLoaderProgressEvent,ISceneLoaderPluginExtensions,ISceneLoaderPluginFactory,ISceneLoaderPlugin,ISceneLoaderPluginAsync,SceneLoader,FilesInput} from 'babylonjs/loader';
import {IShadowGenerator,ShadowGenerator} from 'babylonjs/shadows';
import {StringDictionary} from 'babylonjs/stringDictionary';
import {Tags,AndOrNotEvaluator} from 'babylonjs/userData';
import {FresnelParameters} from 'babylonjs/fresnel';
import {MultiMaterial} from 'babylonjs/multiMaterial';
import {Database} from 'babylonjs/offline';
import {FreeCameraTouchInput,TouchCamera} from 'babylonjs/touchCamera';
import {ProceduralTexture,CustomProceduralTexture} from 'babylonjs/procedural';
import {FreeCameraGamepadInput,ArcRotateCameraGamepadInput,GamepadManager,StickValues,GamepadButtonChanges,Gamepad,GenericPad,Xbox360Button,Xbox360Dpad,Xbox360Pad,PoseEnabledControllerType,MutableGamepadButton,ExtendedGamepadButton,PoseEnabledControllerHelper,PoseEnabledController,WebVRController,OculusTouchController,ViveController,GenericController,WindowsMotionController} from 'babylonjs/gamepad';
import {FollowCamera,ArcFollowCamera,UniversalCamera,GamepadCamera} from 'babylonjs/additionalCameras';
import {DepthRenderer} from 'babylonjs/depthRenderer';
import {GeometryBufferRenderer} from 'babylonjs/geometryBufferRenderer';
import {PostProcessOptions,PostProcess,PassPostProcess} from 'babylonjs/postProcesses';
import {BlurPostProcess} from 'babylonjs/additionalPostProcess_blur';
import {FxaaPostProcess} from 'babylonjs/additionalPostProcess_fxaa';
import {HighlightsPostProcess} from 'babylonjs/additionalPostProcess_highlights';
import {RefractionPostProcess,BlackAndWhitePostProcess,ConvolutionPostProcess,FilterPostProcess,VolumetricLightScatteringPostProcess,ColorCorrectionPostProcess,TonemappingOperator,TonemapPostProcess,DisplayPassPostProcess,ImageProcessingPostProcess} from 'babylonjs/additionalPostProcesses';
import {PostProcessRenderPipelineManager,PostProcessRenderPass,PostProcessRenderEffect,PostProcessRenderPipeline} from 'babylonjs/renderingPipeline';
import {SSAORenderingPipeline,SSAO2RenderingPipeline,LensRenderingPipeline,StandardRenderingPipeline} from 'babylonjs/additionalRenderingPipeline';
import {DefaultRenderingPipeline} from 'babylonjs/defaultRenderingPipeline';
import {Bone,BoneIKController,BoneLookController,Skeleton} from 'babylonjs/bones';
import {SphericalPolynomial,SphericalHarmonics,CubeMapToSphericalPolynomialTools,CubeMapInfo,PanoramaToCubeMapTools,HDRInfo,HDRTools,HDRCubeTexture} from 'babylonjs/hdr';
import {CSG} from 'babylonjs/csg';
import {Polygon,PolygonMeshBuilder} from 'babylonjs/polygonMesh';
import {LensFlare,LensFlareSystem} from 'babylonjs/lensFlares';
import {PhysicsJointData,PhysicsJoint,DistanceJoint,MotorEnabledJoint,HingeJoint,Hinge2Joint,IMotorEnabledJoint,DistanceJointData,SpringJointData,PhysicsImpostorParameters,IPhysicsEnabledObject,PhysicsImpostor,PhysicsImpostorJoint,PhysicsEngine,IPhysicsEnginePlugin,PhysicsHelper,PhysicsRadialExplosionEvent,PhysicsGravitationalFieldEvent,PhysicsUpdraftEvent,PhysicsVortexEvent,PhysicsRadialImpulseFalloff,PhysicsUpdraftMode,PhysicsForceAndContactPoint,PhysicsRadialExplosionEventData,PhysicsGravitationalFieldEventData,PhysicsUpdraftEventData,PhysicsVortexEventData,CannonJSPlugin,OimoJSPlugin} from 'babylonjs/physics';
import {TGATools,DDSInfo,DDSTools,KhronosTextureContainer} from 'babylonjs/textureFormats';
import {Debug,RayHelper,DebugLayer,BoundingBoxRenderer} from 'babylonjs/debug';
import {MorphTarget,MorphTargetManager} from 'babylonjs/morphTargets';
import {IOctreeContainer,Octree,OctreeBlock} from 'babylonjs/octrees';
import {SIMDHelper} from 'babylonjs/simd';
import {VRDistortionCorrectionPostProcess,AnaglyphPostProcess,StereoscopicInterlacePostProcess,FreeCameraDeviceOrientationInput,ArcRotateCameraVRDeviceOrientationInput,VRCameraMetrics,DevicePose,PoseControlled,WebVROptions,WebVRFreeCamera,DeviceOrientationCamera,VRDeviceOrientationFreeCamera,VRDeviceOrientationGamepadCamera,VRDeviceOrientationArcRotateCamera,AnaglyphFreeCamera,AnaglyphArcRotateCamera,AnaglyphGamepadCamera,AnaglyphUniversalCamera,StereoscopicFreeCamera,StereoscopicArcRotateCamera,StereoscopicGamepadCamera,StereoscopicUniversalCamera,VRTeleportationOptions,VRExperienceHelperOptions,VRExperienceHelper} from 'babylonjs/vr';
import {JoystickAxis,VirtualJoystick,VirtualJoysticksCamera,FreeCameraVirtualJoystickInput} from 'babylonjs/virtualJoystick';
import {ISimplifier,ISimplificationSettings,SimplificationSettings,ISimplificationTask,SimplificationQueue,SimplificationType,DecimationTriangle,DecimationVertex,QuadraticMatrix,Reference,QuadraticErrorSimplification,MeshLODLevel,SceneOptimization,TextureOptimization,HardwareScalingOptimization,ShadowsOptimization,PostProcessesOptimization,LensFlaresOptimization,ParticlesOptimization,RenderTargetsOptimization,MergeMeshesOptimization,SceneOptimizerOptions,SceneOptimizer} from 'babylonjs/optimizations';
import {OutlineRenderer,EdgesRenderer,IHighlightLayerOptions,HighlightLayer} from 'babylonjs/highlights';
import {SceneSerializer} from 'babylonjs/serialization';
import {AssetTaskState,AbstractAssetTask,IAssetsProgressEvent,AssetsProgressEvent,MeshAssetTask,TextFileAssetTask,BinaryFileAssetTask,ImageAssetTask,ITextureAssetTask,TextureAssetTask,CubeTextureAssetTask,HDRCubeTextureAssetTask,AssetsManager} from 'babylonjs/assetsManager';
import {ReflectionProbe} from 'babylonjs/probes';
import {BackgroundMaterial} from 'babylonjs/backgroundMaterial';
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';
