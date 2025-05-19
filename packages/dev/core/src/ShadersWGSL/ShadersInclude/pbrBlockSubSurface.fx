struct subSurfaceOutParams
{
    specularEnvironmentReflectance: vec3f,
#ifdef SS_REFRACTION
    finalRefraction: vec3f,
    surfaceAlbedo: vec3f,
    #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
        alpha: f32,
    #endif
    refractionOpacity: f32,
#endif
#ifdef SS_TRANSLUCENCY
    transmittance: vec3f,
    translucencyIntensity: f32,
    #ifdef REFLECTION
        refractionIrradiance: vec3f,
    #endif
#endif
#if DEBUGMODE > 0
    #ifdef SS_THICKNESSANDMASK_TEXTURE
        thicknessMap: vec4f,
    #endif
    #ifdef SS_REFRACTION
        environmentRefraction: vec4f,
        refractionTransmittance: vec3f
    #endif
#endif
};

#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        #define pbr_inline
        fn sampleEnvironmentRefraction(
            ior: f32
            , thickness: f32
            , refractionLOD: f32
            , normalW: vec3f
            , vPositionW: vec3f
            , viewDirectionW: vec3f
            , view: mat4x4f
            , vRefractionInfos: vec4f
            , refractionMatrix: mat4x4f
            , vRefractionMicrosurfaceInfos: vec4f
            , alphaG: f32
            #ifdef SS_REFRACTIONMAP_3D
                , refractionSampler: texture_cube<f32>
                , refractionSamplerSampler: sampler
                #ifndef LODBASEDMICROSFURACE
                    , refractionLowSampler: texture_cube<f32>
                    , refractionLowSamplerSampler: sampler
                    , refractionHighSampler: texture_cube<f32>
                    , refractionHighSamplerSampler: sampler                    
                #endif
            #else
                , refractionSampler: texture_2d<f32>
                , refractionSamplerSampler: sampler
                #ifndef LODBASEDMICROSFURACE
                    , refractionLowSampler: texture_2d<f32>
                    , refractionLowSamplerSampler: sampler
                    , refractionHighSampler: texture_2d<f32>
                    , refractionHighSamplerSampler: sampler   
                #endif
            #endif
            #ifdef ANISOTROPIC
                , anisotropicOut: anisotropicOutParams
            #endif
            #ifdef REALTIME_FILTERING
                , vRefractionFilteringInfo: vec2f
            #endif
            #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                , refractionPosition: vec3f
                , refractionSize: vec3f
            #endif
        ) -> vec4f {
            var environmentRefraction: vec4f =  vec4f(0., 0., 0., 0.);
            #ifdef ANISOTROPIC
                var refractionVector: vec3f = refract(-viewDirectionW, anisotropicOut.anisotropicNormal, ior);
            #else
                var refractionVector: vec3f = refract(-viewDirectionW, normalW, ior);
            #endif

            #ifdef SS_REFRACTIONMAP_OPPOSITEZ
                refractionVector.z *= -1.0;
            #endif

            // _____________________________ 2D vs 3D Maps ________________________________
            #ifdef SS_REFRACTIONMAP_3D
                #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                    refractionVector = parallaxCorrectNormal(vPositionW, refractionVector, refractionSize, refractionPosition);
                #endif
                refractionVector.y = refractionVector.y * vRefractionInfos.w;
                var refractionCoords: vec3f = refractionVector;
                refractionCoords =  (refractionMatrix *  vec4f(refractionCoords, 0)).xyz;
            #else
                #ifdef SS_USE_THICKNESS_AS_DEPTH
                    var vRefractionUVW: vec3f =  (refractionMatrix * (view *  vec4f(vPositionW + refractionVector * thickness, 1.0))).xyz;
                #else
                    var vRefractionUVW: vec3f =  (refractionMatrix * (view *  vec4f(vPositionW + refractionVector * vRefractionInfos.z, 1.0))).xyz;
                #endif
                var refractionCoords: vec2f = vRefractionUVW.xy / vRefractionUVW.z;
                refractionCoords.y = 1.0 - refractionCoords.y;
            #endif
            
            #ifdef LODBASEDMICROSFURACE
                // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
                var lod = refractionLOD * vRefractionMicrosurfaceInfos.y + vRefractionMicrosurfaceInfos.z;

                #ifdef SS_LODINREFRACTIONALPHA
                    // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
                    // is constrained to appropriate LOD levels in order to prevent aliasing.
                    // The environment map is first sampled without custom LOD selection to determine
                    // the hardware-selected LOD, and this is then used to constrain the final LOD selection
                    // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
                    // where the normal is varying rapidly).

                    // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
                    // manual calculation via derivatives is also possible, but for simplicity we use the 
                    // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
                    var automaticRefractionLOD: f32 = UNPACK_LOD(textureSample(refractionSampler, refractionSamplerSampler, refractionCoords).a);
                    var requestedRefractionLOD: f32 = max(automaticRefractionLOD, lod);
                #else
                    var requestedRefractionLOD: f32 = lod;
                #endif

                #if defined(REALTIME_FILTERING) && defined(SS_REFRACTIONMAP_3D)
                    environmentRefraction =  vec4f(radiance(alphaG, refractionSampler, refractionSamplerSampler, refractionCoords, vRefractionFilteringInfo), 1.0);
                #else
                    environmentRefraction = textureSampleLevel(refractionSampler, refractionSamplerSampler, refractionCoords, requestedRefractionLOD);
                #endif
            #else
                var lodRefractionNormalized: f32 = saturate(refractionLOD / log2(vRefractionMicrosurfaceInfos.x));
                var lodRefractionNormalizedDoubled: f32 = lodRefractionNormalized * 2.0;

                var environmentRefractionMid: vec4f = textureSample(refractionSampler, refractionSamplerSampler, refractionCoords);
                if (lodRefractionNormalizedDoubled < 1.0){
                    environmentRefraction = mix(
                        textureSample(refractionHighSampler, refractionHighSamplerSampler, refractionCoords),
                        environmentRefractionMid,
                        lodRefractionNormalizedDoubled
                    );
                } else {
                    environmentRefraction = mix(
                        environmentRefractionMid,
                        textureSample(refractionLowSampler, refractionLowSamplerSampler, refractionCoords),
                        lodRefractionNormalizedDoubled - 1.0
                    );
                }
            #endif

            var refraction = environmentRefraction.rgb;

            #ifdef SS_RGBDREFRACTION
                refraction = fromRGBD(environmentRefraction);
            #endif

            #ifdef SS_GAMMAREFRACTION
                refraction = toLinearSpaceVec3(environmentRefraction.rgb);
            #endif

            return vec4f(refraction, environmentRefraction.a);
        }
    #endif
    #define pbr_inline
    fn subSurfaceBlock(
        vSubSurfaceIntensity: vec3f
        , vThicknessParam: vec2f
        , vTintColor: vec4f
        , normalW: vec3f
        , specularEnvironmentReflectance: vec3f
    #ifdef SS_THICKNESSANDMASK_TEXTURE
        , thicknessMap: vec4f
    #endif
    #ifdef SS_REFRACTIONINTENSITY_TEXTURE
        , refractionIntensityMap: vec4f
    #endif
    #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
        , translucencyIntensityMap: vec4f
    #endif
    #ifdef REFLECTION
        #ifdef SS_TRANSLUCENCY
            , reflectionMatrix: mat4x4f
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                    , irradianceVector_: vec3f
                #endif
                #if defined(REALTIME_FILTERING)
                    , reflectionSampler: texture_cube<f32>
                    , reflectionSamplerSampler: sampler
                    , vReflectionFilteringInfo: vec2f
                    #ifdef IBL_CDF_FILTERING
                        , icdfSampler: texture_2d<f32>
                        , icdfSamplerSampler: sampler
                    #endif
                #endif
            #endif
            #ifdef USEIRRADIANCEMAP
                #ifdef REFLECTIONMAP_3D
                    , irradianceSampler: texture_cube<f32>
                    , irradianceSamplerSampler: sampler
                #else
                    , irradianceSampler: texture_2d<f32>
                    , irradianceSamplerSampler: sampler
                #endif
            #endif
        #endif
    #endif
    #if defined(SS_REFRACTION) || defined(SS_TRANSLUCENCY)
        , surfaceAlbedo: vec3f
    #endif
    #ifdef SS_REFRACTION
        , vPositionW: vec3f
        , viewDirectionW: vec3f
        , view: mat4x4f
        , vRefractionInfos: vec4f
        , refractionMatrix: mat4x4f
        , vRefractionMicrosurfaceInfos: vec4f
        , vLightingIntensity: vec4f
        #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
            , alpha: f32
        #endif
        #ifdef SS_LODINREFRACTIONALPHA
            , NdotVUnclamped: f32
        #endif
        #ifdef SS_LINEARSPECULARREFRACTION
            , roughness: f32
        #endif
        , alphaG: f32
        #ifdef SS_REFRACTIONMAP_3D
            , refractionSampler: texture_cube<f32>
            , refractionSamplerSampler: sampler
            #ifndef LODBASEDMICROSFURACE
                , refractionLowSampler: texture_cube<f32>
                , refractionLowSamplerSampler: sampler
                , refractionHighSampler: texture_cube<f32>
                , refractionHighSamplerSampler: sampler  
            #endif
        #else
            , refractionSampler: texture_2d<f32>
            , refractionSamplerSampler: sampler
            #ifndef LODBASEDMICROSFURACE
                , refractionLowSampler: texture_2d<f32>
                , refractionLowSamplerSampler: sampler
                , refractionHighSampler: texture_2d<f32>
                , refractionHighSamplerSampler: sampler  
            #endif
        #endif
        #ifdef ANISOTROPIC
            , anisotropicOut: anisotropicOutParams
        #endif
        #ifdef REALTIME_FILTERING
            , vRefractionFilteringInfo: vec2f
        #endif
        #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
            , refractionPosition: vec3f
            , refractionSize: vec3f
        #endif
        #ifdef SS_DISPERSION
            , dispersion: f32
        #endif
    #endif
    #ifdef SS_TRANSLUCENCY
        , vDiffusionDistance: vec3f
        , vTranslucencyColor: vec4f
        #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
            , translucencyColorMap: vec4f
        #endif
    #endif
    ) -> subSurfaceOutParams
    {
        var outParams: subSurfaceOutParams;
        outParams.specularEnvironmentReflectance = specularEnvironmentReflectance;

    // ______________________________________________________________________________________
    // _____________________________ Intensities & thickness ________________________________
    // ______________________________________________________________________________________
    #ifdef SS_REFRACTION
        var refractionIntensity: f32 = vSubSurfaceIntensity.x;
        #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
            refractionIntensity *= (1.0 - alpha);
            // Put alpha back to 1;
            outParams.alpha = 1.0;
        #endif
    #endif

    #ifdef SS_TRANSLUCENCY
        var translucencyIntensity: f32 = vSubSurfaceIntensity.y;
    #endif

    #ifdef SS_THICKNESSANDMASK_TEXTURE
        #ifdef SS_USE_GLTF_TEXTURES
            var thickness: f32 = thicknessMap.g * vThicknessParam.y + vThicknessParam.x;
        #else
            var thickness: f32 = thicknessMap.r * vThicknessParam.y + vThicknessParam.x;
        #endif

        #if DEBUGMODE > 0
            outParams.thicknessMap = thicknessMap;
        #endif

        #if defined(SS_REFRACTION) && defined(SS_REFRACTION_USE_INTENSITY_FROM_THICKNESS)
            #ifdef SS_USE_GLTF_TEXTURES
                refractionIntensity *= thicknessMap.r;
            #else
                refractionIntensity *= thicknessMap.g;
            #endif
        #endif

        #if defined(SS_TRANSLUCENCY) && defined(SS_TRANSLUCENCY_USE_INTENSITY_FROM_THICKNESS)
            #ifdef SS_USE_GLTF_TEXTURES
                translucencyIntensity *= thicknessMap.a;
            #else
                translucencyIntensity *= thicknessMap.b;
            #endif
        #endif
    #else
        var thickness: f32 = vThicknessParam.y;
    #endif

    #if defined(SS_REFRACTION) && defined(SS_REFRACTIONINTENSITY_TEXTURE)
        #ifdef SS_USE_GLTF_TEXTURES
            refractionIntensity *= refractionIntensityMap.r;
        #else
            refractionIntensity *= refractionIntensityMap.g;
        #endif
    #endif

    #if defined(SS_TRANSLUCENCY) && defined(SS_TRANSLUCENCYINTENSITY_TEXTURE)
        #ifdef SS_USE_GLTF_TEXTURES
            translucencyIntensity *= translucencyIntensityMap.a;
        #else
            translucencyIntensity *= translucencyIntensityMap.b;
        #endif
    #endif

    // _________________________________________________________________________________________
    // _____________________________ Translucency transmittance ________________________________
    // _________________________________________________________________________________________
    #ifdef SS_TRANSLUCENCY
        thickness = maxEps(thickness);
        var translucencyColor: vec4f = vTranslucencyColor;
        #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
            translucencyColor *= translucencyColorMap;
        #endif

        var transmittance: vec3f = transmittanceBRDF_Burley(translucencyColor.rgb, vDiffusionDistance, thickness);
        transmittance *= translucencyIntensity;
        outParams.transmittance = transmittance;
        outParams.translucencyIntensity = translucencyIntensity;
    #endif

    // _____________________________________________________________________________________
    // _____________________________ Refraction environment ________________________________
    // _____________________________________________________________________________________
    #ifdef SS_REFRACTION
        var environmentRefraction: vec4f =  vec4f(0., 0., 0., 0.);

        // vRefractionInfos.y is the IOR of the volume.
        // vRefractionMicrosurfaceInfos.w is the IOR of the surface.
        #ifdef SS_HAS_THICKNESS
            var ior: f32 = vRefractionInfos.y;
        #else
            var ior: f32 = vRefractionMicrosurfaceInfos.w;
        #endif
        // Scale roughness with IOR so that an IOR of 1.0 results in no microfacet refraction and
        // an IOR of 1.5 results in the default amount of microfacet refraction.
        #ifdef SS_LODINREFRACTIONALPHA
            var refractionAlphaG: f32 = alphaG;
            refractionAlphaG = mix(alphaG, 0.0, clamp(ior * 3.0 - 2.0, 0.0, 1.0));
            var refractionLOD: f32 = getLodFromAlphaGNdotV(vRefractionMicrosurfaceInfos.x, refractionAlphaG, NdotVUnclamped);
        #elif defined(SS_LINEARSPECULARREFRACTION)
            var refractionRoughness: f32 = alphaG;
            refractionRoughness = mix(alphaG, 0.0, clamp(ior * 3.0 - 2.0, 0.0, 1.0));
            var refractionLOD: f32 = getLinearLodFromRoughness(vRefractionMicrosurfaceInfos.x, refractionRoughness);
        #else
            var refractionAlphaG: f32 = alphaG;
            refractionAlphaG = mix(alphaG, 0.0, clamp(ior * 3.0 - 2.0, 0.0, 1.0));
            var refractionLOD: f32 = getLodFromAlphaG(vRefractionMicrosurfaceInfos.x, refractionAlphaG);
        #endif

        var refraction_ior: f32 = vRefractionInfos.y;
        #ifdef SS_DISPERSION
            var realIOR: f32 = 1.0 / refraction_ior;
            // The 0.04 value is completely empirical
            var iorDispersionSpread: f32 = 0.04 * dispersion * (realIOR - 1.0);
            var iors: vec3f =  vec3f(1.0/(realIOR - iorDispersionSpread), refraction_ior, 1.0/(realIOR + iorDispersionSpread));
            for (var i: i32 = 0; i < 3; i++) {
                refraction_ior = iors[i];
        #endif
                var envSample: vec4f = sampleEnvironmentRefraction(refraction_ior, thickness, refractionLOD, normalW, vPositionW, viewDirectionW, view, vRefractionInfos, refractionMatrix, vRefractionMicrosurfaceInfos, alphaG
                #ifdef SS_REFRACTIONMAP_3D
                    , refractionSampler
                    , refractionSamplerSampler
                    #ifndef LODBASEDMICROSFURACE
                        , refractionLowSampler
                        , refractionLowSamplerSampler
                        , refractionHighSampler
                        , refractionHighSamplerSampler
                    #endif
                #else
                    , refractionSampler
                    , refractionSamplerSampler
                    #ifndef LODBASEDMICROSFURACE
                        , refractionLowSampler
                        , refractionLowSamplerSampler
                        , refractionHighSampler
                        , refractionHighSamplerSampler
                    #endif
                #endif
                #ifdef ANISOTROPIC
                    , anisotropicOut
                #endif
                #ifdef REALTIME_FILTERING
                    , vRefractionFilteringInfo
                #endif
                #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                    , refractionPosition
                    , refractionSize
                #endif
                );
                
        #ifdef SS_DISPERSION
                environmentRefraction[i] = envSample[i];
            }
        #else
            environmentRefraction = envSample;
        #endif

        // _____________________________ Levels _____________________________________
        environmentRefraction = vec4f(environmentRefraction.rgb * vRefractionInfos.x, environmentRefraction.a);
    #endif

    // _______________________________________________________________________________
    // _____________________________ Final Refraction ________________________________
    // _______________________________________________________________________________
    #ifdef SS_REFRACTION
        var refractionTransmittance: vec3f =  vec3f(refractionIntensity);
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            var volumeAlbedo: vec3f = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);

            // // Simulate Flat Surface
            // thickness /=  dot(refractionVector, -normalW);

            // // Simulate Curved Surface
            // var NdotRefract: f32 = dot(normalW, refractionVector);
            // thickness *= -NdotRefract;

            refractionTransmittance *= cocaLambertVec3(volumeAlbedo, thickness);
        #elif defined(SS_LINKREFRACTIONTOTRANSPARENCY)
            // Tvar the: i32 material with albedo.
            var maxChannel: f32 = max(max(surfaceAlbedo.r, surfaceAlbedo.g), surfaceAlbedo.b);
            var volumeAlbedo: vec3f = saturateVec3(maxChannel * surfaceAlbedo);

            // Tvar reflectance: i32
            environmentRefraction = vec4f(environmentRefraction.rgb * volumeAlbedo, environmentRefraction.a);
        #else
            // Compute tvar from: i32 min distance only.
            var volumeAlbedo: vec3f = computeColorAtDistanceInMedia(vTintColor.rgb, vTintColor.w);
            refractionTransmittance *= cocaLambertVec3(volumeAlbedo, vThicknessParam.y);
        #endif

        #ifdef SS_ALBEDOFORREFRACTIONTINT
            // Tvar the: i32 transmission with albedo.
            environmentRefraction = vec4f(environmentRefraction.rgb * surfaceAlbedo.rgb, environmentRefraction.a);
        #endif

        #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
            outParams.surfaceAlbedo = surfaceAlbedo * (1.-refractionIntensity);
            outParams.refractionOpacity = 1.0;
        #else
            outParams.surfaceAlbedo = surfaceAlbedo;
            outParams.refractionOpacity = (1. - refractionIntensity);
        #endif

        #ifdef UNUSED_MULTIPLEBOUNCES
            // Keeping track in case of back compat issue.
            // The following code is broken and has never worked cause the mix is reversed. Fixing it
            // Introduces more reflection at grazing angle than expected and we can not find it back in any
            // nomenclatures (probably coming from our V1)

            // Add Multiple internal bounces.
            var bounceSpecularEnvironmentReflectance: vec3f = (2.0 * specularEnvironmentReflectance) / (1.0 + specularEnvironmentReflectance);
            outParams.specularEnvironmentReflectance = mix(bounceSpecularEnvironmentReflectance, specularEnvironmentReflectance, refractionIntensity);
        #endif

        #if DEBUGMODE > 0
            outParams.refractionTransmittance = refractionTransmittance;
        #endif

        outParams.finalRefraction = environmentRefraction.rgb * refractionTransmittance * vLightingIntensity.z;

        // Decrease the trasmitted light based on the specular environment reflectance.
        outParams.finalRefraction *= vec3f(1.0) - specularEnvironmentReflectance;

        #if DEBUGMODE > 0
            outParams.environmentRefraction = environmentRefraction;
        #endif
    #endif

    // __________________________________________________________________________________
    // _______________________________  IBL Translucency ________________________________
    // __________________________________________________________________________________
    #if defined(REFLECTION) && defined(SS_TRANSLUCENCY)
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX) || !defined(USESPHERICALFROMREFLECTIONMAP)
            var irradianceVector: vec3f =  (reflectionMatrix *  vec4f(normalW, 0)).xyz;
            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0;
            #endif
            #ifdef INVERTCUBICMAP
                irradianceVector.y *= -1.0;
            #endif
        #else
            var irradianceVector: vec3f = irradianceVector_;
        #endif

        #if defined(USESPHERICALFROMREFLECTIONMAP)
            #if defined(REALTIME_FILTERING)
                var refractionIrradiance: vec3f = irradiance(reflectionSampler, reflectionSamplerSampler, -irradianceVector, vReflectionFilteringInfo, 0.0, surfaceAlbedo, irradianceVector
                #ifdef IBL_CDF_FILTERING
                    , icdfSampler
                    , icdfSamplerSampler
                #endif
                );
            #else
                var refractionIrradiance: vec3f = computeEnvironmentIrradiance(-irradianceVector);
            #endif
        #elif defined(USEIRRADIANCEMAP)
            #ifdef REFLECTIONMAP_3D
                var irradianceCoords: vec3f = irradianceVector;
            #else
                var irradianceCoords: vec2f = irradianceVector.xy;
                #ifdef REFLECTIONMAP_PROJECTION
                    irradianceCoords /= irradianceVector.z;
                #endif
                irradianceCoords.y = 1.0 - irradianceCoords.y;
            #endif

            var temp: vec4f = textureSample(irradianceSampler, irradianceSamplerSampler, -irradianceCoords);
            var refractionIrradiance = temp.rgb;
            
            #ifdef RGBDREFLECTION
                refractionIrradiance = fromRGBD(temp).rgb;
            #endif

            #ifdef GAMMAREFLECTION
                refractionIrradiance = toLinearSpaceVec3(refractionIrradiance);
            #endif
        #else
            var refractionIrradiance: vec3f =  vec3f(0.);
        #endif

        refractionIrradiance *= transmittance;

        #ifdef SS_ALBEDOFORTRANSLUCENCYTINT
            // Tvar the: i32 transmission with albedo.
            refractionIrradiance *= surfaceAlbedo.rgb;
        #endif

        outParams.refractionIrradiance = refractionIrradiance;
    #endif

        return outParams;
    }
#endif

