#define OPENPBR_FRAGMENT_SHADER

#define CUSTOM_FRAGMENT_EXTENSION

#if defined(BUMP) || !defined(NORMAL) || defined(FORCENORMALFORWARD) || defined(SPECULARAA)
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
#include<oitDeclaration>

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE
#endif

// Declaration
#include<__decl__openpbrFragment>

#include<pbrFragmentExtraDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<openpbrFragmentSamplersDeclaration>
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

#include<openpbrBlockAlbedoOpacity>
#include<openpbrBlockReflectivity>
#include<pbrBlockAmbientOcclusion>
#include<pbrBlockAlphaFresnel>
#include<pbrBlockReflection>

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

#ifdef BASE_COLOR
    vec4 baseColorFromTexture = texture2D(baseColorSampler, vBaseColorUV + uvOffset);
#endif

#ifdef BASE_WEIGHT
    vec4 baseWeightFromTexture = texture2D(baseWeightSampler, vBaseWeightUV + uvOffset);
#endif

#ifdef OPACITY
    vec4 opacityMap = texture2D(opacitySampler, vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    vec4 decalColor = texture2D(decalSampler, vDecalUV + uvOffset);
#endif

    albedoOpacityOut = albedoOpacityBlock(
        vBaseColor
    #ifdef BASE_COLOR
        , baseColorFromTexture
        , vBaseColorInfos
    #endif
        , baseWeight
    #ifdef BASE_WEIGHT
        , baseWeightFromTexture
        , vBaseWeightInfos
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

    vec3 surfaceAlbedo = albedoOpacityOut.surfaceAlbedo;
    float alpha = albedoOpacityOut.alpha;

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS


// MPBR	=mix(Sambient-medium,Msurface,α)	whereα	=geometry_opacity
// Msurface	=layer(Mcoated-base,Sfuzz,F)	whereF	=fuzz_weight
// Mcoated-base	=layer(Mbase,Scoat,C)	whereC	=coat_weight

// Mbase	=mix(Mdielectric-base,Smetal,M)	whereM	=base_metalness
// Mdielectric-base	=mix(Mopaque-base,Stranslucent-base,T)	whereT	=transmission_weight
// Mopaque-base	=mix(Mglossy-diffuse,Ssubsurface,S)	whereS	=subsurface_weight
// Mglossy-diffuse	=layer(Sdiffuse,Sgloss)



    // _____________________________ AO  _______________________________
    ambientOcclusionOutParams aoOut;

#ifdef AMBIENT
    vec3 ambientOcclusionColorMap = texture2D(ambientSampler, vAmbientUV + uvOffset).rgb;
#endif

    aoOut = ambientOcclusionBlock(
    #ifdef AMBIENT
        ambientOcclusionColorMap,
        vAmbientInfos
    #endif
    );

    #include<pbrBlockLightmapInit>

#ifdef UNLIT
    vec3 diffuseBase = vec3(1., 1., 1.);
#else // !UNLIT

    // _____________________________ Reflectivity (Rename this to IBL) _______________________________
    
    reflectivityOutParams reflectivityOut;

#ifdef METALLIC_ROUGHNESS
    vec4 metallicRoughnessFromTexture = texture2D(baseMetalRoughSampler, vBaseMetalRoughUV + uvOffset);
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    float baseDiffuseRoughnessFromTexture = texture2D(baseDiffuseRoughnessSampler, vBaseDiffuseRoughnessUV + uvOffset).r;
#endif

vec4 specularColor = vSpecularColor;
#ifdef SPECULAR_COLOR
    vec4 specularColorFromTexture = texture2D(specularColorSampler, vSpecularColorUV + uvOffset);
    #ifdef SPECULAR_COLOR_GAMMA
        specularColorFromTexture = toLinearSpace(specularColorFromTexture);
    #endif

    specularColor.rgb *= specularColorFromTexture.rgb;
#endif
#ifdef SPECULAR_WEIGHT
    vec4 specularWeightFromTexture = texture2D(specularWeightSampler, vSpecularWeightUV + uvOffset);
    #ifdef SPECULAR_WEIGHT_GAMMA
        specularWeightFromTexture = toLinearSpace(specularWeightFromTexture);
    #endif

    // If loaded from a glTF, the specular_weight is stored in the alpha channel.
    // Otherwise, it's expected to just be a greyscale texture.
    #ifdef SPECULAR_WEIGHT_USE_ALPHA_ONLY
        specularColor.a *= specularWeightFromTexture.a;
    #else
        specularColor.rgb *= specularWeightFromTexture.rgb;
    #endif
#endif

    reflectivityOut = reflectivityBlock(
        vReflectanceInfo
        , surfaceAlbedo
        , specularColor
        , vBaseDiffuseRoughness
    #ifdef BASE_DIFFUSE_ROUGHNESS
        , baseDiffuseRoughnessFromTexture
        , vBaseDiffuseRoughnessInfos
    #endif
    #ifdef METALLIC_ROUGHNESS
        , vec3(vBaseMetalRoughInfos, 1.0f)
        , metallicRoughnessFromTexture
    #endif
    #if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
        , aoOut.ambientOcclusionColor
    #endif
    #ifdef DETAIL
        , detailColor
        , vDetailInfos
    #endif
    );

    float roughness = reflectivityOut.roughness;
    float diffuseRoughness = reflectivityOut.diffuseRoughness;

    // surfaceAlbedo = reflectivityOut.surfaceAlbedo;
    
    #if defined(METALLIC_ROUGHNESS) && defined(AOSTOREINMETALMAPRED)
        aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
    #endif

    // _____________________________ Compute Geometry info _________________________________
    #include<pbrBlockGeometryInfo>


    // _____________________________ Reflection Info _______________________________________
    #ifdef REFLECTION
        reflectionOutParams reflectionOut;

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
            #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
                , reflectionMatrix
            #endif
            #ifdef USEIRRADIANCEMAP
                , irradianceSampler
                #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                    , vReflectionDominantDirection
                #endif
            #endif
            #ifndef LODBASEDMICROSFURACE
                , reflectionSamplerLow
                , reflectionSamplerHigh
            #endif
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
                #ifdef IBL_CDF_FILTERING
                    , icdfSampler
                #endif
            #endif
                , viewDirectionW
                , diffuseRoughness
                , surfaceAlbedo
            );
        #else
            #define CUSTOM_REFLECTION
        #endif
    #endif

    // _________________________ Specular Environment Reflectance __________________________
    float reflectanceF0 = reflectivityOut.reflectanceF0;
    vec3 specularEnvironmentR0 = reflectivityOut.colorReflectanceF0;
    vec3 specularEnvironmentR90 = reflectivityOut.colorReflectanceF90;
    #include<openpbrBlockReflectance>
    
    // _____________________________ Direct Lighting Info __________________________________
    #include<pbrBlockDirectLighting>

    // TODO: lightFragment references cloatcoatOut, subsurfaceOut, etc.
    // lightFragment shouldn't know what layer it's working on.
    // Instead, we should define values for lightFragment to use here, defining
    // conditions like F0, F90, etc.
    // Or we could convert lightFragment to be a function that returns the diffuse
    // or specular contribution, given the reflectance inputs?
    // e.g. lighting contributions from clearcoat, subsurface, base layer, etc. need
    // to be computed separately.
    // #include<lightFragment>[0..maxSimultaneousLights]

    // _____________________________ Compute Final Lit Components ________________________
    #include<openpbrBlockFinalLitComponents>
#endif // !UNLIT

    #include<pbrBlockFinalUnlitComponents>

    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION

    #include<openpbrBlockFinalColorComposition>

    #include<logDepthFragment>
    #include<fogFragment>(color, finalColor)
    #include<pbrBlockImageProcessing>

    #define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    #include<pbrBlockPrePass>
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
