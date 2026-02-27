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

#include<openpbrAmbientOcclusionFunctions>
#include<openpbrGeometryInfo>
#include<openpbrIblFunctions>

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

    // ______________________ Read Base, Specular properties & Opacity ______________________________
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
    float subsurface_weight = 0.0;

    #define CUSTOM_FRAGMENT_UPDATE_ALPHA

    #include<depthPrePass>

    #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

    // _____________________________ Compute Geometry info for coat layer _________________________
    #ifdef ANISOTROPIC_COAT
        geometryInfoAnisoOutParams coatGeoInfo = geometryInfoAniso(
            coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
            , vec3(geometry_coat_tangent.x, geometry_coat_tangent.y, coat_roughness_anisotropy), TBN
        );
    #else
        geometryInfoOutParams coatGeoInfo = geometryInfo(
            coatNormalW, viewDirectionW.xyz, coat_roughness, geometricNormalW
        );
    #endif

    // _____________________________ Compute Geometry info for base layer _________________________
    // Adjust the base roughness to account for the coat layer. Equation 61 in OpenPBR spec.
    specular_roughness = mix(specular_roughness, pow(min(1.0, pow(specular_roughness, 4.0) + 2.0 * pow(coat_roughness, 4.0)), 0.25), coat_weight);

    #ifdef ANISOTROPIC_BASE
        geometryInfoAnisoOutParams baseGeoInfo = geometryInfoAniso(
            normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
            , vec3(geometry_tangent.x, geometry_tangent.y, specular_roughness_anisotropy), TBN
        );
    #else
        geometryInfoOutParams baseGeoInfo = geometryInfo(
            normalW, viewDirectionW.xyz, specular_roughness, geometricNormalW
        );
    #endif

    #ifdef FUZZ
        // _____________________________ Compute Geometry info for fuzz layer _________________________
        vec3 fuzzNormalW = normalize(mix(normalW, coatNormalW, coat_weight));
        vec3 fuzzTangent = normalize(TBN[0]);
        fuzzTangent = normalize(fuzzTangent - dot(fuzzTangent, fuzzNormalW) * fuzzNormalW);
        vec3 fuzzBitangent = cross(fuzzNormalW, fuzzTangent);
        geometryInfoOutParams fuzzGeoInfo = geometryInfo(
            fuzzNormalW, viewDirectionW.xyz, fuzz_roughness, geometricNormalW
        );
    #endif

    // _______________________ F0 and F90 Reflectance _______________________________
    
    // Coat
    ReflectanceParams coatReflectance;
    coatReflectance = dielectricReflectance(
        coat_ior // inside IOR
        , 1.0 // outside IOR is air
        , vec3(1.0)
        , coat_weight
    );

#ifdef THIN_FILM
    // Thin Film
    float thin_film_outside_ior = mix(1.0, coat_ior, coat_weight);
#endif

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

    vec3 transmission_absorption = vec3(1.0);
    #if defined(REFRACTED_BACKGROUND) || defined(REFRACTED_ENVIRONMENT) || defined(REFRACTED_LIGHTS)
        #ifdef DISPERSION
            vec3 refractedViewVectors[3];
            float iorDispersionSpread = transmission_dispersion_scale / transmission_dispersion_abbe_number * (specular_ior - 1.0);
            vec3 dispersion_iors = vec3(specular_ior - iorDispersionSpread, specular_ior, specular_ior + iorDispersionSpread);
            for (int i = 0; i < 3; i++) {
                refractedViewVectors[i] = double_refract(-viewDirectionW, normalW, dispersion_iors[i]);    
            }
        #else
            vec3 refractedViewVector = double_refract(-viewDirectionW, normalW, specular_ior);
        #endif
        // Transmission blurriness is affected by IOR so we scale the roughness accordingly
        float transmission_roughness = specular_roughness * clamp(4.0 * (specular_ior - 1.0), 0.001, 1.0);

        vec3 extinction_coeff = vec3(0.0);
        vec3 scatter_coeff = vec3(0.0);
        vec3 absorption_coeff = vec3(0.0);
        vec3 ss_albedo = vec3(0.0);
        vec3 multi_scatter_color = vec3(1.0);
        // Absorption is volumetric if transmission depth is > 0.
        // Otherwise, absorption is considered instantaneous at the surface.
        if (transmission_depth > 0.0) {
            // Figure out coefficients based on OpenPBR spec.
            vec3 invDepth = vec3(1. / maxEps(transmission_depth));
            extinction_coeff = -log(transmission_color.rgb) * invDepth;
            scatter_coeff = transmission_scatter.rgb * invDepth;
            absorption_coeff = extinction_coeff - scatter_coeff.rgb;
            float minCoeff = min3(absorption_coeff);
            if (minCoeff < 0.0) {
                absorption_coeff -= vec3(minCoeff);
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

        float refractionAlphaG = transmission_roughness * transmission_roughness;
        #ifdef SCATTERING
            // Transmission Scattering
            float back_to_iso_scattering_blend = min(1.0 + transmission_scatter_anisotropy, 1.0);
            float iso_to_forward_scattering_blend = max(transmission_scatter_anisotropy, 0.0);

            // The 0.2 exponent is an empirical fit to match reference renderers - check if it works broadly
            vec3 iso_scatter_transmittance = pow(exp(-extinction_coeff * geometry_thickness), vec3(0.2));
            vec3 iso_scatter_density = clamp(vec3(1.0) - iso_scatter_transmittance, 0.0, 1.0);
            
            // Refraction roughness is modified by the density of the scattering and also by the anisotropy.
            float roughness_alpha_modified_for_scatter = min(refractionAlphaG + (1.0 - abs(transmission_scatter_anisotropy)) * max3(iso_scatter_density * iso_scatter_density), 1.0);
            roughness_alpha_modified_for_scatter = pow(roughness_alpha_modified_for_scatter, 6.0);
            roughness_alpha_modified_for_scatter = clamp(roughness_alpha_modified_for_scatter, refractionAlphaG, 1.0);
        #else
            float roughness_alpha_modified_for_scatter = refractionAlphaG;
        #endif
        
        // Calculated viewable distance based on reduced extinction and use that to
        // determine absorption at mean free path.
        vec3 transport_mfp = vec3(2.0) / scatter_coeff;
        vec3 absorption_at_mfp = exp(-absorption_coeff * transport_mfp);
        
    #endif
    // __________________ Transmitted Light From Background Refraction ___________________________
    #include<openpbrBackgroundTransmission>
    
    // ________________________ Environment (IBL) Lighting ____________________________
    vec3 material_surface_ibl = vec3(0., 0., 0.);
    #include<openpbrEnvironmentLighting>

    // __________________________ Direct Lighting ____________________________
    vec3 material_surface_direct = vec3(0., 0., 0.);
    // The refracted background is basically an environment contribution so it's
    // included in the environment lighting section above. However, if we don't
    // have IBL enabled, we still need to compute the refracted background here and
    // will split it between all the lights.
    #ifdef REFLECTION
        slab_translucent_background = vec4(0., 0., 0., 1.);
    #else
        slab_translucent_background /= float(LIGHTCOUNT); // Average the background contribution over the number of lights
    #endif
    #if defined(LIGHT0)
        float aggShadow = 0.;
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
