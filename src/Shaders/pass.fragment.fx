#ifdef GL_ES
precision highp float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

void main(void) 
{
	gl_FragColor = texture2D(textureSampler, vUV);
}