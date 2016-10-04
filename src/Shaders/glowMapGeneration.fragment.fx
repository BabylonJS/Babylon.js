#ifdef ALPHATEST
varying vec2 vUVDiffuse;
uniform sampler2D diffuseSampler;
#endif

#ifdef EMISSIVE
varying vec2 vUVEmissive;
uniform sampler2D emissiveSampler;
#endif

uniform vec4 color;

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUVDiffuse).a < 0.4)
		discard;
#endif

#ifdef EMISSIVE
	gl_FragColor = texture2D(emissiveSampler, vUVEmissive);
#else
	gl_FragColor = color;
#endif
}