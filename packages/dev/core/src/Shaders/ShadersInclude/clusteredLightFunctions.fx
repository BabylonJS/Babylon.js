struct SpotLight {
    vec4 vLightData;
    vec4 vLightDiffuse;
    vec4 vLightSpecular;
    vec4 vLightDirection;
    vec4 vLightFalloff;
};

SpotLight getClusteredSpotLight(sampler2D lightDataTexture, int index) {
    return SpotLight(
        texelFetch(lightDataTexture, ivec2(0, index), 0),
        texelFetch(lightDataTexture, ivec2(1, index), 0),
        texelFetch(lightDataTexture, ivec2(2, index), 0),
        texelFetch(lightDataTexture, ivec2(3, index), 0),
        texelFetch(lightDataTexture, ivec2(4, index), 0)
    );
}
