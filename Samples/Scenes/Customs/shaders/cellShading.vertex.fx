#ifdef GL_ES
precision mediump float;
#endif

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

// Normal
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

void main(void) {
	vec4 outPosition = worldViewProjection * vec4(position, 1.0);
	gl_Position = outPosition;
	
	vPositionW = vec3(world * vec4(position, 1.0));
	vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

	vUV = uv;
}