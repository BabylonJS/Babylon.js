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
    mat3 TBNClearCoat;
    vec2 clearCoatMapData;
    vec4 clearCoatTintMapData;
    vec4 environmentClearCoatRadiance;
    float clearCoatNdotV;
    vec3 clearCoatEnvironmentReflectance;
#endif
};

#ifdef CLEARCOAT
    #define inline
    void clearcoatBlock(
        const in vec3 vPositionW,
        const in vec3 geometricNormalW,
        const in vec3 viewDirectionW,
        const in vec2 vClearCoatParams,
        const in vec3 specularEnvironmentR0,
    #ifdef CLEARCOAT_TEXTURE
        const in vec2 clearCoatMapData,
    #endif
    #ifdef CLEARCOAT_TINT
        const in vec4 vClearCoatTintParams,
        const in float clearCoatColorAtDistance,
        const in vec4 vClearCoatRefractionParams,
        #ifdef CLEARCOAT_TINT_TEXTURE
            const in vec4 clearCoatTintMapData,
        #endif
    #endif
    #ifdef CLEARCOAT_BUMP
        const in vec2 vClearCoatBumpInfos,
        const in vec4 clearCoatBumpMapData,
        const in vec2 vClearCoatBumpUV,
        #if defined(TANGENT) && defined(NORMAL)
            const in mat3 vTBN,
        #else
            const in vec2 vClearCoatTangentSpaceParams,
        #endif
        #ifdef OBJECTSPACE_NORMALMAP
            const in mat4 normalMatrix,
        #endif
    #endif
    #if defined(FORCENORMALFORWARD) && defined(NORMAL)
        const in vec3 faceNormal,
    #endif
    #ifdef REFLECTION
        const in vec3 vReflectionMicrosurfaceInfos,
        const in vec2 vReflectionInfos,
        const in vec3 vReflectionColor,
        const in vec4 vLightingIntensity,
        #ifdef REFLECTIONMAP_3D
            const in samplerCube reflectionSampler,
        #else
            const in sampler2D reflectionSampler,
        #endif
        #ifndef LODBASEDMICROSFURACE
            #ifdef REFLECTIONMAP_3D
                const in samplerCube reflectionSamplerLow,
                const in samplerCube reflectionSamplerHigh,
            #else
                const in sampler2D reflectionSamplerLow,
                const in sampler2D reflectionSamplerHigh,
            #endif
        #endif
    #endif
    #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        #ifdef RADIANCEOCCLUSION
            const in float ambientMonochrome,
        #endif
    #endif
        out clearcoatOutParams outParams
    )
    {
        // Clear COAT parameters.
        float clearCoatIntensity = vClearCoatParams.x;
        float clearCoatRoughness = vClearCoatParams.y;

        #ifdef CLEARCOAT_TEXTURE
            clearCoatIntensity *= clearCoatMapData.x;
            clearCoatRoughness *= clearCoatMapData.y;
            #if DEBUGMODE > 0
                outParams.clearCoatMapData = clearCoatMapData;
            #endif
        #endif

        outParams.clearCoatIntensity = clearCoatIntensity;
        outParams.clearCoatRoughness = clearCoatRoughness;

        #ifdef CLEARCOAT_TINT
            vec3 clearCoatColor = vClearCoatTintParams.rgb;
            float clearCoatThickness = vClearCoatTintParams.a;

            #ifdef CLEARCOAT_TINT_TEXTURE
                clearCoatColor *= clearCoatTintMapData.rgb;
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
        vec3 specularEnvironmentR0Updated = getR0RemappedForClearCoat(specularEnvironmentR0);
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
                mat3 TBNClearCoat = cotangent_frame(clearCoatNormalW * clearCoatNormalScale, vPositionW, vClearCoatBumpUV, vClearCoatTangentSpaceParams);
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
            clearCoatNormalW = gl_FrontFacing ? clearCoatNormalW : -clearCoatNormalW;
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
            vec3 clearCoatVRefract = -refract(vPositionW, clearCoatNormalW, vClearCoatRefractionParams.y);
            // The order 1886 page 3.
            outParams.clearCoatNdotVRefract = absEps(dot(clearCoatNormalW, clearCoatVRefract));
        #endif

        #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
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
                environmentClearCoatRadiance
            );

            #if DEBUGMODE > 0
                outParams.environmentClearCoatRadiance = environmentClearCoatRadiance;
            #endif

            // _________________________ Clear Coat Environment Oclusion __________________________
            #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
                vec3 clearCoatEnvironmentReflectance = getReflectanceFromBRDFLookup(vec3(vClearCoatRefractionParams.x), environmentClearCoatBrdf);

                #ifdef RADIANCEOCCLUSION
                    float clearCoatSeo = environmentRadianceOcclusion(ambientMonochrome, clearCoatNdotVUnclamped);
                    clearCoatEnvironmentReflectance *= clearCoatSeo;
                #endif

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
    }
#endif
