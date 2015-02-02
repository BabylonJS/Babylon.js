#ifdef GL_ES
precision mediump float;
#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER)
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

#ifdef BASIC_RENDER
	gl_FragColor = texture2D(diffuseSampler, vUV);
#else
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
#endif
}