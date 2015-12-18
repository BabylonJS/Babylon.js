precision highp float;

uniform sampler2D textureSampler;
uniform sampler2D originalColor;

varying vec2 vUV;

void main(void) {
	vec4 ssaoColor = texture2D(textureSampler, vUV);
	vec4 sceneColor = texture2D(originalColor, vUV);

	gl_FragColor = sceneColor * ssaoColor;
}
