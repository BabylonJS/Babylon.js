precision highp float;

// Uniforms
uniform sampler2D baseSampler;
uniform float size;

// Varyings
varying vec2 vUV;

// Constants
const vec3 LUMA_COEFFICIENT = vec3(0.2126, 0.7152, 0.0722);

float lumaAtCoord(vec2 coord)
{
	vec3 pixel = texture2D(baseSampler, coord).rgb;
	float luma = dot(pixel, LUMA_COEFFICIENT);
	return luma;
}

void main()
{
	float lumaU0 = lumaAtCoord(vUV + vec2(-1.0,  0.0) / size);
	float lumaU1 = lumaAtCoord(vUV + vec2( 1.0,  0.0) / size);
	float lumaV0 = lumaAtCoord(vUV + vec2( 0.0, -1.0) / size);
	float lumaV1 = lumaAtCoord(vUV + vec2( 0.0,  1.0) / size);

	vec2 slope = (vec2(lumaU0 - lumaU1, lumaV0 - lumaV1) + 1.0) * 0.5;

	gl_FragColor = vec4(slope, 1.0, 1.0);
}
