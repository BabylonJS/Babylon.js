precision highp float;

varying vec3 vNormalizedPosition;
varying vec3 vNormalizedCenterPosition;
varying float vAlpha;
varying vec2 vPatchPosition;

uniform float nearPlane;
uniform float farPlane;
uniform float stepSize;

void main(void) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}