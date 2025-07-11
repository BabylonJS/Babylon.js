// Uniform Buffers
#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<lightClusteredDeclaration>
#include<lightVxUboDeclaration>[0..1]

// Attributes
attribute vec3 position;
#include<instancesDeclaration>

// Output
flat varying highp uint vMask;

// TODO: switch default direction to up??
const vec3 down = vec3(0, -1, 0);

float acosClamped(float v) {
    return acos(clamp(v, 0.0, 1.0));
}

void main(void) {
    float lightAngle = acosClamped(light0.vLights[gl_InstanceID].direction.a);
    float posAngle = acosClamped(dot(down, position));

    // We allow some wiggle room equal to the rotation of one slice of the sphere
    vec3 positionUpdated = posAngle - lightAngle < 0.32 ? position : vec3(0);
    positionUpdated *= light0.vLights[gl_InstanceID].diffuse.a;

#include<instancesVertex>

    gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1);
    vMask = 1u << gl_InstanceID;
}
