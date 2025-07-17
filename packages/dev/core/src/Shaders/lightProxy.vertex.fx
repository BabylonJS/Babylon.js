attribute vec3 position;
flat varying highp uint vMask;

// Declarations
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
#include<instancesDeclaration>

#include<spotLightDeclaration>
#include<lightVxUboDeclaration>[0..1]

// TODO: switch default direction to up??
const vec3 DOWN = vec3(0, -1, 0);

float acosClamped(float v) {
    return acos(clamp(v, 0.0, 1.0));
}

void main(void) {
    float maxAngle = acosClamped(light0.vLights[gl_InstanceID].direction.a);
    // We allow some wiggle room equal to the difference between two vertical sphere segments
    maxAngle += SEGMENT_ANGLE;

    float angle = acosClamped(dot(DOWN, position));
    vec3 positionUpdated = angle < maxAngle ? position : vec3(0);

#include<instancesVertex>

    gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1);
    // Since we don't write to depth just set this to 0 to prevent clipping
    gl_Position.z = 0.0;
    vMask = 1u << gl_InstanceID;
}
