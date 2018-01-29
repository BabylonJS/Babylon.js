// samplers
uniform sampler2D textureSampler;
uniform sampler2D originalSampler;
uniform sampler2D circleOfConfusionSampler;

// varyings
varying vec2 vUV;

void main(void)
{
    vec4 blurred = texture2D(textureSampler, vUV);
    vec4 original = texture2D(originalSampler, vUV);
    float coc = texture2D(circleOfConfusionSampler, vUV).r;
    gl_FragColor = mix(original, blurred, coc);
}
