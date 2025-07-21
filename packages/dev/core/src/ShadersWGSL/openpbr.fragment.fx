#define OPENPBR_FRAGMENT_SHADER

#define CUSTOM_FRAGMENT_BEGIN

#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE
#endif

// Declaration
#include<openpbrUboDeclaration>

#include<pbrFragmentExtraDeclaration>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
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
#include<openpbrNormalMapFragmentMainFunctions>
#include<openpbrNormalMapFragmentFunctions>

#ifdef REFLECTION
    #include<reflectionFunction>
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<openpbrBlockAlbedoOpacity>
#include<openpbrBlockReflectivity>
#include<openpbrBlockAmbientOcclusion>
#include<pbrBlockAlphaFresnel>
#include<pbrBlockReflection>

// _____________________________ MAIN FUNCTION ____________________________
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // _____________________________ Geometry Information ____________________________
    #include<pbrBlockNormalGeometric>

    #include<openpbrNormalMapFragment>

    #include<pbrBlockNormalFinal>

    // _____________________________ Albedo & Opacity ______________________________
    var albedoOpacityOut: albedoOpacityOutParams;

#ifdef BASE_COLOR
    var baseColorFromTexture: vec4f = textureSample(baseColorSampler, baseColorSamplerSampler, fragmentInputs.vBaseColorUV + uvOffset);
#endif

#ifdef BASE_WEIGHT
    var baseWeightFromTexture: vec4f = textureSample(baseWeightSampler, baseWeightSamplerSampler, fragmentInputs.vBaseWeightUV + uvOffset);
#endif

#ifdef OPACITY
    var opacityMap: vec4f = textureSample(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV + uvOffset);
#endif

#ifdef DECAL
    var decalColor: vec4f = textureSample(decalSampler, decalSamplerSampler, fragmentInputs.vDecalUV + uvOffset);
#endif

    albedoOpacityOut = albedoOpacityBlock(
        uniforms.vBaseColor
    #ifdef BASE_COLOR
        , baseColorFromTexture
        , uniforms.vBaseColorInfos
    #endif
        , uniforms.baseWeight
    #ifdef BASE_WEIGHT
        , baseWeightFromTexture
        , uniforms.vBaseWeightInfos
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

#ifdef AMBIENT_OCCLUSION
    var ambientOcclusionFromTexture: vec3f = textureSample(ambientOcclusionSampler, ambientOcclusionSamplerSampler, fragmentInputs.vAmbientOcclusionUV + uvOffset).rgb;
#endif

    aoOut = ambientOcclusionBlock(
    #ifdef AMBIENT_OCCLUSION
        ambientOcclusionFromTexture,
        uniforms.vAmbientOcclusionInfos
    #endif
    );

    #include<pbrBlockLightmapInit>

#ifdef UNLIT
    var diffuseBase: vec3f =  vec3f(1., 1., 1.);
#else

    // _____________________________ Reflectivity _______________________________
    var baseColor: vec3f = surfaceAlbedo;

    var reflectivityOut: reflectivityOutParams;

#ifdef METALLIC_ROUGHNESS
    var metallicRoughnessFromTexture: vec4f = textureSample(baseMetalRoughSampler, baseMetalRoughSamplerSampler, fragmentInputs.vBaseMetalRoughUV + uvOffset);
#endif

#ifdef BASE_DIFFUSE_ROUGHNESS
    var baseDiffuseRoughnessFromTexture: f32 = textureSample(baseDiffuseRoughnessSampler, baseDiffuseRoughnessSamplerSampler, fragmentInputs.vBaseDiffuseRoughnessUV + uvOffset).x;
#endif

var specularColor: vec4f = uniforms.vSpecularColor;
#ifdef SPECULAR_COLOR
    var specularColorFromTexture: vec4f = textureSample(specularColorSampler, specularColorSamplerSampler, fragmentInputs.vSpecularColorUV + uvOffset);
    #ifdef SPECULAR_COLOR_GAMMA
        specularColorFromTexture = toLinearSpaceVec4(specularColorFromTexture);
    #endif

    specularColor = vec4f(specularColor.rgb * specularColorFromTexture.rgb, specularColor.a);
#endif
#ifdef SPECULAR_WEIGHT
    var specularWeightFromTexture: vec4f = textureSample(specularWeightSampler, specularWeightSamplerSampler, fragmentInputs.vSpecularWeightUV + uvOffset);
    #ifdef SPECULAR_WEIGHT_GAMMA
        specularWeightFromTexture = toLinearSpaceVec4(specularWeightFromTexture);
    #endif

    // If loaded from a glTF, the specular_weight is stored in the alpha channel.
    // Otherwise, it's expected to just be a greyscale texture.
    #ifdef SPECULAR_WEIGHT_USE_ALPHA_ONLY
        specularColor.a *= specularWeightFromTexture.a;
    #else
        specularColor = vec4f(specularColor.rgb * specularWeightFromTexture.rgb, specularColor.a);
    #endif
#endif

    reflectivityOut = reflectivityBlock(
        uniforms.vReflectanceInfo
        , surfaceAlbedo
        , specularColor
        , uniforms.vBaseDiffuseRoughness
    #ifdef BASE_DIFFUSE_ROUGHNESS
        , baseDiffuseRoughnessFromTexture
        , uniforms.vBaseDiffuseRoughnessInfos
    #endif
    #ifdef METALLIC_ROUGHNESS
        , vec3f(uniforms.vBaseMetalRoughInfos, 1.0f)
        , metallicRoughnessFromTexture
    #endif
    #if defined(METALLIC_ROUGHNESS)  && defined(AOSTOREINMETALMAPRED)
        , aoOut.ambientOcclusionColor
    #endif
    #ifdef DETAIL
        , detailColor
        , uniforms.vDetailInfos
    #endif
    );

    var roughness: f32 = reflectivityOut.roughness;
    var diffuseRoughness: f32 = reflectivityOut.diffuseRoughness;

    #if defined(METALLIC_ROUGHNESS) && defined(AOSTOREINMETALMAPRED)
        aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
    #endif

    // _____________________________ Compute Geometry info _________________________________
    #include<openpbrBlockGeometryInfo>

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
                , reflectionSampler
                , reflectionSamplerSampler
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                , fragmentInputs.vEnvironmentIrradiance
            #endif
            #if (defined(USESPHERICALFROMREFLECTIONMAP) && (!defined(NORMAL) || !defined(USESPHERICALINVERTEX))) || (defined(USEIRRADIANCEMAP) && defined(REFLECTIONMAP_3D))
                , uniforms.reflectionMatrix
            #endif
            #ifdef USEIRRADIANCEMAP
                , irradianceSampler
                , irradianceSamplerSampler
                #ifdef USE_IRRADIANCE_DOMINANT_DIRECTION
                    , uniforms.vReflectionDominantDirection
                #endif
            #endif
            #ifndef LODBASEDMICROSFURACE
                , reflectionLowSampler
                , reflectionLowSamplerSampler
                , reflectionHighSampler
                , reflectionHighSamplerSampler
            #endif
            #ifdef REALTIME_FILTERING
                , uniforms.vReflectionFilteringInfo
                #ifdef IBL_CDF_FILTERING
                    , icdfSampler
                    , icdfSamplerSampler
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

    // ___________________ Compute Reflectance aka R0 F0 info _________________________
    var reflectanceF0: f32 = reflectivityOut.reflectanceF0;
    var specularEnvironmentR0: vec3f = reflectivityOut.colorReflectanceF0;
    var specularEnvironmentR90: vec3f = reflectivityOut.colorReflectanceF90;

    // _________________________ Specular Environment Reflectance __________________________
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
#endif // UNLIT

    // _____________________________ Diffuse ________________________________________
    var finalDiffuse: vec3f = diffuseBase;
    finalDiffuse *= surfaceAlbedo;
    finalDiffuse = max(finalDiffuse, vec3f(0.0));
    finalDiffuse *= uniforms.vLightingIntensity.x;

    // _____________________________ Emissive ________________________________________
    var finalEmission: vec3f = uniforms.vEmissionColor;
    #ifdef EMISSION
    var emissionColorTex: vec3f = textureSample(emissionSampler, emissionSamplerSampler, fragmentInputs.vEmissionUV + uvOffset).rgb;
        #ifdef EMISSION_GAMMA
            finalEmission *= toLinearSpaceVec3(emissionColorTex.rgb);
        #else
            finalEmission *= emissionColorTex.rgb;
        #endif
        finalEmission *=  uniforms.vEmissionInfos.y;
    #endif
    finalEmission *= uniforms.vLightingIntensity.y;

    // ______________________________ Ambient ________________________________________
    #ifdef AMBIENT_OCCLUSION
        finalDiffuse *= mix( vec3f(1.), aoOut.ambientOcclusionColor, 1.0 - uniforms.vAmbientOcclusionInfos.y);
    #endif

    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION

    #include<openpbrBlockFinalColorComposition>

    #include<logDepthFragment>
    #include<fogFragment>(color, finalColor)
    #include<pbrBlockImageProcessing>

    #define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

#ifdef PREPASS
    #include<pbrBlockPrePass>
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
