#ifdef ANISOTROPIC
    struct anisotropicOutParams
    {
        anisotropy: f32,
        anisotropicTangent: vec3f,
        anisotropicBitangent: vec3f,
        anisotropicNormal: vec3f,
    #if DEBUGMODE > 0 && defined(ANISOTROPIC_TEXTURE)
        anisotropyMapData: vec3f
    #endif
    };

    #define pbr_inline
    fn anisotropicBlock(
        vAnisotropy: vec3f,
        roughness: f32,
    #ifdef ANISOTROPIC_TEXTURE
        anisotropyMapData: vec3f,
    #endif
        TBN: mat3x3f,
        normalW: vec3f,
        viewDirectionW: vec3f
    ) -> anisotropicOutParams
    {        
        var outParams: anisotropicOutParams;
        var anisotropy: f32 = vAnisotropy.b;
        var anisotropyDirection: vec3f =  vec3f(vAnisotropy.xy, 0.);

        #ifdef ANISOTROPIC_TEXTURE
            anisotropy *= anisotropyMapData.b;

            #if DEBUGMODE > 0
                outParams.anisotropyMapData = anisotropyMapData;
            #endif

            anisotropyMapData.rg = anisotropyMapData.rg * 2.0 - 1.0;

            #ifdef ANISOTROPIC_LEGACY
                anisotropyDirection.rg *= anisotropyMapData.rg;
            #else
                anisotropyDirection.xy =  mat2x2f(anisotropyDirection.x, anisotropyDirection.y, -anisotropyDirection.y, anisotropyDirection.x) * normalize(anisotropyMapData.rg);
            #endif
        #endif

        var anisoTBN: mat3x3f =  mat3x3f(normalize(TBN[0]), normalize(TBN[1]), normalize(TBN[2]));
        var anisotropicTangent: vec3f = normalize(anisoTBN * anisotropyDirection);
        var anisotropicBitangent: vec3f = normalize(cross(anisoTBN[2], anisotropicTangent));
        
        outParams.anisotropy = anisotropy;
        outParams.anisotropicTangent = anisotropicTangent;
        outParams.anisotropicBitangent = anisotropicBitangent;
        outParams.anisotropicNormal = getAnisotropicBentNormals(anisotropicTangent, anisotropicBitangent, normalW, viewDirectionW, anisotropy, roughness);

        return outParams;
    }
#endif
