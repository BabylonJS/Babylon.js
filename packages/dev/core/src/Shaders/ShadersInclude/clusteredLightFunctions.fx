#if defined(LIGHT{X}) && defined(CLUSTLIGHT{X}) && CLUSTLIGHT_MAX > 0
lightingInfo computeClusteredLighting{X}(vec3 viewDirectionW, vec3 vNormal, vec3 diffuseScale, float glossiness) {
    lightingInfo result;
    vec4 maskTexel = texelFetch(tileMaskTexture{X}, ivec2(gl_FragCoord.xy * light{X}.vLightData.xy), 0);
    uint mask = uint(maskTexel.r);

    int len = int(light{X}.vLightData.w);
    for (int i = 0; i < len; i += 1) {
        if ((mask & (1u << i)) == 0u) {
            continue;
        }
        vec3 diffuse = light{X}.vLights[i].diffuse.rgb * diffuseScale;
        vec3 specular = light{X}.vLights[i].specular.rgb * light{X}.vLightSpecular.rgb;
        lightingInfo info = computeSpotLighting(viewDirectionW, vNormal, light{X}.vLights[i].position, light{X}.vLights[i].direction, diffuse, specular, light{X}.vLights[i].diffuse.a, glossiness);
        result.diffuse += info.diffuse;
        #ifdef SPECULARTERM
            result.specular += info.specular;
        #endif
    }
    return result;
}
#endif
