precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    gl_Position = worldViewProjection * vec4(position, 1.0);

    vPosition = position;
    vNormal = normal;
}