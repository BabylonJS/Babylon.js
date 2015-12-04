precision highp float;

// Samplers
varying vec2 vUV;
varying vec4 vColor;
uniform vec4 textureMask;
uniform sampler2D diffuseSampler;

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

void main(void) {
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif
	vec4 baseColor = texture2D(diffuseSampler, vUV);

	gl_FragColor = (baseColor * textureMask + (vec4(1., 1., 1., 1.) - textureMask)) * vColor;
}