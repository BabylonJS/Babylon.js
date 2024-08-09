uniform sampler2D textureSampler;
uniform sampler2D originalColor;
uniform viewport: vec4f;

varying vUV: vec2f;


#define CUSTOM_FRAGMENT_DEFINITIONS

fn main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	var ssaoColor: vec4f = texture2D(textureSampler, viewport.xy + vUV * viewport.zw);
	var sceneColor: vec4f = texture2D(originalColor, vUV);

	fragmentOutputs.color = sceneColor * ssaoColor;

#define CUSTOM_FRAGMENT_MAIN_END
}
