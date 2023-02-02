export enum SourceTextureFormat {
    ETC1S,
    UASTC4x4,
}

export enum TranscodeTarget {
    ASTC_4X4_RGBA,
    BC7_RGBA,
    BC3_RGBA,
    BC1_RGB,
    PVRTC1_4_RGBA,
    PVRTC1_4_RGB,
    ETC2_RGBA,
    ETC1_RGB,
    RGBA32,
    R8,
    RG8,
}

export enum EngineFormat {
    COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8e8c,
    COMPRESSED_RGBA_ASTC_4X4_KHR = 0x93b0,
    COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0,
    COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83f3,
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8c02,
    COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8c00,
    COMPRESSED_RGBA8_ETC2_EAC = 0x9278,
    COMPRESSED_RGB8_ETC2 = 0x9274,
    COMPRESSED_RGB_ETC1_WEBGL = 0x8d64,
    RGBA8Format = 0x8058,
    R8Format = 0x8229,
    RG8Format = 0x822b,
}

/**
 * Leaf node of a decision tree
 * It defines the transcoding format to use to transcode the texture as well as the corresponding format to use at the engine level when creating the texture
 */
export interface ILeaf {
    /**
     * The format to transcode to
     */
    transcodeFormat: TranscodeTarget;

    /**
     * The format to use when creating the texture at the engine level after it has been transcoded to transcodeFormat
     */
    engineFormat: EngineFormat;

    /**
     * Whether the texture must be rounded to a multiple of 4 (should normally be the case for all compressed formats). Default: true
     */
    roundToMultiple4?: boolean;
}

/**
 * Regular node of a decision tree
 *
 * Each property (except for "yes" and "no"), if not empty, will be checked in order to determine the next node to select.
 * If all checks are successful, the "yes" node will be selected, else the "no" node will be selected.
 */
export interface INode {
    /**
     * The name of the capability to check. Can be one of the following:
     *      astc
     *      bptc
     *      s3tc
     *      pvrtc
     *      etc2
     *      etc1
     */
    cap?: string;

    /**
     * The name of the option to check from the options object passed to the KTX2 decode function. {@link IKTX2DecoderOptions}
     */
    option?: string;

    /**
     * Checks if alpha is present in the texture
     */
    alpha?: boolean;

    /**
     * Checks the currently selected transcoding format.
     */
    transcodeFormat?: TranscodeTarget | TranscodeTarget[];

    /**
     * Checks that the texture is a power of two
     */
    needsPowerOfTwo?: boolean;

    /**
     * The node to select if all checks are successful
     */
    yes?: INode | ILeaf;

    /**
     * The node to select if at least one check is not successful
     */
    no?: INode | ILeaf;
}

/**
 * Decision tree used to determine the transcoding format to use for a given source texture format
 */
export interface IDecisionTree {
    /**
     * textureFormat can be either UASTC or ETC1S
     */
    [textureFormat: string]: INode;
}

/**
 * Result of the KTX2 decode function
 */
export interface IDecodedData {
    /**
     * Width of the texture
     */
    width: number;

    /**
     * Height of the texture
     */
    height: number;

    /**
     * The format to use when creating the texture at the engine level
     * This corresponds to the engineFormat property of the leaf node of the decision tree
     */
    transcodedFormat: number;

    /**
     * List of mipmap levels.
     * The first element is the base level, the last element is the smallest mipmap level (if more than one mipmap level is present)
     */
    mipmaps: Array<IMipmap>;

    /**
     * Whether the texture data is in gamma space or not
     */
    isInGammaSpace: boolean;

    /**
     * Whether the texture has an alpha channel or not
     */
    hasAlpha: boolean;

    /**
     * The name of the transcoder used to transcode the texture
     */
    transcoderName: string;

    /**
     * The errors (if any) encountered during the decoding process
     */
    errors?: string;
}

/**
 * Defines a mipmap level
 */
export interface IMipmap {
    /**
     * The data of the mipmap level
     */
    data: Uint8Array | null;

    /**
     * The width of the mipmap level
     */
    width: number;

    /**
     * The height of the mipmap level
     */
    height: number;
}

/**
 * The compressed texture formats supported by the browser
 */
export interface ICompressedFormatCapabilities {
    /**
     * Whether the browser supports ASTC
     */
    astc?: boolean;

    /**
     * Whether the browser supports BPTC
     */
    bptc?: boolean;

    /**
     * Whether the browser supports S3TC
     */
    s3tc?: boolean;

    /**
     * Whether the browser supports PVRTC
     */
    pvrtc?: boolean;

    /**
     * Whether the browser supports ETC2
     */
    etc2?: boolean;

    /**
     * Whether the browser supports ETC1
     */
    etc1?: boolean;
}

/**
 * Options passed to the KTX2 decode function
 */
export interface IKTX2DecoderOptions {
    /** use RGBA format if ASTC and BC7 are not available as transcoded format */
    useRGBAIfASTCBC7NotAvailableWhenUASTC?: boolean;

    /** force to always use (uncompressed) RGBA for transcoded format */
    forceRGBA?: boolean;

    /** force to always use (uncompressed) R8 for transcoded format */
    forceR8?: boolean;

    /** force to always use (uncompressed) RG8 for transcoded format */
    forceRG8?: boolean;

    /**
     * list of transcoders to bypass when looking for a suitable transcoder. The available transcoders are:
     *      UniversalTranscoder_UASTC_ASTC
     *      UniversalTranscoder_UASTC_BC7
     *      UniversalTranscoder_UASTC_RGBA_UNORM
     *      UniversalTranscoder_UASTC_RGBA_SRGB
     *      UniversalTranscoder_UASTC_R8_UNORM
     *      UniversalTranscoder_UASTC_RG8_UNORM
     *      MSCTranscoder
     */
    bypassTranscoders?: string[];

    /**
     * Custom decision tree to apply after the default decision tree has selected a transcoding format.
     * Allows the user to override the default decision tree selection.
     * The decision tree can use the INode.transcodeFormat property to base its decision on the transcoding format selected by the default decision tree.
     */
    transcodeFormatDecisionTree?: IDecisionTree;
}
