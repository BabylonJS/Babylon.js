#if defined(LIGHT{X}) && defined(CLUSTLIGHT{X}) && CLUSTLIGHT_MAX > 0
lightingInfo computeClusteredLighting{X}(vec3 viewDirectionW, vec3 vNormal, vec3 diffuseScale, float glossiness) {
    lightingInfo result;
    vec4 maskTexel = texelFetch(tileMaskTexture{X}, ivec2(gl_FragCoord.xy * light{X}.vLightData.xy), 0);
    uint mask = uint(maskTexel.r);
    vec3 specularScale = light{X}.vLightSpecular.rgb;

    int len = int(light{X}.vLightData.w);
    for (int i = 0; i < len; i += 1) {
        if ((mask & (1u << i)) == 0u) {
            continue;
        }
        vec4 position = texelFetch(lightsDataTexture{X}, ivec2(0, i), 0);
        vec4 diffuse = texelFetch(lightsDataTexture{X}, ivec2(1, i), 0);
        vec4 specular = texelFetch(lightsDataTexture{X}, ivec2(2, i), 0);
        vec4 direction = texelFetch(lightsDataTexture{X}, ivec2(3, i), 0);
        vec4 falloff = texelFetch(lightsDataTexture{X}, ivec2(4, i), 0);

        lightingInfo info = computeSpotLighting(viewDirectionW, vNormal, position, direction, diffuse.rgb * diffuseScale, specular.rgb * specularScale, diffuse.a, glossiness);
        result.diffuse += info.diffuse;
        #ifdef SPECULARTERM
            result.specular += info.specular;
        #endif
    }
    return result;
}
#endif
