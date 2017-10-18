// Type definitions for WebGL 2, Editor's Draft Fri Feb 24 16:10:18 2017 -0800
// Project: https://www.khronos.org/registry/webgl/specs/latest/2.0/
// Definitions by: Nico Kemnitz <https://github.com/nkemnitz/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

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
