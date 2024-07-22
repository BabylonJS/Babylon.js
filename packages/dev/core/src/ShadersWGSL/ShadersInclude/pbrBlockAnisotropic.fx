#ifdef ANISOTROPIC
    struct anisotropicOutParams
    {
        var anisotropy: f32;
        var anisotropicTangent: vec3f;
        var anisotropicBitangent: vec3f;
        var anisotropicNormal: vec3f;
    #if DEBUGMODE > 0 && defined(ANISOTROPIC_TEXTURE)
        var anisotropyMapData: vec3f;
    #endif
    };

    #define pbr_inline
    var anisotropicBlock: voidnull(
        in var vAnisotropy: vec3f,
        in var roughness: f32,
    #ifdef ANISOTROPIC_TEXTURE
        in var anisotropyMapData: vec3f,
    #endif
        in var TBN: mat3x3f,
        in var normalW: vec3f,
        in var viewDirectionW: vec3f,
        out anisotropicOutParams outParams
    )
    {
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
    }
#endif
