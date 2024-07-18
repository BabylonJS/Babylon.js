struct clearcoatOutParams
{
    var specularEnvironmentR0: vec3f;
    var conservationFactor: f32;
    var clearCoatNormalW: vec3f;
    var clearCoatAARoughnessFactors: vec2f;
    var clearCoatIntensity: f32;
    var clearCoatRoughness: f32;
#ifdef REFLECTION
    var finalClearCoatRadianceScaled: vec3f;
#endif
#ifdef CLEARCOAT_TINT
    var absorption: vec3f;
    var clearCoatNdotVRefract: f32;
    var clearCoatColor: vec3f;
    var clearCoatThickness: f32;
#endif
#if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
    var energyConservationFactorClearCoat: vec3f;
#endif
#if DEBUGMODE > 0
    #ifdef CLEARCOAT_BUMP
        var TBNClearCoat: mat3x3f;
    #endif
    #ifdef CLEARCOAT_TEXTURE
        var clearCoatMapData: vec2f;
    #endif
    #if defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
        var clearCoatTintMapData: vec4f;
    #endif
    #ifdef REFLECTION
        var environmentClearCoatRadiance: vec4f;
        var clearCoatEnvironmentReflectance: vec3f;
    #endif
    var clearCoatNdotV: f32;
#endif
};

#ifdef CLEARCOAT
    #define pbr_inline
    #define inline
    var clearcoatBlock: voidnull(
        in var vPositionW: vec3f,
        in var geometricNormalW: vec3f,
        in var viewDirectionW: vec3f,
        in var vClearCoatParams: vec2f,
    #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
        in var clearCoatMapRoughnessData: vec4f,
    #endif
        in var specularEnvironmentR0: vec3f,
    #ifdef CLEARCOAT_TEXTURE
        in var clearCoatMapData: vec2f,
    #endif
    #ifdef CLEARCOAT_TINT
        in var vClearCoatTintParams: vec4f,
        in var clearCoatColorAtDistance: f32,
        in var vClearCoatRefractionParams: vec4f,
        #ifdef CLEARCOAT_TINT_TEXTURE
            in var clearCoatTintMapData: vec4f,
        #endif
    #endif
    #ifdef CLEARCOAT_BUMP
        in var vClearCoatBumpInfos: vec2f,
        in var clearCoatBumpMapData: vec4f,
        in var vClearCoatBumpUV: vec2f,
        #if defined(TANGENT) && defined(NORMAL)
            in var vTBN: mat3x3f,
        #else
            in var vClearCoatTangentSpaceParams: vec2f,
        #endif
        #ifdef OBJECTSPACE_NORMALMAP
            in var normalMatrix: mat4x4f,
        #endif
    #endif
    #if defined(FORCENORMALFORWARD) && defined(NORMAL)
        in var faceNormal: vec3f,
    #endif
    #ifdef REFLECTION
        in var vReflectionMicrosurfaceInfos: vec3f,
        in var vReflectionInfos: vec2f,
        in var vReflectionColor: vec3f,
        in var vLightingIntensity: vec4f,
        #ifdef REFLECTIONMAP_3D
            in samplerCube reflectionSampler,
        #else
            in sampler2D reflectionSampler,
        #endif
        #ifndef LODBASEDMICROSFURACE
            #ifdef REFLECTIONMAP_3D
                in samplerCube reflectionSamplerLow,
                in samplerCube reflectionSamplerHigh,
            #else
                in sampler2D reflectionSamplerLow,
                in sampler2D reflectionSamplerHigh,
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            in var vReflectionFilteringInfo: vec2f,
        #endif
    #endif
    #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
        #ifdef RADIANCEOCCLUSION
            in var ambientMonochrome: f32,
        #endif
    #endif
    #if defined(CLEARCOAT_BUMP) || defined(TWOSIDEDLIGHTING)
        in var frontFacingMultiplier: f32,
    #endif
        out clearcoatOutParams outParams
    )
    {
        // Clear COAT parameters.
        var clearCoatIntensity: f32 = vClearCoatParams.x;
        var clearCoatRoughness: f32 = vClearCoatParams.y;

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
            var clearCoatColor: vec3f = vClearCoatTintParams.rgb;
            var clearCoatThickness: f32 = vClearCoatTintParams.a;

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
            var specularEnvironmentR0Updated: vec3f = getR0RemappedForClearCoat(specularEnvironmentR0);
        #else
            var specularEnvironmentR0Updated: vec3f = specularEnvironmentR0;
        #endif
        outParams.specularEnvironmentR0 = mix(specularEnvironmentR0, specularEnvironmentR0Updated, clearCoatIntensity);

        // Needs to use the geometric normal before bump for this.
        var clearCoatNormalW: vec3f = geometricNormalW;

        #ifdef CLEARCOAT_BUMP
            #ifdef NORMALXYSCALE
                var clearCoatNormalScale: f32 = 1.0;
            #else
                var clearCoatNormalScale: f32 = vClearCoatBumpInfos.y;
            #endif

            #if defined(TANGENT) && defined(NORMAL)
                var TBNClearCoat: mat3x3f = vTBN;
            #else
                // flip the uv for the backface
                var TBNClearCoatUV: vec2f = vClearCoatBumpUV * frontFacingMultiplier;
                var TBNClearCoat: mat3x3f = cotangent_frame(clearCoatNormalW * clearCoatNormalScale, vPositionW, TBNClearCoatUV, vClearCoatTangentSpaceParams);
            #endif

            #if DEBUGMODE > 0
                outParams.TBNClearCoat = TBNClearCoat;
            #endif

            #ifdef OBJECTSPACE_NORMALMAP
                clearCoatNormalW = normalize(clearCoatBumpMapData.xyz  * 2.0 - 1.0);
                clearCoatNormalW = normalize( mat3x3f(normalMatrix) * clearCoatNormalW);
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
        var clearCoatNdotVUnclamped: f32 = dot(clearCoatNormalW, viewDirectionW);
        // The order 1886 page 3.
        var clearCoatNdotV: f32 = absEps(clearCoatNdotVUnclamped);

        #if DEBUGMODE > 0
            outParams.clearCoatNdotV = clearCoatNdotV;
        #endif

        #ifdef CLEARCOAT_TINT
            // Used later on in the light fragment and ibl.
            var clearCoatVRefract: vec3f = refract(-viewDirectionW, clearCoatNormalW, vClearCoatRefractionParams.y);
            // The order 1886 page 3.
            outParams.clearCoatNdotVRefract = absEps(dot(clearCoatNormalW, clearCoatVRefract));
        #endif

        #if defined(ENVIRONMENTBRDF) && (!defined(REFLECTIONMAP_SKYBOX) || defined(MS_BRDF_ENERGY_CONSERVATION))
            // BRDF Lookup
            var environmentClearCoatBrdf: vec3f = getBRDFLookup(clearCoatNdotV, clearCoatRoughness);
        #endif

        // Clear Coat Reflection
        #if defined(REFLECTION)
            var clearCoatAlphaG: f32 = convertRoughnessToAverageSlope(clearCoatRoughness);

            #ifdef SPECULARAA
                // Adapt linear roughness (alphaG) to geometric curvature of the current pixel.
                clearCoatAlphaG += outParams.clearCoatAARoughnessFactors.y;
            #endif

            var environmentClearCoatRadiance: vec4f =  vec4f(0., 0., 0., 0.);

            var clearCoatReflectionVector: vec3f = computeReflectionCoords( vec4f(vPositionW, 1.0), clearCoatNormalW);
            #ifdef REFLECTIONMAP_OPPOSITEZ
                clearCoatReflectionVector.z *= -1.0;
            #endif

            // _____________________________ 2D vs 3D Maps ________________________________
            #ifdef REFLECTIONMAP_3D
                var clearCoatReflectionCoords: vec3f = clearCoatReflectionVector;
            #else
                var clearCoatReflectionCoords: vec2f = clearCoatReflectionVector.xy;
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
                var clearCoatEnvironmentReflectance: vec3f = getReflectanceFromBRDFLookup( vec3f(vClearCoatRefractionParams.x), environmentClearCoatBrdf);

                #ifdef HORIZONOCCLUSION
                    #ifdef BUMP
                        #ifdef REFLECTIONMAP_3D
                            var clearCoatEho: f32 = environmentHorizonOcclusion(-viewDirectionW, clearCoatNormalW, geometricNormalW);
                            clearCoatEnvironmentReflectance *= clearCoatEho;
                        #endif
                    #endif
                #endif
            #else
                // Jones implementation of a well balanced fast analytical solution.
                var clearCoatEnvironmentReflectance: vec3f = getReflectanceFromAnalyticalBRDFLookup_Jones(clearCoatNdotV,  vec3f(1.),  vec3f(1.), sqrt(1. - clearCoatRoughness));
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
        var fresnelIBLClearCoat: f32 = fresnelSchlickGGX(clearCoatNdotV, vClearCoatRefractionParams.x, CLEARCOATREFLECTANCE90);
        fresnelIBLClearCoat *= clearCoatIntensity;

        outParams.conservationFactor = (1. - fresnelIBLClearCoat);

        #if defined(ENVIRONMENTBRDF) && defined(MS_BRDF_ENERGY_CONSERVATION)
            outParams.energyConservationFactorClearCoat = getEnergyConservationFactor(outParams.specularEnvironmentR0, environmentClearCoatBrdf);
        #endif
    }
#endif
