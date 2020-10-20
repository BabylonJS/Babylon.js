/**
 * Interface used to describe the capabilities of the engine relatively to the current browser
 */
export interface EngineCapabilities {
    /** Maximum textures units per fragment shader */
    maxTexturesImageUnits: number;
    /** Maximum texture units per vertex shader */
    maxVertexTextureImageUnits: number;
    /** Maximum textures units in the entire pipeline */
    maxCombinedTexturesImageUnits: number;
    /** Maximum texture size */
    maxTextureSize: number;
    /** Maximum texture samples */
    maxSamples?: number;
    /** Maximum cube texture size */
    maxCubemapTextureSize: number;
    /** Maximum render texture size */
    maxRenderTextureSize: number;
    /** Maximum number of vertex attributes */
    maxVertexAttribs: number;
    /** Maximum number of varyings */
    maxVaryingVectors: number;
    /** Maximum number of uniforms per vertex shader */
    maxVertexUniformVectors: number;
    /** Maximum number of uniforms per fragment shader */
    maxFragmentUniformVectors: number;
    /** Defines if standard derivates (dx/dy) are supported */
    standardDerivatives: boolean;
    /** Defines if s3tc texture compression is supported */
    s3tc?: WEBGL_compressed_texture_s3tc;
    /** Defines if pvrtc texture compression is supported */
    pvrtc: any; //WEBGL_compressed_texture_pvrtc;
    /** Defines if etc1 texture compression is supported */
    etc1: any; //WEBGL_compressed_texture_etc1;
    /** Defines if etc2 texture compression is supported */
    etc2: any; //WEBGL_compressed_texture_etc;
    /** Defines if astc texture compression is supported */
    astc: any; //WEBGL_compressed_texture_astc;
    /** Defines if bptc texture compression is supported */
    bptc: any; //EXT_texture_compression_bptc;
    /** Defines if float textures are supported */
    textureFloat: boolean;
    /** Defines if vertex array objects are supported */
    vertexArrayObject: boolean;
    /** Gets the webgl extension for anisotropic filtering (null if not supported) */
    textureAnisotropicFilterExtension?: EXT_texture_filter_anisotropic;
    /** Gets the maximum level of anisotropy supported */
    maxAnisotropy: number;
    /** Defines if instancing is supported */
    instancedArrays: boolean;
    /** Defines if 32 bits indices are supported */
    uintIndices: boolean;
    /** Defines if high precision shaders are supported */
    highPrecisionShaderSupported: boolean;
    /** Defines if depth reading in the fragment shader is supported */
    fragmentDepthSupported: boolean;
    /** Defines if float texture linear filtering is supported*/
    textureFloatLinearFiltering: boolean;
    /** Defines if rendering to float textures is supported */
    textureFloatRender: boolean;
    /** Defines if half float textures are supported*/
    textureHalfFloat: boolean;
    /** Defines if half float texture linear filtering is supported*/
    textureHalfFloatLinearFiltering: boolean;
    /** Defines if rendering to half float textures is supported */
    textureHalfFloatRender: boolean;
    /** Defines if textureLOD shader command is supported */
    textureLOD: boolean;
    /** Defines if draw buffers extension is supported */
    drawBuffersExtension: boolean;
    /** Defines if depth textures are supported */
    depthTextureExtension: boolean;
    /** Defines if float color buffer are supported */
    colorBufferFloat: boolean;
    /** Gets disjoint timer query extension (null if not supported) */
    timerQuery?: EXT_disjoint_timer_query;
    /** Defines if timestamp can be used with timer query */
    canUseTimestampForTimerQuery: boolean;
    /** Defines if multiview is supported (https://www.khronos.org/registry/webgl/extensions/WEBGL_multiview/) */
    multiview?: any;
    /** Defines if oculus multiview is supported (https://developer.oculus.com/documentation/oculus-browser/latest/concepts/browser-multiview/) */
    oculusMultiview?: any;
    /** Function used to let the system compiles shaders in background */
    parallelShaderCompile?: {
        COMPLETION_STATUS_KHR: number;
    };
    /** Max number of texture samples for MSAA */
    maxMSAASamples: number;
    /** Defines if the blend min max extension is supported */
    blendMinMax: boolean;
}