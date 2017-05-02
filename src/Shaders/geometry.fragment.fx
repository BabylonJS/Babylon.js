#version 300 es

precision highp float;
precision highp int;

in vec3 vNormalV;
//in vec3 vPositionV;

layout(location = 0) out vec4 color0;
layout(location = 1) out vec4 color1;

uniform float far;

void main() {
    float depth = (gl_FragCoord.z / gl_FragCoord.w) / far;
    color0 = vec4(depth, depth * depth, 0.0, 1.0);
    color1 = vec4(normalize(vNormalV), 1.0);
    //color2 = vec4(vPositionV, 1.0);
}