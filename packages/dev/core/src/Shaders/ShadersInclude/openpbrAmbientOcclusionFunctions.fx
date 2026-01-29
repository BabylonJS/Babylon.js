float compute_specular_occlusion(const float n_dot_v, const float metallic, const float ambient_occlusion, const float roughness)
{
    // Empirical approximation proposed in:
    // https://seblagarde.wordpress.com/2015/07/14/siggraph-2014-moving-frostbite-to-physically-based-rendering/
    // cf. Section 4.10.2 Specular occlusion
    float specular_occlusion = saturate(pow(n_dot_v + ambient_occlusion, exp2(-16.0 * roughness - 1.0)) - 1.0 + ambient_occlusion);

    // Approximation pulled from Painter to remove AO on glossy metals (close to mirrors).
    return mix(specular_occlusion, 1.0, metallic * square(1.0 - roughness));
}
