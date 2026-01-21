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
        , in geometryInfoAnisoOutParams geoInfo
        , const vec3 normalW
        , const vec3 viewDirectionW
        , const vec3 positionW
        , const vec3 noise
        , bool isRefraction
        , float ior
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
        alphaG = alphaB;

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
            vec3 view = (reflectionMatrix * vec4(viewDirectionW, 0.0)).xyz;
            vec3 tangent = (reflectionMatrix * vec4(geoInfo.anisotropicTangent, 0.0)).xyz;
            vec3 bitangent = (reflectionMatrix * vec4(geoInfo.anisotropicBitangent, 0.0)).xyz;
            vec3 normal = (reflectionMatrix * vec4(normalW, 0.0)).xyz;
            #ifdef REFLECTIONMAP_OPPOSITEZ
                view.z *= -1.0;
                tangent.z *= -1.0;
                bitangent.z *= -1.0;
                normal.z *= -1.0;
            #endif
            environmentRadiance =
                vec4(radianceAnisotropic(alphaT, alphaB, reflectionSampler,
                                     view, tangent,
                                     bitangent, normal,
                                     vReflectionFilteringInfo, noise.xy, isRefraction, ior),
                 1.0);
        #else
            // We will sample multiple reflections using interpolated surface normals along
            // the tangent direction from -tangent to +tangent.
            const int samples = 16;
            vec4 radianceSample = vec4(0.0);
            vec3 reflectionCoords = vec3(0.0);
            float sample_weight = 0.0;
            float total_weight = 0.0;
            float step = 1.0 / float(max(samples-1, 1));
            for (int i = 0; i < samples; ++i) {
                // Calculate interpolation parameter
                float t = mix(-1.0, 1.0, float(i) * step);
                // Use noise to bridge gap between samples
                t += step * 2.0 * noise.x;

                // Empirical weighting to reduce affect of outer samples (geometry masking).
                // Could we improve this with correct masking function?
                sample_weight = max(1.0 - abs(t), 0.001);
                sample_weight *= sample_weight;

                // Scale location of samples based on amount of anisotropy
                t *= min(4.0 * alphaT * geoInfo.anisotropy, 1.0);
                
                // Generate a new normal that represents the normal of the microfacet to sample.
                vec3 bentNormal;
                if (t < 0.0) {
                    // Interpolate from -tangent towards normal
                    float blend = t + 1.0;
                    bentNormal = normalize(mix(-geoInfo.anisotropicTangent, normalW, blend));
                } else if (t > 0.0) {
                    // Interpolate from normal towards +tangent
                    float blend = t;
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
                reflectionCoords = vec3(reflectionMatrix * vec4(reflectionCoords, 0));
                #ifdef REFLECTIONMAP_OPPOSITEZ
                    reflectionCoords.z *= -1.0;
                #endif
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
