precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 viewProjection;
uniform mat4 emissiveMatrix;

varying vec2 vEmissiveUV;

void main(void) {
	vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));

	gl_Position = viewProjection * world * vec4(position, 1.0);
}
