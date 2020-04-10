precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

//Varyings
varying vec3 vPosition;
varying vec2 vUV;
varying vec2 tUV;
varying vec2 stageUnits;
varying vec2 levelUnits;
varying vec2 tileID;

// Uniforms
uniform float time;
uniform mat4 worldViewProjection;

uniform vec2 outputSize;
uniform vec2 stageSize;
uniform vec2 spriteMapSize;

uniform float stageScale;

void main() {
    vec4 p = vec4( position, 1. );
    vPosition = p.xyz;
    vUV = uv;
    tUV = uv * stageSize;	
    gl_Position = worldViewProjection * p;
}