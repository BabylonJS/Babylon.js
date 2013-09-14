#ifdef GL_ES
precision mediump float;
#endif

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform vec2 waveData;
uniform mat4 windMatrix;
uniform mat4 world;
uniform mat4 worldViewProjection;

// Normal
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec4 vUV;
varying vec2 vBumpUV;

void main(void) {
	vec4 outPosition = worldViewProjection * vec4(position, 1.0);
	gl_Position = outPosition;
	
	vPositionW = vec3(world * vec4(position, 1.0));
	vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

	vUV = outPosition;

	vec2 bumpTexCoord = vec2(windMatrix * vec4(uv, 0.0, 1.0));
	vBumpUV = bumpTexCoord / waveData.x;
}