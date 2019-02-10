#if  DEBUGMODE > 0
    if (vClipSpacePosition.x / vClipSpacePosition.w < vDebugMode.x) {
        return;
    }
// Geometry
    #if   DEBUGMODE == 1
        gl_FragColor.rgb = vPositionW.rgb;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 2 && defined(NORMAL)
        gl_FragColor.rgb = vNormalW.rgb;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 3 && (defined(BUMP) || defined(PARALLAX) || defined(ANISOTROPIC))
        // Tangents
        gl_FragColor.rgb = TBN[0];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 4 && (defined(BUMP) || defined(PARALLAX) || defined(ANISOTROPIC))
        // BiTangents
        gl_FragColor.rgb = TBN[1];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 5
        // Bump Normals
        gl_FragColor.rgb = normalW;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 6 && defined(MAINUV1)
        gl_FragColor.rgb = vec3(vMainUV1, 0.0);
    #elif DEBUGMODE == 7 && defined(MAINUV2)
        gl_FragColor.rgb = vec3(vMainUV2, 0.0);
    #elif DEBUGMODE == 8 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
        // ClearCoat Tangents
        gl_FragColor.rgb = TBNClearCoat[0];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 9 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
        // ClearCoat BiTangents
        gl_FragColor.rgb = TBNClearCoat[1];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 10 && defined(CLEARCOAT)
        // ClearCoat Bump Normals
        gl_FragColor.rgb = clearCoatNormalW;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 11 && defined(ANISOTROPIC)
        gl_FragColor.rgb = anisotropicNormal;
        #define DEBUGMODE_NORMALIZE
// Maps
    #elif DEBUGMODE == 20 && defined(ALBEDO)
        gl_FragColor.rgb = albedoTexture.rgb;
    #elif DEBUGMODE == 21 && defined(AMBIENT)
        gl_FragColor.rgb = ambientOcclusionColorMap.rgb;
    #elif DEBUGMODE == 22 && defined(OPACITY)
        gl_FragColor.rgb = opacityMap.rgb;
    #elif DEBUGMODE == 23 && defined(EMISSIVE)
        gl_FragColor.rgb = emissiveColorTex.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 24 && defined(LIGHTMAP)
        gl_FragColor.rgb = lightmapColor.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 25 && defined(REFLECTIVITY) && defined(METALLICWORKFLOW)
        gl_FragColor.rgb = surfaceMetallicColorMap.rgb;
    #elif DEBUGMODE == 26 && defined(REFLECTIVITY) && !defined(METALLICWORKFLOW)
        gl_FragColor.rgb = surfaceReflectivityColorMap.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 27 && defined(CLEARCOAT) && defined(CLEARCOAT_TEXTURE)
        gl_FragColor.rgb = clearCoatMapData.rgb;
    #elif DEBUGMODE == 28 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
        gl_FragColor.rgb = clearCoatTintMapData.rgb;
// Env
    #elif DEBUGMODE == 40 && defined(REFRACTION)
        // Base color.
        gl_FragColor.rgb = environmentRefraction.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 41 && defined(REFLECTION)
        gl_FragColor.rgb = environmentRadiance.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 42 && defined(CLEARCOAT) && defined(REFLECTION)
        gl_FragColor.rgb = environmentClearCoatRadiance;
        #define DEBUGMODE_GAMMA
// Lighting
    #elif DEBUGMODE == 50
        gl_FragColor.rgb = diffuseBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 51 && defined(SPECULARTERM)
        gl_FragColor.rgb = specularBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 52 && defined(CLEARCOAT)
        gl_FragColor.rgb = clearCoatBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 53 && defined(REFLECTION)
        gl_FragColor.rgb = environmentIrradiance.rgb;
        #define DEBUGMODE_GAMMA
// Lighting Params
    #elif DEBUGMODE == 60
        gl_FragColor.rgb = surfaceAlbedo.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 61
        gl_FragColor.rgb = specularEnvironmentR0;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 62
        gl_FragColor.rgb = vec3(roughness);
    #elif DEBUGMODE == 63
        gl_FragColor.rgb = vec3(alphaG);
    #elif DEBUGMODE == 64
        gl_FragColor.rgb = vec3(NdotV);
    #elif DEBUGMODE == 65 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
        gl_FragColor.rgb = clearCoatColor.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 66 && defined(CLEARCOAT)
        gl_FragColor.rgb = vec3(clearCoatRoughness);
    #elif DEBUGMODE == 67 && defined(CLEARCOAT)
        gl_FragColor.rgb = vec3(clearCoatNdotV);
// Misc
    #elif DEBUGMODE == 70 && defined(RADIANCEOCCLUSION)
        gl_FragColor.rgb = vec3(seo);
    #elif DEBUGMODE == 71 && defined(HORIZONOCCLUSION)
        gl_FragColor.rgb = vec3(eho);
    #elif DEBUGMODE == 72 && defined(MS_BRDF_ENERGY_CONSERVATION)
        gl_FragColor.rgb = vec3(energyConservationFactor);
    #elif DEBUGMODE == 73 && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        gl_FragColor.rgb = specularEnvironmentReflectance;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 74 && defined(CLEARCOAT) && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        gl_FragColor.rgb = clearCoatEnvironmentReflectance;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 75 && defined(ALPHABLEND)
        gl_FragColor.rgb = vec3(luminanceOverAlpha);
    #elif DEBUGMODE == 76
        gl_FragColor.rgb = vec3(alpha);
    #endif

    gl_FragColor.rgb *= vDebugMode.y;
    #ifdef DEBUGMODE_NORMALIZE
        gl_FragColor.rgb = normalize(gl_FragColor.rgb) * 0.5 + 0.5;
    #endif
    #ifdef DEBUGMODE_GAMMA
        gl_FragColor.rgb = toGammaSpace(gl_FragColor.rgb);
    #endif

    gl_FragColor.a = 1.0;
#endif