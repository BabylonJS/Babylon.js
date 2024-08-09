// Samplers
varying var vUV: vec2f;
uniform sampler2D textureSampler;
uniform sampler2D leftSampler;


#define CUSTOM_FRAGMENT_DEFINITIONS

fn main(void)
{
    var leftFrag: vec4f = texture2D(leftSampler, vUV);
    leftFrag =  vec4f(1.0, leftFrag.g, leftFrag.b, 1.0);

	var rightFrag: vec4f = texture2D(textureSampler, vUV);
    rightFrag =  vec4f(rightFrag.r, 1.0, 1.0, 1.0);

    gl_FragColor =  vec4f(rightFrag.rgb * leftFrag.rgb, 1.0);
}