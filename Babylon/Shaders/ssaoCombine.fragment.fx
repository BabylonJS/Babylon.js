#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D textureSampler;
uniform sampler2D originalColor;

varying vec2 vUV;

void main(void) {
	gl_FragColor = texture2D(originalColor, vUV) * texture2D(textureSampler, vUV);
}
