attribute vec2 vUV;

uniform sampler2D textureSampler;

#if defined(INITIAL)
uniform sampler2D sourceTexture;
uniform vec2 texSize;

void main(void)
{
    ivec2 coord = ivec2(vUV * (texSize - 1.0));

    float f1 = texelFetch(sourceTexture, coord, 0).r;
    float f2 = texelFetch(sourceTexture, coord + ivec2(1, 0), 0).r;
    float f3 = texelFetch(sourceTexture, coord + ivec2(1, 1), 0).r;
    float f4 = texelFetch(sourceTexture, coord + ivec2(0, 1), 0).r;

    float minz = min(min(min(f1, f2), f3), f4);
    #ifdef DEPTH_REDUX
        float maxz = max(max(max(sign(1.0 - f1) * f1, sign(1.0 - f2) * f2), sign(1.0 - f3) * f3), sign(1.0 - f4) * f4);
    #else
        float maxz = max(max(max(f1, f2), f3), f4);
    #endif

    glFragColor = vec4(minz, maxz, 0., 0.);
}

#elif defined(MAIN)
uniform vec2 texSize;

void main(void)
{
    ivec2 coord = ivec2(vUV * (texSize - 1.0));

    vec2 f1 = texelFetch(textureSampler, coord, 0).rg;
    vec2 f2 = texelFetch(textureSampler, coord + ivec2(1, 0), 0).rg;
    vec2 f3 = texelFetch(textureSampler, coord + ivec2(1, 1), 0).rg;
    vec2 f4 = texelFetch(textureSampler, coord + ivec2(0, 1), 0).rg;

    float minz = min(min(min(f1.x, f2.x), f3.x), f4.x);
    float maxz = max(max(max(f1.y, f2.y), f3.y), f4.y);

    glFragColor = vec4(minz, maxz, 0., 0.);
}

#elif defined(ONEBEFORELAST)
uniform ivec2 texSize;

void main(void)
{
    ivec2 coord = ivec2(vUV * vec2(texSize - 1));

    vec2 f1 = texelFetch(textureSampler, coord % texSize, 0).rg;
    vec2 f2 = texelFetch(textureSampler, (coord + ivec2(1, 0)) % texSize, 0).rg;
    vec2 f3 = texelFetch(textureSampler, (coord + ivec2(1, 1)) % texSize, 0).rg;
    vec2 f4 = texelFetch(textureSampler, (coord + ivec2(0, 1)) % texSize, 0).rg;

    float minz = min(f1.x, f2.x);
    float maxz = max(f1.y, f2.y);

    glFragColor = vec4(minz, maxz, 0., 0.);
}

#elif defined(LAST)
void main(void)
{
    discard;
    glFragColor = vec4(0.);
}
#endif
