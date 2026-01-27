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

#include<openpbrAmbientOcclusionFunctions>
#include<openpbrGeometryInfo>
#include<openpbrIblFunctions>

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

    // _____________________________ Read Transmission Layer properties ______________________
    #include<openpbrTransmissionLayerData>

    // _____________________________ Read Coat Layer properties ______________________
    #include<openpbrCoatLayerData>

    #include<openpbrThinFilmLayerData>

    // _____________________________ Read Fuzz Layer properties ______________________
    #include<openpbrFuzzLayerData>

    // _____________________________ Read AO Properties _______________________________
    #include<openpbrAmbientOcclusionData>

    // TEMP
    var subsurface_weight: f32 = 0.0f;

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

    // _____________________________ Compute Geometry info for coat layer _________________________
    #ifdef ANISOTROPIC_COAT
        let coatGeoInfo: geometryInfoAnisoOutParams = geometryInfoAniso(
            coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
            , vec3f(geometry_coat_tangent.x, geometry_coat_tangent.y, coat_roughness_anisotropy), TBN
        );
    #else
        let coatGeoInfo: geometryInfoOutParams = geometryInfo(
            coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
        );
    #endif

    // _____________________________ Compute Geometry info for base layer _________________________
    // Adjust the base roughness to account for the coat layer. Equation 61 in OpenPBR spec.
    specular_roughness = mix(specular_roughness, pow(min(1.0f, pow(specular_roughness, 4.0f) + 2.0f * pow(coat_roughness, 4.0f)), 0.25f), coat_weight);

    #ifdef ANISOTROPIC_BASE
        let baseGeoInfo: geometryInfoAnisoOutParams = geometryInfoAniso(
            normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
            , vec3f(geometry_tangent.x, geometry_tangent.y, specular_roughness_anisotropy), TBN
        );
    #else
        let baseGeoInfo: geometryInfoOutParams = geometryInfo(
            normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
        );
    #endif

    #ifdef FUZZ
        // _____________________________ Compute Geometry info for fuzz layer _________________________
        let fuzzNormalW = normalize(mix(normalW, coatNormalW, coat_weight));
        var fuzzTangent = normalize(TBN[0]);
        fuzzTangent = normalize(fuzzTangent - dot(fuzzTangent, fuzzNormalW) * fuzzNormalW);
        let fuzzBitangent = cross(fuzzNormalW, fuzzTangent);

        let fuzzGeoInfo: geometryInfoOutParams = geometryInfo(
            fuzzNormalW, viewDirectionW.xyz, fuzz_roughness, geometricNormalW
        );
    #endif

    // _______________________ F0 and F90 Reflectance _______________________________
    
    // Coat
    let coatReflectance: ReflectanceParams = dielectricReflectance(
        coat_ior // inside IOR
        , 1.0f // outside IOR is air
        , vec3f(1.0f)
        , coat_weight
    );

#ifdef THIN_FILM
    // Thin Film
    let thin_film_outside_ior: f32 = mix(1.0f, coat_ior, coat_weight);
#endif

    // Base Dielectric
    let baseDielectricReflectance: ReflectanceParams = dielectricReflectance(
        specular_ior // inside IOR
        , mix(1.0f, coat_ior, coat_weight) // outside IOR is coat
        , specular_color
        , specular_weight
    );

    // Base Metallic
    let baseConductorReflectance: ReflectanceParams = conductorReflectance(base_color, specular_color, specular_weight);

    var transmission_absorption: vec3f = vec3f(1.0f);
    #if defined(REFRACTED_BACKGROUND) || defined(REFRACTED_ENVIRONMENT) || defined(REFRACTED_LIGHTS)
        #ifdef DISPERSION
            var refractedViewVectors: array<vec3f, 3>;
            let iorDispersionSpread: f32 = transmission_dispersion_scale / transmission_dispersion_abbe_number * (specular_ior - 1.0f);
            let dispersion_iors: vec3f = vec3f(specular_ior - iorDispersionSpread, specular_ior, specular_ior + iorDispersionSpread);
            for (var i: i32 = 0; i < 3; i++) {
                refractedViewVectors[i] = double_refract(-viewDirectionW, normalW, dispersion_iors[i]);    
            }
        #else
            let refractedViewVector: vec3f = double_refract(-viewDirectionW, normalW, specular_ior);
        #endif
        // Transmission blurriness is affected by IOR so we scale the roughness accordingly
        let transmission_roughness: f32 = specular_roughness * clamp(4.0f * (specular_ior - 1.0f), 0.001f, 1.0f);

        var extinction_coeff: vec3f = vec3f(0.0f);
        var scatter_coeff: vec3f = vec3f(0.0f);
        var absorption_coeff: vec3f = vec3f(0.0f);
        var ss_albedo: vec3f = vec3f(0.0f);
        var multi_scatter_color: vec3f = vec3f(1.0f);
        // Absorption is volumetric if transmission depth is > 0.
        // Otherwise, absorption is considered instantaneous at the surface.
        if (transmission_depth > 0.0f) {
            // Figure out coefficients based on OpenPBR spec.
            let invDepth: vec3f = vec3f(1.f / maxEps(transmission_depth));
            extinction_coeff = -log(transmission_color.rgb) * invDepth;
            scatter_coeff = transmission_scatter.rgb * invDepth;
            absorption_coeff = extinction_coeff - scatter_coeff.rgb;
            let minCoeff: f32 = min3(absorption_coeff);
            if (minCoeff < 0.0f) {
                absorption_coeff -= vec3f(minCoeff);
            }
            // Set extinction coefficient after shifting the absorption to be non-negative.
            extinction_coeff = absorption_coeff + scatter_coeff;
            ss_albedo = scatter_coeff / (extinction_coeff);
            multi_scatter_color = singleScatterToMultiScatterAlbedo(ss_albedo);

            transmission_absorption = exp(-absorption_coeff * geometry_thickness);
        } else {
            // We'll account for double-absorption here, assuming light enters and then exits the
            // volume before reaching the eye. 
            transmission_absorption = transmission_color.rgb * transmission_color.rgb;
        }

        let refractionAlphaG: f32 = transmission_roughness * transmission_roughness;
        #ifdef SCATTERING
            // Transmission Scattering
            let back_to_iso_scattering_blend: f32 = min(1.0f + transmission_scatter_anisotropy, 1.0f);
            let iso_to_forward_scattering_blend: f32 = max(transmission_scatter_anisotropy, 0.0f);

            // The 0.2 exponent is an empirical fit to match reference renderers - check if it works broadly
            let iso_scatter_transmittance: vec3f = pow(exp(-extinction_coeff * geometry_thickness), vec3f(0.2f));
            let iso_scatter_density: vec3f = clamp(vec3f(1.0f) - iso_scatter_transmittance, vec3f(0.0f), vec3f(1.0f));
            
            // Refration roughness is modified by the density of the scattering and also by the anisotropy.
            var roughness_alpha_modified_for_scatter: f32 = min(refractionAlphaG + (1.0f - abs(transmission_scatter_anisotropy)) * max3(iso_scatter_density * iso_scatter_density), 1.0f);
            roughness_alpha_modified_for_scatter = pow(roughness_alpha_modified_for_scatter, 6.0f);
            roughness_alpha_modified_for_scatter = clamp(roughness_alpha_modified_for_scatter, refractionAlphaG, 1.0f);
        #else
            let roughness_alpha_modified_for_scatter: f32 = refractionAlphaG;
        #endif
        
        // Calculated viewable distance based on reduced extinction and use that to
        // determine absorption at mean free path.
        let transport_mfp: vec3f = vec3f(2.0f) / scatter_coeff;
        let absorption_at_mfp: vec3f = exp(-absorption_coeff * transport_mfp);
    #endif
    // __________________ Transmitted Light From Background Refraction ___________________________
    #include<openpbrBackgroundTransmission>

    // ________________________ Environment (IBL) Lighting ____________________________
    var material_surface_ibl: vec3f = vec3f(0.f, 0.f, 0.f);
    #include<openpbrEnvironmentLighting>

    // __________________________ Direct Lighting ____________________________
    var material_surface_direct: vec3f = vec3f(0.f, 0.f, 0.f);
    // The refracted background is basically an environment contribution so it's
    // included in the environment lighting section above. However, if we don't
    // have IBL enabled, we still need to compute the refracted background here and
    // will split it between all the lights.
    #ifdef REFLECTION
        slab_translucent_background = vec4f(0.f, 0.f, 0.f, 1.f);
    #else
        slab_translucent_background /= f32(LIGHTCOUNT); // Average the background contribution over the number of lights
    #endif
    #if defined(LIGHT0)
        var aggShadow: f32 = 0.f;
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
