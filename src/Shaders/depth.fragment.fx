#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

varying float vDepthMetric;

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

	gl_FragColor = vec4(vDepthMetric, vDepthMetric * vDepthMetric, 0.0, 1.0);
}