#ifdef GL_ES
precision highp float;
#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER) || defined(OPACITY)
varying vec2 vUV;
#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER)
uniform sampler2D diffuseSampler;
#endif

#if defined(OPACITY)
uniform sampler2D opacitySampler;
#endif

void main(void)
{
#if defined(ALPHATEST) || defined(OPACITY) || defined(BASIC_RENDER)
	vec4 diffuseColor = texture2D(diffuseSampler, vUV);
#endif

#ifdef ALPHATEST
	if (diffuseColor.a < 0.4)
		discard;
#endif

#ifdef BASIC_RENDER
#ifdef OPACITY
	gl_FragColor = diffuseColor * texture2D(opacitySampler, vUV);
#else
	gl_FragColor = diffuseColor;
#endif
#else
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
#endif

}
