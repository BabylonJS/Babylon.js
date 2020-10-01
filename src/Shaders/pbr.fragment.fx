#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD) || defined(SPECULARAA) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef LODBASEDMICROSFURACE
#extension GL_EXT_shader_texture_lod : enable
#endif

#define CUSTOM_FRAGMENT_BEGIN

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<prePassDeclaration>[SCENE_MRT_COUNT]

precision highp float;

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE
#endif

// Declaration
#include<__decl__pbrFragment>
#include<pbrFragmentExtraDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<pbrFragmentSamplersDeclaration>
#include<imageProcessingDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

// Helper Functions
#include<helperFunctions>
#include<subSurfaceScatteringFunctions>
#include<importanceSampling>
#include<pbrHelperFunctions>
#include<imageProcessingFunctions>
#include<shadowsFragmentFunctions>
#include<harmonicsFunctions>
#include<pbrDirectLightingSetupFunctions>
#include<pbrDirectLightingFalloffFunctions>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
#include<pbrDirectLightingFunctions>
#include<pbrIBLFunctions>
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>

#ifdef REFLECTION
    #include<reflectionFunction>
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<pbrBlockAlbedoOpacity>
#include<pbrBlockReflectivity>
#include<pbrBlockAmbientOcclusion>
#include<pbrBlockAlphaFresnel>
#include<pbrBlockAnisotropic>
#include<pbrBlockReflection>
#include<pbrBlockSheen>
#include<pbrBlockClearcoat>
#include<pbrBlockSubSurface>

// _____________________________ MAIN FUNCTION ____________________________
void main(void) {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // _____________________________ Geometry Information ____________________________
    #include<pbrBlockNormalGeometric>

    #include<bumpFragment>

    #include<pbrBlockNormalFinal>

    // _____________________________ Albedo & Opacity ______________________________
    albedoOpacityOutParams albedoOpacityOut;

#ifdef ALBEDO
    vec4 albedoTexture = texture2D(albedoSampler, vAlbedoUV + uvOffset);
#endif

#ifdef OPACITY
    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV + uvOffset);
#endif

    albedoOpacityBlock(
        vAlbedoColor,
    #ifdef ALBEDO
        albedoTexture,
        vAlbedoInfos,
    #endif
    #ifdef OPACITY
        opacityMap,
        vOpacityInfos,
    #endif
    #ifdef DETAIL
        detailColor,
        vDetailInfos,
    #endif
        albedoOpacityOut
    );

    vec3 surfaceAlbedo = albedoOpacityOut.surfaceAlbedo;
    float alpha = albedoOpacityOut.alpha;

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

    // _____________________________ AO  _______________________________
    ambientOcclusionOutParams aoOut;

#ifdef AMBIENT
    vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb;
#endif

    ambientOcclusionBlock(
    #ifdef AMBIENT
        ambientOcclusionColorMap,
        vAmbientInfos,
    #endif
        aoOut
    );

    #include<pbrBlockLightmapInit>

#ifdef UNLIT
    vec3 diffuseBase = vec3(1., 1., 1.);
#else

    // _____________________________ Reflectivity _______________________________
    vec3 baseColor = surfaceAlbedo;

    reflectivityOutParams reflectivityOut;

#if defined(REFLECTIVITY)
    vec4 surfaceMetallicOrReflectivityColorMap = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
    vec4 baseReflectivity = surfaceMetallicOrReflectivityColorMap;
    #ifndef METALLICWORKFLOW
        surfaceMetallicOrReflectivityColorMap = toLinearSpace(surfaceMetallicOrReflectivityColorMap);
        surfaceMetallicOrReflectivityColorMap.rgb *= vReflectivityInfos.y;
    #endif
#endif

#if defined(MICROSURFACEMAP)
    vec4 microSurfaceTexel = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
#endif

#ifdef METALLICWORKFLOW
    vec4 metallicReflectanceFactors = vMetallicReflectanceFactors;
    #ifdef METALLIC_REFLECTANCE
        vec4 metallicReflectanceFactorsMap = texture2D(metallicReflectanceSampler, vMetallicReflectanceUV + uvOffset);
        metallicReflectanceFactorsMap = toLinearSpace(metallicReflectanceFactorsMap);

        metallicReflectanceFactors *= metallicReflectanceFactorsMap;
    #endif
#endif

    reflectivityBlock(
        vReflectivityColor,
    #ifdef METALLICWORKFLOW
        surfaceAlbedo,
        metallicReflectanceFactors,
    #endif
    #ifdef REFLECTIVITY
        vReflectivityInfos,
        surfaceMetallicOrReflectivityColorMap,
    #endif
    #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
        aoOut.ambientOcclusionColor,
    #endif
    #ifdef MICROSURFACEMAP
        microSurfaceTexel,
    #endif
    #ifdef DETAIL
        detailColor,
        vDetailInfos,
    #endif
        reflectivityOut
    );

    float microSurface = reflectivityOut.microSurface;
    float roughness = reflectivityOut.roughness;

    #ifdef METALLICWORKFLOW
        surfaceAlbedo = reflectivityOut.surfaceAlbedo;
    #endif
    #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
        aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
    #endif

    // _____________________________ Alpha Fresnel ___________________________________
    #ifdef ALPHAFRESNEL
        #if defined(ALPHATEST) || defined(ALPHABLEND)
            alphaFresnelOutParams alphaFresnelOut;

            alphaFresnelBlock(
                normalW,
                viewDirectionW,
                alpha,
                microSurface,
                alphaFresnelOut
            );

            alpha = alphaFresnelOut.alpha;
        #endif
    #endif

    // _____________________________ Compute Geometry info _________________________________
    #include<pbrBlockGeometryInfo>

    // _____________________________ Anisotropy _______________________________________
    #ifdef ANISOTROPIC
        anisotropicOutParams anisotropicOut;

        #ifdef ANISOTROPIC_TEXTURE
            vec3 anisotropyMapData = texture2D(anisotropySampler, vAnisotropyUV + uvOffset).rgb * vAnisotropyInfos.y;
        #endif

        anisotropicBlock(
            vAnisotropy,
        #ifdef ANISOTROPIC_TEXTURE
            anisotropyMapData,
        #endif
            TBN,
            normalW,
            viewDirectionW,
            anisotropicOut
        );
    #endif

    // _____________________________ Reflection Info _______________________________________
    #ifdef REFLECTION
        reflectionOutParams reflectionOut;

        reflectionBlock(
            vPositionW,
            normalW,
            alphaG,
            vReflectionMicrosurfaceInfos,
            vReflectionInfos,
            vReflectionColor,
        #ifdef ANISOTROPIC
            anisotropicOut,
        #endif
        #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
            NdotVUnclamped,
        #endif
        #ifdef LINEARSPECULARREFLECTION
            roughness,
        #endif
            reflectionSampler,
        #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
            vEnvironmentIrradiance,
        #endif
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                reflectionMatrix,
            #endif
        #endif
        #ifdef USEIRRADIANCEMAP
            irradianceSampler,
        #endif
        #ifndef LODBASEDMICROSFURACE
            reflectionSamplerLow,
            reflectionSamplerHigh,
        #endif
            reflectionOut
        );
    #endif

    // ___________________ Compute Reflectance aka R0 F0 info _________________________
    #include<pbrBlockReflectance0>

    // ________________________________ Sheen ______________________________
    #ifdef SHEEN
        sheenOutParams sheenOut;

        #ifdef SHEEN_TEXTURE
            vec4 sheenMapData = toLinearSpace(texture2D(sheenSampler, vSheenUV + uvOffset)) * vSheenInfos.y;
        #endif
        #if defined(SHEEN_ROUGHNESS) && defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
            vec4 sheenMapRoughnessData = texture2D(sheenRoughnessSampler, vSheenRoughnessUV + uvOffset) * vSheenInfos.w;
        #endif

        sheenBlock(
            vSheenColor,
        #ifdef SHEEN_ROUGHNESS
            vSheenRoughness,
            #if defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
                sheenMapRoughnessData,
            #endif
        #endif
            roughness,
        #ifdef SHEEN_TEXTURE
            sheenMapData,
        #endif
            reflectance,
        #ifdef SHEEN_LINKWITHALBEDO
            baseColor,
            surfaceAlbedo,
        #endif
        #ifdef ENVIRONMENTBRDF
            NdotV,
            environmentBrdf,
        #endif
        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            AARoughnessFactors,
            vReflectionMicrosurfaceInfos,
            vReflectionInfos,
            vReflectionColor,
            vLightingIntensity,
            reflectionSampler,
            reflectionOut.reflectionCoords,
            NdotVUnclamped,
            #ifndef LODBASEDMICROSFURACE
                reflectionSamplerLow,
                reflectionSamplerHigh,
            #endif
            #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
                seo,
            #endif
            #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
                eho,
            #endif
        #endif
            sheenOut
        );

        #ifdef SHEEN_LINKWITHALBEDO
            surfaceAlbedo = sheenOut.surfaceAlbedo;
        #endif
    #endif

    // _____________________________ Clear Coat ____________________________
    clearcoatOutParams clearcoatOut;

    #ifdef CLEARCOAT
        #ifdef CLEARCOAT_TEXTURE
            vec2 clearCoatMapData = texture2D(clearCoatSampler, vClearCoatUV + uvOffset).rg * vClearCoatInfos.y;
        #endif

        #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
            vec4 clearCoatMapRoughnessData = texture2D(clearCoatRoughnessSampler, vClearCoatRoughnessUV + uvOffset) * vClearCoatInfos.w;
        #endif

        #if defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
            vec4 clearCoatTintMapData = toLinearSpace(texture2D(clearCoatTintSampler, vClearCoatTintUV + uvOffset));
        #endif

        #ifdef CLEARCOAT_BUMP
            vec4 clearCoatBumpMapData = texture2D(clearCoatBumpSampler, vClearCoatBumpUV + uvOffset);
        #endif

        clearcoatBlock(
            vPositionW,
            geometricNormalW,
            viewDirectionW,
            vClearCoatParams,
            #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_TEXTURE_ROUGHNESS_IDENTICAL) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
                clearCoatMapRoughnessData,
            #endif
            specularEnvironmentR0,
        #ifdef CLEARCOAT_TEXTURE
            clearCoatMapData,
        #endif
        #ifdef CLEARCOAT_TINT
            vClearCoatTintParams,
            clearCoatColorAtDistance,
            vClearCoatRefractionParams,
            #ifdef CLEARCOAT_TINT_TEXTURE
                clearCoatTintMapData,
            #endif
        #endif
        #ifdef CLEARCOAT_BUMP
            vClearCoatBumpInfos,
            clearCoatBumpMapData,
            vClearCoatBumpUV,
            #if defined(TANGENT) && defined(NORMAL)
                vTBN,
            #else
                vClearCoatTangentSpaceParams,
            #endif
            #ifdef OBJECTSPACE_NORMALMAP
                normalMatrix,
            #endif
        #endif
        #if defined(FORCENORMALFORWARD) && defined(NORMAL)
            faceNormal,
        #endif
        #ifdef REFLECTION
            vReflectionMicrosurfaceInfos,
            vReflectionInfos,
            vReflectionColor,
            vLightingIntensity,
            reflectionSampler,
            #ifndef LODBASEDMICROSFURACE
                reflectionSamplerLow,
                reflectionSamplerHigh,
            #endif
        #endif
        #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
            #ifdef RADIANCEOCCLUSION
                ambientMonochrome,
            #endif
        #endif
            clearcoatOut
        );
    #else
        clearcoatOut.specularEnvironmentR0 = specularEnvironmentR0;
    #endif

    // _________________________ Specular Environment Reflectance __________________________
    #include<pbrBlockReflectance>

    // ___________________________________ SubSurface ______________________________________
    subSurfaceOutParams subSurfaceOut;

    #ifdef SUBSURFACE
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            vec4 thicknessMap = texture2D(thicknessSampler, vThicknessUV + uvOffset);
        #endif

        subSurfaceBlock(
            vSubSurfaceIntensity,
            vThicknessParam,
            vTintColor,
            normalW,
            specularEnvironmentReflectance,
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            thicknessMap,
        #endif
        #ifdef REFLECTION
            #ifdef SS_TRANSLUCENCY
                reflectionMatrix,
                #ifdef USESPHERICALFROMREFLECTIONMAP
                    #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                        reflectionOut.irradianceVector,
                    #endif
                #endif
                #ifdef USEIRRADIANCEMAP
                    irradianceSampler,
                #endif
            #endif
        #endif
        #ifdef SS_REFRACTION
            vPositionW,
            viewDirectionW,
            view,
            surfaceAlbedo,
            vRefractionInfos,
            refractionMatrix,
            vRefractionMicrosurfaceInfos,
            vLightingIntensity,
            #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                alpha,
            #endif
            #ifdef SS_LODINREFRACTIONALPHA
                NdotVUnclamped,
            #endif
            #ifdef SS_LINEARSPECULARREFRACTION
                roughness,
            #else
                alphaG,
            #endif
            refractionSampler,
            #ifndef LODBASEDMICROSFURACE
                refractionSamplerLow,
                refractionSamplerHigh,
            #endif
            #ifdef ANISOTROPIC
                anisotropicOut,
            #endif
        #endif
        #ifdef SS_TRANSLUCENCY
            vDiffusionDistance,
        #endif
            subSurfaceOut
        );

        #ifdef SS_REFRACTION
            surfaceAlbedo = subSurfaceOut.surfaceAlbedo;
            #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                alpha = subSurfaceOut.alpha;
            #endif
        #endif
    #else
        subSurfaceOut.specularEnvironmentReflectance = specularEnvironmentReflectance;
    #endif

    // _____________________________ Direct Lighting Info __________________________________
    #include<pbrBlockDirectLighting>

    #include<lightFragment>[0..maxSimultaneousLights]

    // _____________________________ Compute Final Lit Components ________________________
    #include<pbrBlockFinalLitComponents>
#endif // UNLIT

    #include<pbrBlockFinalUnlitComponents>

    #include<pbrBlockFinalColorComposition>

    #include<logDepthFragment>
    #include<fogFragment>(color, finalColor)
    #include<pbrBlockImageProcessing>

    #define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    #ifdef PREPASS_POSITION
    gl_FragData[PREPASS_POSITION_INDEX] = vec4(vPositionW, 1.0);
    #endif

    #ifdef PREPASS_VELOCITY
    vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
    vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    vec2 velocity = abs(a - b);
    velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    gl_FragData[PREPASS_VELOCITY_INDEX] = vec4(velocity, 0.0, 1.0);
    #endif

    #ifdef PREPASS_IRRADIANCE
        vec3 irradiance = finalDiffuse;
        #ifndef UNLIT
            #ifdef REFLECTION
                irradiance += finalIrradiance;
            #endif
        #endif

        vec3 sqAlbedo = sqrt(surfaceAlbedo); // for pre and post scatter
        gl_FragData[0] = vec4(finalColor.rgb - irradiance, finalColor.a); // Split irradiance from final color
        irradiance /= sqAlbedo;
        
        #ifndef SS_SCATTERING
            float scatteringDiffusionProfile = 255.;
        #endif
        gl_FragData[PREPASS_IRRADIANCE_INDEX] = vec4(tagLightingForSSS(irradiance), scatteringDiffusionProfile / 255.); // Irradiance + SS diffusion profile
    #else
        gl_FragData[0] = vec4(finalColor.rgb, finalColor.a);
    #endif

    #ifdef PREPASS_DEPTHNORMAL
        gl_FragData[PREPASS_DEPTHNORMAL_INDEX] = vec4(vViewPos.z, (view * vec4(normalW, 0.0)).rgb); // Linear depth + normal
    #endif

    #ifdef PREPASS_ALBEDO
        gl_FragData[PREPASS_ALBEDO_INDEX] = vec4(sqAlbedo, 1.0); // albedo, for pre and post scatter
    #endif

    #ifdef PREPASS_REFLECTIVITY
        #if defined(REFLECTIVITY)
            gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4(baseReflectivity.rgb, 1.0);
        #else
            gl_FragData[PREPASS_REFLECTIVITY_INDEX] = vec4(0.0, 0.0, 0.0, 1.0);
        #endif
    #endif
#endif

#if !defined(PREPASS) || defined(WEBGL2) 
    gl_FragColor = finalColor;
#endif
    #include<pbrDebug>
}
