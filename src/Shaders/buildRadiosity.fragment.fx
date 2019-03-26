#version 300 es

// Attributes
in vec2 vUV;
in vec4 worldPosition;
in vec3 worldNormal;

layout(location = 0) out vec4 glFragData[3];

// Uniforms
uniform mat4 world;

const float resolution = 8.0;

vec3 encode() {
	return vec3(floor(vUV.x * resolution) / resolution, floor(vUV.y * resolution) / resolution, 0.0);
}

void main(void) {
	glFragData[0] = vec4(worldPosition.xyz / worldPosition.w, 1.0);
	glFragData[1] = vec4(normalize(worldNormal.xyz), 1.0);
	glFragData[2] = vec4(encode(), 1.0);
}