/* eslint-disable @typescript-eslint/naming-convention */
import type { DeviceType } from "../../DeviceInput/InputDevices/deviceEnums";
import type { IDeviceInputSystem } from "../../DeviceInput/inputInterfaces";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { ICanvas, IImage, IPath2D } from "../ICanvas";
import type { NativeData, NativeDataStream } from "./nativeDataStream";
import type { Matrix } from "../../Maths/math.vector";

export type NativeTexture = NativeData;
export type NativeFramebuffer = NativeData;
export type NativeVertexArrayObject = NativeData;
export type NativeProgram = NativeData;
export type NativeUniform = NativeData;

/** @internal */
export type NativeFrameStats = {
    /** @internal */
    gpuTimeNs: number;
};

/** @internal */
export interface INativeEngine {
    dispose(): void;

    requestAnimationFrame(callback: () => void): void;
    setDeviceLostCallback(callback: () => void): void;

    createVertexArray(): NativeData;

    createIndexBuffer(dataBuffer: ArrayBufferLike, dataByteOffset: number, dataByteLength: number, is32Bits: boolean, dynamic: boolean): NativeData;
    recordIndexBuffer(vertexArray: NativeData, indexBuffer: NativeData): void;
    updateDynamicIndexBuffer(indexBuffer: NativeData, data: ArrayBufferLike, dataByteOffset: number, dataByteLength: number, startIndex: number): void;

    createVertexBuffer(dataBuffer: ArrayBufferLike, dataByteOffset: number, dataByteLength: number, dynamic: boolean): NativeData;
    recordVertexBuffer(
        vertexArray: NativeData,
        vertexBuffer: NativeData,
        location: number,
        byteOffset: number,
        byteStride: number,
        numElements: number,
        type: number,
        normalized: boolean,
        instanceDivisor: number
    ): void;
    updateDynamicVertexBuffer(vertexBuffer: NativeData, dataBuffer: ArrayBufferLike, dataByteOffset: number, dataByteLength: number, vertexByteOffset?: number): void;

    createProgram(vertexShader: string, fragmentShader: string): NativeProgram;
    createProgramAsync(vertexShader: string, fragmentShader: string, onSuccess: () => void, onError: (error: Error) => void): NativeProgram;
    getUniforms(shaderProgram: NativeProgram, uniformsNames: string[]): WebGLUniformLocation[];
    getAttributes(shaderProgram: NativeProgram, attributeNames: string[]): number[];

    createTexture(): NativeTexture;
    initializeTexture(texture: NativeTexture, width: number, height: number, hasMips: boolean, format: number, renderTarget: boolean, srgb: boolean, samples: number): void;
    loadTexture(texture: NativeTexture, data: ArrayBufferView, generateMips: boolean, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    loadRawTexture(texture: NativeTexture, data: ArrayBufferView, width: number, height: number, format: number, generateMips: boolean, invertY: boolean): void;
    loadRawTexture2DArray(
        texture: NativeTexture,
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean
    ): void;
    loadCubeTexture(texture: NativeTexture, data: Array<ArrayBufferView>, generateMips: boolean, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    loadCubeTextureWithMips(texture: NativeTexture, data: Array<Array<ArrayBufferView>>, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    getTextureWidth(texture: NativeTexture): number;
    getTextureHeight(texture: NativeTexture): number;
    deleteTexture(texture: NativeTexture): void;
    readTexture(
        texture: NativeTexture,
        mipLevel: number,
        x: number,
        y: number,
        width: number,
        height: number,
        buffer: Nullable<ArrayBuffer>,
        bufferOffset: number,
        bufferLength: number
    ): Promise<ArrayBuffer>;

    createImageBitmap(data: ArrayBuffer | IImage): ImageBitmap;
    resizeImageBitmap(image: ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array;

    createFrameBuffer(
        texture: Nullable<NativeTexture>,
        width: number,
        height: number,
        generateStencilBuffer: boolean,
        generateDepthBuffer: boolean,
        samples: number
    ): NativeFramebuffer;

    getRenderWidth(): number;
    getRenderHeight(): number;

    setHardwareScalingLevel(level: number): void;

    setViewPort(x: number, y: number, width: number, height: number): void;

    setCommandDataStream(dataStream: NativeDataStream): void;
    submitCommands(): void;

    populateFrameStats(stats: NativeFrameStats): void;
}

/** @internal */
interface INativeEngineInfo {
    version: string;
    nonFloatVertexBuffers: true;
}

/** @internal */
interface INativeEngineConstructor {
    prototype: INativeEngine;
    new (info: INativeEngineInfo): INativeEngine;

    readonly PROTOCOL_VERSION: number;

    readonly CAPS_LIMITS_MAX_TEXTURE_SIZE: number;
    readonly CAPS_LIMITS_MAX_TEXTURE_LAYERS: number;

    readonly TEXTURE_NEAREST_NEAREST: number;
    readonly TEXTURE_LINEAR_LINEAR: number;
    readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR: number;
    readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST: number;
    readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST: number;
    readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR: number;
    readonly TEXTURE_NEAREST_LINEAR: number;
    readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR: number;
    readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST: number;
    readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR: number;
    readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST: number;
    readonly TEXTURE_LINEAR_NEAREST: number;

    readonly DEPTH_TEST_LESS: number;
    readonly DEPTH_TEST_LEQUAL: number;
    readonly DEPTH_TEST_EQUAL: number;
    readonly DEPTH_TEST_GEQUAL: number;
    readonly DEPTH_TEST_GREATER: number;
    readonly DEPTH_TEST_NOTEQUAL: number;
    readonly DEPTH_TEST_NEVER: number;
    readonly DEPTH_TEST_ALWAYS: number;

    readonly ADDRESS_MODE_WRAP: number;
    readonly ADDRESS_MODE_MIRROR: number;
    readonly ADDRESS_MODE_CLAMP: number;
    readonly ADDRESS_MODE_BORDER: number;
    readonly ADDRESS_MODE_MIRROR_ONCE: number;

    readonly TEXTURE_FORMAT_BC1: number;
    readonly TEXTURE_FORMAT_BC2: number;
    readonly TEXTURE_FORMAT_BC3: number;
    readonly TEXTURE_FORMAT_BC4: number;
    readonly TEXTURE_FORMAT_BC5: number;
    readonly TEXTURE_FORMAT_BC6H: number;
    readonly TEXTURE_FORMAT_BC7: number;
    readonly TEXTURE_FORMAT_ETC1: number;
    readonly TEXTURE_FORMAT_ETC2: number;
    readonly TEXTURE_FORMAT_ETC2A: number;
    readonly TEXTURE_FORMAT_ETC2A1: number;
    readonly TEXTURE_FORMAT_PTC12: number;
    readonly TEXTURE_FORMAT_PTC14: number;
    readonly TEXTURE_FORMAT_PTC12A: number;
    readonly TEXTURE_FORMAT_PTC14A: number;
    readonly TEXTURE_FORMAT_PTC22: number;
    readonly TEXTURE_FORMAT_PTC24: number;
    readonly TEXTURE_FORMAT_ATC: number;
    readonly TEXTURE_FORMAT_ATCE: number;
    readonly TEXTURE_FORMAT_ATCI: number;
    readonly TEXTURE_FORMAT_ASTC4x4: number;
    readonly TEXTURE_FORMAT_ASTC5x4: number;
    readonly TEXTURE_FORMAT_ASTC5x5: number;
    readonly TEXTURE_FORMAT_ASTC6x5: number;
    readonly TEXTURE_FORMAT_ASTC6x6: number;
    readonly TEXTURE_FORMAT_ASTC8x5: number;
    readonly TEXTURE_FORMAT_ASTC8x6: number;
    readonly TEXTURE_FORMAT_ASTC8x8: number;
    readonly TEXTURE_FORMAT_ASTC10x5: number;
    readonly TEXTURE_FORMAT_ASTC10x6: number;
    readonly TEXTURE_FORMAT_ASTC10x8: number;
    readonly TEXTURE_FORMAT_ASTC10x10: number;
    readonly TEXTURE_FORMAT_ASTC12x10: number;
    readonly TEXTURE_FORMAT_ASTC12x12: number;

    readonly TEXTURE_FORMAT_R1: number;
    readonly TEXTURE_FORMAT_A8: number;
    readonly TEXTURE_FORMAT_R8: number;
    readonly TEXTURE_FORMAT_R8I: number;
    readonly TEXTURE_FORMAT_R8U: number;
    readonly TEXTURE_FORMAT_R8S: number;
    readonly TEXTURE_FORMAT_R16: number;
    readonly TEXTURE_FORMAT_R16I: number;
    readonly TEXTURE_FORMAT_R16U: number;
    readonly TEXTURE_FORMAT_R16F: number;
    readonly TEXTURE_FORMAT_R16S: number;
    readonly TEXTURE_FORMAT_R32I: number;
    readonly TEXTURE_FORMAT_R32U: number;
    readonly TEXTURE_FORMAT_R32F: number;
    readonly TEXTURE_FORMAT_RG8: number;
    readonly TEXTURE_FORMAT_RG8I: number;
    readonly TEXTURE_FORMAT_RG8U: number;
    readonly TEXTURE_FORMAT_RG8S: number;
    readonly TEXTURE_FORMAT_RG16: number;
    readonly TEXTURE_FORMAT_RG16I: number;
    readonly TEXTURE_FORMAT_RG16U: number;
    readonly TEXTURE_FORMAT_RG16F: number;
    readonly TEXTURE_FORMAT_RG16S: number;
    readonly TEXTURE_FORMAT_RG32I: number;
    readonly TEXTURE_FORMAT_RG32U: number;
    readonly TEXTURE_FORMAT_RG32F: number;
    readonly TEXTURE_FORMAT_RGB8: number;
    readonly TEXTURE_FORMAT_RGB8I: number;
    readonly TEXTURE_FORMAT_RGB8U: number;
    readonly TEXTURE_FORMAT_RGB8S: number;
    readonly TEXTURE_FORMAT_RGB9E5F: number;
    readonly TEXTURE_FORMAT_BGRA8: number;
    readonly TEXTURE_FORMAT_RGBA8: number;
    readonly TEXTURE_FORMAT_RGBA8I: number;
    readonly TEXTURE_FORMAT_RGBA8U: number;
    readonly TEXTURE_FORMAT_RGBA8S: number;
    readonly TEXTURE_FORMAT_RGBA16: number;
    readonly TEXTURE_FORMAT_RGBA16I: number;
    readonly TEXTURE_FORMAT_RGBA16U: number;
    readonly TEXTURE_FORMAT_RGBA16F: number;
    readonly TEXTURE_FORMAT_RGBA16S: number;
    readonly TEXTURE_FORMAT_RGBA32I: number;
    readonly TEXTURE_FORMAT_RGBA32U: number;
    readonly TEXTURE_FORMAT_RGBA32F: number;
    readonly TEXTURE_FORMAT_B5G6R5: number;
    readonly TEXTURE_FORMAT_R5G6B5: number;
    readonly TEXTURE_FORMAT_BGRA4: number;
    readonly TEXTURE_FORMAT_RGBA4: number;
    readonly TEXTURE_FORMAT_BGR5A1: number;
    readonly TEXTURE_FORMAT_RGB5A1: number;
    readonly TEXTURE_FORMAT_RGB10A2: number;
    readonly TEXTURE_FORMAT_RG11B10F: number;

    readonly TEXTURE_FORMAT_D16: number;
    readonly TEXTURE_FORMAT_D24: number;
    readonly TEXTURE_FORMAT_D24S8: number;
    readonly TEXTURE_FORMAT_D32: number;
    readonly TEXTURE_FORMAT_D16F: number;
    readonly TEXTURE_FORMAT_D24F: number;
    readonly TEXTURE_FORMAT_D32F: number;
    readonly TEXTURE_FORMAT_D0S8: number;

    readonly ATTRIB_TYPE_INT8: number;
    readonly ATTRIB_TYPE_UINT8: number;
    readonly ATTRIB_TYPE_INT16: number;
    readonly ATTRIB_TYPE_UINT16: number;
    readonly ATTRIB_TYPE_FLOAT: number;

    readonly ALPHA_DISABLE: number;
    readonly ALPHA_ADD: number;
    readonly ALPHA_COMBINE: number;
    readonly ALPHA_SUBTRACT: number;
    readonly ALPHA_MULTIPLY: number;
    readonly ALPHA_MAXIMIZED: number;
    readonly ALPHA_ONEONE: number;
    readonly ALPHA_PREMULTIPLIED: number;
    readonly ALPHA_PREMULTIPLIED_PORTERDUFF: number;
    readonly ALPHA_INTERPOLATE: number;
    readonly ALPHA_SCREENMODE: number;

    readonly STENCIL_TEST_LESS: number;
    readonly STENCIL_TEST_LEQUAL: number;
    readonly STENCIL_TEST_EQUAL: number;
    readonly STENCIL_TEST_GEQUAL: number;
    readonly STENCIL_TEST_GREATER: number;
    readonly STENCIL_TEST_NOTEQUAL: number;
    readonly STENCIL_TEST_NEVER: number;
    readonly STENCIL_TEST_ALWAYS: number;

    readonly STENCIL_OP_FAIL_S_ZERO: number;
    readonly STENCIL_OP_FAIL_S_KEEP: number;
    readonly STENCIL_OP_FAIL_S_REPLACE: number;
    readonly STENCIL_OP_FAIL_S_INCR: number;
    readonly STENCIL_OP_FAIL_S_INCRSAT: number;
    readonly STENCIL_OP_FAIL_S_DECR: number;
    readonly STENCIL_OP_FAIL_S_DECRSAT: number;
    readonly STENCIL_OP_FAIL_S_INVERT: number;

    readonly STENCIL_OP_FAIL_Z_ZERO: number;
    readonly STENCIL_OP_FAIL_Z_KEEP: number;
    readonly STENCIL_OP_FAIL_Z_REPLACE: number;
    readonly STENCIL_OP_FAIL_Z_INCR: number;
    readonly STENCIL_OP_FAIL_Z_INCRSAT: number;
    readonly STENCIL_OP_FAIL_Z_DECR: number;
    readonly STENCIL_OP_FAIL_Z_DECRSAT: number;
    readonly STENCIL_OP_FAIL_Z_INVERT: number;

    readonly STENCIL_OP_PASS_Z_ZERO: number;
    readonly STENCIL_OP_PASS_Z_KEEP: number;
    readonly STENCIL_OP_PASS_Z_REPLACE: number;
    readonly STENCIL_OP_PASS_Z_INCR: number;
    readonly STENCIL_OP_PASS_Z_INCRSAT: number;
    readonly STENCIL_OP_PASS_Z_DECR: number;
    readonly STENCIL_OP_PASS_Z_DECRSAT: number;
    readonly STENCIL_OP_PASS_Z_INVERT: number;

    readonly COMMAND_DELETEVERTEXARRAY: NativeData;
    readonly COMMAND_DELETEINDEXBUFFER: NativeData;
    readonly COMMAND_DELETEVERTEXBUFFER: NativeData;
    readonly COMMAND_SETPROGRAM: NativeData;
    readonly COMMAND_SETMATRIX: NativeData;
    readonly COMMAND_SETMATRIX3X3: NativeData;
    readonly COMMAND_SETMATRIX2X2: NativeData;
    readonly COMMAND_SETMATRICES: NativeData;
    readonly COMMAND_SETINT: NativeData;
    readonly COMMAND_SETINTARRAY: NativeData;
    readonly COMMAND_SETINTARRAY2: NativeData;
    readonly COMMAND_SETINTARRAY3: NativeData;
    readonly COMMAND_SETINTARRAY4: NativeData;
    readonly COMMAND_SETFLOATARRAY: NativeData;
    readonly COMMAND_SETFLOATARRAY2: NativeData;
    readonly COMMAND_SETFLOATARRAY3: NativeData;
    readonly COMMAND_SETFLOATARRAY4: NativeData;
    readonly COMMAND_SETTEXTURESAMPLING: NativeData;
    readonly COMMAND_SETTEXTUREWRAPMODE: NativeData;
    readonly COMMAND_SETTEXTUREANISOTROPICLEVEL: NativeData;
    readonly COMMAND_SETTEXTURE: NativeData;
    readonly COMMAND_UNSETTEXTURE: NativeData;
    readonly COMMAND_DISCARDALLTEXTURES: NativeData;
    readonly COMMAND_BINDVERTEXARRAY: NativeData;
    readonly COMMAND_SETSTATE: NativeData;
    readonly COMMAND_DELETEPROGRAM: NativeData;
    readonly COMMAND_SETZOFFSET: NativeData;
    readonly COMMAND_SETZOFFSETUNITS: NativeData;
    readonly COMMAND_SETDEPTHTEST: NativeData;
    readonly COMMAND_SETDEPTHWRITE: NativeData;
    readonly COMMAND_SETCOLORWRITE: NativeData;
    readonly COMMAND_SETBLENDMODE: NativeData;
    readonly COMMAND_SETFLOAT: NativeData;
    readonly COMMAND_SETFLOAT2: NativeData;
    readonly COMMAND_SETFLOAT3: NativeData;
    readonly COMMAND_SETFLOAT4: NativeData;
    readonly COMMAND_BINDFRAMEBUFFER: NativeData;
    readonly COMMAND_UNBINDFRAMEBUFFER: NativeData;
    readonly COMMAND_DELETEFRAMEBUFFER: NativeData;
    readonly COMMAND_DRAWINDEXED: NativeData;
    readonly COMMAND_DRAWINDEXEDINSTANCED: NativeData;
    readonly COMMAND_DRAW: NativeData;
    readonly COMMAND_DRAWINSTANCED: NativeData;
    readonly COMMAND_CLEAR: NativeData;
    readonly COMMAND_SETSTENCIL: NativeData;
    readonly COMMAND_SETVIEWPORT: NativeData;
    readonly COMMAND_SETSCISSOR: NativeData;
    readonly COMMAND_COPYTEXTURE: NativeData;
}

/** @internal */
export interface INativeCamera {
    createVideo(constraints: MediaTrackConstraints): any;
    updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
}

/** @internal */
interface INativeCameraConstructor {
    prototype: INativeCamera;
    new (): INativeCamera;
}

/** @internal */
interface INativeCanvasConstructor {
    prototype: ICanvas;
    new (): ICanvas;

    loadTTFAsync(fontName: string, buffer: ArrayBuffer): void;
}

/** @internal */
interface INativeImageConstructor {
    prototype: IImage;
    new (): IImage;
}

/** @internal */
interface INativePath2DConstructor {
    prototype: IPath2D;
    new (d?: string): IPath2D;
}

/** @internal */
interface IDeviceInputSystemConstructor {
    prototype: IDeviceInputSystem;
    new (
        onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void,
        onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, currentState: number) => void
    ): IDeviceInputSystem;
}

/** @internal */
export interface INativeDataStream {
    writeBuffer(buffer: ArrayBuffer, length: number): void;
}

/** @internal */
interface INativeDataStreamConstructor {
    prototype: INativeDataStream;
    new (requestFlushCallback: () => void): INativeDataStream;

    readonly VALIDATION_ENABLED: boolean;
    readonly VALIDATION_UINT_32: number;
    readonly VALIDATION_INT_32: number;
    readonly VALIDATION_FLOAT_32: number;
    readonly VALIDATION_UINT_32_ARRAY: number;
    readonly VALIDATION_INT_32_ARRAY: number;
    readonly VALIDATION_FLOAT_32_ARRAY: number;
    readonly VALIDATION_NATIVE_DATA: number;
    readonly VALIDATION_BOOLEAN: number;
}

// Note: These values need to match those in Babylon Native's NativeTracing plugin.
export const enum NativeTraceLevel {
    Mark = 1,
    Log = 2,
}

/** @internal */
export interface INative {
    // NativeEngine plugin
    Engine: INativeEngineConstructor;
    NativeDataStream: INativeDataStreamConstructor;

    // NativeCamera plugin
    Camera?: INativeCameraConstructor;

    // NativeCanvas plugin
    Canvas?: INativeCanvasConstructor;
    Image?: INativeImageConstructor;
    Path2D?: INativePath2DConstructor;

    // Native XMLHttpRequest polyfill
    XMLHttpRequest?: typeof XMLHttpRequest;

    // NativeInput plugin
    DeviceInputSystem?: IDeviceInputSystemConstructor;

    // NativeTracing plugin
    enablePerformanceLogging?(level?: NativeTraceLevel): void;
    disablePerformanceLogging?(): void;
    startPerformanceCounter?(counter: string): unknown;
    endPerformanceCounter?(counter: unknown): void;

    // GaussianSplatting
    sortSplats?(modelViewMatrix: Matrix, splatPositions: Float32Array, splatIndex: Float32Array, useRightHandedSystem: boolean): void;
}
