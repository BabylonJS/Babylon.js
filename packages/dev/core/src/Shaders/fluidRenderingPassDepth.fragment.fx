uniform sampler2D textureDepth;

varying vec2 vUV;

void main(void) 
{
	gl_FragDepth = texture2D(textureDepth, vUV).x;
}
