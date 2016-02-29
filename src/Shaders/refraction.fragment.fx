// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D refractionSampler;

// Parameters
uniform vec3 baseColor;
uniform float depth;
uniform float colorLevel;

void main() {
	float ref = 1.0 - texture2D(refractionSampler, vUV).r;

	vec2 uv = vUV - vec2(0.5);
	vec2 offset = uv * depth * ref;
	vec3 sourceColor = texture2D(textureSampler, vUV - offset).rgb;

	gl_FragColor = vec4(sourceColor + sourceColor * ref * colorLevel, 1.0);
}