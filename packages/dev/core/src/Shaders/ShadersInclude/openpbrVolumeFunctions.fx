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

    #ifdef GEOMETRY_THIN_WALLED
        // For thin-walled geometry, we don't compute actual volume coefficients
        volumeParams.scatter_coeff = vec3(1.0);
        volumeParams.anisotropy = 1.0; // Forward scattering
        volumeParams.extinction_coeff = volumeParams.absorption_coeff + volumeParams.scatter_coeff;
        volumeParams.ss_albedo = vec3(1.0);
    #else
        if (transmission_depth > 0.0) {
            // Compute only if we have a valid transmission
            vec3 invDepth = vec3(1. / maxEps(transmission_depth));
            volumeParams.extinction_coeff = -log(maxEps(transmission_color.rgb)) * invDepth;
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
    #endif

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

// SSS profile
vec3 sss_pdf(float r, vec3 d)
{
    d = max(vec3(1e-4f), d);
    return (exp(-r / d) + exp(-r / (3.0f * d))) / max(vec3(1e-5f), 8.0f * PI * d * r);
}

// Samples distribution (approx. of sss_pdf)
float sss_samples_pdf(float r, float d)
{
    d = max(1e-4f, d);
    return exp(-r / (3.0f * d)) / (6.0f * PI * d * r);
}

// Inverse of the CDF of [sss_samples_pdf * 2 * Pi * r] for importance sampling.
float sss_samples_icdf(float x, float d)
{
    d = max(1e-4f, d);
    x = max(1e-4f, x);
    return -3.0f * log(x) * d;
}

// Inverse of the previous icdf for filter samples scaling
float samples_scale(float x, float d)
{
    return 1.0f - exp(-x / (3.0f * d));
}

vec3 sss_get_position(sampler2D depth_texture, vec2 tex_coord, vec2 render_resolution, mat4 inv_proj)
{
    vec4 P = vec4(tex_coord, texelFetch(depth_texture, ivec2(tex_coord * render_resolution), 0).x, 1.0f);
    P.xy = 2.0f * P.xy - 1.0f;
    P = inv_proj * P;
    return P.xyz / P.w;
}

// Use the projection matrix to determine the relative screen space scale of the filter
float sss_filter_scale(float currZ, mat4 proj)
{
    return 1.0f / dot(vec2(proj[2].w, proj[3].w), vec2(currZ, 1.0f));
}

float projective_to_pixels(float proj_dist, mat4 proj, vec2 resolution)
{
    return proj_dist * proj[1][1] * resolution.y;
}

float pixels_to_projective(float pixel_dist, mat4 proj, vec2 resolution)
{
    return pixel_dist / (proj[1][1] * resolution.y);
}

vec3 sss_convolve(sampler2D sss_irradiance_texture, sampler2D depth_texture, vec2 render_resolution, vec3 d, mat4 proj, mat4 inv_proj, int sample_count, vec2 noise)
{
    vec2 tex_coord = gl_FragCoord.xy / render_resolution;
    vec3 unconvolved_irradiance = texelFetch(sss_irradiance_texture, ivec2(gl_FragCoord.xy), 0).rgb;
    vec3 curr_pos = sss_get_position(depth_texture, tex_coord, render_resolution, inv_proj);

    // Importance sample along the largest RGB component
    float dmax = max3(d);

    // Clamp max scattering distance to avoid cases where the sampling radius is so large
    // that even the closest sample is unlikely to hit a valid pixel.
    // It should be better to do it before Z scaling as most of the time, further objects also gets smaller.
    float max_dmax = 0.1 * float(sample_count);
    if (dmax > max_dmax)
    {
        d.rgb *= max_dmax / dmax;
        dmax = max_dmax;
    }

    // Scale sample distribution with z
    float dz = dmax * sss_filter_scale(curr_pos.z, proj);

    mat2 projMat2d = mat2(proj);
    if (determinant(projMat2d) * dz < 1e-4f)
        return unconvolved_irradiance;

    // Overscan size is 10% of the maximum screen dimension in pixels, which should be enough to capture most of the energy for typical SSS profiles and prevent artifacts from insufficient sampling.
    float overscan_size_in_pixels = max(render_resolution.x, render_resolution.y) * 0.1;

    // Clamp scattering distance to a "safe" value regarding tiles overscan size.
    // Support is infinite so we have to pick a representative radius containing most of the energy.
    const float filter_crop_ratio = 0.8f;  // 0.8 = 80% of SSS energy
    float crop_radius = projective_to_pixels(sss_samples_icdf(1.0f - filter_crop_ratio, dz), proj, render_resolution);
    if (crop_radius > overscan_size_in_pixels)
    {
        d.rgb *= overscan_size_in_pixels / crop_radius;
        dz *= overscan_size_in_pixels / crop_radius;
    }

    float filter_samples_scale = samples_scale(pixels_to_projective(overscan_size_in_pixels, proj, render_resolution), dz);

    vec3 irradiance_sum = vec3(0.0f);
    vec3 weight_sum = vec3(0.0f);
    for (int i = 0; i < sample_count; i++)
    {
        vec2 r = fract(plasticSequence(uint(i + sample_count)) + noise * 0.2);
        r.x *= TWO_PI;
        r.y *= filter_samples_scale;
        float icdf = sss_samples_icdf(1.0 - r.y, dz);
        vec2 sample_uv = tex_coord + icdf * projMat2d * vec2(cos(r.x), sin(r.x));
        vec4 sss_irradiance = texelFetch(sss_irradiance_texture, ivec2(sample_uv * render_resolution), 0);
        // Re-weight samples with the scene 3D distance and SSS profile instead of 2D importance sampling weights
        // SSS mask in alpha
        float dist = distance(curr_pos, sss_get_position(depth_texture, sample_uv, render_resolution, inv_proj));
        if (dist > 0.0f)
        {
            vec3 weights = sss_irradiance.a / sss_samples_pdf(icdf, dz) * sss_pdf(dist, d.rgb);
            irradiance_sum += weights * sss_irradiance.rgb;
            weight_sum += weights;
        }
    }

    return vec3(weight_sum.r < 1e-5f ? unconvolved_irradiance.r : irradiance_sum.r / weight_sum.r,
                weight_sum.g < 1e-5f ? unconvolved_irradiance.g : irradiance_sum.g / weight_sum.g,
                weight_sum.b < 1e-5f ? unconvolved_irradiance.b : irradiance_sum.b / weight_sum.b);
}