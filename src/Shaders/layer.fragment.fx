// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Color
uniform vec4 color;

void main(void) {
	vec4 baseColor = texture2D(textureSampler, vUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	gl_FragColor = baseColor * color;
}