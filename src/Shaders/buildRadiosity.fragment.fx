#version 300 es

// Attributes
in vec2 vUV;
in vec4 worldPosition;
in vec3 worldNormal;

layout(location = 0) out vec4 glFragData[7];

// Uniforms
uniform mat4 world;
uniform float texSize;
uniform float patchOffset;
uniform vec3 color;
uniform float lightStrength;

vec3 encode() {
	float halfPixelSize = 0.5 / texSize;
	float remain = patchOffset;
	vec3 result;
    result.x = mod(remain, 256.) / 255.;
    remain = floor(remain / 256.);
    result.y = mod(remain, 256.) / 255.;
    remain = floor(remain / 256.);
    result.z = mod(remain, 256.) / 255.;
	return result;
}

void main(void) {
	glFragData[0] = vec4(worldPosition.xyz / worldPosition.w, 1.0);
	glFragData[1] = vec4(normalize(worldNormal.xyz), 1.0);
	glFragData[2] = vec4(encode(), 1.0);
	glFragData[3] = vec4(color, 1.0);
	glFragData[4] = vec4(color, 1.0);
	glFragData[5] = vec4(0.0, 0.0, 0.0, 1.0); // offscreen textures
	glFragData[6] = vec4(0.0, 0.0, 0.0, 1.0); // offscreen textures
}