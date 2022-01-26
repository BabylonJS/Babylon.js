/**
 * Error codes for babylon JS
 */
export const ErrorCodes = Object.freeze({
    // Mesh validation
    MeshInvalidPositionsError: "MeshInvalidPositionsError",

    // Texture validation
    UnsupportedTextureError: "UnsupportedTextureError",

    // GLTF Loader errors
    GLTFLoaderUnexpectedMagicError: "GLTFLoaderUnexpectedMagicError",
});

/**
 * Error code type
 */
export type ErrorCodesString = keyof typeof ErrorCodes;
