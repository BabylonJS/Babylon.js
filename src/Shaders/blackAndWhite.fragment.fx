precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

void main(void) 
{
	float luminance = dot(texture2D(textureSampler, vUV).rgb, vec3(0.3, 0.59, 0.11));
	gl_FragColor = vec4(luminance, luminance, luminance, 1.0);
}