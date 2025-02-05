uniform sampler2D textureSampler;
uniform sampler2D originalColor;
uniform vec4 viewport;

varying vec2 vUV;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	vec2 uv = viewport.xy + vUV * viewport.zw;
	vec4 ssaoColor = texture2D(textureSampler, uv);
	vec4 sceneColor = texture2D(originalColor, uv);

	gl_FragColor = sceneColor * ssaoColor;

#define CUSTOM_FRAGMENT_MAIN_END
}
