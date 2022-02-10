/* IMP! DO NOT CHANGE THE NUMBERING OF EXISTING ERROR CODES */
/**
 * Error codes for BaseError
 */
export const ErrorCodes = {
    // Mesh errors 0-999
    /** Invalid or empty mesh vertex positions. */
    MeshInvalidPositionsError: 0,

    // Texture errors 1000-1999
    /** Unsupported texture found. */
    UnsupportedTextureError: 1000,

    // GLTFLoader errors 2000-2999
    /** Unexpected magic number found in GLTF file header. */
    GLTFLoaderUnexpectedMagicError: 2000,

    // SceneLoader errors 3000-3999
    /** SceneLoader generic error code. Ideally wraps the inner exception. */
    SceneLoaderError: 3000,
} as const;

/**
 * Error code type
 */
export type ErrorCodesType = typeof ErrorCodes[keyof typeof ErrorCodes];