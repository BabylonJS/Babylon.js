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
            volumeParams.extinction_coeff = -log(maxEpsVec3(transmission_color.rgb)) * invDepth;
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

// SSS profile
fn sss_pdf(r: f32, d: vec3f) -> vec3f
{
    let d_clamped = max(vec3f(1e-4f), d);
    return (exp(-r / d_clamped) + exp(-r / (3.0f * d_clamped))) / max(vec3f(1e-5f), 8.0f * PI * d_clamped * r);
}

// Samples distribution (approx. of sss_pdf)
fn sss_samples_pdf(r: f32, d: f32) -> f32
{
    let d_clamped = max(1e-4f, d);
    return exp(-r / (3.0f * d_clamped)) / (6.0f * PI * d_clamped * r);
}

// Inverse of the CDF of [sss_samples_pdf * 2 * Pi * r] for importance sampling.
fn sss_samples_icdf(x: f32, d: f32) -> f32
{
    let d_clamped = max(1e-4f, d);
    let x_clamped = max(1e-4f, x);
    return -3.0f * log(x_clamped) * d_clamped;
}

// Inverse of the previous icdf for filter samples scaling
fn samples_scale(x: f32, d: f32) -> f32
{
    return 1.0f - exp(-x / (3.0f * d));
}

fn sss_get_position(depth_texture: texture_2d<f32>, tex_coord: vec2f, render_resolution: vec2f, inv_proj: mat4x4f) -> vec3f
{
    var P: vec4f = vec4f(tex_coord, textureLoad(depth_texture, vec2i(tex_coord * render_resolution), 0).x, 1.0f);
    P.x = 2.0f * P.x - 1.0f;
    P.y = 2.0f * P.y - 1.0f;
    P = inv_proj * P;
    return P.xyz / P.w;
}

// Use the projection matrix to determine the relative screen space scale of the filter
fn sss_filter_scale(currZ: f32, proj: mat4x4f) -> f32
{
    return 1.0f / dot(vec2f(proj[2].w, proj[3].w), vec2f(currZ, 1.0f));
}

fn projective_to_pixels(proj_dist: f32, proj: mat4x4f, resolution: vec2f) -> f32
{
    return proj_dist * proj[1][1] * resolution.y;
}

fn pixels_to_projective(pixel_dist: f32, proj: mat4x4f, resolution: vec2f) -> f32
{
    return pixel_dist / (proj[1][1] * resolution.y);
}

fn sss_convolve(sss_irradiance_texture: texture_2d<f32>, depth_texture: texture_2d<f32>, render_resolution: vec2f, d: vec3f, proj: mat4x4f, inv_proj: mat4x4f, sample_count: i32, noise: vec2f) -> vec3f
{
    let tex_coord: vec2f = fragmentInputs.position.xy / render_resolution;
    let unconvolved_irradiance: vec3f = textureLoad(sss_irradiance_texture, vec2i(fragmentInputs.position.xy), 0).rgb;
    let curr_pos: vec3f = sss_get_position(depth_texture, tex_coord, render_resolution, inv_proj);

    // Importance sample along the largest RGB component
    var dmax: f32 = max3(d);

    // Clamp max scattering distance to avoid cases where the sampling radius is so large
    // that even the closest sample is unlikely to hit a valid pixel.
    // It should be better to do it before Z scaling as most of the time, further objects also gets smaller.
    let max_dmax: f32 = 0.1 * f32(sample_count);
    var d_adjusted = d;
    if (dmax > max_dmax)
    {
        d_adjusted *= max_dmax / dmax;
        dmax = max_dmax;
    }

    // Scale sample distribution with z
    var dz: f32 = dmax * sss_filter_scale(curr_pos.z, proj);

    let projMat2d: mat2x2f = mat2x2f(proj[0].xy, proj[1].xy);
    if (determinant(projMat2d) * dz < 1e-4f) {
        return unconvolved_irradiance;
    }

    // Overscan size is 10% of the maximum screen dimension in pixels, which should be enough to capture most of the energy for typical SSS profiles and prevent artifacts from insufficient sampling.
    let overscan_size_in_pixels: f32 = max(render_resolution.x, render_resolution.y) * 0.1;

    // Clamp scattering distance to a "safe" value regarding tiles overscan size.
    // Support is infinite so we have to pick a representative radius containing most of the energy.
    let filter_crop_ratio: f32 = 0.8f;  // 0.8 = 80% of SSS energy
    let crop_radius: f32 = projective_to_pixels(sss_samples_icdf(1.0f - filter_crop_ratio, dz), proj, render_resolution);
    if (crop_radius > overscan_size_in_pixels)
    {
        d_adjusted *= overscan_size_in_pixels / crop_radius;
        dz *= overscan_size_in_pixels / crop_radius;
    }

    let filter_samples_scale: f32 = samples_scale(pixels_to_projective(overscan_size_in_pixels, proj, render_resolution), dz);

    var irradiance_sum: vec3f = vec3f(0.0f);
    var weight_sum: vec3f = vec3f(0.0f);
    for (var i: i32 = 0; i < sample_count; i++)
    {
        var r: vec2f = fract(plasticSequence(u32(i + sample_count)) + noise * vec2(0.2));
        r.x *= TWO_PI;
        r.y *= filter_samples_scale;
        let icdf: f32 = sss_samples_icdf(1.0 - r.y, dz);
        let sample_uv: vec2f = tex_coord + icdf * projMat2d * vec2f(cos(r.x), sin(r.x));
        let sss_irradiance: vec4f = textureLoad(sss_irradiance_texture, vec2i(sample_uv * render_resolution), 0);
        // Re-weight samples with the scene 3D distance and SSS profile instead of 2D importance sampling weights
        // SSS mask in alpha
        let dist: f32 = distance(curr_pos, sss_get_position(depth_texture, sample_uv, render_resolution, inv_proj));
        if (dist > 0.0f)
        {
            let weights: vec3f = sss_irradiance.a / sss_samples_pdf(icdf, dz) * sss_pdf(dist, d_adjusted);
            irradiance_sum += weights * sss_irradiance.rgb;
            weight_sum += weights;
        }
    }

    return vec3f(select(unconvolved_irradiance.r, irradiance_sum.r / weight_sum.r, weight_sum.r >= 1e-5f),
                select(unconvolved_irradiance.g, irradiance_sum.g / weight_sum.g, weight_sum.g >= 1e-5f),
                select(unconvolved_irradiance.b, irradiance_sum.b / weight_sum.b, weight_sum.b >= 1e-5f));
}
