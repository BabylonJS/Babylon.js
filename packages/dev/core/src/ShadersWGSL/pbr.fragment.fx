#define CUSTOM_FRAGMENT_BEGIN

#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE
#endif

// Declaration
#include<pbrUboDeclaration>

#include<pbrFragmentExtraDeclaration>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
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
#include<pbrBlockIridescence>
#include<pbrBlockSubSurface>

// _____________________________ MAIN FUNCTION ____________________________
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // _____________________________ Geometry Information ____________________________
    #include<pbrBlockNormalGeometric>

    #include<bumpFragment>

    #include<pbrBlockNormalFinal>

    // _____________________________ Albedo & Opacity ______________________________
    var albedoOpacityOut: albedoOpacityOutParams;

#ifdef ALBEDO
    var albedoTexture: vec4f = textureSample(albedoSampler, albedoSamplerSampler, fragmentInputs.vAlbedoUV + uvOffset);
#endif

#ifdef OPACITY
    var opacityMap: vec4f = textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    var decalColor: vec4f = textureSample(decalSampler, decalSamplerSampler, fragmentInputs.vDecalUV + uvOffset);
#endif

    albedoOpacityOut = albedoOpacityBlock(
        uniforms.vAlbedoColor
    #ifdef ALBEDO
        , albedoTexture
        , uniforms.vAlbedoInfos
    #endif
    #ifdef OPACITY
        , opacityMap
        , uniforms.vOpacityInfos
    #endif
    #ifdef DETAIL
        , detailColor
        , uniforms.vDetailInfos
    #endif
    #ifdef DECAL
        , decalColor
        , uniforms.vDecalInfos
    #endif
    );

    var surfaceAlbedo: vec3f = albedoOpacityOut.surfaceAlbedo;
    var alpha: f32 = albedoOpacityOut.alpha;

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

    // _____________________________ AO  _______________________________
    var aoOut: ambientOcclusionOutParams;

#ifdef AMBIENT
    var ambientOcclusionColorMap: vec3f = textureSample(ambientSampler, ambientSamplerSampler, fragmentInputs.vAmbientUV + uvOffset).rgb;
#endif

    aoOut = ambientOcclusionBlock(
    #ifdef AMBIENT
        ambientOcclusionColorMap,
        uniforms.vAmbientInfos
    #endif        
    );

    #include<pbrBlockLightmapInit>

#ifdef UNLIT
    var diffuseBase: vec3f =  vec3f(1., 1., 1.);
#else

    // _____________________________ Reflectivity _______________________________
    var baseColor: vec3f = surfaceAlbedo;

    var reflectivityOut: reflectivityOutParams;

#if defined(REFLECTIVITY)
    var surfaceMetallicOrReflectivityColorMap: vec4f = textureSample(reflectivitySampler, reflectivitySamplerSampler, fragmentInputs.vReflectivityUV + uvOffset);
    var baseReflectivity: vec4f = surfaceMetallicOrReflectivityColorMap;
    #ifndef METALLICWORKFLOW
        #ifdef REFLECTIVITY_GAMMA
            surfaceMetallicOrReflectivityColorMap = toLinearSpaceVec4(surfaceMetallicOrReflectivityColorMap);
        #endif
        surfaceMetallicOrReflectivityColorMap = vec4f(surfaceMetallicOrReflectivityColorMap.rgb * uniforms.vReflectivityInfos.y, surfaceMetallicOrReflectivityColorMap.a);
    #endif
#endif

#if defined(MICROSURFACEMAP)
    var microSurfaceTexel: vec4f = textureSample(microSurfaceSampler, microSurfaceSamplerSampler, fragmentInputs.vMicroSurfaceSamplerUV + uvOffset) * uniforms.vMicroSurfaceSamplerInfos.y;
#endif

#ifdef METALLICWORKFLOW
    var metallicReflectanceFactors: vec4f = uniforms.vMetallicReflectanceFactors;
    #ifdef REFLECTANCE
        var reflectanceFactorsMap: vec4f = textureSample(reflectanceSampler, reflectanceSamplerSampler, fragmentInputs.vReflectanceUV + uvOffset);
        #ifdef REFLECTANCE_GAMMA
            reflectanceFactorsMap = toLinearSpaceVec4(reflectanceFactorsMap);
        #endif

        metallicReflectanceFactors = vec4f(metallicReflectanceFactors.rgb * reflectanceFactorsMap.rgb, metallicReflectanceFactors.a);
    #endif
    #ifdef METALLIC_REFLECTANCE
        var metallicReflectanceFactorsMap: vec4f = textureSample(metallicReflectanceSampler, metallicReflectanceSamplerSampler, fragmentInputs.vMetallicReflectanceUV + uvOffset);
        #ifdef METALLIC_REFLECTANCE_GAMMA
            metallicReflectanceFactorsMap = toLinearSpaceVec4(metallicReflectanceFactorsMap);
        #endif

        #ifndef METALLIC_REFLECTANCE_USE_ALPHA_ONLY
            metallicReflectanceFactors = vec4f(metallicReflectanceFactors.rgb * metallicReflectanceFactorsMap.rgb, metallicReflectanceFactors.a);
        #endif
        metallicReflectanceFactors *= metallicReflectanceFactorsMap.a;
    #endif
#endif

    reflectivityOut = reflectivityBlock(
        uniforms.vReflectivityColor
    #ifdef METALLICWORKFLOW
        , surfaceAlbedo
        , metallicReflectanceFactors
    #endif
    #ifdef REFLECTIVITY
        , uniforms.vReflectivityInfos
        , surfaceMetallicOrReflectivityColorMap
    #endif
    #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
        , aoOut.ambientOcclusionColor
    #endif
    #ifdef MICROSURFACEMAP
        , microSurfaceTexel
    #endif
    #ifdef DETAIL
        , detailColor
        , uniforms.vDetailInfos
    #endif
    );

    var microSurface: f32 = reflectivityOut.microSurface;
    var roughness: f32 = reflectivityOut.roughness;

    #ifdef METALLICWORKFLOW
        surfaceAlbedo = reflectivityOut.surfaceAlbedo;
    #endif
    #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
        aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
    #endif

    // _____________________________ Alpha Fresnel ___________________________________
    #ifdef ALPHAFRESNEL
        #if defined(ALPHATEST) || defined(ALPHABLEND)
            var alphaFresnelOut: alphaFresnelOutParams;

            alphaFresnelOut = alphaFresnelBlock(
                normalW,
                viewDirectionW,
                alpha,
                microSurface
            );

            alpha = alphaFresnelOut.alpha;
        #endif
    #endif

    // _____________________________ Compute Geometry info _________________________________
    #include<pbrBlockGeometryInfo>

    // _____________________________ Anisotropy _______________________________________
    #ifdef ANISOTROPIC
        var anisotropicOut: anisotropicOutParams;

        #ifdef ANISOTROPIC_TEXTURE
            var anisotropyMapData: vec3f = textureSample(anisotropySampler, anisotropySamplerSampler, fragmentInputs.vAnisotropyUV + uvOffset).rgb * uniforms.vAnisotropyInfos.y;
        #endif

        anisotropicOut = anisotropicBlock(
            uniforms.vAnisotropy,
            roughness,
        #ifdef ANISOTROPIC_TEXTURE
            anisotropyMapData,
        #endif
            TBN,
            normalW,
            viewDirectionW            
        );
    #endif

    // _____________________________ Reflection Info _______________________________________
    #ifdef REFLECTION
        var reflectionOut: reflectionOutParams;

        #ifndef USE_CUSTOM_REFLECTION
            reflectionOut = reflectionBlock(
                fragmentInputs.vPositionW
                , normalW
                , alphaG
                , uniforms.vReflectionMicrosurfaceInfos
                , uniforms.vReflectionInfos
                , uniforms.vReflectionColor
            #ifdef ANISOTROPIC
                , anisotropicOut
            #endif
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                , NdotVUnclamped
            #endif
            #ifdef LINEARSPECULARREFLECTION
                , roughness
            #endif
                , reflectionSampler
                , reflectionSamplerSampler
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                , fragmentInputs.vEnvironmentIrradiance
            #endif
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                    , uniforms.reflectionMatrix
                #endif
            #endif
            #ifdef USEIRRADIANCEMAP
                , irradianceSampler
                , irradianceSamplerSampler
            #endif
            #ifndef LODBASEDMICROSFURACE
                , reflectionLowSampler
                , reflectionLowSamplerSampler
                , reflectionHighSampler
                , reflectionHighSamplerSampler
            #endif
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
            #endif
            );
        #else
            #define CUSTOM_REFLECTION
        #endif
    #endif

    // ___________________ Compute Reflectance aka R0 F0 info _________________________
    #include<pbrBlockReflectance0>

    // ________________________________ Sheen ______________________________
    #ifdef SHEEN
        var sheenOut: sheenOutParams;

        #ifdef SHEEN_TEXTURE
            var sheenMapData: vec4f = textureSample(sheenSampler, sheenSamplerSampler, fragmentInputs.vSheenUV + uvOffset);
        #endif
        #if defined(SHEEN_ROUGHNESS) && defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
            var sheenMapRoughnessData: vec4f = textureSample(sheenRoughnessSampler, sheenRoughnessSamplerSampler, fragmentInputs.vSheenRoughnessUV + uvOffset) * uniforms.vSheenInfos.w;
        #endif

        sheenOut = sheenBlock(
            uniforms.vSheenColor
        #ifdef SHEEN_ROUGHNESS
            , uniforms.vSheenRoughness
            #if defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
                , sheenMapRoughnessData
            #endif
        #endif
            , roughness
        #ifdef SHEEN_TEXTURE
            , sheenMapData
            , uniforms.vSheenInfos.y
        #endif
            , reflectance
        #ifdef SHEEN_LINKWITHALBEDO
            , baseColor
            , surfaceAlbedo
        #endif
        #ifdef ENVIRONMENTBRDF
            , NdotV
            , environmentBrdf
        #endif
        #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
            , AARoughnessFactors
            , uniforms.vReflectionMicrosurfaceInfos
            , uniforms.vReflectionInfos
            , uniforms.vReflectionColor
            , uniforms.vLightingIntensity
            , reflectionSampler
            , reflectionSamplerSampler
            , reflectionOut.reflectionCoords
            , NdotVUnclamped
            #ifndef LODBASEDMICROSFURACE
                , reflectionLowSampler
                , reflectionLowSamplerSampler
                , reflectionHighSampler
                , reflectionHighSamplerSampler
            #endif
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
            #if !defined(REFLECTIONMAP_SKYBOX) && defined(RADIANCEOCCLUSION)
                , seo
            #endif
            #if !defined(REFLECTIONMAP_SKYBOX) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(REFLECTIONMAP_3D)
                , eho
            #endif
        #endif
        );

        #ifdef SHEEN_LINKWITHALBEDO
            surfaceAlbedo = sheenOut.surfaceAlbedo;
        #endif
    #endif

    // _____________ Shared Iridescence and Clear Coat data _________________
    #ifdef CLEARCOAT
        #ifdef CLEARCOAT_TEXTURE
            var clearCoatMapData: vec2f = textureSample(clearCoatSampler, clearCoatSamplerSampler, fragmentInputs.vClearCoatUV + uvOffset).rg * uniforms.vClearCoatInfos.y;
        #endif
    #endif

    // _____________________________ Iridescence ____________________________
    #ifdef IRIDESCENCE
        var iridescenceOut: iridescenceOutParams;

        #ifdef IRIDESCENCE_TEXTURE
            var iridescenceMapData: vec2f = textureSample(iridescenceSampler, iridescenceSamplerSampler, fragmentInputs.vIridescenceUV + uvOffset).rg * vIridescenceInfos.y;
        #endif
        #ifdef IRIDESCENCE_THICKNESS_TEXTURE
            var iridescenceThicknessMapData: vec2f = textureSample(iridescenceThicknessSampler, iridescenceThicknessSamplerSampler, fragmentInputs.vIridescenceThicknessUV + uvOffset).rg * vIridescenceInfos.w;
        #endif

        iridescenceOut = iridescenceBlock(
            uniforms.vIridescenceParams
            , NdotV
            , specularEnvironmentR0
            #ifdef IRIDESCENCE_TEXTURE
                , iridescenceMapData
            #endif
            #ifdef IRIDESCENCE_THICKNESS_TEXTURE
                , iridescenceThicknessMapData
            #endif
            #ifdef CLEARCOAT
                , NdotVUnclamped
                #ifdef CLEARCOAT_TEXTURE
                    , clearCoatMapData
                #endif
            #endif
        );

        var iridescenceIntensity: f32 = iridescenceOut.iridescenceIntensity;
        specularEnvironmentR0 = iridescenceOut.specularEnvironmentR0;
    #endif

    // _____________________________ Clear Coat ____________________________
    var clearcoatOut: clearcoatOutParams;

    #ifdef CLEARCOAT
        #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
            var clearCoatMapRoughnessData: vec4f = textureSample(clearCoatRoughnessSampler, clearCoatRoughnessSamplerSampler, fragmentInputs.vClearCoatRoughnessUV + uvOffset) * uniforms.vClearCoatInfos.w;
        #endif

        #if defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
            var clearCoatTintMapData: vec4f = textureSample(clearCoatTintSampler, clearCoatTintSamplerSampler, fragmentInputs.vClearCoatTintUV + uvOffset);
        #endif

        #ifdef CLEARCOAT_BUMP
            var clearCoatBumpMapData: vec4f = textureSample(clearCoatBumpSampler, clearCoatBumpSamplerSampler, fragmentInputs.vClearCoatBumpUV + uvOffset);
        #endif

        clearcoatOut = clearcoatBlock(
            fragmentInputs.vPositionW
            , geometricNormalW
            , viewDirectionW
            , uniforms.vClearCoatParams
            #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
                , clearCoatMapRoughnessData
            #endif
            , specularEnvironmentR0
        #ifdef CLEARCOAT_TEXTURE
            , clearCoatMapData
        #endif
        #ifdef CLEARCOAT_TINT
            , uniforms.vClearCoatTintParams
            , uniforms.clearCoatColorAtDistance
            , uniforms.vClearCoatRefractionParams
            #ifdef CLEARCOAT_TINT_TEXTURE
                , clearCoatTintMapData
            #endif
        #endif
        #ifdef CLEARCOAT_BUMP
            , uniforms.vClearCoatBumpInfos
            , clearCoatBumpMapData
            , fragmentInputs.vClearCoatBumpUV
            #if defined(TANGENT) && defined(NORMAL)
                , vTBN
            #else
                , uniforms.vClearCoatTangentSpaceParams
            #endif
            #ifdef OBJECTSPACE_NORMALMAP
                , uniforms.normalMatrix
            #endif
        #endif
        #if defined(FORCENORMALFORWARD) && defined(NORMAL)
            , faceNormal
        #endif
        #ifdef REFLECTION
            , uniforms.vReflectionMicrosurfaceInfos
            , uniforms.vReflectionInfos
            , uniforms.vReflectionColor
            , uniforms.vLightingIntensity
            , reflectionSampler
            , reflectionSamplerSampler
            #ifndef LODBASEDMICROSFURACE
                , reflectionLowSampler
                , reflectionLowSamplerSampler
                , reflectionHighSampler
                , reflectionHighSamplerSampler
            #endif
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
            #endif
        #endif
        #if defined(CLEARCOAT_BUMP) || defined(TWOSIDEDLIGHTING)
            , select(-1., 1., fragmentInputs.frontFacing)
        #endif
        );
    #else
        clearcoatOut.specularEnvironmentR0 = specularEnvironmentR0;
    #endif

    // _________________________ Specular Environment Reflectance __________________________
    #include<pbrBlockReflectance>

    // ___________________________________ SubSurface ______________________________________
    var subSurfaceOut: subSurfaceOutParams;

    #ifdef SUBSURFACE
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            var thicknessMap: vec4f = textureSample(thicknessSampler, thicknessSamplerSampler, fragmentInputs.vThicknessUV + uvOffset);
        #endif

        #ifdef SS_REFRACTIONINTENSITY_TEXTURE
            var refractionIntensityMap: vec4f = textureSample(refractionIntensitySampler, refractionIntensitySamplerSampler, fragmentInputs.vRefractionIntensityUV + uvOffset);
        #endif

        #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
            var translucencyIntensityMap: vec4f = textureSample(translucencyIntensitySampler, translucencyIntensitySamplerSampler, fragmentInputs.vTranslucencyIntensityUV + uvOffset);
        #endif

        #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
            var translucencyColorMap: vec4f = textureSample(translucencyColorSampler, translucencyColorSamplerSampler, fragmentInputs.vTranslucencyColorUV + uvOffset);
        #endif

        subSurfaceOut = subSurfaceBlock(
            uniforms.vSubSurfaceIntensity
            , uniforms.vThicknessParam
            , uniforms.vTintColor
            , normalW
            , specularEnvironmentReflectance
        #ifdef SS_THICKNESSANDMASK_TEXTURE
            , thicknessMap
        #endif
        #ifdef SS_REFRACTIONINTENSITY_TEXTURE
            , refractionIntensityMap
        #endif
        #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
            , translucencyIntensityMap
        #endif
        #ifdef REFLECTION
            #ifdef SS_TRANSLUCENCY
                , uniforms.reflectionMatrix
                #ifdef USESPHERICALFROMREFLECTIONMAP
                    #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                        , reflectionOut.irradianceVector
                    #endif
                    #if defined(REALTIME_FILTERING)
                        , reflectionSampler
                        , reflectionSamplerSampler
                        , vReflectionFilteringInfo
                    #endif
                #endif
                #ifdef USEIRRADIANCEMAP
                    , irradianceSampler
                    , irradianceSamplerSampler
                #endif
            #endif
        #endif
        #if defined(SS_REFRACTION) || defined(SS_TRANSLUCENCY)
            , surfaceAlbedo
        #endif
        #ifdef SS_REFRACTION
            , fragmentInputs.vPositionW
            , viewDirectionW
            , scene.view
            , uniforms.vRefractionInfos
            , uniforms.refractionMatrix
            , uniforms.vRefractionMicrosurfaceInfos
            , uniforms.vLightingIntensity
            #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                , alpha
            #endif
            #ifdef SS_LODINREFRACTIONALPHA
                , NdotVUnclamped
            #endif
            #ifdef SS_LINEARSPECULARREFRACTION
                , roughness
            #endif
            , alphaG
            , refractionSampler
            , refractionSamplerSampler
            #ifndef LODBASEDMICROSFURACE
                , refractionLowSampler
                , refractionLowSamplerSampler
                , refractionHighSampler
                , refractionHighSamplerSampler
            #endif
            #ifdef ANISOTROPIC
                , anisotropicOut
            #endif
            #ifdef REALTIME_FILTERING
                , uniforms.vRefractionFilteringInfo
            #endif
            #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                , uniforms.vRefractionPosition
                , uniforms.vRefractionSize
            #endif
            #ifdef SS_DISPERSION
                , dispersion
            #endif
        #endif
        #ifdef SS_TRANSLUCENCY
            , uniforms.vDiffusionDistance
            , uniforms.vTranslucencyColor
            #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
                , translucencyColorMap
            #endif
        #endif
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

    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION

    #include<pbrBlockFinalColorComposition>

    #include<logDepthFragment>
    #include<fogFragment>(color, finalColor)
    #include<pbrBlockImageProcessing>

    #define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    var writeGeometryInfo: f32 = select(0.0, 1.0, finalColor.a > ALPHATESTVALUE);
    var fragData: array<vec4<f32>, SCENE_MRT_COUNT>;

    #ifdef PREPASS_POSITION
    fragData[PREPASS_POSITION_INDEX] =  vec4f(fragmentInputs.vPositionW, writeGeometryInfo);
    #endif

    #ifdef PREPASS_LOCAL_POSITION
    fragData[PREPASS_LOCAL_POSITION_INDEX] =
        vec4f(fragmentInputs.vPosition, writeGeometryInfo);
#endif

#ifdef PREPASS_VELOCITY
    var a: vec2f = (fragmentInputs.vCurrentPosition.xy / fragmentInputs.vCurrentPosition.w) * 0.5 + 0.5;
    var b: vec2f = (fragmentInputs.vPreviousPosition.xy / fragmentInputs.vPreviousPosition.w) * 0.5 + 0.5;

    var velocity: vec2f = abs(a - b);
    velocity =  vec2f(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    fragData[PREPASS_VELOCITY_INDEX] =  vec4f(velocity, 0.0, writeGeometryInfo);
#elif defined(PREPASS_VELOCITY_LINEAR)
    var velocity : vec2f = vec2f(0.5) * ((fragmentInputs.vPreviousPosition.xy /
                                          fragmentInputs.vPreviousPosition.w) -
                                         (fragmentInputs.vCurrentPosition.xy /
                                          fragmentInputs.vCurrentPosition.w));
    fragData[PREPASS_VELOCITY_LINEAR_INDEX] =
        vec4f(velocity, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_ALBEDO_SQRT
    var sqAlbedo : vec3f = sqrt(surfaceAlbedo); // for pre and post scatter
#endif

#ifdef PREPASS_IRRADIANCE
    var irradiance : vec3f = finalDiffuse;
#ifndef UNLIT
#ifdef REFLECTION
    irradiance += finalIrradiance;
#endif
#endif

#ifdef SS_SCATTERING
    fragData[0] = vec4f(finalColor.rgb - irradiance,
                        finalColor.a); // Split irradiance from final color
    irradiance /= sqAlbedo;
#else
    fragData[0] = finalColor; // No split lighting
    var scatteringDiffusionProfile : f32 = 255.;
#endif

    fragData[PREPASS_IRRADIANCE_INDEX] =
        vec4f(clamp(irradiance, vec3f(0.), vec3f(1.)),
              writeGeometryInfo * scatteringDiffusionProfile /
                  255.); // Irradiance + SS diffusion profile
#else
    fragData[0] = vec4f(finalColor.rgb, finalColor.a);
#endif

#ifdef PREPASS_DEPTH
    fragData[PREPASS_DEPTH_INDEX] = vec4f(fragmentInputs.vViewPos.z, 0.0, 0.0,
                                          writeGeometryInfo); // Linear depth
#endif

#ifdef PREPASS_SCREENSPACE_DEPTH
    fragData[PREPASS_SCREENSPACE_DEPTH_INDEX] =
        vec4f(fragmentInputs.position.z, 0.0, 0.0, writeGeometryInfo);
#endif

#ifdef PREPASS_NORMAL
#ifdef PREPASS_NORMAL_WORLDSPACE
    fragData[PREPASS_NORMAL_INDEX] =
        vec4f(normalW, writeGeometryInfo); // Normal
#else
    fragData[PREPASS_NORMAL_INDEX] =
        vec4f(normalize((scene.view * vec4f(normalW, 0.0)).rgb),
              writeGeometryInfo); // Normal
#endif
#endif

#ifdef PREPASS_WORLD_NORMAL
    fragData[PREPASS_WORLD_NORMAL_INDEX] = vec4f(normalW * 0.5 + 0.5, writeGeometryInfo); // Normal
#endif

#ifdef PREPASS_ALBEDO_SQRT
    fragData[PREPASS_ALBEDO_SQRT_INDEX] =
        vec4f(sqAlbedo, writeGeometryInfo); // albedo, for pre and post scatter
#endif

#ifdef PREPASS_REFLECTIVITY
#ifndef UNLIT
    fragData[PREPASS_REFLECTIVITY_INDEX] =
        vec4f(specularEnvironmentR0, microSurface) * writeGeometryInfo;
#else
    fragData[PREPASS_REFLECTIVITY_INDEX] =
        vec4f(0.0, 0.0, 0.0, 1.0) * writeGeometryInfo;
#endif
#endif

#if SCENE_MRT_COUNT > 0
    fragmentOutputs.fragData0 = fragData[0];
#endif
#if SCENE_MRT_COUNT > 1
    fragmentOutputs.fragData1 = fragData[1];
#endif
#if SCENE_MRT_COUNT > 2
    fragmentOutputs.fragData2 = fragData[2];
#endif
#if SCENE_MRT_COUNT > 3
    fragmentOutputs.fragData3 = fragData[3];
#endif
#if SCENE_MRT_COUNT > 4
    fragmentOutputs.fragData4 = fragData[4];
#endif
#if SCENE_MRT_COUNT > 5
    fragmentOutputs.fragData5 = fragData[5];
#endif
#if SCENE_MRT_COUNT > 6
    fragmentOutputs.fragData6 = fragData[6];
#endif
#if SCENE_MRT_COUNT > 7
    fragmentOutputs.fragData7 = fragData[7];
#endif
#endif

#if !defined(PREPASS) && !defined(ORDER_INDEPENDENT_TRANSPARENCY)
    fragmentOutputs.color = finalColor;
#endif

    #include<oitFragment>

#if ORDER_INDEPENDENT_TRANSPARENCY
	if (fragDepth == nearestDepth) {
		fragmentOutputs.frontColor = vec4f(fragmentOutputs.frontColor.rgb + finalColor.rgb * finalColor.a * alphaMultiplier, 1.0 - alphaMultiplier * (1.0 - finalColor.a));
	} else {
		fragmentOutputs.backColor += finalColor;
	}
#endif

    #include<pbrDebug>

    #define CUSTOM_FRAGMENT_MAIN_END

}