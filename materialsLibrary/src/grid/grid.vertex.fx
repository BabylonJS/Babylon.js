precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 projection;
uniform mat4 world;
uniform mat4 view;
uniform mat4 worldView;

// Varying
#ifdef TRANSPARENT
    varying vec4 vCameraSpacePosition;
#endif
varying vec3 vPosition;
varying vec3 vNormal;

#include<fogVertexDeclaration>

void main(void) {

    #ifdef FOG
    vec4 worldPos = world * vec4(position, 1.0);
    #endif

    #include<fogVertex>

    vec4 cameraSpacePosition = worldView * vec4(position, 1.0);
    gl_Position = projection * cameraSpacePosition;

    #ifdef TRANSPARENT
        vCameraSpacePosition = cameraSpacePosition;
    #endif

    vPosition = position;
    vNormal = normal;
}