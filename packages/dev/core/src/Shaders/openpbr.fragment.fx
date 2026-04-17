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
#include<openpbrVolumeFunctions>

// Do a mix between layers with additional multipliers for each layer.
vec3 layer(vec3 slab_bottom, vec3 slab_top, float lerp_factor, vec3 bottom_multiplier, vec3 top_multiplier) {

    return mix(slab_bottom * bottom_multiplier, slab_top * top_multiplier, lerp_factor);
}

// _____________________________ MAIN FUNCTION ____________________________
void main(void) {

    #ifdef PREPASS_IRRADIANCE
        vec3 total_direct_diffuse = vec3(0.0);
    #endif

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

    // Absorption for entire volume thickness
    vec3 volume_absorption = vec3(1.0);
    // Surface constant tint for transmission
    vec3 transmission_tint = vec3(1.0);
    float surface_translucency_weight = 0.0;
    #if defined(REFRACTED_BACKGROUND) || defined(REFRACTED_ENVIRONMENT) || defined(REFRACTED_LIGHTS)
        #if defined(GEOMETRY_THIN_WALLED)
            vec3 refractedViewVector = -viewDirectionW;
        #else
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
        #endif
        #ifdef GEOMETRY_THIN_WALLED
            float transmission_roughness = specular_roughness;
        #else
            // Transmission blurriness is affected by IOR so we scale the roughness accordingly
            float transmission_roughness = specular_roughness * clamp(4.0 * (specular_ior - 1.0), 0.001, 1.0);
        #endif

        #if (defined(TRANSMISSION_SLAB) || defined(SUBSURFACE_SLAB))
        
            OpenPBRHomogeneousVolume volumeParams;
            {
                #if defined(TRANSMISSION_SLAB)
                    OpenPBRHomogeneousVolume transmissionVolumeParams = computeOpenPBRTransmissionVolume(
                        transmission_color.rgb,
                        transmission_depth,
                        transmission_scatter.rgb,
                        transmission_scatter_anisotropy
                    );
                #endif
                #if defined(SUBSURFACE_SLAB)
                    OpenPBRHomogeneousVolume subsurfaceVolumeParams = computeOpenPBRSubsurfaceVolume(
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
                    float subsurface_fraction_of_dielectric = (1.0f - transmission_weight) * subsurface_weight;
                    float subsurface_and_transmission_fraction_of_dielectric = subsurface_fraction_of_dielectric + transmission_weight;
                    float reciprocal_of_subsurface_and_transmission_fraction_of_dielectric =
                        1.0f / maxEps(subsurface_and_transmission_fraction_of_dielectric);
                    float trans_weight = transmission_weight * reciprocal_of_subsurface_and_transmission_fraction_of_dielectric;
                    float subsurf_weight = subsurface_fraction_of_dielectric * reciprocal_of_subsurface_and_transmission_fraction_of_dielectric;
                    volumeParams.scatter_coeff = transmissionVolumeParams.scatter_coeff * trans_weight + subsurfaceVolumeParams.scatter_coeff * subsurf_weight;
                    volumeParams.absorption_coeff = transmissionVolumeParams.absorption_coeff * trans_weight + subsurfaceVolumeParams.absorption_coeff * subsurf_weight;
                    volumeParams.anisotropy = (transmissionVolumeParams.anisotropy * trans_weight + subsurfaceVolumeParams.anisotropy * subsurf_weight) / maxEps(trans_weight + subsurf_weight);
                    volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
                    volumeParams.ss_albedo = volumeParams.scatter_coeff / maxEps(volumeParams.extinction_coeff);
                    volumeParams.multi_scatter_color = singleScatterToMultiScatterAlbedo(volumeParams.ss_albedo);
                    surface_translucency_weight = subsurface_and_transmission_fraction_of_dielectric;
                #endif
            }
            volume_absorption = exp(-volumeParams.absorption_coeff * geometry_thickness);
            
            // Calculate approximate colour resulting from scattering. This will be used to colour diffuse lighting.
            vec3 backscatter_color = vec3(1.0);
            {
                vec3 reduced_scatter = volumeParams.scatter_coeff * vec3(1.0 - volumeParams.anisotropy);
                vec3 reduced_albedo = reduced_scatter / (volumeParams.absorption_coeff + reduced_scatter);
                vec3 sqrt_term = max(sqrt(1.0 - reduced_albedo), 0.0001);
                backscatter_color = (1.0 - sqrt_term) / (1.0 + sqrt_term);
            }

        #elif defined(TRANSMISSION_SLAB)
            // If we only have a transmission slab and no subsurface, use the transmission_weight directly
            surface_translucency_weight = transmission_weight;
        #endif

        float refractionAlphaG = transmission_roughness * transmission_roughness;
        
        #ifdef SCATTERING
            // Transmission Scattering
            #ifdef GEOMETRY_THIN_WALLED
                vec3 iso_scatter_density = vec3(1.0);
                float roughness_alpha_modified_for_scatter = 1.0;
            #else

                #ifdef USE_IRRADIANCE_TEXTURE_FOR_SCATTERING
                    // If we have a precomputed multi-scatter texture, we can use the scatter vector to sample it and get a more accurate scattered environment light.
                    // This allows us to capture higher order scattering effects that aren't possible with just a single scatter sample.
                    vec3 mfp = vec3(100.0) / volumeParams.extinction_coeff;
                    vec3 scattered_light_from_irradiance_texture = sss_convolve(sceneIrradianceSampler, sceneDepthSampler, renderTargetSize, mfp, projection, inverseProjection, 16, noise.xy);
                #else
                    vec3 scattered_light_from_irradiance_texture = vec3(0.0);
                #endif
                
                float back_to_iso_scattering_blend = min(1.0 + volumeParams.anisotropy, 1.0);
                float iso_to_forward_scattering_blend = max(volumeParams.anisotropy, 0.0);
                // The 0.2 exponent is an empirical fit to match reference renderers - check if it works broadly
                vec3 iso_scatter_transmittance = pow(exp(-volumeParams.scatter_coeff * geometry_thickness), vec3(0.2));
                vec3 iso_scatter_density = clamp(vec3(1.0) - iso_scatter_transmittance, 0.0, 1.0);
            
                // Refraction roughness is modified by the density of the scattering and also by the anisotropy.
                float roughness_alpha_modified_for_scatter = min(refractionAlphaG + (1.0 - abs(volumeParams.anisotropy)) * max3(iso_scatter_density * iso_scatter_density), 1.0);
                roughness_alpha_modified_for_scatter = pow(roughness_alpha_modified_for_scatter, 6.0);
                roughness_alpha_modified_for_scatter = clamp(roughness_alpha_modified_for_scatter, refractionAlphaG, 1.0);
            #endif

            // Blend the multi-scatter color towards single-scatter based on the scatter density
            // This is an empirical approximation to account for weaker scattering at low densities where scattering isn't strong enough to reach the multiple scattering colour.
            volumeParams.multi_scatter_color = mix(volumeParams.ss_albedo, volumeParams.multi_scatter_color, max3(iso_scatter_density));
        #else
            float roughness_alpha_modified_for_scatter = refractionAlphaG;
        #endif

        #if defined(TRANSMISSION_SLAB) && (!defined(TRANSMISSION_SLAB_VOLUME) || defined(GEOMETRY_THIN_WALLED))
            // Geometry is either thin-walled or we have a transmission slab with depth=0
            // For now, assume that mesh is closed and light enters and exits through the surface, leading to double-tinting.
            transmission_tint *= transmission_color.rgb * transmission_color.rgb;

            #ifdef SUBSURFACE_SLAB
                // When subsurface is also present, we need to blend some values between transmission and subsurface slabs.
                float unweighted_translucency = mix(subsurface_weight, 1.0f, transmission_weight);
                transmission_tint = mix(vec3(1.0), transmission_tint, transmission_weight / unweighted_translucency);
                // Roughness for transmission is just surface roughness while, for subsurface, transmission is fully diffuse.
                roughness_alpha_modified_for_scatter = mix(1.0, refractionAlphaG, transmission_weight / unweighted_translucency);
            #endif

            #ifdef GEOMETRY_THIN_WALLED
                float sin2 = 1.0 - baseGeoInfo.NdotV * baseGeoInfo.NdotV;
                // Divide by the square of the relative IOR (eta) of the incident medium and coat. This
                // is just coat_ior since the incident medium is air (IOR = 1.0).
                sin2 = sin2 / (specular_ior * specular_ior);
                float cos_t = sqrt(1.0 - sin2);
                float pathLength = 1.0 / cos_t;
                transmission_tint = pow(transmission_tint, vec3(pathLength));
            #endif
        #endif
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
    #include<openpbrBlockPrePass>
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
