#ifdef REFLECTION
    // _____________________________ Irradiance ________________________________
    // surfaceNormal is the direction to sample. Pass in a refracted vector to sample
    // diffusely refracted light.
    vec3 sampleIrradiance(
        in vec3 surfaceNormal
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            , in vec3 vEnvironmentIrradianceSH
        #endif
        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            , in mat4 iblMatrix
        #endif
        #ifdef USEIRRADIANCEMAP
            #ifdef REFLECTIONMAP_3D
                , in samplerCube irradianceSampler
            #else
                , in sampler2D irradianceSampler
            #endif
            #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                , in vec3 reflectionDominantDirection
            #endif
        #endif
        #ifdef REALTIME_FILTERING
            , in vec2 vReflectionFilteringInfo
            #ifdef IBL_CDF_FILTERING
                , in sampler2D icdfSampler
            #endif
        #endif
        , in vec2 vReflectionInfos
        , in vec3 viewDirectionW
        , in float diffuseRoughness
        , in vec3 surfaceAlbedo
    ) {
        vec3 environmentIrradiance = vec3(0., 0., 0.);

        #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
            vec3 irradianceVector = (iblMatrix * vec4(surfaceNormal, 0)).xyz;
            vec3 irradianceView = (iblMatrix * vec4(viewDirectionW, 0)).xyz;
            #if !defined(USE_IRRADIANCE_DOMINANT_DIRECTION) && !defined(REALTIME_FILTERING)
                // Approximate diffuse roughness by bending the surface normal away from the view.
                #if BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LAMBERT && BASE_DIFFUSE_MODEL != BRDF_DIFFUSE_MODEL_LEGACY
                {
                    float NdotV = max(dot(surfaceNormal, viewDirectionW), 0.0);
                    irradianceVector = mix(irradianceVector, irradianceView, (0.5 * (1.0 - NdotV)) * diffuseRoughness);
                }
                #endif
            #endif

            #ifdef REFLECTIONMAP_OPPOSITEZ
                irradianceVector.z *= -1.0;
            #endif

            #ifdef INVERTCUBICMAP
                irradianceVector.y *= -1.0;
            #endif
        #endif
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                environmentIrradiance = vEnvironmentIrradianceSH;
            #else
                #if defined(REALTIME_FILTERING)
                    environmentIrradiance = irradiance(reflectionSampler, irradianceVector, vReflectionFilteringInfo, diffuseRoughness, surfaceAlbedo, irradianceView
                    #ifdef IBL_CDF_FILTERING
                        , icdfSampler
                    #endif
                    );
                #else
                    environmentIrradiance = computeEnvironmentIrradiance(irradianceVector);
                #endif
            #endif
        #elif defined(USEIRRADIANCEMAP)
            #ifdef REFLECTIONMAP_3D
                vec4 environmentIrradianceFromTexture = sampleReflection(irradianceSampler, irradianceVector);
            #else
                // TODO: What kind of irradiance map isn't 3D?
                vec4 environmentIrradianceFromTexture = sampleReflection(irradianceSampler, reflectionCoords);
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
                vec3 Ls = normalize(reflectionDominantDirection);
                float NoL = dot(irradianceVector, Ls);
                float NoV = dot(irradianceVector, irradianceView);
                
                vec3 diffuseRoughnessTerm = vec3(1.0);
                #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                    float LoV = dot (Ls, irradianceView);
                    float mag = length(reflectionDominantDirection) * 2.0;
                    vec3 clampedAlbedo = clamp(surfaceAlbedo, vec3(0.1), vec3(1.0));
                    diffuseRoughnessTerm = diffuseBRDF_EON(clampedAlbedo, diffuseRoughness, NoL, NoV, LoV) * PI;
                    diffuseRoughnessTerm = diffuseRoughnessTerm / clampedAlbedo;
                    diffuseRoughnessTerm = mix(vec3(1.0), diffuseRoughnessTerm, sqrt(clamp(mag * NoV, 0.0, 1.0)));
                #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                    vec3 H = (irradianceView + Ls)*0.5;
                    float VoH = dot(irradianceView, H);
                    diffuseRoughnessTerm = vec3(diffuseBRDF_Burley(NoL, NoV, VoH, diffuseRoughness) * PI);
                #endif
                environmentIrradiance = environmentIrradiance.rgb * diffuseRoughnessTerm;
            #endif
        #endif

        environmentIrradiance *= vReflectionInfos.x;
        return environmentIrradiance;
    }

    #define pbr_inline
    #ifdef REFLECTIONMAP_3D
        vec3 createReflectionCoords(
    #else
        vec2 createReflectionCoords(
    #endif
        in vec3 vPositionW
        , in vec3 normalW
    )
    {
        vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);

        #ifdef REFLECTIONMAP_OPPOSITEZ
            reflectionVector.z *= -1.0;
        #endif

        // _____________________________ 2D vs 3D Maps ________________________________
        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = reflectionVector;
        #else
            vec2 reflectionCoords = reflectionVector.xy;
            #ifdef REFLECTIONMAP_PROJECTION
                reflectionCoords /= reflectionVector.z;
            #endif
            reflectionCoords.y = 1.0 - reflectionCoords.y;
        #endif
        return reflectionCoords;
    }

    #define pbr_inline
    #define inline
    vec3 sampleRadiance(
        in float alphaG
        , in vec3 vReflectionMicrosurfaceInfos
        , in vec2 vReflectionInfos
        , in geometryInfoOutParams geoInfo
    #ifdef REFLECTIONMAP_3D
        , in samplerCube reflectionSampler
        , const vec3 reflectionCoords
    #else
        , in sampler2D reflectionSampler
        , const vec2 reflectionCoords
    #endif
    #ifdef REALTIME_FILTERING
        , in vec2 vReflectionFilteringInfo
    #endif
    )
    {
        vec4 environmentRadiance = vec4(0., 0., 0., 0.);
        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, geoInfo.NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            float reflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
        #else
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
        #endif

        // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
        reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

        #ifdef REALTIME_FILTERING
            environmentRadiance = vec4(radiance(alphaG, reflectionSampler, reflectionCoords, vReflectionFilteringInfo), 1.0);
        // #elif defined(ANISOTROPIC)
        //     vec4 radianceSample = vec4(0.0);
        //     const int samples = 16;
        //     for (int i = 0; i < samples; ++i) {
        //         float t = (float(i) * (1.0f / float(max(samples - 1, 1))) - 0.5f) * 3.14159 * alphaT;
        //         vec3 perturbed_N = geoInfo.anisotropicTangent * t;
        //         // Add noise (mostly in the tangent direction) to smooth out sampling
        //         // perturbed_N.xy += new_noise.xy;
                
        //         vec3 newCoords = normalize(reflectionCoords + perturbed_N);
        //         radianceSample += sampleReflectionLod(reflectionSampler, newCoords, reflectionLOD);
        //     }
        //     environmentRadiance = vec4(radianceSample.xyz / float(samples), 1.0);
        #else
            environmentRadiance = sampleReflectionLod(reflectionSampler, reflectionCoords, reflectionLOD);
        #endif

        #ifdef RGBDREFLECTION
            environmentRadiance.rgb = fromRGBD(environmentRadiance);
        #endif

        #ifdef GAMMAREFLECTION
            environmentRadiance.rgb = toLinearSpace(environmentRadiance.rgb);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance.rgb *= vec3(vReflectionInfos.x);
        return environmentRadiance.rgb;
    }

#if defined(ANISOTROPIC)
    #define pbr_inline
    #define inline
    vec3 sampleRadianceAnisotropic(
        in float alphaG
        , in vec3 vReflectionMicrosurfaceInfos
        , in vec2 vReflectionInfos
        , in geometryInfoOutParams geoInfo
        , const vec3 normalW
        , const vec3 viewDirectionW
        , const vec3 positionW
        , const vec3 noise
    #ifdef REFLECTIONMAP_3D
        , in samplerCube reflectionSampler
    #else
        , in sampler2D reflectionSampler
    #endif
    #ifdef REALTIME_FILTERING
        , in vec2 vReflectionFilteringInfo
    #endif
    )
    {
        vec4 environmentRadiance = vec4(0., 0., 0., 0.);

        // Calculate alpha along tangent and bitangent according to equation 21 in the OpenPBR spec.
        float alphaT = alphaG * sqrt(2.0 / (1.0 + (1.0 - geoInfo.anisotropy) * (1.0 - geoInfo.anisotropy)));
        float alphaB = (1.0 - geoInfo.anisotropy) * alphaT;
        alphaG = mix(alphaG, alphaB, 0.95);

        // _____________________________ 2D vs 3D Maps ________________________________
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, geoInfo.NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            float reflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
        #else
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
        #endif

        // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
        reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

        #ifdef REALTIME_FILTERING
            environmentRadiance = vec4(radiance(alphaG, reflectionSampler, reflectionCoords, vReflectionFilteringInfo), 1.0);
        #else
            // We will sample multiple reflections using interpolated surface normals along
            // the tangent direction from -tangent to +tangent.
            // We don't want to waste samples where the view direction is back-facing so
            // we'll compress samples into the valid range.
            const int samples = 16;
            // Find the maximum safe interpolation range
            float normalDot = dot(viewDirectionW, normalW);
            float tangentDot = dot(viewDirectionW, geoInfo.anisotropicTangent);
            float negTangentDot = dot(viewDirectionW, -geoInfo.anisotropicTangent);
        
            // Find the valid interpolation range on each side of the normal
            float maxPositiveT = 1.0;  // Default: sample all the way to +tangent
            float maxNegativeT = -1.0; // Default: sample all the way to -tangent
        
            // If +tangent is back-facing, find where the interpolation becomes back-facing
            if (tangentDot <= 0.0) {
                // Find t where mix(normalW, tangentW, t) becomes perpendicular to view
                if (abs(tangentDot - normalDot) > 0.001) {
                    maxPositiveT = clamp(-normalDot / (tangentDot - normalDot), 0.0, 1.0);
                } else {
                    maxPositiveT = 0.0; // Can't sample towards tangent
                }
            }
        
            // If -tangent is back-facing, find where the interpolation becomes back-facing  
            if (negTangentDot <= 0.0) {
                // Find t where mix(-tangentW, normalW, blend) becomes perpendicular to view
                // This is equivalent to mix(normalW, -tangentW, -t) for t < 0
                if (abs(negTangentDot - normalDot) > 0.001) {
                    float negT = -normalDot / (negTangentDot - normalDot);
                    maxNegativeT = clamp(-negT, -1.0, 0.0);
                } else {
                    maxNegativeT = 0.0; // Can't sample towards -tangent
                }
            }

            // Further compress the sampling range based on the level of anisotropic roughness
            float tangentRange = clamp(sqrt(sqrt(alphaT)) * geoInfo.anisotropy, 0.0, 1.0) * (0.25 * noise.x + 0.75);
            maxPositiveT *= maxPositiveT * tangentRange;
            maxNegativeT = -(maxNegativeT * maxNegativeT) * tangentRange;
        
            vec4 radianceSample = vec4(0.0);
            vec3 reflectionCoords = vec3(0.0);
            float sample_weight = 0.0;
            float total_weight = 0.0;
            for (int i = 0; i < samples; ++i) {
                // Find interpolation parameter in our valid range
                float t = mix(maxNegativeT, maxPositiveT, float(i) / float(max(samples - 1, 1)));
                
                // Generate sample direction
                vec3 sampleDirection;
                if (t < 0.0) {
                    // Interpolate from -tangent towards normal
                    float blend = t + 1.0;
                    sampleDirection = normalize(mix(-geoInfo.anisotropicTangent, normalW, blend));
                } else if (t > 0.0) {
                    // Interpolate from normal towards +tangent
                    float blend = t;
                    sampleDirection = normalize(mix(normalW, geoInfo.anisotropicTangent, blend));
                } else {
                    // t = 0, sample the normal
                    sampleDirection = normalW;
                }
                
                // Empirical approximation of geometry masking.
                sample_weight = pow(clamp(dot(normalW, sampleDirection), 0.0, 1.0), 16.0);
                reflectionCoords = createReflectionCoords(positionW, sampleDirection);
                radianceSample = sampleReflectionLod(reflectionSampler, reflectionCoords, reflectionLOD);
                #ifdef RGBDREFLECTION
                    environmentRadiance.rgb += sample_weight * fromRGBD(radianceSample);
                #elif defined(GAMMAREFLECTION)
                    environmentRadiance.rgb += sample_weight * toLinearSpace(radianceSample.rgb);
                #else
                    environmentRadiance.rgb += sample_weight * radianceSample.rgb;
                #endif
                total_weight += sample_weight;
            }
            environmentRadiance = vec4(environmentRadiance.xyz / float(total_weight), 1.0);
        #endif

        // _____________________________ Levels _____________________________________
        environmentRadiance.rgb *= vec3(vReflectionInfos.x);
        return environmentRadiance.rgb;
    }
#endif

    #define pbr_inline
    vec3 conductorIblFresnel(in ReflectanceParams reflectance, in float NdotV, in float roughness, in vec3 environmentBrdf)
    {
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
            // This is an empirical hack to modify the F0 albedo based on roughness. It's not based on any paper
            // or anything. Just trying to match results of rough metals in a pathtracer.
            vec3 albedoF0 = mix(reflectance.coloredF0, pow(reflectance.coloredF0, vec3(1.4)), roughness);
            return getF82Specular(NdotV, albedoF0, reflectance.coloredF90, roughness);
        #else
            return getReflectanceFromBRDFLookup(reflectance.coloredF0, reflectance.coloredF90, environmentBrdf);
        #endif
    }
#endif
