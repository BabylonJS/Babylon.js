#ifdef GL_ES
precision mediump float;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;


void main(void) {
	vec4 baseColor = texture2D(textureSampler, vUV);

	gl_FragColor = baseColor;
}