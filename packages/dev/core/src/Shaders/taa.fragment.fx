varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D historySampler;
#ifdef TAA_VELOCITY_OFFSET
uniform sampler2D velocitySampler;
#endif
uniform float factor;

void main() {
    ivec2 pos = ivec2(gl_FragCoord.xy);
    vec4 c = texelFetch(textureSampler, pos, 0);

#ifdef TAA_VELOCITY_OFFSET
    vec4 v = texelFetch(velocitySampler, pos, 0);
    vec4 h = texture2D(historySampler, vUV + v.xy);

    #ifdef TAA_COLOR_CLAMPED
        vec4 minColor = vec4(1);
        vec4 maxColor = vec4(0);
        for (int x = -1; x <= 1; x += 1) {
            for (int y = -1; y <= 1; y += 1) {
                vec4 color = texelFetch(textureSampler, pos + ivec2(x, y), 0);
                minColor = min(minColor, color);
                maxColor = max(maxColor, color);
            }
        }
        h = clamp(h, minColor, maxColor);
    #endif

#else
    vec4 h = texelFetch(historySampler, pos, 0);
#endif
    gl_FragColor = mix(h, c, factor);
}
