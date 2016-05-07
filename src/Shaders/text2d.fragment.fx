varying vec4 vColor;
varying vec2 vUV;

// Samplers
uniform sampler2D diffuseSampler;

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);
	gl_FragColor = vec4(color.xyz*vColor.xyz, color.w);
}