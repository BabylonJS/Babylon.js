attribute vec3 position;
flat varying highp uint vMask;

uniform float angleBias;
uniform vec2 positionBias;

// Declarations
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#include<instancesDeclaration>

#include<spotLightDeclaration>
#include<lightVxUboDeclaration>[0..1]

// TODO: switch default direction to up??
const vec3 DOWN = vec3(0, -1, 0);

void main(void) {
#include<instancesVertex>

    // Get the center (last column) and transformed offset (everything but the last column) of the projected position
    vec4 projPosition = viewProjection * finalWorld[3];
    vec4 offset = viewProjection * (mat3x4(finalWorld) * position);

    // For spot lights we keep it at the center if its larger than the spotlight angle
    float maxAngle = acos(light0.vLights[gl_InstanceID].direction.w);
    // We use the original position for this angle, it will get rotated to face the spotlight direction
    float angle = acos(dot(DOWN, normalize(position))) + angleBias;
    if (angle < maxAngle) {
        // Pointlights or positions within the angle of a spotlight
        projPosition += offset;
    }

    gl_Position = vec4(
        // Offset the position in NDC space away from the center
        projPosition.xy + sign(offset.xy) * positionBias * projPosition.w,
        // Since we don't write to depth just set this to 0 to prevent clipping
        0,
        projPosition.w
    );
    vMask = 1u << gl_InstanceID;
}
