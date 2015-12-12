precision highp float;

uniform vec4 color;

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

void main(void) {
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

	gl_FragColor = color;
}