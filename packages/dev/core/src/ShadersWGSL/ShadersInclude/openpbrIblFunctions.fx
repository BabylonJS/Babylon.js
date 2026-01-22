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
        environmentRadiance = vec4f(environmentRadiance.rgb * reflectionInfos.x, environmentRadiance.a);
        return environmentRadiance.rgb;
    }

#if defined(ANISOTROPIC)
    fn sampleRadianceAnisotropic(
        alphaG: f32
        , reflectionMicrosurfaceInfos: vec3f
        , reflectionInfos: vec2f
        , geoInfo: geometryInfoAnisoOutParams
        , normalW: vec3f
        , viewDirectionW: vec3f
        , positionW: vec3f
        , noise: vec3f
        , isRefraction: bool
        , ior: f32
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
        let modifiedAlphaG = alphaB;
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
            var view = (uniforms.reflectionMatrix * vec4f(viewDirectionW, 0.0f)).xyz;
            var tangent = (uniforms.reflectionMatrix * vec4f(geoInfo.anisotropicTangent, 0.0f)).xyz;
            var bitangent = (uniforms.reflectionMatrix * vec4f(geoInfo.anisotropicBitangent, 0.0f)).xyz;
            var normal = (uniforms.reflectionMatrix * vec4f(normalW, 0.0f)).xyz;
            #ifdef REFLECTIONMAP_OPPOSITEZ
                view.z *= -1.0f;
                tangent.z *= -1.0f;
                bitangent.z *= -1.0f;
                normal.z *= -1.0f;
            #endif
            environmentRadiance =
                vec4f(radianceAnisotropic(alphaT, alphaB, reflectionSampler, reflectionSamplerSampler,
                                         view, tangent,
                                         bitangent, normal,
                                         reflectionFilteringInfo, noise.xy, isRefraction, ior),
                     1.0f);
        #else
            // We will sample multiple reflections using interpolated surface normals along
            // the tangent direction from -tangent to +tangent.
            const samples: i32 = 16;
            var radianceSample = vec4f(0.0);
            var accumulatedRadiance = vec3f(0.0);
            var reflectionCoords = vec3f(0.0);
            var sample_weight = 0.0f;
            var total_weight = 0.0f;
            let step = 1.0f / f32(max(samples-1, 1));
            for (var i: i32 = 0; i < samples; i++) {
                // Find interpolation parameter in our valid range
                var t: f32 = mix(-1.0, 1.0, f32(i) * step);
                
                // Use noise to bridge gap between samples
                t += step * 2.0 * noise.x;

                // Empirical weighting to reduce affect of outer samples (geometry masking).
                // Could we improve this with correct masking function?
                sample_weight = max(1.0 - abs(t), 0.001);
                sample_weight *= sample_weight;

                // Scale location of samples based on amount of anisotropy
                t *= min(4.0 * alphaT * geoInfo.anisotropy, 1.0);

                // Generate a new normal that represents the normal of the microfacet to sample.
                var bentNormal: vec3f;
                if (t < 0.0) {
                    // Interpolate from -tangent towards normal
                    let blend: f32 = t + 1.0;
                    bentNormal = normalize(mix(-geoInfo.anisotropicTangent, normalW, blend));
                } else if (t > 0.0) {
                    // Interpolate from normal towards +tangent
                    let blend: f32 = t;
                    bentNormal = normalize(mix(normalW, geoInfo.anisotropicTangent, blend));
                } else {
                    // t = 0, sample the normal
                    bentNormal = normalW;
                }
                
                if (isRefraction) {
                    reflectionCoords = double_refract(-viewDirectionW, bentNormal, ior);
                } else {
                    reflectionCoords = reflect(-viewDirectionW, bentNormal);
                }
                // Use this new normal to calculate a reflection vector to sample from.
                reflectionCoords = (uniforms.reflectionMatrix * vec4f(reflectionCoords, 0.f)).xyz;
                #ifdef REFLECTIONMAP_OPPOSITEZ
                    reflectionCoords.z *= -1.0f;
                #endif
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
