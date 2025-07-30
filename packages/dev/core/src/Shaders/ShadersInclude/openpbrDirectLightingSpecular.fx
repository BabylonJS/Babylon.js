#ifdef LIGHT{X}

    // Specular contribution
    #ifdef SPECULARTERM
        #if AREALIGHT{X}
            info{X}.specular = computeAreaSpecularLighting(preInfo{X}, light{X}.vLightSpecular.rgb, specularEnvironmentR0, specularEnvironmentR90);
        #else
            // For OpenPBR, we use the F82 specular model for metallic materials and mix with the
            // usual Schlick lobe.
            #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
                {
                    vec3 metalFresnel = specular_weight * getF82Specular(preInfo{X}.VdotH, baseConductorReflectance.F0, baseConductorReflectance.F90, specular_roughness);
                    vec3 dielectricFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseDielectricReflectance.F0, baseDielectricReflectance.F90);
                    coloredFresnel = mix(dielectricFresnel, metalFresnel, base_metalness);
                }
            #else
                coloredFresnel = fresnelSchlickGGX(preInfo{X}.VdotH, baseDielectricReflectance.F0, baseDielectricReflectance.F90);
            #endif
            {
                // The diffuse contribution needs to be decreased by the average Fresnel for the hemisphere.
                // We can approximate this with NdotH.
                float NdotH = dot(normalW, preInfo{X}.H);
                vec3 fresnel = fresnelSchlickGGX(NdotH, vec3(baseDielectricReflectance.F0), baseDielectricReflectance.F90);
                info{X}.diffuse *= (vec3(1.0) - fresnel);
            }
            #ifdef ANISOTROPIC
                info{X}.specular = computeAnisotropicSpecularLighting(preInfo{X}, viewDirectionW, normalW, anisotropicOut.anisotropicTangent, anisotropicOut.anisotropicBitangent, anisotropicOut.anisotropy, specularEnvironmentR0, specularEnvironmentR90, baseGeoInfo.AARoughnessFactors.x, diffuse{X}.rgb);
            #else
                info{X}.specular = computeSpecularLighting(preInfo{X}, normalW, baseDielectricReflectance.F0, coloredFresnel, specular_roughness, diffuse{X}.rgb);
            #endif

            #ifndef SHADOWONLY
                #ifdef SHADOWCSMDEBUG{X}
                    baseSpecularDirectLight += info{X}.specular * shadowDebug{X};
                #else
                    baseSpecularDirectLight += info{X}.specular * shadow{X};
                #endif
            #endif
        #endif
    #endif
#endif
