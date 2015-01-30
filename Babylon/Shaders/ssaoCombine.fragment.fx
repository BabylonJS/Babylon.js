#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D textureSampler;
uniform sampler2D originalColor;

varying vec2 vUV;

void main(void) {
	gl_FragColor = texture2D(textureSampler, vUV) * texture2D(originalColor, vUV);
}
