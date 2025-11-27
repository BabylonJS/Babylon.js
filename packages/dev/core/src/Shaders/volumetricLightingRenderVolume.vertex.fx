#include<sceneUboDeclaration>
#include<meshUboDeclaration>

attribute vec3 position;

varying vec4 vWorldPos;

void main(void) {
    vec4 worldPos = world * vec4(position, 1.0);

    vWorldPos = worldPos;
    gl_Position = viewProjection * worldPos;
}
