#ifdef REFLECTION
    // _____________________________ Irradiance ________________________________
    // surfaceNormal is the direction to sample. Pass in a refracted vector to sample
    // diffusely refracted light.
    vec3 sampleIrradiance(
        in vec3 surfaceNormal
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            , in vec3 vEnvironmentIrradiance
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
            vec3 irradianceVector = vec3(iblMatrix * vec4(surfaceNormal, 0)).xyz;
            vec3 irradianceView = vec3(iblMatrix * vec4(viewDirectionW, 0)).xyz;
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
                environmentIrradiance = vEnvironmentIrradiance;
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
    #ifdef ANISOTROPIC
        , in anisotropicOutParams anisotropicOut
    #endif
    )
    {
        #ifdef ANISOTROPIC
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), anisotropicOut.anisotropicNormal);
        #else
            vec3 reflectionVector = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
        #endif

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
    #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
        , in float NdotVUnclamped
    #endif
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
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG, NdotVUnclamped);
        #elif defined(LINEARSPECULARREFLECTION)
            float reflectionLOD = getLinearLodFromRoughness(vReflectionMicrosurfaceInfos.x, roughness);
        #else
            float reflectionLOD = getLodFromAlphaG(vReflectionMicrosurfaceInfos.x, alphaG);
        #endif

        // Apply environment convolution scale/offset filter tuning parameters to the mipmap LOD selection
        reflectionLOD = reflectionLOD * vReflectionMicrosurfaceInfos.y + vReflectionMicrosurfaceInfos.z;

        #ifdef LODINREFLECTIONALPHA
            // Automatic LOD adjustment to ensure that the smoothness-based environment LOD selection
            // is constrained to appropriate LOD levels in order to prevent aliasing.
            // The environment map is first sampled without custom LOD selection to determine
            // the hardware-selected LOD, and this is then used to constrain the final LOD selection
            // so that excessive surface smoothness does not cause aliasing (e.g. on curved geometry
            // where the normal is varying rapidly).

            // Note: Shader Model 4.1 or higher can provide this directly via CalculateLevelOfDetail(), and
            // manual calculation via derivatives is also possible, but for simplicity we use the
            // hardware LOD calculation with the alpha channel containing the LOD for each mipmap.
            float automaticReflectionLOD = UNPACK_LOD(sampleReflection(reflectionSampler, reflectionCoords).a);
            float requestedReflectionLOD = max(automaticReflectionLOD, reflectionLOD);
        #else
            float requestedReflectionLOD = reflectionLOD;
        #endif
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
        environmentRadiance.rgb *= vReflectionInfos.x;
        return environmentRadiance.rgb;
    }

    #define pbr_inline
    vec3 conductorIblFresnel(in ReflectanceParams reflectance, in float NdotV, in float roughness, in vec3 environmentBrdf)
    {
        #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
            // For OpenPBR, we use a different specular lobe for metallic materials and then blend based on metalness. However,
            // to do this correctly, we really need reflectivityOut to contain separate F0 and F90 values for purely dielectric
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
