// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Offset
uniform float offset;

void main(void) {
	vec4 baseColor = texture2D(textureSampler, vUV);

	baseColor.a = abs(offset - baseColor.a);

	#ifdef STROKE
        float alpha = smoothstep(.0, .1, baseColor.a);
        baseColor.a = alpha;
        baseColor.rgb = baseColor.rgb * alpha;
    #endif

	gl_FragColor = baseColor;
}