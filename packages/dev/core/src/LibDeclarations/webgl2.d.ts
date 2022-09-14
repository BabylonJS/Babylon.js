/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/naming-convention */
// Type definitions for WebGL 2 extended with Babylon specific types

interface WebGL2RenderingContext extends WebGL2RenderingContextBase {
    HALF_FLOAT_OES: number;
    RGBA16F: number;
    RGBA32F: number;
    DEPTH24_STENCIL8: number;
    COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR: number;
    COMPRESSED_SRGB_S3TC_DXT1_EXT: number;
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: number;
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: number;
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT: number;
    COMPRESSED_SRGB8_ETC2: number;
    COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: number;
    DRAW_FRAMEBUFFER: number;
    UNSIGNED_INT_24_8: number;
    MAX: number;
    MIN: number;
    SRGB: number;
    SRGB8: number;
    SRGB8_ALPHA8: number;
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

interface WebGLProgram {
    __SPECTOR_rebuildProgram?:
        | ((vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) => void)
        | null;
}

interface WebGLUniformLocation {
    _currentState: any;
}
