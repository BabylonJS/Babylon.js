struct OpenPBRHomogeneousVolume {
    extinction_coeff: vec3f,        // Extinction coefficient (per unit length)
    ss_albedo: vec3f,              // Single scattering albedo
    multi_scatter_color: vec3f,    // Multi-scatter albedo
    absorption_coeff: vec3f,        // Absorption coefficient (per unit length)
    scatter_coeff: vec3f,          // Scattering coefficient (per unit length)
    anisotropy: f32,       // Scattering phase function anisotropy
};

fn computeOpenPBRTransmissionVolume(
    transmission_color: vec3f,
    transmission_depth: f32,
    transmission_scatter: vec3f,
    anisotropy: f32
) -> OpenPBRHomogeneousVolume
{
    var volumeParams: OpenPBRHomogeneousVolume;

    // Default to no volume
    volumeParams.absorption_coeff = vec3f(0.0f);
    volumeParams.scatter_coeff = vec3f(0.0f);
    volumeParams.anisotropy = anisotropy;

    #ifdef GEOMETRY_THIN_WALLED
        // For thin-walled geometry, we don't compute actual volume coefficients
        volumeParams.scatter_coeff = vec3f(1.0f);
        volumeParams.anisotropy = 1.0f; // Forward scattering
        volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
        volumeParams.ss_albedo = vec3f(1.0f);
    #else
        if (transmission_depth > 0.0f) {
            // Compute only if we have a valid transmission
            let invDepth: vec3f = vec3f(1.f / maxEps(transmission_depth));
            volumeParams.extinction_coeff = -log(transmission_color.rgb) * invDepth;
            volumeParams.scatter_coeff = transmission_scatter.rgb * invDepth;
            volumeParams.absorption_coeff = volumeParams.extinction_coeff - volumeParams.scatter_coeff.rgb;
            let minCoeff: f32 = min3(volumeParams.absorption_coeff);
            if (minCoeff < 0.0f) {
                volumeParams.absorption_coeff -= vec3f(minCoeff);
            }
            // Set extinction coefficient after shifting the absorption to be non-negative.
            volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
            volumeParams.ss_albedo = volumeParams.scatter_coeff / (volumeParams.extinction_coeff);
        } else {
            volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
            volumeParams.ss_albedo = vec3f(0.0f);
        }
    #endif

    return volumeParams;
}

fn computeOpenPBRSubsurfaceVolume(
    subsurface_color: vec3f,
    subsurface_radius: f32,
    subsurface_radius_scale: vec3f,
    anisotropy: f32
) -> OpenPBRHomogeneousVolume
{
    var volumeParams: OpenPBRHomogeneousVolume;

    // Default to no volume
    volumeParams.absorption_coeff = vec3f(0.0f);
    volumeParams.scatter_coeff = vec3f(0.0f);
    volumeParams.anisotropy = anisotropy;

    // Figure out subsurface scattering contribution
    volumeParams.multi_scatter_color = subsurface_color;
    let mfp: vec3f = subsurface_radius_scale * vec3f(subsurface_radius);
    volumeParams.extinction_coeff = vec3f(1.0f) / maxEpsVec3(mfp);

    // Convert subsurface color to single scatter albedo and then to coefficients
    volumeParams.ss_albedo = multiScatterToSingleScatterAlbedoWithAniso(subsurface_color, anisotropy);
    volumeParams.scatter_coeff = volumeParams.ss_albedo * volumeParams.extinction_coeff;
    volumeParams.absorption_coeff = volumeParams.extinction_coeff - volumeParams.scatter_coeff.rgb;
    let minCoeff: f32 = min3(volumeParams.absorption_coeff);
    if (minCoeff < 0.0f) {
        volumeParams.absorption_coeff -= vec3f(minCoeff);
    }
    // Set extinction coefficient after shifting the absorption to be non-negative.
    volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;

    return volumeParams;
}
