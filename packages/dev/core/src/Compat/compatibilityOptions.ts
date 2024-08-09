/**
 * Defines if the system should use OpenGL convention for UVs when creating geometry or loading .babylon files (false by default)
 */
export let useOpenGLOrientationForUV = false;

/**
 * Sets whether to use OpenGL convention for UVs
 * @param value the new value
 */
export function setOpenGLOrientationForUV(value: boolean) {
    useOpenGLOrientationForUV = value;
}

/**
 * Options used to control default behaviors regarding compatibility support
 * @deprecated please use named exports
 */
export const CompatibilityOptions = {
    /* eslint-disable @typescript-eslint/naming-convention */
    get UseOpenGLOrientationForUV() {
        return useOpenGLOrientationForUV;
    },
    set UseOpenGLOrientationForUV(value) {
        useOpenGLOrientationForUV = value;
    },
    /* eslint-enable @typescript-eslint/naming-convention */
};
