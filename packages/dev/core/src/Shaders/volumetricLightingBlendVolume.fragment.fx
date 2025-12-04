varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform mat4 invProjection;
uniform vec2 outputTextureSize;
#ifdef USE_EXTINCTION
    uniform vec3 extinction;
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {
    gl_FragColor = texture2D(textureSampler, vUV);

#ifdef USE_EXTINCTION
    float depth = texelFetch(depthSampler, ivec2(gl_FragCoord.xy), 0).r;
    vec4 ndc = vec4((gl_FragCoord.xy / outputTextureSize) * 2. - 1., depth * 2. - 1., 1.0);

    vec4 viewPos = invProjection * ndc;
    viewPos = viewPos / viewPos.w;

    float eyeDist = length(viewPos);

    gl_FragColor2 = vec4(exp(-extinction * eyeDist), 1.0);
#endif
}
