precision highp float;

layout(location = 0) out highp float glFragData[MAX_DRAW_BUFFERS];

varying vec3 vNormalizedPosition;
varying vec3 vNormalizedCenterPosition;
varying float vAlpha;
varying vec2 vPatchPosition;

uniform float nearPlane;
uniform float farPlane;
uniform float stepSize;

float max3(vec3 v) { return max(max(v.x, v.y), v.z); }

void main(void) {
    vec3 normPos = vNormalizedPosition.xyz;
    // If we're not rendering into the current "slab", discard.
    if (normPos.z < nearPlane || normPos.z > farPlane) {
        discard;
    }

    // Per-fragment coverage of the voxel cell times the splat's transparency.
    // Rather than doing a stochastic (Russian-roulette) discard here and writing a
    // binary 0/1 occupancy, we write this non-binary opacity into the cell. The
    // roulette is deferred to the shadow ray-march, where it can vary per sample and
    // thus converge to the correct transmittance. Cells accumulate with a MAX blend
    // equation, so overlapping splats keep the strongest occluder.
    float distToCenter = max3(abs(vNormalizedCenterPosition - normPos));
    float shadowingOpacity = clamp((distToCenter < stepSize ? 1.0 : exp(-dot(vPatchPosition, vPatchPosition))) * vAlpha, 0.0, 1.0);

    if (shadowingOpacity <= 0.0) {
        discard;
    }

    // I'd like to do this with a for loop but I can't index into glFragData[] without a constant integer.
    // Loop-unrolling doesn't seem to be an option.
    // A fragment writes its opacity into the slab slice its Z falls in; 0.0 elsewhere is a MAX-blend no-op.
    glFragData[0] = normPos.z < nearPlane + stepSize ? shadowingOpacity : 0.0;
    glFragData[1] = normPos.z >= nearPlane + stepSize && normPos.z < nearPlane + 2.0 * stepSize ? shadowingOpacity : 0.0;
    glFragData[2] = normPos.z >= nearPlane + 2.0 * stepSize && normPos.z < nearPlane + 3.0 * stepSize ? shadowingOpacity : 0.0;
    glFragData[3] = normPos.z >= nearPlane + 3.0 * stepSize && normPos.z < nearPlane + 4.0 * stepSize ? shadowingOpacity : 0.0;
#if MAX_DRAW_BUFFERS > 4
    glFragData[4] = normPos.z >= nearPlane + 4.0 * stepSize && normPos.z < nearPlane + 5.0 * stepSize ? shadowingOpacity : 0.0;
    glFragData[5] = normPos.z >= nearPlane + 5.0 * stepSize && normPos.z < nearPlane + 6.0 * stepSize ? shadowingOpacity : 0.0;
#if MAX_DRAW_BUFFERS > 6
    glFragData[6] = normPos.z >= nearPlane + 6.0 * stepSize && normPos.z < nearPlane + 7.0 * stepSize ? shadowingOpacity : 0.0;
    glFragData[7] = normPos.z >= nearPlane + 7.0 * stepSize && normPos.z < nearPlane + 8.0 * stepSize ? shadowingOpacity : 0.0;
#endif
#endif
}