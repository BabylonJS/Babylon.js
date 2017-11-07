// Type definitions for WebGL 2, Editor's Draft Fri Feb 24 16:10:18 2017 -0800
// Project: https://www.khronos.org/registry/webgl/specs/latest/2.0/
// Definitions by: Nico Kemnitz <https://github.com/nkemnitz/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

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
