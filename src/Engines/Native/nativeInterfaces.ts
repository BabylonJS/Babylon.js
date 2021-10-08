import { INativeInput } from "../../DeviceInput/Interfaces/inputInterfaces";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Nullable } from "../../types";
import { ICanvas, IImage } from "../ICanvas";
import { NativeData, NativeDataStream } from "./nativeDataStream";

/** @hidden */
export interface INativeEngine {
    dispose(): void;

    requestAnimationFrame(callback: () => void): void;

    createVertexArray(): NativeData;

    createIndexBuffer(bytes: ArrayBuffer, byteOffset: number, byteLength: number, is32Bits: boolean, dynamic: boolean): NativeData;
    recordIndexBuffer(vertexArray: NativeData, indexBuffer: NativeData): void;
    updateDynamicIndexBuffer(buffer: NativeData, bytes: ArrayBuffer, byteOffset: number, byteLength: number, startIndex: number): void;

    createVertexBuffer(bytes: ArrayBuffer, byteOffset: number, byteLength: number, dynamic: boolean): NativeData;
    recordVertexBuffer(vertexArray: NativeData, vertexBuffer: NativeData, location: number, byteOffset: number, byteStride: number, numElements: number, type: number, normalized: boolean): void;
    updateDynamicVertexBuffer(vertexBuffer: NativeData, bytes: ArrayBuffer, byteOffset: number, byteLength: number): void;

    createProgram(vertexShader: string, fragmentShader: string): any;
    getUniforms(shaderProgram: any, uniformsNames: string[]): WebGLUniformLocation[];
    getAttributes(shaderProgram: any, attributeNames: string[]): number[];

    createTexture(): WebGLTexture;
    loadTexture(texture: WebGLTexture, data: ArrayBufferView, generateMips: boolean, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    loadRawTexture(texture: WebGLTexture, data: ArrayBufferView, width: number, height: number, format: number, generateMips: boolean, invertY: boolean): void;
    loadCubeTexture(texture: WebGLTexture, data: Array<ArrayBufferView>, generateMips: boolean, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    loadCubeTextureWithMips(texture: WebGLTexture, data: Array<Array<ArrayBufferView>>, invertY: boolean, srgb: boolean, onSuccess: () => void, onError: () => void): void;
    getTextureWidth(texture: WebGLTexture): number;
    getTextureHeight(texture: WebGLTexture): number;
    copyTexture(desination: Nullable<WebGLTexture>, source: Nullable<WebGLTexture>): void;
    deleteTexture(texture: Nullable<WebGLTexture>): void;

    createImageBitmap(data: ArrayBufferView): ImageBitmap;
    resizeImageBitmap(image: ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array;

    createFrameBuffer(texture: WebGLTexture, width: number, height: number, format: number, generateStencilBuffer: boolean, generateDepthBuffer: boolean, generateMips: boolean): WebGLFramebuffer;

    getRenderWidth(): number;
    getRenderHeight(): number;
    getHardwareScalingLevel(): number;
    setHardwareScalingLevel(level: number): void;

    setViewPort(x: number, y: number, width: number, height: number): void;

    setCommandDataStream(dataStream: NativeDataStream): void;
    submitCommands(): void;
}

/** @hidden */
interface INativeEngineConstructor {
    prototype: INativeEngine;
    new(): INativeEngine;

    readonly PROTOCOL_VERSION: number;

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

    readonly TEXTURE_FORMAT_RGB8: number;
    readonly TEXTURE_FORMAT_RGBA8: number;
    readonly TEXTURE_FORMAT_RGBA32F: number;

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
    readonly COMMAND_DRAW: NativeData;
    readonly COMMAND_CLEAR: NativeData;
    readonly COMMAND_SETSTENCIL: NativeData;
}

/** @hidden */
export interface INativeCamera {
    createVideo(constraints: MediaTrackConstraints): any;
    updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
}

/** @hidden */
interface INativeCameraConstructor {
    prototype: INativeCamera;
    new(): INativeCamera;
}

/** @hidden */
interface INativeCanvasConstructor {
    prototype: ICanvas;
    new(): ICanvas;

    loadTTFAsync(fontName: string, buffer: ArrayBuffer): void;
}

/** @hidden */
interface INativeImageConstructor {
    prototype: IImage;
    new(): IImage;
}

/** @hidden */
interface IDeviceInputSystemConstructor {
    prototype: INativeInput;
    new(): INativeInput;
}

/** @hidden */
export interface INativeDataStream {
    writeBytes(buffer: ArrayBuffer, byteLength: number): void;
}

/** @hidden */
interface INativeDataStreamConstructor {
    prototype: INativeDataStream;
    new(requestFlushCallback: () => void): INativeDataStream;

    readonly VALIDATION_ENABLED: boolean;
    readonly VALIDATION_UINT_8: number;
    readonly VALIDATION_UINT_32: number;
    readonly VALIDATION_INT_32: number;
    readonly VALIDATION_FLOAT_32: number;
    readonly VALIDATION_UINT_32_ARRAY: number;
    readonly VALIDATION_INT_32_ARRAY: number;
    readonly VALIDATION_FLOAT_32_ARRAY: number;
    readonly VALIDATION_NATIVE_DATA: number;
    readonly VALIDATION_BOOLEAN: number;
}

/** @hidden */
export interface INative {
    Engine: INativeEngineConstructor;
    Camera: INativeCameraConstructor;
    Canvas: INativeCanvasConstructor;
    Image: INativeImageConstructor;
    XMLHttpRequest: any; // TODO: how to do this?
    DeviceInputSystem: IDeviceInputSystemConstructor;
    NativeDataStream: INativeDataStreamConstructor;
}
