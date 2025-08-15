attribute vec3 position;
flat varying vec2 vLimits;
flat varying highp uint vMask;

// Uniforms
#include<__decl__sceneVertex>

uniform sampler2D lightDataTexture;
uniform vec3 tileMaskResolution;

#include<clusteredLightingFunctions>

void main(void) {
    ClusteredLight light = getClusteredLight(lightDataTexture, gl_InstanceID);
    float range = light.vLightFalloff.x;

    vec4 viewPosition = view * vec4(light.vLightData.xyz, 1);
    vec4 viewPositionSq = viewPosition * viewPosition;

    // Squared distance for both XZ and YZ
    vec2 distSq = viewPositionSq.xy + viewPositionSq.z;
    // Compute the horizontal and vertical angles to rotate by to get the sphere horizon positions
    vec2 sinSq = (range * range) / distSq;
    // Rotation is multiplied by cos (cos^2 and sin*cos) to scale down the vector after rotation
    vec2 cosSq = max(1.0 - sinSq, 0.01);
    // Flip the sin values (reversing rotation) if the position is negative
    vec2 sinCos = position.xy * sqrt(sinSq * cosSq);

    // Apply rotation
    vec2 rotatedX = mat2(cosSq.x, -sinCos.x, sinCos.x, cosSq.x) * viewPosition.xz;
    vec2 rotatedY = mat2(cosSq.y, -sinCos.y, sinCos.y, cosSq.y) * viewPosition.yz;
    // Apply projection
    vec4 projX = projection * vec4(rotatedX.x, 0, rotatedX.y, 1);
    vec4 projY = projection * vec4(0, rotatedY.x, rotatedY.y, 1);
    // We really do be `max(..., 0.01)` all through this to get rid of them pesky zeros
    vec2 projPosition = vec2(projX.x / max(projX.w, 0.01), projY.y / max(projY.w, 0.01));
    // Override with screen extents if rotation invalid (occurs when inside the sphere)
    projPosition = mix(position.xy, projPosition, greaterThan(cosSq, vec2(0.01)));

    // Convert to NDC 0->1 space and scale to the tile resolution
    vec2 halfTileRes = tileMaskResolution.xy / 2.0;
    vec2 tilePosition = (projPosition + 1.0) * halfTileRes;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = mix(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, greaterThan(position.xy, vec2(0)));
    // Reposition vertically based on current batch
    float offset = float(gl_InstanceID / CLUSTLIGHT_BATCH) * tileMaskResolution.y;
    tilePosition.y = (tilePosition.y + offset) / tileMaskResolution.z;

    // We don't care about depth and don't want it to be clipped so set Z to 0
    gl_Position = vec4(tilePosition / halfTileRes - 1.0, 0, 1);
    vLimits = vec2(offset, offset + tileMaskResolution.y);
    vMask = 1u << (gl_InstanceID % CLUSTLIGHT_BATCH);
}
