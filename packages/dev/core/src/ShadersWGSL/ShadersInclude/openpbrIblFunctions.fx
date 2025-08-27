#ifdef REFLECTION
    // _____________________________ Irradiance ________________________________
    // surfaceNormal is the direction to sample. Pass in a refracted vector to sample
    // diffusely refracted light.
    fn sampleIrradiance(
        surfaceNormal: vec3f
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            , vEnvironmentIrradianceSH: vec3f
        #endif
        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            , iblMatrix: mat4x4f
        #endif
        #ifdef USEIRRADIANCEMAP
            #ifdef REFLECTIONMAP_3D
                , irradianceSampler: texture_cube<f32>
                , irradianceSamplerSampler: sampler
            #else
                , irradianceSampler: texture_2d<f32>
                , irradianceSamplerSampler: sampler
            #endif
            #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                , reflectionDominantDirection: vec3f
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            , reflectionFilteringInfo: vec2f
            #ifdef IBL_CDF_FILTERING
                , icdfSampler: texture_2d<f32>
                , icdfSamplerSampler: sampler
            #endif
        #endif
        , reflectionInfos: vec2f
        , viewDirectionW: vec3f
        , diffuseRoughness: f32
        , surfaceAlbedo: vec3f
    ) -> vec3f {
        var environmentIrradiance = vec3f(0., 0., 0.);

        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            var irradianceVector = (iblMatrix * vec4f(surfaceNormal, 0.0f)).xyz;
            let irradianceView = (iblMatrix * vec4f(viewDirectionW, 0.0f)).xyz;
            #if !defined(USE_IRRADIANCE_DOMINANT_DIRECTION) && !defined(REALTIME_FILTERING)
                // Approximate diffuse roughness by bending the surface normal away from the view.
                #if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
                {
                    let NdotV = max(dot(surfaceNormal, viewDirectionW), 0.0f);
                    irradianceVector = mix(irradianceVector, irradianceView, (0.5f * (1.0f - NdotV)) * diffuseRoughness);
                }
                #endif
            #endif

            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0f;
            #endif

            #ifdef INVERTCUBICMAP
                irradianceVector.y *= -1.0f;
            #endif
        #endif
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradianceSH;
            #else
                #if defined(REALTIME_FILTERING)
                    environmentIrradiance = irradiance(reflectionSampler, reflectionSamplerSampler, irradianceVector, reflectionFilteringInfo, diffuseRoughness, surfaceAlbedo, irradianceView
                    #ifdef IBL_CDF_FILTERING
                        , icdfSampler
                        , icdfSamplerSampler
                    #endif
                    );
                #else
                    environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);
                #endif
            #endif
        #elif defined(USEIRRADIANCEMAP)
            #ifdef REFLECTIONMAP_3D
                let environmentIrradianceFromTexture: vec4f = textureSample(irradianceSampler, irradianceSamplerSampler, irradianceVector);
            #else
                // TODO: What kind of irradiance map isn't 3D?
                let environmentIrradianceFromTexture: vec4f = textureSample(irradianceSampler, irradianceSamplerSampler, reflectionCoords);
            #endif
            
            environmentIrradiance = environmentIrradianceFromTexture.rgb;
            #ifdef RGBDREFLECTION
                environmentIrradiance.rgb = fromRGBD(environmentIrradianceFromTexture);
            #endif

            #ifdef GAMMAREFLECTION
                environmentIrradiance.rgb = toLinearSpace(environmentIrradiance.rgb);
            #endif
            // If we have a predominant light direction, use it to compute the diffuse roughness term.abort
            // Otherwise, bend the irradiance vector to simulate retro-reflectivity of diffuse roughness.
            #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                let Ls: vec3f = normalize(reflectionDominantDirection);
                let NoL: f32 = dot(irradianceVector, Ls);
                let NoV: f32 = dot(irradianceVector, irradianceView);
                
                var diffuseRoughnessTerm = vec3f(1.0f);
                #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                    let LoV: f32 = dot (Ls, irradianceView);
                    let mag: f32 = length(reflectionDominantDirection) * 2.0f;
                    let clampedAlbedo: vec3f = clamp(surfaceAlbedo, vec3f(0.1f), vec3f(1.0f));
                    diffuseRoughnessTerm = diffuseBRDF_EON(clampedAlbedo, diffuseRoughness, NoL, NoV, LoV) * PI;
                    diffuseRoughnessTerm = diffuseRoughnessTerm / clampedAlbedo;
                    diffuseRoughnessTerm = mix(vec3f(1.0f), diffuseRoughnessTerm, sqrt(clamp(mag * NoV, 0.0f, 1.0f)));
                #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                    let H: vec3f = (irradianceView + Ls) * 0.5f;
                    let VoH: f32 = dot(irradianceView, H);
                    diffuseRoughnessTerm = vec3f(diffuseBRDF_Burley(NoL, NoV, VoH, diffuseRoughness) * PI);
                #endif
                environmentIrradiance = environmentIrradiance.rgb * diffuseRoughnessTerm;
            #endif
        #endif

        environmentIrradiance *= reflectionInfos.x;
        return environmentIrradiance;
    }

    #ifdef REFLECTIONMAP_3D
        fn createReflectionCoords(vPositionW: vec3f, normalW: vec3f) -> vec3f
    #else
        fn createReflectionCoords(vPositionW: vec3f, normalW: vec3f) -> vec2f
    #endif
    {
        var reflectionVector: vec3f = computeReflectionCoords(vec4f(vPositionW, 1.0f), normalW);

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            var reflectionCoords: vec3f = reflectionVector;
        #else
            var reflectionCoords: vec2f = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0f - reflectionCoords.y;
        #endif
        return reflectionCoords;
    }

    fn sampleRadiance(
        alphaG: f32
        , reflectionMicrosurfaceInfos: vec3f
        , reflectionInfos: vec2f
        , geoInfo: geometryInfoOutParams
    #ifdef REFLECTIONMAP_3D
        , reflectionSampler: texture_cube<f32>
        , reflectionSamplerSampler: sampler
        , reflectionCoords: vec3f
    #else
        , reflectionSampler: texture_2d<f32>
        , reflectionSamplerSampler: sampler
        , reflectionCoords: vec2f
    #endif
    #ifdef REALTIME_FILTERING
        , reflectionFilteringInfo: vec2f
    #endif
    ) -> vec3f {
        var environmentRadiance: vec4f = vec4f(0.f, 0.f, 0.f, 0.f);
        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            var reflectionLOD: f32 = getLodFromAlphaG(reflectionMicrosurfaceInfos.x, alphaG, geoInfo.NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            var reflectionLOD: f32 = getLinearLodFromRoughness(reflectionMicrosurfaceInfos.x, roughness);
        #else
            var reflectionLOD: f32 = getLodFromAlphaG(reflectionMicrosurfaceInfos.x, alphaG);
        #endif

        // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
        reflectionLOD = reflectionLOD * reflectionMicrosurfaceInfos.y + reflectionMicrosurfaceInfos.z;

        #ifdef REALTIME_FILTERING
            environmentRadiance = vec4f(radiance(alphaG, reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionFilteringInfo), 1.0f);
        #else
            environmentRadiance = textureSampleLevel(reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionLOD);
        #endif

        #ifdef RGBDREFLECTION
            environmentRadiance.rgb = fromRGBD(environmentRadiance);
        #endif

        #ifdef GAMMAREFLECTION
            environmentRadiance.rgb = toLinearSpace(environmentRadiance.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        // environmentRadiance.rgb *= reflectionInfos.xxx;
        return environmentRadiance.rgb;
    }

#if defined(ANISOTROPIC)
    fn sampleRadianceAnisotropic(
        alphaG: f32
        , reflectionMicrosurfaceInfos: vec3f
        , reflectionInfos: vec2f
        , geoInfo: geometryInfoOutParams
        , normalW: vec3f
        , viewDirectionW: vec3f
        , positionW: vec3f
        , noise: vec3f
    #ifdef REFLECTIONMAP_3D
        , reflectionSampler: texture_cube<f32>
        , reflectionSamplerSampler: sampler
    #else
        , reflectionSampler: texture_2d<f32>
        , reflectionSamplerSampler: sampler
    #endif
    #ifdef REALTIME_FILTERING
        , reflectionFilteringInfo: vec2f
    #endif
    ) -> vec3f {
        var environmentRadiance: vec4f = vec4f(0.f, 0.f, 0.f, 0.f);

        // Calculate alpha along tangent and bitangent according to equation 21 in the OpenPBR spec.
        let alphaT = alphaG * sqrt(2.0f / (1.0f + (1.0f - geoInfo.anisotropy) * (1.0f - geoInfo.anisotropy)));
        let alphaB = (1.0f - geoInfo.anisotropy) * alphaT;
        let modifiedAlphaG = mix(alphaG, alphaB, 0.95);
        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            var reflectionLOD: f32 = getLodFromAlphaG(reflectionMicrosurfaceInfos.x, modifiedAlphaG, geoInfo.NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            var reflectionLOD: f32 = getLinearLodFromRoughness(reflectionMicrosurfaceInfos.x, roughness);
        #else
            var reflectionLOD: f32 = getLodFromAlphaG(reflectionMicrosurfaceInfos.x, modifiedAlphaG);
        #endif

        // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
        reflectionLOD = reflectionLOD * reflectionMicrosurfaceInfos.y + reflectionMicrosurfaceInfos.z;

        #ifdef REALTIME_FILTERING
            environmentRadiance = vec4f(radiance(modifiedAlphaG, reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionFilteringInfo), 1.0f);
        #else
            // We will sample multiple reflections using interpolated surface normals along
            // the tangent direction from -tangent to +tangent.
            // We don't want to waste samples where the view direction is back-facing so
            // we'll compress samples into the valid range.
            const samples: i32 = 16;
            // Find the maximum safe interpolation range
            let normalDot = dot(viewDirectionW, normalW);
            let tangentDot = dot(viewDirectionW, geoInfo.anisotropicTangent);
            let negTangentDot = dot(viewDirectionW, -geoInfo.anisotropicTangent);

            // Find the valid interpolation range on each side of the normal
            var maxPositiveT = 1.0f;  // Default: sample all the way to +tangent
            var maxNegativeT = -1.0f; // Default: sample all the way to -tangent

            // If +tangent is back-facing, find where the interpolation becomes back-facing
            if (tangentDot <= 0.0f) {
                // Find t where mix(normalW, tangentW, t) becomes perpendicular to view
                if (abs(tangentDot - normalDot) > 0.001f) {
                    maxPositiveT = clamp(-normalDot / (tangentDot - normalDot), 0.0, 1.0);
                } else {
                    maxPositiveT = 0.0f; // Can't sample towards tangent
                }
            }
        
            // If -tangent is back-facing, find where the interpolation becomes back-facing  
            if (negTangentDot <= 0.0f) {
                // Find t where mix(-tangentW, normalW, blend) becomes perpendicular to view
                // This is equivalent to mix(normalW, -tangentW, -t) for t < 0
                if (abs(negTangentDot - normalDot) > 0.001f) {
                    let negT = -normalDot / (negTangentDot - normalDot);
                    maxNegativeT = clamp(-negT, -1.0f, 0.0f);
                } else {
                    maxNegativeT = 0.0f; // Can't sample towards -tangent
                }
            }

            // Further compress the sampling range based on the level of anisotropic roughness
            let tangentRange: f32 = clamp(sqrt(sqrt(alphaT)) * geoInfo.anisotropy, 0.0f, 1.0f) * (0.25f * noise.x + 0.75f);
            maxPositiveT *= maxPositiveT * tangentRange;
            maxNegativeT = -(maxNegativeT * maxNegativeT) * tangentRange;
        
            var radianceSample = vec4f(0.0);
            var accumulatedRadiance = vec3f(0.0);
            var reflectionCoords = vec3f(0.0);
            var sample_weight = 0.0f;
            var total_weight = 0.0f;
            for (var i: i32 = 0; i < samples; i++) {
                // Find interpolation parameter in our valid range
                let t: f32 = mix(maxNegativeT, maxPositiveT, f32(i) / f32(max(samples - 1, 1)));
                
                // Generate sample direction
                var sampleDirection: vec3f;
                if (t < 0.0) {
                    // Interpolate from -tangent towards normal
                    let blend: f32 = t + 1.0;
                    sampleDirection = normalize(mix(-geoInfo.anisotropicTangent, normalW, blend));
                } else if (t > 0.0) {
                    // Interpolate from normal towards +tangent
                    let blend: f32 = t;
                    sampleDirection = normalize(mix(normalW, geoInfo.anisotropicTangent, blend));
                } else {
                    // t = 0, sample the normal
                    sampleDirection = normalW;
                }
                
                // Empirical approximation of geometry masking.
                sample_weight = pow(clamp(dot(normalW, sampleDirection), 0.0f, 1.0f), 16.0f);
                reflectionCoords = createReflectionCoords(positionW, sampleDirection);
                radianceSample = textureSampleLevel(reflectionSampler, reflectionSamplerSampler, reflectionCoords, reflectionLOD);
                #ifdef RGBDREFLECTION
                    accumulatedRadiance += vec3f(sample_weight) * fromRGBD(radianceSample);
                #elif defined(GAMMAREFLECTION)
                    accumulatedRadiance += vec3f(sample_weight) * toLinearSpace(radianceSample.rgb);
                #else
                    accumulatedRadiance += vec3f(sample_weight) * radianceSample.rgb;
                #endif
                total_weight += sample_weight;
            }
            environmentRadiance = vec4f(accumulatedRadiance / vec3f(total_weight), 1.0f);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance = vec4f(environmentRadiance.rgb * reflectionInfos.xxx, environmentRadiance.a);
        return environmentRadiance.rgb;
    }
#endif

    fn conductorIblFresnel(reflectance: ReflectanceParams, NdotV: f32, roughness: f32, environmentBrdf: vec3f) -> vec3f
    {
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
            // This is an empirical hack to modify the F0 albedo based on roughness. It's not based on any paper
            // or anything. Just trying to match results of rough metals in a pathtracer.
            let albedoF0: vec3f = mix(reflectance.coloredF0, pow(reflectance.coloredF0, vec3f(1.4f)), roughness);
            return getF82Specular(NdotV, albedoF0, reflectance.coloredF90, roughness);
        #else
            return getReflectanceFromBRDFLookup(reflectance.coloredF0, reflectance.coloredF90, environmentBrdf);
        #endif
    }
#endif
