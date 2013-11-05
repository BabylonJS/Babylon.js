#ifdef GL_ES
precision mediump float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Parameters
uniform vec2 screenSize;
uniform float highlightThreshold;

float highlights(vec3 color)
{
	return smoothstep(highlightThreshold, 1.0, dot(color, vec3(0.3, 0.59, 0.11)));
}

void main(void) 
{
	vec2 texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
	vec4 baseColor = texture2D(textureSampler, vUV + vec2(-1.0, -1.0) * texelSize) * 0.25;
	baseColor += texture2D(textureSampler, vUV + vec2(1.0, -1.0) * texelSize) * 0.25;
	baseColor += texture2D(textureSampler, vUV + vec2(1.0, 1.0) * texelSize) * 0.25;
	baseColor += texture2D(textureSampler, vUV + vec2(-1.0, 1.0) * texelSize) * 0.25;
	
	baseColor.a = highlights(baseColor.rgb);

	gl_FragColor = baseColor;
}