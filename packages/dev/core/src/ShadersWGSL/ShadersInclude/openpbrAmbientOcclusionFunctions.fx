fn compute_specular_occlusion(n_dot_v: f32, metallic: f32, ambient_occlusion: f32, roughness: f32) -> f32
{
    // Empirical approximation proposed in:
    // https://seblagarde.wordpress.com/2015/07/14/siggraph-2014-moving-frostbite-to-physically-based-rendering/
    // cf. Section 4.10.2 Specular occlusion
    let specular_occlusion: f32 = saturate(pow(n_dot_v + ambient_occlusion, exp2(-16.0 * roughness - 1.0)) - 1.0 + ambient_occlusion);

    // Approximation pulled from Painter to remove AO on glossy metals (close to mirrors).
    return mix(specular_occlusion, 1.0, metallic * square(1.0 - roughness));
}
