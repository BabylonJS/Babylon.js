/**
 * Error codes for babylon JS errors
 */
export const ErrorCodes = {
    // Mesh validation
    MeshInvalidPositionsError: "MeshInvalidPositionsError",

    // Material validation
    UnsupportedTextureError: "UnsupportedTextureError",

    // GLTF Loader errors
    GLTFLoaderUnexpectedMagicError: "GLTFLoaderUnexpectedMagicError",

    // Scene Load errors
    SceneLoaderError: "SceneLoaderError",
} as const;

/**
 * Error code type
 */
export type ErrorCodesString = keyof typeof ErrorCodes;
