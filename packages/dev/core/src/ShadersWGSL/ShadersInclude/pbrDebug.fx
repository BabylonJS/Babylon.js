#if  DEBUGMODE > 0
if (input.vClipSpacePosition.x / input.vClipSpacePosition.w >= uniforms.vDebugMode.x) {

    var color: vec3f;
// Geometry
    #if   DEBUGMODE == 1
        color = fragmentInputs.vPositionW.rgb;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 2 && defined(NORMAL)
        color = fragmentInputs.vNormalW.rgb;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 3 && defined(BUMP) || DEBUGMODE == 3 && defined(PARALLAX) || DEBUGMODE == 3 && defined(ANISOTROPIC)
        // Tangents
        color = TBN[0];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 4 && defined(BUMP) || DEBUGMODE == 4 && defined(PARALLAX) || DEBUGMODE == 4 && defined(ANISOTROPIC)
        // BiTangents
        color = TBN[1];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 5
        // Bump Normals
        color = normalW;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 6 && defined(MAINUV1)
        color =  vec3f(input.vMainUV1, 0.0);
    #elif DEBUGMODE == 7 && defined(MAINUV2)
        color =  vec3f(input.vMainUV2, 0.0);
    #elif DEBUGMODE == 8 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
        // ClearCoat Tangents
        color = clearcoatOut.TBNClearCoat[0];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 9 && defined(CLEARCOAT) && defined(CLEARCOAT_BUMP)
        // ClearCoat BiTangents
        color = clearcoatOut.TBNClearCoat[1];
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 10 && defined(CLEARCOAT)
        // ClearCoat Bump Normals
        color = clearcoatOut.clearCoatNormalW;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 11 && defined(ANISOTROPIC)
        color = anisotropicOut.anisotropicNormal;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 12 && defined(ANISOTROPIC)
        color = anisotropicOut.anisotropicTangent;
        #define DEBUGMODE_NORMALIZE
    #elif DEBUGMODE == 13 && defined(ANISOTROPIC)
        color = anisotropicOut.anisotropicBitangent;
        #define DEBUGMODE_NORMALIZE
// Maps
    #elif DEBUGMODE == 20 && defined(ALBEDO)
        color = albedoTexture.rgb;
        #ifndef GAMMAALBEDO
            #define DEBUGMODE_GAMMA
        #endif
    #elif DEBUGMODE == 21 && defined(AMBIENT)
        color = aoOut.ambientOcclusionColorMap.rgb;
    #elif DEBUGMODE == 22 && defined(OPACITY)
        color = opacityMap.rgb;
    #elif DEBUGMODE == 23 && defined(EMISSIVE)
        color = emissiveColorTex.rgb;
        #ifndef GAMMAEMISSIVE
            #define DEBUGMODE_GAMMA
        #endif
    #elif DEBUGMODE == 24 && defined(LIGHTMAP)
        color = lightmapColor;
        #ifndef GAMMALIGHTMAP
            #define DEBUGMODE_GAMMA
        #endif
    #elif DEBUGMODE == 25 && defined(REFLECTIVITY) && defined(METALLICWORKFLOW)
        color = reflectivityOut.surfaceMetallicColorMap.rgb;
    #elif DEBUGMODE == 26 && defined(REFLECTIVITY) && !defined(METALLICWORKFLOW)
        color = reflectivityOut.surfaceReflectivityColorMap.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 27 && defined(CLEARCOAT) && defined(CLEARCOAT_TEXTURE)
        color =  vec3f(clearcoatOut.clearCoatMapData.rg, 0.0);
    #elif DEBUGMODE == 28 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
        color = clearcoatOut.clearCoatTintMapData.rgb;
    #elif DEBUGMODE == 29 && defined(SHEEN) && defined(SHEEN_TEXTURE)
        color = sheenOut.sheenMapData.rgb;
    #elif DEBUGMODE == 30 && defined(ANISOTROPIC) && defined(ANISOTROPIC_TEXTURE)
        color = anisotropicOut.anisotropyMapData.rgb;
    #elif DEBUGMODE == 31 && defined(SUBSURFACE) && defined(SS_THICKNESSANDMASK_TEXTURE)
        color = subSurfaceOut.thicknessMap.rgb;
    #elif DEBUGMODE == 32 && defined(BUMP)
        color = textureSample(bumpSampler, bumpSamplerSampler, fragmentInputs.vBumpUV).rgb;
// Env
    #elif DEBUGMODE == 40 && defined(SS_REFRACTION)
        // Base color.
        color = subSurfaceOut.environmentRefraction.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 41 && defined(REFLECTION)
        color = reflectionOut.environmentRadiance.rgb;
        #ifndef GAMMAREFLECTION
            #define DEBUGMODE_GAMMA
        #endif
    #elif DEBUGMODE == 42 && defined(CLEARCOAT) && defined(REFLECTION)
        color = clearcoatOut.environmentClearCoatRadiance.rgb;
        #define DEBUGMODE_GAMMA
// Lighting
    #elif DEBUGMODE == 50
        color = diffuseBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 51 && defined(SPECULARTERM)
        color = specularBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 52 && defined(CLEARCOAT)
        color = clearCoatBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 53 && defined(SHEEN)
        color = sheenBase.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 54 && defined(REFLECTION)
        color = reflectionOut.environmentIrradiance.rgb;
        #ifndef GAMMAREFLECTION
            #define DEBUGMODE_GAMMA
        #endif
// Lighting Params
    #elif DEBUGMODE == 60
        color = surfaceAlbedo.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 61
        color = clearcoatOut.specularEnvironmentR0;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 62 && defined(METALLICWORKFLOW)
        color =  vec3f(reflectivityOut.metallicRoughness.r);
    #elif DEBUGMODE == 71 && defined(METALLICWORKFLOW)
        color = reflectivityOut.metallicF0;
    #elif DEBUGMODE == 63
        color =  vec3f(roughness);
    #elif DEBUGMODE == 64
        color =  vec3f(alphaG);
    #elif DEBUGMODE == 65
        color =  vec3f(NdotV);
    #elif DEBUGMODE == 66 && defined(CLEARCOAT) && defined(CLEARCOAT_TINT)
        color = clearcoatOut.clearCoatColor;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 67 && defined(CLEARCOAT)
        color =  vec3f(clearcoatOut.clearCoatRoughness);
    #elif DEBUGMODE == 68 && defined(CLEARCOAT)
        color =  vec3f(clearcoatOut.clearCoatNdotV);
    #elif DEBUGMODE == 69 && defined(SUBSURFACE) && defined(SS_TRANSLUCENCY)
        color = subSurfaceOut.transmittance;
    #elif DEBUGMODE == 70 && defined(SUBSURFACE) && defined(SS_REFRACTION)
        color = subSurfaceOut.refractionTransmittance;
    #elif DEBUGMODE == 72
        color =  vec3f(microSurface);
    #elif DEBUGMODE == 73
        color = uniforms.vAlbedoColor.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 74 && !defined(METALLICWORKFLOW)
        color = uniforms.vReflectivityColor.rgb;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 75
        color = uniforms.vEmissiveColor;
        #define DEBUGMODE_GAMMA
// Misc
    #elif DEBUGMODE == 80 && defined(RADIANCEOCCLUSION)
        color =  vec3f(seo);
    #elif DEBUGMODE == 81 && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
        color =  vec3f(eho);
    #elif DEBUGMODE == 82 && defined(MS_BRDF_ENERGY_CONSERVATION)
        color =  vec3f(energyConservationFactor);
    #elif DEBUGMODE == 83 && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        color = specularEnvironmentReflectance;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 84 && defined(CLEARCOAT) && defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        color = clearcoatOut.clearCoatEnvironmentReflectance;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 85 && defined(SHEEN) && defined(REFLECTION)
        color = sheenOut.sheenEnvironmentReflectance;
        #define DEBUGMODE_GAMMA
    #elif DEBUGMODE == 86 && defined(ALPHABLEND)
        color =  vec3f(luminanceOverAlpha);
    #elif DEBUGMODE == 87
        color =  vec3f(alpha);
    #elif DEBUGMODE == 88 && defined(ALBEDO)
        color =  vec3f(albedoTexture.a);
    #elif DEBUGMODE == 89
        color = aoOut.ambientOcclusionColor;
    // Does Not Exist
    #else
        var stripeWidth: f32 = 30.;
        var stripePos: f32 = abs(floor(input.position.x / stripeWidth));
        var whichColor: f32 = ((stripePos)%(2.));
        var color1: vec3f =  vec3f(.6,.2,.2);
        var color2: vec3f =  vec3f(.3,.1,.1);
        color = mix(color1, color2, whichColor);
    #endif

    color *= uniforms.vDebugMode.y;
    #ifdef DEBUGMODE_NORMALIZE
        color = normalize(color) * 0.5 + 0.5;
    #endif
    #ifdef DEBUGMODE_GAMMA
        color = toGammaSpaceVec3(color);
    #endif

    fragmentOutputs.color = vec4f(color, 1.0);
    #ifdef PREPASS
        fragmentOutputs.fragData0 = toLinearSpaceVec3(color); // linear to cancel gamma transform in prepass
        fragmentOutputs.fragData1 = vec4f(0., 0., 0., 0.); // tag as no SSS
    #endif

    #ifdef DEBUGMODE_FORCERETURN
        return fragmentOutputs;
    #endif
}
#endif