precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform mat4 view;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;

#include<fogVertexDeclaration>

void main(void) {

    #ifdef FOG
    vec4 worldPos = world * vec4(position, 1.0);
    #endif

    #include<fogVertex>

    gl_Position = worldViewProjection * vec4(position, 1.0);

    vPosition = position;
    vNormal = normal;
}