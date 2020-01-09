// Type definitions for WebGL 2, Editor's Draft Fri Feb 24 16:10:18 2017 -0800
// Project: https://www.khronos.org/registry/webgl/specs/latest/2.0/
// Definitions by: Nico Kemnitz <https://github.com/nkemnitz/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface WebGLRenderingContext {
    readonly RASTERIZER_DISCARD: number;
    readonly DEPTH_COMPONENT24: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_COMPARE_FUNC: number;
    readonly TEXTURE_COMPARE_MODE: number;
    readonly COMPARE_REF_TO_TEXTURE: number;
    readonly TEXTURE_WRAP_R: number;
    readonly HALF_FLOAT: number;
    readonly RGB8: number;
    readonly RED_INTEGER: number;
    readonly RG_INTEGER: number;
    readonly RGB_INTEGER: number;
    readonly RGBA_INTEGER: number;
    readonly R8_SNORM: number;
    readonly RG8_SNORM: number;
    readonly RGB8_SNORM: number;
    readonly RGBA8_SNORM: number;
    readonly R8I: number;
    readonly RG8I: number;
    readonly RGB8I: number;
    readonly RGBA8I: number;
    readonly R8UI: number;
    readonly RG8UI: number;
    readonly RGB8UI: number;
    readonly RGBA8UI: number;
    readonly R16I: number;
    readonly RG16I: number;
    readonly RGB16I: number;
    readonly RGBA16I: number;
    readonly R16UI: number;
    readonly RG16UI: number;
    readonly RGB16UI: number;
    readonly RGBA16UI: number;
    readonly R32I: number;
    readonly RG32I: number;
    readonly RGB32I: number;
    readonly RGBA32I: number;
    readonly R32UI: number;
    readonly RG32UI: number;
    readonly RGB32UI: number;
    readonly RGBA32UI: number;
    readonly RGB10_A2UI: number;
    readonly R11F_G11F_B10F: number;
    readonly RGB9_E5: number;
    readonly RGB10_A2: number;
    readonly UNSIGNED_INT_2_10_10_10_REV: number;
    readonly UNSIGNED_INT_10F_11F_11F_REV: number;
    readonly UNSIGNED_INT_5_9_9_9_REV: number;
    readonly FLOAT_32_UNSIGNED_INT_24_8_REV: number;
    readonly DEPTH_COMPONENT32F: number;

    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView, offset: number): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ImageBitmap | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;

    framebufferTextureLayer(target: number, attachment: number, texture: WebGLTexture | null, level: number, layer: number): void;

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

    clearBufferfv(buffer: number, drawbuffer: number, values: ArrayBufferView, srcOffset: number | null): void;
    clearBufferiv(buffer: number, drawbuffer: number, values: ArrayBufferView, srcOffset: number | null): void;
    clearBufferuiv(buffer: number, drawbuffer: number, values: ArrayBufferView, srcOffset: number | null): void;
    clearBufferfi(buffer: number, drawbuffer: number, depth: number, stencil: number): void;
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
    new(): WebGLQuery;
};

interface WebGLSampler extends WebGLObject {
}

declare var WebGLSampler: {
    prototype: WebGLSampler;
    new(): WebGLSampler;
};

interface WebGLSync extends WebGLObject {
}

declare var WebGLSync: {
    prototype: WebGLSync;
    new(): WebGLSync;
};

interface WebGLTransformFeedback extends WebGLObject {
}

declare var WebGLTransformFeedback: {
    prototype: WebGLTransformFeedback;
    new(): WebGLTransformFeedback;
};

interface WebGLVertexArrayObject extends WebGLObject {
}

declare var WebGLVertexArrayObject: {
    prototype: WebGLVertexArrayObject;
    new(): WebGLVertexArrayObject;
};
