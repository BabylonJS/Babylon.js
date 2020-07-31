#ifdef ANISOTROPIC
    struct anisotropicOutParams
    {
        float anisotropy;
        vec3 anisotropicTangent;
        vec3 anisotropicBitangent;
        vec3 anisotropicNormal;
    #if DEBUGMODE > 0
        vec3 anisotropyMapData;
    #endif
    };

    void anisotropicBlock(
        const in vec3 vAnisotropy,
    #ifdef ANISOTROPIC_TEXTURE
        const in vec3 anisotropyMapData,
    #endif
        const in mat3 TBN,
        const in vec3 normalW,
        const in vec3 viewDirectionW,
        out anisotropicOutParams outParams
    )
    {
        float anisotropy = vAnisotropy.b;
        vec3 anisotropyDirection = vec3(vAnisotropy.xy, 0.);

        #ifdef ANISOTROPIC_TEXTURE
            anisotropy *= anisotropyMapData.b;
            anisotropyDirection.rg *= anisotropyMapData.rg * 2.0 - 1.0;
            #if DEBUGMODE > 0
                outParams.anisotropyMapData = anisotropyMapData;
            #endif
        #endif

        mat3 anisoTBN = mat3(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        vec3 anisotropicTangent = normalize(anisoTBN * anisotropyDirection);
        vec3 anisotropicBitangent = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        outParams.anisotropy = anisotropy;
        outParams.anisotropicTangent = anisotropicTangent;
        outParams.anisotropicBitangent = anisotropicBitangent;
        outParams.anisotropicNormal = getAnisotropicBentNormals(anisotropicTangent, anisotropicBitangent, normalW, viewDirectionW, anisotropy);
    }
#endif
