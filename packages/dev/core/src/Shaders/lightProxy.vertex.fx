attribute vec3 position;
flat varying highp uint vMask;

// Uniforms
#include<sceneUboDeclaration>
#include<spotLightDeclaration>
#include<lightVxUboDeclaration>[0..1]

uniform vec2 halfTileRes;

void main(void) {
    SpotLight light = light0.vLights[gl_InstanceID];

    // We don't apply the view matrix to the disc since we want it always facing the camera
    vec4 viewPosition = view * vec4(light.position.xyz, 1) + vec4(position * light.falloff.x, 0);
    vec4 projPosition = projection * viewPosition;

    // Convert to NDC space and scale to the tile resolution
    vec2 tilePosition = projPosition.xy / projPosition.w * halfTileRes;
    // Round to a whole tile boundary with a bit of wiggle room
    tilePosition = mix(floor(tilePosition) - 0.01, ceil(tilePosition) + 0.01, greaterThan(position.xy, vec2(0)));

    // We don't care about depth and don't want it to be clipped
    gl_Position = vec4(tilePosition.xy / halfTileRes, 0, 1);
    vMask = 1u << gl_InstanceID;
}
