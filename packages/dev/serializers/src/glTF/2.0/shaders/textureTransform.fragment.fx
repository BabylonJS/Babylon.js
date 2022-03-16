precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform mat4 textureTransformMat;

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	vec2 uvTransformed = (textureTransformMat * vec4(vUV.xy, 1, 1)).xy;
	gl_FragColor = texture2D(textureSampler, uvTransformed);

#define CUSTOM_FRAGMENT_MAIN_END

}