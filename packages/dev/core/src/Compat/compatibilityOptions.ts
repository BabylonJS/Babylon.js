/* Options used to control default behaviors regarding compatibility support */

/**
 * Defines if the system should use OpenGL convention for UVs when creating geometry or loading .babylon files (false by default)
 */
export const useOpenGLOrientationForUV = false;

/**
 * @deprecated use compatibility options variables
 */
export const CompatibilityOptions = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    UseOpenGLOrientationForUV: useOpenGLOrientationForUV,
};
