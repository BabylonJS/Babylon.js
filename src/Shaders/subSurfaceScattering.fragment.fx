// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D irradianceSampler;

void main(void) 
{
	gl_FragColor = mix(texture2D(textureSampler, vUV), texture2D(irradianceSampler, vUV), 0.5);
}