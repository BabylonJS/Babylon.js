attribute vec3 position;
flat varying vec2 vLimits;
flat varying highp uint vMask;

// Uniforms
#include<sceneUboDeclaration>

uniform sampler2D lightDataTexture;
uniform vec3 tileMaskResolution;

void main(void) {
    vec4 lightData = texelFetch(lightDataTexture, ivec2(0, gl_InstanceID), 0);
    vec4 falloff = texelFetch(lightDataTexture, ivec2(4, gl_InstanceID), 0);

    // We don't apply the view matrix to the disc since we want it always facing the camera
    vec4 viewPosition = view * vec4(lightData.xyz, 1) + vec4(position * falloff.x, 0);
    vec4 projPosition = projection * viewPosition;

    // Convert to NDC 0->1 space and scale to the tile resolution
    vec2 tilePosition = (projPosition.xy / projPosition.w + 1.0) / 2.0 * tileMaskResolution.xy;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = mix(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, greaterThan(position.xy, vec2(0)));
    // Reposition vertically based on current batch
    float offset = float(gl_InstanceID / CLUSTLIGHT_BATCH) * tileMaskResolution.y;
    tilePosition.y = (tilePosition.y + offset) / tileMaskResolution.z;

    // We don't care about depth and don't want it to be clipped so set Z to 0
    gl_Position = vec4(tilePosition / tileMaskResolution.xy * 2.0 - 1.0, 0, 1);
    vLimits = vec2(offset, offset + tileMaskResolution.y);
    vMask = 1u << (gl_InstanceID % CLUSTLIGHT_BATCH);
}
