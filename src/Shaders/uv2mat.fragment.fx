// Attributes
in vec2 vUV2;
uniform sampler2D itemBuffer;

#ifdef DEPTH_COMPARE
in float depth;
#endif

void main(void) {
	#ifdef DEPTH_COMPARE
	gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
	#else
	gl_FragColor = vec4(texture(itemBuffer, vUV2).xyz, 1.0);
	#endif
}