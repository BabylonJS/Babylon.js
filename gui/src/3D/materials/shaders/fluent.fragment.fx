precision highp float;

varying vec2 vEmissiveUV;
uniform sampler2D emissiveSampler;


void main(void) {
	vec3 emissiveColor = texture2D(emissiveSampler, vEmissiveUV).rgb;
	gl_FragColor = vec4(emissiveColor, 1.0);
}