// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Color
uniform vec4 color;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	vec4 baseColor = texture2D(textureSampler, vUV);

	gl_FragColor = baseColor * color;

#define CUSTOM_FRAGMENT_MAIN_END
}