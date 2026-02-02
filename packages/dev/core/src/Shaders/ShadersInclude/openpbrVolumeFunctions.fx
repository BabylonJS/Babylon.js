struct OpenPBRHomogeneousVolume {
    vec3  extinction_coeff;        // Extinction coefficient (per unit length)
    vec3  ss_albedo;              // Single scattering albedo
    vec3  multi_scatter_color;    // Multi-scatter albedo
    vec3  absorption_coeff;        // Absorption coefficient (per unit length)
    vec3  scatter_coeff;          // Scattering coefficient (per unit length)
    float anisotropy;       // Scattering phase function anisotropy
};

OpenPBRHomogeneousVolume computeOpenPBRTransmissionVolume(
    in vec3 transmission_color,
    in float transmission_depth,
    in vec3 transmission_scatter,
    in float anisotropy
)
{
    OpenPBRHomogeneousVolume volumeParams;

    // Default to no volume
    volumeParams.absorption_coeff = vec3(0.0);
    volumeParams.scatter_coeff = vec3(0.0);
    volumeParams.anisotropy = anisotropy;

    if (transmission_depth > 0.0) {
        // Compute only if we have a valid transmission
        vec3 invDepth = vec3(1. / maxEps(transmission_depth));
        volumeParams.extinction_coeff = -log(transmission_color.rgb) * invDepth;
        volumeParams.scatter_coeff = transmission_scatter.rgb * invDepth;
        volumeParams.absorption_coeff = volumeParams.extinction_coeff - volumeParams.scatter_coeff.rgb;
        float minCoeff = min3(volumeParams.absorption_coeff);
        if (minCoeff < 0.0) {
            volumeParams.absorption_coeff -= vec3(minCoeff);
        }
        // Set extinction coefficient after shifting the absorption to be non-negative.
        volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
        volumeParams.ss_albedo = volumeParams.scatter_coeff / (volumeParams.extinction_coeff);
    } else {
        volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
        volumeParams.ss_albedo = vec3(0.0);
    }

    return volumeParams;
}

OpenPBRHomogeneousVolume computeOpenPBRSubsurfaceVolume(
    in vec3 subsurface_color,
    in float subsurface_radius,
    in vec3 subsurface_radius_scale,
    in float anisotropy
)
{
    OpenPBRHomogeneousVolume volumeParams;

    // Default to no volume
    volumeParams.absorption_coeff = vec3(0.0);
    volumeParams.scatter_coeff = vec3(0.0);
    volumeParams.anisotropy = anisotropy;

    // Figure out subsurface scattering contribution
    volumeParams.multi_scatter_color = subsurface_color;
    vec3 mfp = subsurface_radius_scale * vec3(subsurface_radius);
    volumeParams.extinction_coeff = vec3(1.0) / maxEps(mfp);

    // Convert subsurface color to single scatter albedo and then to coefficients
    volumeParams.ss_albedo = multiScatterToSingleScatterAlbedo(subsurface_color, anisotropy);
    volumeParams.scatter_coeff = volumeParams.ss_albedo * volumeParams.extinction_coeff;
    volumeParams.absorption_coeff = volumeParams.extinction_coeff - volumeParams.scatter_coeff.rgb;
    float minCoeff = min3(volumeParams.absorption_coeff);
    if (minCoeff < 0.0) {
        volumeParams.absorption_coeff -= vec3(minCoeff);
    }
    // Set extinction coefficient after shifting the absorption to be non-negative.
    volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;

    return volumeParams;
}