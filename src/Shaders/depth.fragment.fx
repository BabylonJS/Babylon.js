precision highp float;

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

uniform float far;

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

	float depth = (gl_FragCoord.z / gl_FragCoord.w) / far;
	gl_FragColor = vec4(depth, depth * depth, 0.0, 1.0);
}