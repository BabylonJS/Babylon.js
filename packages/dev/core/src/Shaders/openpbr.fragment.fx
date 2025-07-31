#define OPENPBR_FRAGMENT_SHADER

#define CUSTOM_FRAGMENT_EXTENSION

#if defined(GEOMETRY_NORMAL) || defined(GEOMETRY_COAT_NORMAL) || !defined(NORMAL) || defined(FORCENORMALFORWARD) || defined(SPECULARAA)
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
#include<openpbrNormalMapFragmentMainFunctions>
#include<openpbrNormalMapFragmentFunctions>

#ifdef REFLECTION
    #include<reflectionFunction>
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<openpbrDielectricReflectance>
#include<openpbrConductorReflectance>

#include<openpbrBlockAmbientOcclusion>
#include<pbrBlockAlphaFresnel>
#include<openpbrIblFunctions>
#include<openpbrGeometryInfo>

struct openpbrLightingInfo
{
    vec3 diffuse;
    #ifdef SPECULARTERM
        vec3 specular;
    #endif
    vec3 coloredFresnel;
    float fresnel;
};

// _____________________________ MAIN FUNCTION ____________________________
void main(void) {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // _____________________________ Geometry Information ____________________________
    #include<pbrBlockNormalGeometric>
    vec3 coatNormalW = normalW;

    #include<openpbrNormalMapFragment>

    #include<openpbrBlockNormalFinal>

    // ______________________ Read Base properties & Opacity ______________________________
    #include<openpbrBaseLayerData>

    // _____________________________ Read Coat Layer properties ______________________
    #include<openpbrCoatLayerData>

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

    // _____________________________ AO  _______________________________
    ambientOcclusionOutParams aoOut;

#ifdef AMBIENT_OCCLUSION
    vec3 ambientOcclusionFromTexture = texture2D(ambientOcclusionSampler, vAmbientOcclusionUV + uvOffset).rgb;
#endif

    aoOut = ambientOcclusionBlock(
    #ifdef AMBIENT_OCCLUSION
        ambientOcclusionFromTexture,
        vAmbientOcclusionInfos
    #endif
    );

    // _____________________________ Compute Geometry info for coat layer _________________________
    geometryInfoOutParams coatGeoInfo = geometryInfo(
        coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
    );

    // _____________________________ Compute Geometry info for base layer _________________________
    // Adjust the base roughness to account for the coat layer. Equation 61 in OpenPBR spec.
    specular_roughness = mix(specular_roughness, pow(min(1.0, pow(specular_roughness, 4.0) + 2.0 * pow(coat_roughness, 4.0)), 0.25), coat_weight);
    geometryInfoOutParams baseGeoInfo = geometryInfo(
        normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
    );

    // _____________________________ Base Diffuse Layer IBL _______________________________________
    #ifdef REFLECTION
        // Pass in a vector to sample teh irradiance with (to handle reflection or )
        vec3 baseDiffuseEnvironmentLight = sampleIrradiance(
            normalW
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
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
                #ifdef IBL_CDF_FILTERING
                    , icdfSampler
                #endif
            #endif
            , vReflectionInfos
            , viewDirectionW
            , base_diffuse_roughness
            , base_color
        );

    // _____________________________ Base Specular Layer IBL _______________________________________    

        #ifdef REFLECTIONMAP_3D
            vec3 reflectionCoords = vec3(0., 0., 0.);
        #else
            vec2 reflectionCoords = vec2(0., 0.);
        #endif
        reflectionCoords = createReflectionCoords(vPositionW, normalW);
        float specularAlphaG = specular_roughness * specular_roughness;
        vec3 baseSpecularEnvironmentLight = sampleRadiance(specularAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
            #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                , baseGeoInfo.NdotVUnclamped
            #endif
            , reflectionSampler
            , reflectionCoords
            #ifdef REALTIME_FILTERING
                , vReflectionFilteringInfo
            #endif
        );

        baseSpecularEnvironmentLight = mix(baseSpecularEnvironmentLight.rgb, baseDiffuseEnvironmentLight, specularAlphaG);

        vec3 coatEnvironmentLight = vec3(0., 0., 0.);
        if (coat_weight > 0.0) {
            #ifdef REFLECTIONMAP_3D
                vec3 reflectionCoords = vec3(0., 0., 0.);
            #else
                vec2 reflectionCoords = vec2(0., 0.);
            #endif
            reflectionCoords = createReflectionCoords(vPositionW, coatNormalW);
            float coatAlphaG = coat_roughness * coat_roughness;
            coatEnvironmentLight = sampleRadiance(coatAlphaG, vReflectionMicrosurfaceInfos.rgb, vReflectionInfos
                #if defined(LODINREFLECTIONALPHA) && !defined(REFLECTIONMAP_SKYBOX)
                    , coatGeoInfo.NdotVUnclamped
                #endif
                , reflectionSampler
                , reflectionCoords
                #ifdef REALTIME_FILTERING
                    , vReflectionFilteringInfo
                #endif
            );
        }

        
    #endif

    // _______________________ F0 and F90 Reflectance _______________________________

    // Coat
    dielectricReflectanceOutParams coatReflectance;
    coatReflectance = dielectricReflectance(
        coat_ior // inside IOR
        , 1.0 // outside IOR is air
        , vec3(1.0)
        , coat_weight
    );

    // Base Dielectric
    dielectricReflectanceOutParams baseDielectricReflectance;
    {
        float effectiveCoatIor = mix(1.0, coat_ior, coat_weight);
        baseDielectricReflectance = dielectricReflectance(
            specular_ior // inside IOR
            , effectiveCoatIor // outside IOR is coat
            , specular_color
            , specular_weight
        );
    }

    // Base Metallic
    conductorReflectanceOutParams baseConductorReflectance;
    baseConductorReflectance = conductorReflectance(base_color, specular_color, specular_weight);
    
    // ______________________________ IBL Fresnel Reflectance ____________________________
    #ifdef REFLECTION
    
        // Dielectric IBL Fresnel
        // The colored fresnel represents the % of light reflected by the base specular lobe
        // The non-colored fresnel represents the % of light that doesn't penetrate through 
        // the base specular lobe. i.e. the specular lobe isn't energy conserving for coloured specular.
        float dielectricIblFresnel = getReflectanceFromBRDFLookup(vec3(baseDielectricReflectance.F0), vec3(baseDielectricReflectance.F90), baseGeoInfo.environmentBrdf).r;
        vec3 dielectricIblColoredFresnel = getReflectanceFromBRDFLookup(baseDielectricReflectance.coloredF0, baseDielectricReflectance.coloredF90, baseGeoInfo.environmentBrdf);

        // Conductor IBL Fresnel
        vec3 conductorIblFresnel = conductorIblFresnel(baseConductorReflectance, baseGeoInfo.NdotV, specular_roughness, baseGeoInfo.environmentBrdf);

        // Coat IBL Fresnel
        float coatIblFresnel = 0.0;
        if (coat_weight > 0.0) {
            coatIblFresnel = getReflectanceFromBRDFLookup(vec3(coatReflectance.F0), vec3(coatReflectance.F90), coatGeoInfo.environmentBrdf).r;
            // Prevent the light reflected by the coat from being added to the base layer
            dielectricIblFresnel -= coatIblFresnel;
            dielectricIblColoredFresnel = max(dielectricIblColoredFresnel - vec3(coatIblFresnel), 0.0);
            conductorIblFresnel = max(conductorIblFresnel - vec3(coatIblFresnel), 0.0);
        }
    #endif

    // _____________________________ Base Layer IBL ______________________________________
    vec3 slab_diffuse = vec3(0., 0., 0.);
    vec3 slab_glossy = vec3(0., 0., 0.);
    #ifdef REFLECTION
        slab_diffuse = baseDiffuseEnvironmentLight * vLightingIntensity.z;

        // Account for energy loss due to specular reflectance
        vec3 baseSpecularEnergy = vec3(dielectricIblFresnel + coatIblFresnel);
        slab_diffuse *= clamp(vec3(1.0) - baseSpecularEnergy, 0.0, 1.0);
        slab_diffuse *= base_color.rgb;
        slab_diffuse *= aoOut.ambientOcclusionColor;

        // Add the specular environment light
        slab_glossy = baseSpecularEnvironmentLight * dielectricIblColoredFresnel * vLightingIntensity.z;
    #endif

    // _____________________________ Metal Layer IBL ____________________________
    vec3 slab_metal_IBL = vec3(0., 0., 0.);
    #ifdef REFLECTION
        slab_metal_IBL = baseSpecularEnvironmentLight * conductorIblFresnel * vLightingIntensity.z;
    #endif

    // _____________________________ Coat Layer IBL ____________________________
    vec3 slab_coated_base = vec3(0., 0., 0.);
    #ifdef REFLECTION
        if (coat_weight > 0.0) {
            slab_coated_base = coatEnvironmentLight * coatIblFresnel * vLightingIntensity.z;
        }
    #endif

    // __________________________ Direct Lighting Info ____________________________
    vec3 baseDiffuseDirectLight = vec3(0., 0., 0.);
    #ifdef SPECULARTERM
        vec3 baseSpecularDirectLight = vec3(0., 0., 0.);
    #endif

    // Direct Lighting Variables
    #if defined(SPECULARTERM) && defined(LIGHT0)
        vec3 coloredFresnel;
    #endif
    float aggShadow = 0.;
    float numLights = 0.;

    #include<openpbrDirectLightingInit>[0..maxSimultaneousLights]
    #include<openpbrDirectLightingShadow>[0..maxSimultaneousLights]
    #include<openpbrDirectLightingDiffuse>[0..maxSimultaneousLights]
    #include<openpbrDirectLightingSpecular>[0..maxSimultaneousLights]

    aggShadow = aggShadow / numLights;


    // Handle direct lighting
    vec3 finalDiffuseDirect = baseDiffuseDirectLight * vLightingIntensity.x;
    finalDiffuseDirect *= base_color.rgb;


    // ___________________ Specular Layer Direct Lighting ___________________________
    vec3 finalSpecularDirect = vec3(0., 0., 0.);
    #ifdef SPECULARTERM
        baseSpecularDirectLight = max(baseSpecularDirectLight, 0.0) * vLightingIntensity.x * vLightingIntensity.w;
        finalSpecularDirect += baseSpecularDirectLight;
    #endif

    // _____________________________ Emission ________________________________________
    vec3 finalEmission = vEmissionColor;
    #ifdef EMISSION_COLOR
        vec3 emissionColorTex = texture2D(emissionColorSampler, vEmissionColorUV + uvOffset).rgb;
        #ifdef EMISSION_COLOR_GAMMA
            finalEmission *= toLinearSpace(emissionColorTex.rgb);
        #else
            finalEmission *= emissionColorTex.rgb;
        #endif
        finalEmission *=  vEmissionColorInfos.y;
    #endif
    finalEmission *= vLightingIntensity.y;

    // _____________________________ Final Color Composition ________________________
    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION

    // TEMP
    vec3 slab_subsurface = vec3(0., 0., 0.);
    vec3 slab_translucent_base = vec3(0., 0., 0.);
    vec3 slab_fuzz = vec3(0., 0., 0.);
    float subsurface_weight = 0.0;
    float transmission_weight = 0.0;
    float fuzz_weight = 0.0;

    vec3 material_glossy_diffuse = slab_diffuse + slab_glossy;
    vec3 material_opaque_base = mix(material_glossy_diffuse, slab_subsurface, subsurface_weight);
    vec3 material_dielectric_base = mix(material_opaque_base, slab_translucent_base, transmission_weight);
    vec3 material_base_substrate = mix(material_dielectric_base, slab_metal_IBL, base_metalness);
    vec3 material_coated_base = material_base_substrate + slab_coated_base;
    vec3 material_surface = mix(material_coated_base, slab_fuzz, fuzz_weight);
    vec4 material_final = vec4(material_surface, alpha);

    vec4 finalColor = vec4(
        material_final.rgb +
        finalDiffuseDirect +
        finalSpecularDirect +
        finalEmission
        , alpha);

    // _____________________________ EmissiveLight _____________________________________
    finalColor.rgb += finalEmission;

    #define CUSTOM_FRAGMENT_BEFORE_FOG

    // _____________________________ Finally ___________________________________________
    finalColor = max(finalColor, 0.0);

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
