#ifdef GL_ES
precision mediump float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D sceneSampler;

// Parameters
uniform vec2 screenSize;
uniform float sceneIntensity;
uniform float glowIntensity;
uniform float highlightIntensity;

void main(void) 
{
	vec4 orig = texture2D(sceneSampler, vUV);
	vec4 blur = texture2D(textureSampler, vUV);

	vec4 final = sceneIntensity * orig + glowIntensity * blur + highlightIntensity * blur.a;
	final.a = 1.0;

	gl_FragColor = final;
}