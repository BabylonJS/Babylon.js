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

// #include<openpbrBlockAmbientOcclusion>
#include<openpbrIblFunctions>
#include<openpbrGeometryInfo>

// Do a mix between layers with additional multipliers for each layer.
vec3 layer(vec3 slab_bottom, vec3 slab_top, float lerp_factor, vec3 bottom_multiplier, vec3 top_multiplier) {

    return mix(slab_bottom * bottom_multiplier, slab_top * top_multiplier, lerp_factor);
}

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

    // TEMP
    float subsurface_weight = 0.0;
    float transmission_weight = 0.0;
    float fuzz_weight = 0.0;

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

    // _______________________ F0 and F90 Reflectance _______________________________
    
    // Coat
    ReflectanceParams coatReflectance;
    coatReflectance = dielectricReflectance(
        coat_ior // inside IOR
        , 1.0 // outside IOR is air
        , vec3(1.0)
        , coat_weight
    );

    // Base Dielectric
    ReflectanceParams baseDielectricReflectance;
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
    ReflectanceParams baseConductorReflectance;
    baseConductorReflectance = conductorReflectance(base_color, specular_color, specular_weight);
    
    // ________________________ Environment (IBL) Lighting ____________________________
    vec3 material_surface_ibl = vec3(0., 0., 0.);
    #include<openpbrEnvironmentLighting>

    // __________________________ Direct Lighting ____________________________
    vec3 material_surface_direct = vec3(0., 0., 0.);
    #if defined(LIGHT0)
        float aggShadow = 0.;
        float numLights = 0.;
        #include<openpbrDirectLightingInit>[0..maxSimultaneousLights]
        #include<openpbrDirectLighting>[0..maxSimultaneousLights]
        
    #endif

    // _________________________ Emissive Lighting _______________________________
    vec3 material_surface_emission = vEmissionColor;
    #ifdef EMISSION_COLOR
        vec3 emissionColorTex = texture2D(emissionColorSampler, vEmissionColorUV + uvOffset).rgb;
        #ifdef EMISSION_COLOR_GAMMA
            material_surface_emission *= toLinearSpace(emissionColorTex.rgb);
        #else
            material_surface_emission *= emissionColorTex.rgb;
        #endif
        material_surface_emission *=  vEmissionColorInfos.y;
    #endif
    material_surface_emission *= vLightingIntensity.y;

    // _____________________________ Final Color Composition ________________________
    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION


    vec4 finalColor = vec4(material_surface_ibl + material_surface_direct + material_surface_emission, alpha);


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
