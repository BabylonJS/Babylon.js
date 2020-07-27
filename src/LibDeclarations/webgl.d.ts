interface WebGLRenderingContext {
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisor(index: number, divisor: number): void;

    createVertexArray(): any;
    bindVertexArray(vao?: WebGLVertexArrayObject | null): void;
    deleteVertexArray(vao: WebGLVertexArrayObject): void;

    blitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;
    renderbufferStorageMultisample?(target: number, samples: number, internalformat: number, width: number, height: number): void;

    bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null): void;
    getUniformBlockIndex(program: WebGLProgram, uniformBlockName: string): number;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: number, uniformBlockBinding: number): void;

    // Queries
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
    R32F: number;
    RG32F: number;
    RGB32F: number;
    R16F: number;
    RG16F: number;
    RGB16F: number;
    RED: number;
    RG: number;
    R8: number;
    RG8: number;

    UNSIGNED_INT_24_8: number;
    DEPTH24_STENCIL8: number;

    MIN: number;
    MAX: number;

    /* Multiple Render Targets */
    drawBuffers(buffers: number[]): void;
    readBuffer(src: number): void;

    readonly COLOR_ATTACHMENT0: number;                             // 0x8CE1
    readonly COLOR_ATTACHMENT1: number;                             // 0x8CE2
    readonly COLOR_ATTACHMENT2: number;                             // 0x8CE3
    readonly COLOR_ATTACHMENT3: number;                             // 0x8CE4

    // Occlusion Query
    ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    ANY_SAMPLES_PASSED: number;
    QUERY_RESULT_AVAILABLE: number;
    QUERY_RESULT: number;
}

interface WebGLProgram {
    __SPECTOR_rebuildProgram?: ((vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) => void) | null;
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

interface WebGLUniformLocation {
    _currentState: any;
}