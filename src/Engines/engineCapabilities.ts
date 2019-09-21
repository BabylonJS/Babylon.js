import { Nullable } from '../types';

/**
 * Class used to describe the capabilities of the engine relatively to the current browser
 */
export class EngineCapabilities {
    /** Maximum textures units per fragment shader */
    public maxTexturesImageUnits: number;
    /** Maximum texture units per vertex shader */
    public maxVertexTextureImageUnits: number;
    /** Maximum textures units in the entire pipeline */
    public maxCombinedTexturesImageUnits: number;
    /** Maximum texture size */
    public maxTextureSize: number;
    /** Maximum cube texture size */
    public maxCubemapTextureSize: number;
    /** Maximum render texture size */
    public maxRenderTextureSize: number;
    /** Maximum number of vertex attributes */
    public maxVertexAttribs: number;
    /** Maximum number of varyings */
    public maxVaryingVectors: number;
    /** Maximum number of uniforms per vertex shader */
    public maxVertexUniformVectors: number;
    /** Maximum number of uniforms per fragment shader */
    public maxFragmentUniformVectors: number;
    /** Defines if standard derivates (dx/dy) are supported */
    public standardDerivatives: boolean;
    /** Defines if s3tc texture compression is supported */
    public s3tc: Nullable<WEBGL_compressed_texture_s3tc>;
    /** Defines if pvrtc texture compression is supported */
    public pvrtc: any; //WEBGL_compressed_texture_pvrtc;
    /** Defines if etc1 texture compression is supported */
    public etc1: any; //WEBGL_compressed_texture_etc1;
    /** Defines if etc2 texture compression is supported */
    public etc2: any; //WEBGL_compressed_texture_etc;
    /** Defines if astc texture compression is supported */
    public astc: any; //WEBGL_compressed_texture_astc;
    /** Defines if float textures are supported */
    public textureFloat: boolean;
    /** Defines if vertex array objects are supported */
    public vertexArrayObject: boolean;
    /** Gets the webgl extension for anisotropic filtering (null if not supported) */
    public textureAnisotropicFilterExtension: Nullable<EXT_texture_filter_anisotropic>;
    /** Gets the maximum level of anisotropy supported */
    public maxAnisotropy: number;
    /** Defines if instancing is supported */
    public instancedArrays: boolean;
    /** Defines if 32 bits indices are supported */
    public uintIndices: boolean;
    /** Defines if high precision shaders are supported */
    public highPrecisionShaderSupported: boolean;
    /** Defines if depth reading in the fragment shader is supported */
    public fragmentDepthSupported: boolean;
    /** Defines if float texture linear filtering is supported*/
    public textureFloatLinearFiltering: boolean;
    /** Defines if rendering to float textures is supported */
    public textureFloatRender: boolean;
    /** Defines if half float textures are supported*/
    public textureHalfFloat: boolean;
    /** Defines if half float texture linear filtering is supported*/
    public textureHalfFloatLinearFiltering: boolean;
    /** Defines if rendering to half float textures is supported */
    public textureHalfFloatRender: boolean;
    /** Defines if textureLOD shader command is supported */
    public textureLOD: boolean;
    /** Defines if draw buffers extension is supported */
    public drawBuffersExtension: boolean;
    /** Defines if depth textures are supported */
    public depthTextureExtension: boolean;
    /** Defines if float color buffer are supported */
    public colorBufferFloat: boolean;
    /** Gets disjoint timer query extension (null if not supported) */
    public timerQuery: EXT_disjoint_timer_query;
    /** Defines if timestamp can be used with timer query */
    public canUseTimestampForTimerQuery: boolean;
    /** Defines if multiview is supported (https://www.khronos.org/registry/webgl/extensions/WEBGL_multiview/) */
    public multiview: any;
    /** Function used to let the system compiles shaders in background */
    public parallelShaderCompile: {
        COMPLETION_STATUS_KHR: number;
    };
    /** Max number of texture samples for MSAA */
    public maxMSAASamples = 1;
    /** Defines if the blend min max extension is supported */
    public blendMinMax: boolean;
}