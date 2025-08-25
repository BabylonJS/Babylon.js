#ifdef ANISOTROPIC
    struct anisotropicOutParams
    {
        float anisotropy;
        vec3 anisotropicTangent;
        vec3 anisotropicBitangent;
        vec3 anisotropicNormal;
    #if DEBUGMODE > 0 && defined(SPECULAR_ROUGHNESS_ANISOTROPY)
        vec3 anisotropyMapData;
    #endif
    };

    #define pbr_inline
    anisotropicOutParams anisotropicBlock(
        in vec3 vAnisotropy,
        in float roughness,
    #ifdef SPECULAR_ROUGHNESS_ANISOTROPY
        in vec3 anisotropyMapData,
    #endif
        in mat3 TBN,
        in vec3 normalW,
        in vec3 viewDirectionW
    )
    {
        anisotropicOutParams outParams;
        float anisotropy = vAnisotropy.b;
        vec3 anisotropyDirection = vec3(vAnisotropy.xy, 0.);

        #ifdef SPECULAR_ROUGHNESS_ANISOTROPY
            anisotropy *= anisotropyMapData.b;

            #if DEBUGMODE > 0
                outParams.anisotropyMapData = anisotropyMapData;
            #endif

            anisotropyMapData.rg = anisotropyMapData.rg * 2.0 - 1.0;
            anisotropyDirection.xy = mat2(anisotropyDirection.x, anisotropyDirection.y, -anisotropyDirection.y, anisotropyDirection.x) * normalize(anisotropyMapData.rg);

        #endif

        mat3 anisoTBN = mat3(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        vec3 anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
        vec3 anisotropicBitangent = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        outParams.anisotropy = anisotropy;
        outParams.anisotropicTangent = anisotropicTangent;
        outParams.anisotropicBitangent = anisotropicBitangent;
        outParams.anisotropicNormal = getAnisotropicBentNormals(anisotropicTangent, anisotropicBitangent, normalW, viewDirectionW, anisotropy, roughness);
        return outParams;
    }
#endif
