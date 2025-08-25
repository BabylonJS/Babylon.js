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

#include<openpbrDielectricReflectance>
#include<openpbrConductorReflectance>

#include<openpbrBlockAmbientOcclusion>
#include<openpbrIblFunctions>
#include<openpbrGeometryInfo>

// Do a mix between layers with additional multipliers for each layer.
fn layer(slab_bottom: vec3f, slab_top: vec3f, lerp_factor: f32, bottom_multiplier: vec3f, top_multiplier: vec3f) -> vec3f {

    return mix(slab_bottom * bottom_multiplier, slab_top * top_multiplier, lerp_factor);
}

// _____________________________ MAIN FUNCTION ____________________________
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>

    // _____________________________ Geometry Information ____________________________
    #include<pbrBlockNormalGeometric>
    var coatNormalW: vec3f = normalW;

    #include<openpbrNormalMapFragment>

    #include<openpbrBlockNormalFinal>

    // ______________________ Read Base properties & Opacity ______________________________
    #include<openpbrBaseLayerData>

    // _____________________________ Read Coat Layer properties ______________________
    #include<openpbrCoatLayerData>

    // TEMP
    var subsurface_weight: f32 = 0.0f;
    var transmission_weight: f32 = 0.0f;
    var fuzz_weight: f32 = 0.0f;

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

    // _____________________________ Compute Geometry info for coat layer _________________________
    let coatGeoInfo: geometryInfoOutParams = geometryInfo(
        coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
        #ifdef ANISOTROPIC
        , vec3f(1.0f, 0.0f, specular_roughness_anisotropy), TBN
        #endif
    );

    // _____________________________ Compute Geometry info for base layer _________________________
    // Adjust the base roughness to account for the coat layer. Equation 61 in OpenPBR spec.
    specular_roughness = mix(specular_roughness, pow(min(1.0f, pow(specular_roughness, 4.0f) + 2.0f * pow(coat_roughness, 4.0f)), 0.25f), coat_weight);
    let baseGeoInfo: geometryInfoOutParams = geometryInfo(
        normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
        #ifdef ANISOTROPIC
        , vec3f(geometry_tangent.x, geometry_tangent.y, specular_roughness_anisotropy), TBN
        #endif
    );

    // _______________________ F0 and F90 Reflectance _______________________________
    
    // Coat
    let coatReflectance: ReflectanceParams = dielectricReflectance(
        coat_ior // inside IOR
        , 1.0f // outside IOR is air
        , vec3f(1.0f)
        , coat_weight
    );

    // Base Dielectric
    let baseDielectricReflectance: ReflectanceParams = dielectricReflectance(
        specular_ior // inside IOR
        , mix(1.0f, coat_ior, coat_weight) // outside IOR is coat
        , specular_color
        , specular_weight
    );

    // Base Metallic
    let baseConductorReflectance: ReflectanceParams = conductorReflectance(base_color, specular_color, specular_weight);

    // ________________________ Environment (IBL) Lighting ____________________________
    var material_surface_ibl: vec3f = vec3f(0.f, 0.f, 0.f);
    #include<openpbrEnvironmentLighting>

    // __________________________ Direct Lighting ____________________________
    var material_surface_direct: vec3f = vec3f(0.f, 0.f, 0.f);
    #if defined(LIGHT0)
        var aggShadow: f32 = 0.f;
        var numLights: f32 = 0.f;
        #include<openpbrDirectLightingInit>[0..maxSimultaneousLights]
        #include<openpbrDirectLighting>[0..maxSimultaneousLights]
        
    #endif

    // _________________________ Emissive Lighting _______________________________
    var material_surface_emission: vec3f = uniforms.vEmissionColor;
    #ifdef EMISSION_COLOR
        let emissionColorTex: vec3f = textureSample(emissionColorSampler, emissionColorSamplerSampler, uniforms.vEmissionColorUV + uvOffset).rgb;
        #ifdef EMISSION_COLOR_GAMMA
            material_surface_emission *= toLinearSpace(emissionColorTex.rgb);
        #else
            material_surface_emission *= emissionColorTex.rgb;
        #endif
        material_surface_emission *=  uniforms.vEmissionColorInfos.y;
    #endif
    material_surface_emission *= uniforms.vLightingIntensity.y;

    // _____________________________ Final Color Composition ________________________
    #define CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION

    var finalColor: vec4f = vec4f(material_surface_ibl + material_surface_direct + material_surface_emission, alpha);

    #define CUSTOM_FRAGMENT_BEFORE_FOG

    // _____________________________ Finally ___________________________________________
    finalColor = max(finalColor, vec4f(0.0));

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
