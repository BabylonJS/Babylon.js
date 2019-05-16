// Attributes
in vec2 vUV2;
uniform sampler2D itemBuffer;

#ifdef DEPTH_COMPARE
in float depth;
#endif


vec4 pack(float d)
{
    const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
    const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

    vec4 res = fract(d * bit_shift);
    res -= res.xxyz * bit_mask;

    return res;
}

void main(void) {
	#ifdef DEPTH_COMPARE
	gl_FragColor = pack(depth);
	#else
	gl_FragColor = vec4(texture(itemBuffer, vUV2).xyz, 1.0);
	#endif
}