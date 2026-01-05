varying vec2 vUV;

uniform sampler2D textureSampler;

#if defined(INITIAL)
uniform vec2 texSize;

void main(void)
{
    ivec2 coord = ivec2(vUV * (texSize - 1.0));

    float f1 = texelFetch(textureSampler, coord, 0).r;
    float f2 = texelFetch(textureSampler, coord + ivec2(1, 0), 0).r;
    float f3 = texelFetch(textureSampler, coord + ivec2(1, 1), 0).r;
    float f4 = texelFetch(textureSampler, coord + ivec2(0, 1), 0).r;

    #ifdef DEPTH_REDUX
        #ifdef VIEW_DEPTH
            // depth is camera view depth, ranging from near to far clip planes.
            // 0 is the clear depth value, so we must not consider it when calculating min depth.
            float minz = 3.4e38;

            if (f1 != 0.0) { minz = f1; }
            if (f2 != 0.0) { minz = min(minz, f2); }
            if (f3 != 0.0) { minz = min(minz, f3); }
            if (f4 != 0.0) { minz = min(minz, f4); }

            float maxz = max(max(max(f1, f2), f3), f4);
        #else
            // depth is either normalized view depth or screen space depth, ranging from 0 to 1
            float minz = min(min(min(f1, f2), f3), f4);

            // 1 is the clear depth value, so we must not consider it, hence sign(1.0 - f) * f which will result in 0 if f is 1.0
            float maxz = max(max(max(sign(1.0 - f1) * f1, sign(1.0 - f2) * f2), sign(1.0 - f3) * f3), sign(1.0 - f4) * f4);
        #endif
    #else
        float minz = min(min(min(f1, f2), f3), f4);
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

    float minz = min(min(min(f1.x, f2.x), f3.x), f4.x);
    float maxz = max(max(max(f1.y, f2.y), f3.y), f4.y);

    glFragColor = vec4(minz, maxz, 0., 0.);
}

#elif defined(LAST)
void main(void)
{
    glFragColor = vec4(0.);
    if (true) { // do not remove, else you will get a "warning: code is unreachable" error!
        discard;
    }
}
#endif
