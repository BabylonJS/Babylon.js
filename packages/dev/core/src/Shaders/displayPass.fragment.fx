// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D passSampler;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void)
{
    gl_FragColor = texture2D(passSampler, vUV);
}