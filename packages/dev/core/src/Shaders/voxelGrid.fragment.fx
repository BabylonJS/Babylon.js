precision highp float;
layout(location = 0) out highp float glFragData[MAX_DRAW_BUFFERS];
varying vec3 vNormalizedPosition;

uniform float nearPlane;
uniform float farPlane;
uniform float stepSize;
void main(void) {
    vec3 normPos = vNormalizedPosition.xyz;
    // If we're not rendering into the current "slab", discard.
    if (normPos.z < nearPlane || normPos.z > farPlane) {
        discard;
    }

    // I'd like to do this with a for loop but I can't index into glFragData[] without a constant integer.
    // Loop-unrolling doesn't seem to be an option.
    glFragData[0] = normPos.z < nearPlane + stepSize ? 1.0 : 0.0;
    glFragData[1] = normPos.z >= nearPlane + stepSize && normPos.z < nearPlane + 2.0 * stepSize ? 1.0 : 0.0;
    glFragData[2] = normPos.z >= nearPlane + 2.0 * stepSize && normPos.z < nearPlane + 3.0 * stepSize ? 1.0 : 0.0;
    glFragData[3] = normPos.z >= nearPlane + 3.0 * stepSize && normPos.z < nearPlane + 4.0 * stepSize ? 1.0 : 0.0;
#if MAX_DRAW_BUFFERS > 4
    glFragData[4] = normPos.z >= nearPlane + 4.0 * stepSize && normPos.z < nearPlane + 5.0 * stepSize ? 1.0 : 0.0;
    glFragData[5] = normPos.z >= nearPlane + 5.0 * stepSize && normPos.z < nearPlane + 6.0 * stepSize ? 1.0 : 0.0;
    glFragData[6] = normPos.z >= nearPlane + 6.0 * stepSize && normPos.z < nearPlane + 7.0 * stepSize ? 1.0 : 0.0;
    glFragData[7] = normPos.z >= nearPlane + 7.0 * stepSize && normPos.z < nearPlane + 8.0 * stepSize ? 1.0 : 0.0;
#endif
}