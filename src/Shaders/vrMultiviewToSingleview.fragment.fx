precision mediump sampler2DArray;

varying vec2 vUV;
uniform sampler2DArray multiviewSampler;
uniform int imageIndex;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void)
{
	gl_FragColor = texture2D(multiviewSampler, vec3(vUV, imageIndex));
}