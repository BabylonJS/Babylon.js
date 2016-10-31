//#extension GL_OES_standard_derivatives : enable

varying vec4 vColor;
varying vec2 vUV;

// Samplers
uniform sampler2D diffuseSampler;

void main(void) {
#ifdef SignedDistanceField
	float dist = texture2D(diffuseSampler, vUV).r;
	if (dist < 0.5) {
		discard;
	}

	// Another way using derivative, commented right now because I don't know if it worth doing it
	//float edgeDistance = 0.5;
	//float edgeWidth = 0.7 * length(vec2(dFdx(dist), dFdy(dist)));
	//float opacity = dist * smoothstep(edgeDistance - edgeWidth, edgeDistance + edgeWidth, dist);

	float opacity = smoothstep(0.25, 0.75, dist);
	gl_FragColor = vec4(vColor.xyz*opacity, 1.0);
#else
	vec4 color = texture2D(diffuseSampler, vUV);
	gl_FragColor = color*vColor;
#endif

}