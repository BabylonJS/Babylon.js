#ifdef GL_ES
	precision mediump sampler2DArray;
#endif

varying vec2 vUV;
uniform sampler2DArray multiviewSampler;
uniform int imageIndex;

void main(void)
{
	gl_FragColor = texture(multiviewSampler, vec3(vUV, imageIndex));
}