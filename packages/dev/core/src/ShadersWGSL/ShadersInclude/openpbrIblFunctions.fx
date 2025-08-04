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
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        , NdotVUnclamped: f32
    #endif
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
            var reflectionLOD: f32 = getLodFromAlphaG(reflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
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

    fn conductorIblFresnel(reflectance: ReflectanceParams, NdotV: f32, roughness: f32, environmentBrdf: vec3f) -> vec3f
    {
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
            // For OpenPBR, we use a different specular lobe for metallic materials and then blend based on metalness. However,
            // to do this correctly, we really need reflectanceOut to contain separate F0 and F90 values for purely dielectric
            // and purely metal. Instead, the values are already a mix of dielectric and metallic values.
            // So, for intermediate metallic values, the result isn't 100% correct but it seems to work well enough in practice.
            // Because specular weight in OpenPBR removes the specular lobe entirely for metals, we do need the actual dielectric
            // F0 value to pickup the weight from the dielectric lobe.
            return getF82Specular(NdotV, reflectance.coloredF0, reflectance.coloredF90, roughness);
        #else
            return getReflectanceFromBRDFLookup(reflectance.coloredF0, reflectance.coloredF90, environmentBrdf);
        #endif
    }
#endif
