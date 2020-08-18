// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float lod;

void main(void) 
{
	gl_FragColor = textureLod(textureSampler, vUV, lod);
}