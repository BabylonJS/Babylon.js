#define CUSTOM_FRAGMENT_BEGIN

#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>

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
    var albedoTexture: vec4f = texture2D(albedoSampler, vAlbedoUV + uvOffset);
#endif

#ifdef OPACITY
    var opacityMap: vec4f = texture2D(opacitySampler, vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    var decalColor: vec4f = texture2D(decalSampler, vDecalUV + uvOffset);
#endif

    albedoOpacityOut = albedoOpacityBlock(
        vAlbedoColor
    #ifdef ALBEDO
        , albedoTexture
        , vAlbedoInfos
    #endif
    #ifdef OPACITY
        , opacityMap
        , vOpacityInfos
    #endif
    #ifdef DETAIL
        , detailColor
        , vDetailInfos
    #endif
    #ifdef DECAL
        , decalColor
        , vDecalInfos
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
    var ambientOcclusionColorMap: vec3f = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb;
#endif

    aoOut = ambientOcclusionBlock(
    #ifdef AMBIENT
        ambientOcclusionColorMap,
        vAmbientInfos
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
    var surfaceMetallicOrReflectivityColorMap: vec4f = texture2D(reflectivitySampler, vReflectivityUV + uvOffset);
    var baseReflectivity: vec4f = surfaceMetallicOrReflectivityColorMap;
    #ifndef METALLICWORKFLOW
        #ifdef REFLECTIVITY_GAMMA
            surfaceMetallicOrReflectivityColorMap = toLinearSpace(surfaceMetallicOrReflectivityColorMap);
        #endif
        surfaceMetallicOrReflectivityColorMap.rgb *= vReflectivityInfos.y;
    #endif
#endif

#if defined(MICROSURFACEMAP)
    var microSurfaceTexel: vec4f = texture2D(microSurfaceSampler, vMicroSurfaceSamplerUV + uvOffset) * vMicroSurfaceSamplerInfos.y;
#endif

#ifdef METALLICWORKFLOW
    var metallicReflectanceFactors: vec4f = vMetallicReflectanceFactors;
    #ifdef REFLECTANCE
        var reflectanceFactorsMap: vec4f = texture2D(reflectanceSampler, vReflectanceUV + uvOffset);
        #ifdef REFLECTANCE_GAMMA
            reflectanceFactorsMap = toLinearSpace(reflectanceFactorsMap);
        #endif

        metallicReflectanceFactors.rgb *= reflectanceFactorsMap.rgb;
    #endif
    #ifdef METALLIC_REFLECTANCE
        var metallicReflectanceFactorsMap: vec4f = texture2D(metallicReflectanceSampler, vMetallicReflectanceUV + uvOffset);
        #ifdef METALLIC_REFLECTANCE_GAMMA
            metallicReflectanceFactorsMap = toLinearSpace(metallicReflectanceFactorsMap);
        #endif

        #ifndef METALLIC_REFLECTANCE_USE_ALPHA_ONLY
            metallicReflectanceFactors.rgb *= metallicReflectanceFactorsMap.rgb;
        #endif
        metallicReflectanceFactors *= metallicReflectanceFactorsMap.a;
    #endif
#endif

    reflectivityOut = reflectivityBlock(
        vReflectivityColor
    #ifdef METALLICWORKFLOW
        , surfaceAlbedo
        , metallicReflectanceFactors
    #endif
    #ifdef REFLECTIVITY
        , vReflectivityInfos
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
        , vDetailInfos
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
            var anisotropyMapData: vec3f = texture2D(anisotropySampler, vAnisotropyUV + uvOffset).rgb * vAnisotropyInfos.y;
        #endif

        anisotropicOut = anisotropicBlock(
            vAnisotropy,
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
                vPositionW
                , normalW
                , alphaG
                , vReflectionMicrosurfaceInfos
                , vReflectionInfos
                , vReflectionColor
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
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                , vEnvironmentIrradiance
            #endif
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                    , reflectionMatrix
                #endif
            #endif
            #ifdef USEIRRADIANCEMAP
                , irradianceSampler
            #endif
            #ifndef LODBASEDMICROSFURACE
                , reflectionSamplerLow
                , reflectionSamplerHigh
            #endif
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
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
            var sheenMapData: vec4f = texture2D(sheenSampler, vSheenUV + uvOffset);
        #endif
        #if defined(SHEEN_ROUGHNESS) && defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
            var sheenMapRoughnessData: vec4f = texture2D(sheenRoughnessSampler, vSheenRoughnessUV + uvOffset) * vSheenInfos.w;
        #endif

        sheenOut = sheenBlock(
            vSheenColor
        #ifdef SHEEN_ROUGHNESS
            , vSheenRoughness
            #if defined(SHEEN_TEXTURE_ROUGHNESS) && !defined(SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE)
                , sheenMapRoughnessData
            #endif
        #endif
            , roughness
        #ifdef SHEEN_TEXTURE
            , sheenMapData
            , vSheenInfos.y
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
            , vReflectionMicrosurfaceInfos
            , vReflectionInfos
            , vReflectionColor
            , vLightingIntensity
            , reflectionSampler
            , reflectionOut.reflectionCoords
            , NdotVUnclamped
            #ifndef LODBASEDMICROSFURACE
                , reflectionSamplerLow
                , reflectionSamplerHigh
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
            var clearCoatMapData: vec2f = texture2D(clearCoatSampler, vClearCoatUV + uvOffset).rg * vClearCoatInfos.y;
        #endif
    #endif

    // _____________________________ Iridescence ____________________________
    #ifdef IRIDESCENCE
        var iridescenceOut: iridescenceOutParams;

        #ifdef IRIDESCENCE_TEXTURE
            var iridescenceMapData: vec2f = texture2D(iridescenceSampler, vIridescenceUV + uvOffset).rg * vIridescenceInfos.y;
        #endif
        #ifdef IRIDESCENCE_THICKNESS_TEXTURE
            var iridescenceThicknessMapData: vec2f = texture2D(iridescenceThicknessSampler, vIridescenceThicknessUV + uvOffset).rg * vIridescenceInfos.w;
        #endif

        iridescenceOut = iridescenceBlock(
            vIridescenceParams
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
            var clearCoatMapRoughnessData: vec4f = texture2D(clearCoatRoughnessSampler, vClearCoatRoughnessUV + uvOffset) * vClearCoatInfos.w;
        #endif

        #if defined(CLEARCOAT_TINT) && defined(CLEARCOAT_TINT_TEXTURE)
            var clearCoatTintMapData: vec4f = texture2D(clearCoatTintSampler, vClearCoatTintUV + uvOffset);
        #endif

        #ifdef CLEARCOAT_BUMP
            var clearCoatBumpMapData: vec4f = texture2D(clearCoatBumpSampler, vClearCoatBumpUV + uvOffset);
        #endif

        clearcoatOut = clearcoatBlock(
            vPositionW
            , geometricNormalW
            , viewDirectionW
            , vClearCoatParams
            #if defined(CLEARCOAT_TEXTURE_ROUGHNESS) && !defined(CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE)
                , clearCoatMapRoughnessData
            #endif
            , specularEnvironmentR0
        #ifdef CLEARCOAT_TEXTURE
            , clearCoatMapData
        #endif
        #ifdef CLEARCOAT_TINT
            , vClearCoatTintParams
            , clearCoatColorAtDistance
            , vClearCoatRefractionParams
            #ifdef CLEARCOAT_TINT_TEXTURE
                , clearCoatTintMapData
            #endif
        #endif
        #ifdef CLEARCOAT_BUMP
            , vClearCoatBumpInfos
            , clearCoatBumpMapData
            , vClearCoatBumpUV
            #if defined(TANGENT) && defined(NORMAL)
                , vTBN
            #else
                , vClearCoatTangentSpaceParams
            #endif
            #ifdef OBJECTSPACE_NORMALMAP
                , normalMatrix
            #endif
        #endif
        #if defined(FORCENORMALFORWARD) && defined(NORMAL)
            , faceNormal
        #endif
        #ifdef REFLECTION
            , vReflectionMicrosurfaceInfos
            , vReflectionInfos
            , vReflectionColor
            , vLightingIntensity
            , reflectionSampler
            #ifndef LODBASEDMICROSFURACE
                , reflectionSamplerLow
                , reflectionSamplerHigh
            #endif
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
        #endif
        #if defined(ENVIRONMENTBRDF) && !defined(REFLECTIONMAP_SKYBOX)
            #ifdef RADIANCEOCCLUSION
                , ambientMonochrome
            #endif
        #endif
        #if defined(CLEARCOAT_BUMP) || defined(TWOSIDEDLIGHTING)
            , (gl_FrontFacing ? 1. : -1.)
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
            var thicknessMap: vec4f = texture2D(thicknessSampler, vThicknessUV + uvOffset);
        #endif

        #ifdef SS_REFRACTIONINTENSITY_TEXTURE
            var refractionIntensityMap: vec4f = texture2D(refractionIntensitySampler, vRefractionIntensityUV + uvOffset);
        #endif

        #ifdef SS_TRANSLUCENCYINTENSITY_TEXTURE
            var translucencyIntensityMap: vec4f = texture2D(translucencyIntensitySampler, vTranslucencyIntensityUV + uvOffset);
        #endif

        #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
            var translucencyColorMap: vec4f = texture2D(translucencyColorSampler, vTranslucencyColorUV + uvOffset);
        #endif

        subSurfaceOut = subSurfaceBlock(
            vSubSurfaceIntensity
            , vThicknessParam
            , vTintColor
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
                , reflectionMatrix
                #ifdef USESPHERICALFROMREFLECTIONMAP
                    #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                        , reflectionOut.irradianceVector
                    #endif
                    #if defined(REALTIME_FILTERING)
                        , reflectionSampler
                        , vReflectionFilteringInfo
                    #endif
                #endif
                #ifdef USEIRRADIANCEMAP
                    , irradianceSampler
                #endif
            #endif
        #endif
        #if defined(SS_REFRACTION) || defined(SS_TRANSLUCENCY)
            , surfaceAlbedo
        #endif
        #ifdef SS_REFRACTION
            , vPositionW
            , viewDirectionW
            , view
            , vRefractionInfos
            , refractionMatrix
            , vRefractionMicrosurfaceInfos
            , vLightingIntensity
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
            #ifndef LODBASEDMICROSFURACE
                , refractionSamplerLow
                , refractionSamplerHigh
            #endif
            #ifdef ANISOTROPIC
                , anisotropicOut
            #endif
            #ifdef REALTIME_FILTERING
                , vRefractionFilteringInfo
            #endif
            #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                , vRefractionPosition
                , vRefractionSize
            #endif
            #ifdef SS_DISPERSION
                , dispersion
            #endif
        #endif
        #ifdef SS_TRANSLUCENCY
            , vDiffusionDistance
            , vTranslucencyColor
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
    var writeGeometryInfo: f32 = finalColor.a > 0.4 ? 1.0 : 0.0;

    #ifdef PREPASS_POSITION
    gl_FragData[PREPASS_POSITION_INDEX] =  vec4f(vPositionW, writeGeometryInfo);
    #endif

    #ifdef PREPASS_VELOCITY
    var a: vec2f = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
    var b: vec2f = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    var velocity: vec2f = abs(a - b);
    velocity =  vec2f(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    gl_FragData[PREPASS_VELOCITY_INDEX] =  vec4f(velocity, 0.0, writeGeometryInfo);
    #endif

    #ifdef PREPASS_ALBEDO_SQRT
        var sqAlbedo: vec3f = sqrt(surfaceAlbedo); // for pre and post scatter
    #endif

    #ifdef PREPASS_IRRADIANCE
        var irradiance: vec3f = finalDiffuse;
        #ifndef UNLIT
            #ifdef REFLECTION
                irradiance += finalIrradiance;
            #endif
        #endif

        #ifdef SS_SCATTERING
            gl_FragData[0] =  vec4f(finalColor.rgb - irradiance, finalColor.a); // Split irradiance from final color
            irradiance /= sqAlbedo;
        #else
            gl_FragData[0] = finalColor; // No split lighting
            var scatteringDiffusionProfile: f32 = 255.;
        #endif

        gl_FragData[PREPASS_IRRADIANCE_INDEX] =  vec4f(clamp(irradiance,  vec3f(0.),  vec3f(1.)), writeGeometryInfo * scatteringDiffusionProfile / 255.); // Irradiance + SS diffusion profile
    #else
        gl_FragData[0] =  vec4f(finalColor.rgb, finalColor.a);
    #endif

    #ifdef PREPASS_DEPTH
        gl_FragData[PREPASS_DEPTH_INDEX] =  vec4f(vViewPos.z, 0.0, 0.0, writeGeometryInfo); // Linear depth
    #endif

    #ifdef PREPASS_NORMAL
        #ifdef PREPASS_NORMAL_WORLDSPACE
            gl_FragData[PREPASS_NORMAL_INDEX] =  vec4f(normalW, writeGeometryInfo); // Normal
        #else
            gl_FragData[PREPASS_NORMAL_INDEX] =  vec4f(normalize((view *  vec4f(normalW, 0.0)).rgb), writeGeometryInfo); // Normal
        #endif
    #endif

    #ifdef PREPASS_ALBEDO_SQRT
        gl_FragData[PREPASS_ALBEDO_SQRT_INDEX] =  vec4f(sqAlbedo, writeGeometryInfo); // albedo, for pre and post scatter
    #endif

    #ifdef PREPASS_REFLECTIVITY
        #ifndef UNLIT
            gl_FragData[PREPASS_REFLECTIVITY_INDEX] =  vec4f(specularEnvironmentR0, microSurface) * writeGeometryInfo;
        #else
            gl_FragData[PREPASS_REFLECTIVITY_INDEX] =  vec4f( 0.0, 0.0, 0.0, 1.0 ) * writeGeometryInfo;
        #endif
    #endif
#endif

#if !defined(PREPASS) || defined(WEBGL2)
    gl_FragColor = finalColor;
#endif

    #include<oitFragment>

#if ORDER_INDEPENDENT_TRANSPARENCY
	if (fragDepth == nearestDepth) {
		frontColor.rgb += finalColor.rgb * finalColor.a * alphaMultiplier;
        // Cancels the 1 - a initial value operation
		frontColor.a = 1.0 - alphaMultiplier * (1.0 - finalColor.a);
	} else {
		backColor += finalColor;
	}
#endif

    #include<pbrDebug>

    #define CUSTOM_FRAGMENT_MAIN_END

}
