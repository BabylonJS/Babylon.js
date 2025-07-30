#ifdef LIGHT{X}
    #ifdef SHADOW{X}
        #ifdef SHADOWCSM{X}
            for (int i = 0; i < SHADOWCSMNUM_CASCADES{X}; i++)
            {
                #ifdef SHADOWCSM_RIGHTHANDED{X}
                    diff{X} = viewFrustumZ{X}[i] + vPositionFromCamera{X}.z;
                #else
                    diff{X} = viewFrustumZ{X}[i] - vPositionFromCamera{X}.z;
                #endif
                if (diff{X} >= 0.) {
                    index{X} = i;
                    break;
                }
            }

            #ifdef SHADOWCSMUSESHADOWMAXZ{X}
            if (index{X} >= 0)
            #endif
            {
                #if defined(SHADOWPCF{X})
                    #if defined(SHADOWLOWQUALITY{X})
                        shadow{X} = computeShadowWithCSMPCF1(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow{X} = computeShadowWithCSMPCF3(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #else
                        shadow{X} = computeShadowWithCSMPCF5(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                    #endif
                #elif defined(SHADOWPCSS{X})
                    #if defined(SHADOWLOWQUALITY{X})
                        shadow{X} = computeShadowWithCSMPCSS16(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #elif defined(SHADOWMEDIUMQUALITY{X})
                        shadow{X} = computeShadowWithCSMPCSS32(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #else
                        shadow{X} = computeShadowWithCSMPCSS64(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                    #endif
                #else
                    shadow{X} = computeShadowCSM(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                #endif

                #ifdef SHADOWCSMDEBUG{X}
                    shadowDebug{X} = vec3(shadow{X}) * vCascadeColorsMultiplier{X}[index{X}];
                #endif

                #ifndef SHADOWCSMNOBLEND{X}
                    float frustumLength = frustumLengths{X}[index{X}];
                    float diffRatio = clamp(diff{X} / frustumLength, 0., 1.) * cascadeBlendFactor{X};
                    if (index{X} < (SHADOWCSMNUM_CASCADES{X} - 1) && diffRatio < 1.)
                    {
                        index{X} += 1;
                        float nextShadow = 0.;
                        #if defined(SHADOWPCF{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF1(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCF3(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #else
                                nextShadow = computeShadowWithCSMPCF5(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                            #endif
                        #elif defined(SHADOWPCSS{X})
                            #if defined(SHADOWLOWQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS16(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #elif defined(SHADOWMEDIUMQUALITY{X})
                                nextShadow = computeShadowWithCSMPCSS32(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #else
                                nextShadow = computeShadowWithCSMPCSS64(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w, lightSizeUVCorrection{X}[index{X}], depthCorrection{X}[index{X}], penumbraDarkness{X});
                            #endif
                        #else
                            nextShadow = computeShadowCSM(float(index{X}), vPositionFromLight{X}[index{X}], vDepthMetric{X}[index{X}], shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
                        #endif

                        shadow{X} = mix(nextShadow, shadow{X}, diffRatio);
                        #ifdef SHADOWCSMDEBUG{X}
                            shadowDebug{X} = mix(vec3(nextShadow) * vCascadeColorsMultiplier{X}[index{X}], shadowDebug{X}, diffRatio);
                        #endif
                    }
                #endif
            }
        #elif defined(SHADOWCLOSEESM{X})
            #if defined(SHADOWCUBE{X})
                shadow{X} = computeShadowWithCloseESMCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow{X} = computeShadowWithCloseESM(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWESM{X})
            #if defined(SHADOWCUBE{X})
                shadow{X} = computeShadowWithESMCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.depthValues);
            #else
                shadow{X} = computeShadowWithESM(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.z, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPOISSON{X})
            #if defined(SHADOWCUBE{X})
                shadow{X} = computeShadowWithPoissonSamplingCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow{X} = computeShadowWithPoissonSampling(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCF{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow{X} = computeShadowWithPCF1(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow{X} = computeShadowWithPCF3(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow{X} = computeShadowWithPCF5(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.yz, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #elif defined(SHADOWPCSS{X})
            #if defined(SHADOWLOWQUALITY{X})
                shadow{X} = computeShadowWithPCSS16(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #elif defined(SHADOWMEDIUMQUALITY{X})
                shadow{X} = computeShadowWithPCSS32(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #else
                shadow{X} = computeShadowWithPCSS64(vPositionFromLight{X}, vDepthMetric{X}, depthTexture{X}, shadowTexture{X}, light{X}.shadowsInfo.y, light{X}.shadowsInfo.z, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #else
            #if defined(SHADOWCUBE{X})
                shadow{X} = computeShadowCube(vPositionW, light{X}.vLightData.xyz, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.depthValues);
            #else
                shadow{X} = computeShadow(vPositionFromLight{X}, vDepthMetric{X}, shadowTexture{X}, light{X}.shadowsInfo.x, light{X}.shadowsInfo.w);
            #endif
        #endif

        #ifdef SHADOWONLY
            #ifndef SHADOWINUSE
                #define SHADOWINUSE
            #endif
            globalShadow += shadow{X};
            shadowLightCount += 1.0;
        #endif
    #else
        shadow{X} = 1.;
    #endif

    aggShadow += shadow{X};
#endif