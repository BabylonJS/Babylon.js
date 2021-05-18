precision highp float;

// Attributes
attribute vec3 position;

// Uniforms
uniform mat4 worldViewProjection;
uniform float scale;

void main(void) {
    vec4 vPos = vec4(vec3(position) * scale, 1.0);
	gl_Position = worldViewProjection * vPos;
}