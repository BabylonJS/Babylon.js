attribute vec3 position;

// Uniforms
uniform highp uint index;

#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<lightClusteredDeclaration>
#include<lightVxUboDeclaration>[0..1]

// TODO: switch default direction to up??
const vec3 down = vec3(0, -1, 0);

float acosClamped(float v) {
    return acos(clamp(v, 0.0, 1.0));
}

void main(void) {
    float lightAngle = acosClamped(light0.vLights[index].direction.a);
    float posAngle = acosClamped(dot(down, position));
    // We allow some wiggle room equal to the rotation of one slice of the sphere
    vec3 vPosition = posAngle - lightAngle < 0.32 ? position : vec3(0);

    vPosition *= light0.vLights[index].diffuse.a;
    gl_Position = viewProjection * world * vec4(vPosition, 1);
}
