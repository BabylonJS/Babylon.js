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
#include<openpbrVolumeFunctions>

// Do a mix between layers with additional multipliers for each layer.
fn layer(slab_bottom: vec3f, slab_top: vec3f, lerp_factor: f32, bottom_multiplier: vec3f, top_multiplier: vec3f) -> vec3f {

    return mix(slab_bottom * bottom_multiplier, slab_top * top_multiplier, lerp_factor);
}

// _____________________________ MAIN FUNCTION ____________________________
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    #ifdef PREPASS_IRRADIANCE
        var total_direct_diffuse: vec3f = vec3f(0.0f);
    #endif

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

    // _____________________________ Read Subsurface Layer properties ______________________
    #include<openpbrSubsurfaceLayerData>

    // _____________________________ Read Coat Layer properties ______________________
    #include<openpbrCoatLayerData>

    #include<openpbrThinFilmLayerData>

    // _____________________________ Read Fuzz Layer properties ______________________
    #include<openpbrFuzzLayerData>

    // _____________________________ Read AO Properties _______________________________
    #include<openpbrAmbientOcclusionData>

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

    // Absorption for entire volume thickness
    var volume_absorption: vec3f = vec3f(1.0f);
    // Surface constant tint for transmission
    var transmission_tint: vec3f = vec3f(1.0f);
    var surface_translucency_weight: f32 = 0.0f;
    #if defined(REFRACTED_BACKGROUND) || defined(REFRACTED_ENVIRONMENT) || defined(REFRACTED_LIGHTS)
        #if defined(GEOMETRY_THIN_WALLED)
            let refractedViewVector: vec3f = -viewDirectionW;
        #else
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
        #endif
        #ifdef GEOMETRY_THIN_WALLED
            let transmission_roughness: f32 = specular_roughness;
        #else
            // Transmission blurriness is affected by IOR so we scale the roughness accordingly
            let transmission_roughness: f32 = specular_roughness * clamp(4.0f * (specular_ior - 1.0f), 0.001f, 1.0f);
        #endif

        #if (defined(TRANSMISSION_SLAB) || defined(SUBSURFACE_SLAB))
        
            var volumeParams: OpenPBRHomogeneousVolume;
            {
                #if defined(TRANSMISSION_SLAB)
                    let transmissionVolumeParams: OpenPBRHomogeneousVolume = computeOpenPBRTransmissionVolume(
                        transmission_color.rgb,
                        transmission_depth,
                        transmission_scatter.rgb,
                        transmission_scatter_anisotropy
                    );
                #endif
                #if defined(SUBSURFACE_SLAB)
                    let subsurfaceVolumeParams: OpenPBRHomogeneousVolume = computeOpenPBRSubsurfaceVolume(
                        subsurface_color.rgb,
                        subsurface_radius,
                        subsurface_radius_scale.rgb,
                        subsurface_scatter_anisotropy
                    );
                #endif
                // Handle constant transmission with subsurface
                // Also, handle thin-walled geometry
                #if !defined(TRANSMISSION_SLAB)
                    volumeParams = subsurfaceVolumeParams;
                    surface_translucency_weight = subsurface_weight;
                #elif !defined(SUBSURFACE_SLAB)
                    volumeParams = transmissionVolumeParams;
                    #ifdef TRANSMISSION_SLAB_VOLUME
                        volumeParams.multi_scatter_color = singleScatterToMultiScatterAlbedo(volumeParams.ss_albedo);
                    #endif
                    surface_translucency_weight = transmission_weight;
                #else
                    let subsurface_fraction_of_dielectric: f32 = (1.0f - transmission_weight) * subsurface_weight;
                    let subsurface_and_transmission_fraction_of_dielectric: f32 = subsurface_fraction_of_dielectric + transmission_weight;
                    let reciprocal_of_subsurface_and_transmission_fraction_of_dielectric: f32 =
                        1.0f / maxEps(subsurface_and_transmission_fraction_of_dielectric);
                    let trans_weight: f32 = transmission_weight * reciprocal_of_subsurface_and_transmission_fraction_of_dielectric;
                    let subsurf_weight: f32 = subsurface_fraction_of_dielectric * reciprocal_of_subsurface_and_transmission_fraction_of_dielectric;
                    volumeParams.scatter_coeff = transmissionVolumeParams.scatter_coeff * trans_weight + subsurfaceVolumeParams.scatter_coeff * subsurf_weight;
                    volumeParams.absorption_coeff = transmissionVolumeParams.absorption_coeff * trans_weight + subsurfaceVolumeParams.absorption_coeff * subsurf_weight;
                    volumeParams.anisotropy = (transmissionVolumeParams.anisotropy * trans_weight + subsurfaceVolumeParams.anisotropy * subsurf_weight) / maxEps(trans_weight + subsurf_weight);
                    volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
                    volumeParams.ss_albedo = volumeParams.scatter_coeff / maxEpsVec3(volumeParams.extinction_coeff);
                    volumeParams.multi_scatter_color = singleScatterToMultiScatterAlbedo(volumeParams.ss_albedo);
                    surface_translucency_weight = subsurface_and_transmission_fraction_of_dielectric;
                #endif
            }
            volume_absorption = exp(-volumeParams.absorption_coeff * geometry_thickness);
            
            // Calculate approximate colour resulting from scattering. This will be used to colour diffuse lighting.
            var backscatter_color: vec3f = vec3f(1.0f);
            {
                let reduced_scatter: vec3f = volumeParams.scatter_coeff * vec3f(1.0f - volumeParams.anisotropy);
                let reduced_albedo: vec3f = reduced_scatter / (volumeParams.absorption_coeff + reduced_scatter);
                let sqrt_term: vec3f = max(sqrt(vec3f(1.0f) - reduced_albedo), vec3f(0.0001f));
                backscatter_color = (vec3f(1.0f) - sqrt_term) / (vec3f(1.0f) + sqrt_term);
            }
        #elif defined(TRANSMISSION_SLAB)
            // If we only have a transmission slab and no subsurface, use the transmission_weight directly
            surface_translucency_weight = transmission_weight;
        #endif

        let refractionAlphaG: f32 = transmission_roughness * transmission_roughness;
        
        #ifdef SCATTERING
            // Transmission Scattering
            #ifdef GEOMETRY_THIN_WALLED
                var iso_scatter_density: vec3f = vec3f(1.0f);
                var roughness_alpha_modified_for_scatter: f32 = 1.0f;
            #else
                
                let back_to_iso_scattering_blend: f32 = min(1.0f + volumeParams.anisotropy, 1.0f);
                let iso_to_forward_scattering_blend: f32 = max(volumeParams.anisotropy, 0.0f);
                // The 0.2 exponent is an empirical fit to match reference renderers - check if it works broadly
                let iso_scatter_transmittance: vec3f = pow(exp(-volumeParams.scatter_coeff * geometry_thickness), vec3f(0.2f));
                var iso_scatter_density: vec3f = clamp(vec3f(1.0f) - iso_scatter_transmittance, vec3f(0.0f), vec3f(1.0f));
            
                // Refraction roughness is modified by the density of the scattering and also by the anisotropy.
                var roughness_alpha_modified_for_scatter: f32 = min(refractionAlphaG + (1.0f - abs(volumeParams.anisotropy)) * max3(iso_scatter_density * iso_scatter_density), 1.0f);
                roughness_alpha_modified_for_scatter = pow(roughness_alpha_modified_for_scatter, 6.0f);
                roughness_alpha_modified_for_scatter = clamp(roughness_alpha_modified_for_scatter, refractionAlphaG, 1.0f);
            #endif

            // Blend the multi-scatter color towards single-scatter based on the scatter density
            // This is an empirical approximation to account for weaker scattering at low densities where scattering isn't strong enough to reach the multiple scattering colour.
            volumeParams.multi_scatter_color = mix(volumeParams.ss_albedo, volumeParams.multi_scatter_color, max3(iso_scatter_density));
        #else
            var roughness_alpha_modified_for_scatter: f32 = refractionAlphaG;
        #endif

        #if defined(TRANSMISSION_SLAB) && (!defined(TRANSMISSION_SLAB_VOLUME) || defined(GEOMETRY_THIN_WALLED))
            // Geometry is either thin-walled or we have a transmission slab with depth=0
            // For now, assume that mesh is closed and light enters and exits through the surface, leading to double-tinting.
            transmission_tint *= transmission_color.rgb * transmission_color.rgb;

            #ifdef SUBSURFACE_SLAB
                // When subsurface is also present, we need to blend some values between transmission and subsurface slabs.
                let unweighted_translucency: f32 = mix(subsurface_weight, 1.0f, transmission_weight);
                transmission_tint = mix(vec3f(1.0f), transmission_tint, transmission_weight / unweighted_translucency);
                // Roughness for transmission is just surface roughness while, for subsurface, transmission is fully diffuse.
                roughness_alpha_modified_for_scatter = mix(1.0f, refractionAlphaG, transmission_weight / unweighted_translucency);
            #endif

            #ifdef GEOMETRY_THIN_WALLED
                var sin2: f32 = 1.0f - baseGeoInfo.NdotV * baseGeoInfo.NdotV;
                // Divide by the square of the relative IOR (eta) of the incident medium and coat. This
                // is just coat_ior since the incident medium is air (IOR = 1.0).
                sin2 = sin2 / (specular_ior * specular_ior);
                let cos_t: f32 = sqrt(1.0f - sin2);
                let pathLength: f32 = 1.0f / cos_t;
                transmission_tint = pow(transmission_tint, vec3f(pathLength));
            #endif
        #endif

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
    #include<openpbrBlockPrePass>
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
