struct clearcoatOutParams
{
    vec3 specularEnvironmentR0;
    float conservationFactor;
    vec3 clearCoatNormalW;
    vec2 clearCoatAARoughnessFactors;
    float clearCoatIntensity;
    float clearCoatRoughness;
#ifdef REFLECTION
    vec3 finalClearCoatRadianceScaled;
#endif
#ifdef CLEARCOAT_TINT
    vec3 absorption;
    float clearCoatNdotVRefract;
    vec3 clearCoatColor;
    float clearCoatThickness;
#endif
#if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
    vec3 energyConservationFactorClearCoat;
#endif
#if DEBUGMODE > 0
    #ifdef CLEARCOAT_BUMP
        mat3 TBNClearCoat;
    #endif
    #ifdef CLEARCOAT_TEXTURE
        vec2 clearCoatMapData;
    #endif
    #if defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
        vec4 clearCoatTintMapData;
    #endif
    #ifdef REFLECTION
        vec4 environmentClearCoatRadiance;
        vec3 clearCoatEnvironmentReflectance;
    #endif
    float clearCoatNdotV;
#endif
};

#ifdef CLEARCOAT
    #define pbr_inline
    #define inline
    clearcoatOutParams clearcoatBlock(
        in vec3 vPositionW
        , in vec3 geometricNormalW
        , in vec3 viewDirectionW
        , in vec2 vClearCoatParams
    #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
        , in vec4 clearCoatMapRoughnessData
    #endif
        , in vec3 specularEnvironmentR0
    #ifdef CLEARCOAT_TEXTURE
        , in vec2 clearCoatMapData
    #endif
    #ifdef CLEARCOAT_TINT
        , in vec4 vClearCoatTintParams
        , in float clearCoatColorAtDistance
        , in vec4 vClearCoatRefractionParams
        #ifdef CLEARCOAT_TINT_TEXTURE
            , in vec4 clearCoatTintMapData
        #endif
    #endif
    #ifdef CLEARCOAT_BUMP
        , in vec2 vClearCoatBumpInfos
        , in vec4 clearCoatBumpMapData
        , in vec2 vClearCoatBumpUV
        #if defined(TANGENT) && defined(NORMAL)
            , in mat3 vTBN
        #else
            , in vec2 vClearCoatTangentSpaceParams
        #endif
        #ifdef OBJECTSPACE_NORMALMAP
            , in mat4 normalMatrix
        #endif
    #endif
    #if defined(FORCENORMALFORWARD) && defined(NORMAL)
        , in vec3 faceNormal
    #endif
    #ifdef REFLECTION
        , in vec3 vReflectionMicrosurfaceInfos
        , in vec2 vReflectionInfos
        , in vec3 vReflectionColor
        , in vec4 vLightingIntensity
        #ifdef REFLECTIONMAP_3D
            , in samplerCube reflectionSampler
        #else
            , in sampler2D reflectionSampler
        #endif
        #ifndef LODBASEDMICROSFURACE
            #ifdef REFLECTIONMAP_3D
                , in samplerCube reflectionSamplerLow
                , in samplerCube reflectionSamplerHigh
            #else
                , in sampler2D reflectionSamplerLow
                , in sampler2D reflectionSamplerHigh
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            , in vec2 vReflectionFilteringInfo
        #endif
    #endif
    #if defined(CLEARCOAT_BUMP) || defined(TWOSIDEDLIGHTING)
        , in float frontFacingMultiplier
    #endif
    )
    {
        clearcoatOutParams outParams;
        // Clear COAT parameters.
        float clearCoatIntensity = vClearCoatParams.x;
        float clearCoatRoughness = vClearCoatParams.y;

        #ifdef CLEARCOAT_TEXTURE
            clearCoatIntensity *= clearCoatMapData.x;
            #ifdef CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE
                clearCoatRoughness *= clearCoatMapData.y;
            #endif
            #if DEBUGMODE > 0
                outParams.clearCoatMapData = clearCoatMapData;
            #endif
        #endif


        #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
           clearCoatRoughness *= clearCoatMapRoughnessData.y;
        #endif

        outParams.clearCoatIntensity = clearCoatIntensity;
        outParams.clearCoatRoughness = clearCoatRoughness;

        #ifdef CLEARCOAT_TINT
            vec3 clearCoatColor = vClearCoatTintParams.rgb;
            float clearCoatThickness = vClearCoatTintParams.a;

            #ifdef CLEARCOAT_TINT_TEXTURE
                #ifdef CLEARCOAT_TINT_GAMMATEXTURE
                    clearCoatColor *= toLinearSpace(clearCoatTintMapData.rgb);
                #else
                    clearCoatColor *= clearCoatTintMapData.rgb;
                #endif
                clearCoatThickness *= clearCoatTintMapData.a;
                #if DEBUGMODE > 0
                    outParams.clearCoatTintMapData = clearCoatTintMapData;
                #endif
            #endif

            outParams.clearCoatColor = computeColorAtDistanceInMedia(clearCoatColor, clearCoatColorAtDistance);
            outParams.clearCoatThickness = clearCoatThickness;
        #endif

        // remapping and linearization of clear coat roughness
        // Let s see how it ends up in gltf
        // clearCoatRoughness = mix(0.089, 0.6, clearCoatRoughness);

        // Remap F0 to account for the change of interface within the material.
        #ifdef CLEARCOAT_REMAP_F0
            vec3 specularEnvironmentR0Updated = getR0RemappedForClearCoat(specularEnvironmentR0);
        #else
            vec3 specularEnvironmentR0Updated = specularEnvironmentR0;
        #endif
        outParams.specularEnvironmentR0 = mix(specularEnvironmentR0, specularEnvironmentR0Updated, clearCoatIntensity);

        // Needs to use the geometric normal before bump for this.
        vec3 clearCoatNormalW = geometricNormalW;

        #ifdef CLEARCOAT_BUMP
            #ifdef NORMALXYSCALE
                float clearCoatNormalScale = 1.0;
            #else
                float clearCoatNormalScale = vClearCoatBumpInfos.y;
            #endif

            #if defined(TANGENT) && defined(NORMAL)
                mat3 TBNClearCoat = vTBN;
            #else
                // flip the uv for the backface
                vec2 TBNClearCoatUV = vClearCoatBumpUV * frontFacingMultiplier;
                mat3 TBNClearCoat = cotangent_frame(clearCoatNormalW * clearCoatNormalScale, vPositionW, TBNClearCoatUV, vClearCoatTangentSpaceParams);
            #endif

            #if DEBUGMODE > 0
                outParams.TBNClearCoat = TBNClearCoat;
            #endif

            #ifdef OBJECTSPACE_NORMALMAP
                clearCoatNormalW = normalize(clearCoatBumpMapData.xyz  * 2.0 - 1.0);
                clearCoatNormalW = normalize(mat3(normalMatrix) * clearCoatNormalW);
            #else
                clearCoatNormalW = perturbNormal(TBNClearCoat, clearCoatBumpMapData.xyz, vClearCoatBumpInfos.y);
            #endif
        #endif

        #if defined(FORCENORMALFORWARD) && defined(NORMAL)
            clearCoatNormalW *= sign(dot(clearCoatNormalW, faceNormal));
        #endif

        #if defined(TWOSIDEDLIGHTING) && defined(NORMAL)
            clearCoatNormalW = clearCoatNormalW * frontFacingMultiplier;
        #endif

        outParams.clearCoatNormalW = clearCoatNormalW;

        // Clear Coat AA
        outParams.clearCoatAARoughnessFactors = getAARoughnessFactors(clearCoatNormalW.xyz);

        // Compute N dot V.
        float clearCoatNdotVUnclamped = dot(clearCoatNormalW, viewDirectionW);
        // The order 1886 page 3.
        float clearCoatNdotV = absEps(clearCoatNdotVUnclamped);

        #if DEBUGMODE > 0
            outParams.clearCoatNdotV = clearCoatNdotV;
        #endif

        #ifdef CLEARCOAT_TINT
            // Used later on in the light fragment and ibl.
            vec3 clearCoatVRefract = refract(-viewDirectionW, clearCoatNormalW, vClearCoatRefractionParams.y);
            // The order 1886 page 3.
            outParams.clearCoatNdotVRefract = absEps(dot(clearCoatNormalW, clearCoatVRefract));
        #endif

        #if defined(ENVIRONMENTBRDF) && (!defined(REFLECTIONMAP_SKYBOX) || defined(MS_BRDF_ENERGY_CONSERVATION))
            // BRDF Lookup
            vec3 environmentClearCoatBrdf = getBRDFLookup(clearCoatNdotV, clearCoatRoughness);
        #endif

        // Clear Coat Reflection
        #if defined(REFLECTION)
            float clearCoatAlphaG = convertRoughnessToAverageSlope(clearCoatRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                clearCoatAlphaG += outParams.clearCoatAARoughnessFactors.y;
            #endif

            vec4 environmentClearCoatRadiance = vec4(0., 0., 0., 0.);

            vec3 clearCoatReflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), clearCoatNormalW);
            #ifdef REFLECTIONMAP_OPPOSITEZ
                clearCoatReflectionVector.z *= -1.0;
            #endif

            // _____________________________ 2D vs 3D Maps ________________________________
            #ifdef REFLECTIONMAP_3D
                vec3 clearCoatReflectionCoords = clearCoatReflectionVector;
            #else
                vec2 clearCoatReflectionCoords = clearCoatReflectionVector.xy;
                #ifdef REFLECTIONMAP_PROJECTION
                    clearCoatReflectionCoords /= clearCoatReflectionVector.z;
                #endif
                clearCoatReflectionCoords.y = 1.0 - clearCoatReflectionCoords.y;
            #endif

            sampleReflectionTexture(
                clearCoatAlphaG,
                vReflectionMicrosurfaceInfos,
                vReflectionInfos,
                vReflectionColor,
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                clearCoatNdotVUnclamped,
            #endif
            #ifdef LINEARSPECULARREFLECTION
                clearCoatRoughness,
            #endif
                reflectionSampler,
                clearCoatReflectionCoords,
            #ifndef LODBASEDMICROSFURACE
                reflectionSamplerLow,
                reflectionSamplerHigh,
            #endif
            #ifdef REALTIME_FILTERING
                vReflectionFilteringInfo,
            #endif
                environmentClearCoatRadiance
            );

            #if DEBUGMODE > 0
                outParams.environmentClearCoatRadiance = environmentClearCoatRadiance;
            #endif

            // _________________________ Clear Coat Environment Oclusion __________________________
            #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
                vec3 clearCoatEnvironmentReflectance = getReflectanceFromBRDFLookup(vec3(vClearCoatRefractionParams.x), environmentClearCoatBrdf);

                #ifdef HORIZONOCCLUSION
                    #ifdef BUMP
                        #ifdef REFLECTIONMAP_3D
                            float clearCoatEho = environmentHorizonOcclusion(-viewDirectionW, clearCoatNormalW, geometricNormalW);
                            clearCoatEnvironmentReflectance *= clearCoatEho;
                        #endif
                    #endif
                #endif
            #else
                // Jones implementation of a well balanced fast analytical solution.
                vec3 clearCoatEnvironmentReflectance = getReflectanceFromAnalyticalBRDFLookup_Jones(clearCoatNdotV, vec3(1.), vec3(1.), sqrt(1. - clearCoatRoughness));
            #endif

            clearCoatEnvironmentReflectance *= clearCoatIntensity;

            #if DEBUGMODE > 0
                outParams.clearCoatEnvironmentReflectance = clearCoatEnvironmentReflectance;
            #endif

            outParams.finalClearCoatRadianceScaled = 
                environmentClearCoatRadiance.rgb *
                clearCoatEnvironmentReflectance *
                vLightingIntensity.z;
        #endif

        #if defined(CLEARCOAT_TINT)
            // NdotL = NdotV in IBL
            outParams.absorption = computeClearCoatAbsorption(outParams.clearCoatNdotVRefract, outParams.clearCoatNdotVRefract, outParams.clearCoatColor, clearCoatThickness, clearCoatIntensity);
        #endif

        // clear coat energy conservation
        float fresnelIBLClearCoat = fresnelSchlickGGX(clearCoatNdotV, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnelIBLClearCoat *= clearCoatIntensity;

        outParams.conservationFactor = (1. - fresnelIBLClearCoat);

        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            outParams.energyConservationFactorClearCoat = getEnergyConservationFactor(outParams.specularEnvironmentR0, environmentClearCoatBrdf);
        #endif

        return outParams;
    }
#endif
