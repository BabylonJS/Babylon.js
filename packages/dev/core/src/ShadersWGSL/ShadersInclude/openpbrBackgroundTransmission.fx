
var slab_translucent_background: vec4f = vec4f(0., 0., 0., 1.);

#ifdef REFRACTED_BACKGROUND
{
    // Select a mipmap LOD appropriate for the roughness.
    // vBackgroundRefractionInfos.x = log2(LOD0 resolution) = number of mip levels.
    let refractionLOD: f32 = min(transmission_roughness, 0.7) * uniforms.vBackgroundRefractionInfos.x;

    // Size of one texel at the selected LOD, expressed in UV [0,1] space.
    // At LOD k of an N-level mip chain, one texel = 2^k / 2^N = 2^(k-N).
    let lodTexelSize: f32 = pow(2.0f, refractionLOD - uniforms.vBackgroundRefractionInfos.x);

    #ifdef DISPERSION
    {
        #ifdef REFRACTION_HIGH_QUALITY_BLUR
        {
            // High quality: 6 spectral samples for smooth inter-channel blending.
            // Samples are distributed along the R→G→B dispersion path where t ∈ [0,1]
            // maps R=0, G=0.5, B=1. Each sample contributes to all three output channels
            // via tent functions that peak at the corresponding anchor wavelength.
            // Stratified jitter (noise.y) randomises positions within each stratum to
            // prevent regular-pattern aliasing across the spectrum. The spatial offset
            // (noise.xy * lodTexelSize) reduces bilinear block artifacts at higher LODs.
            var dispResult: vec3f = vec3f(0.0);
            var dispWeight: vec3f = vec3f(0.0);
            let noiseOffset: vec2f = noise.xy * select(0.0f, lodTexelSize, refractionLOD > 0.0f);
            for (var k: i32 = 0; k < 6; k++) {
                // Stratified spectral position: one sample per sixth of [0, 1], jittered by noise.y
                let t: f32 = (f32(k) + noise.y) / 6.0f;
                // Piecewise-linear refracted view vector: R→G over [0, 0.5], G→B over [0.5, 1].
                // Written branchlessly via two clamped lerp parameters.
                let t_rg: f32 = clamp(t * 2.0f, 0.0f, 1.0f);
                let t_gb: f32 = clamp((t - 0.5f) * 2.0f, 0.0f, 1.0f);
                let refVec: vec3f = mix(mix(refractedViewVectors[0], refractedViewVectors[1], t_rg), refractedViewVectors[2], t_gb);
                let uvw: vec3f = vec3f((uniforms.backgroundRefractionMatrix * (scene.view * vec4f(fragmentInputs.vPositionW + refVec * geometry_thickness, 1.0f))).xyz);
                var coords: vec2f = uvw.xy / uvw.z;
                coords.y = 1.0f - coords.y;
                let s: vec4f = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, coords + noiseOffset, refractionLOD);
                // Tent-function spectral weights: each peaks at its anchor wavelength
                let rw: f32 = max(0.0f, 1.0f - 2.0f * t);
                let gw: f32 = max(0.0f, 1.0f - abs(2.0f * t - 1.0f));
                let bw: f32 = max(0.0f, 2.0f * t - 1.0f);
                let w: vec3f = vec3f(rw, gw, bw);
                dispResult += s.rgb * w;
                dispWeight += w;
            }
            slab_translucent_background = vec4f(dispResult / max(dispWeight, vec3f(1e-6)), 1.0f);
        }
        #else
        // Low quality: one sample per channel, noise-dithered when blurring.
        for (var i: i32 = 0; i < 3; i++) {
            let refractedViewVector: vec3f = refractedViewVectors[i];
            let uvw: vec3f = vec3f((uniforms.backgroundRefractionMatrix * (scene.view * vec4f(fragmentInputs.vPositionW + refractedViewVector * geometry_thickness, 1.0f))).xyz);
            var coords: vec2f = uvw.xy / uvw.z;
            coords.y = 1.0f - coords.y;
            if (refractionLOD > 0.0f) {
                let noiseOffset: vec2f = noise.xy * lodTexelSize;
                slab_translucent_background[i] = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, coords + noiseOffset, refractionLOD)[i];
            } else {
                slab_translucent_background[i] = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, coords, 0.0f)[i];
            }
        }
        #endif
    }
    #else
    {
        let refractionUVW: vec3f = vec3f((uniforms.backgroundRefractionMatrix * (scene.view * vec4f(fragmentInputs.vPositionW + refractedViewVector * geometry_thickness, 1.0f))).xyz);
        var refractionCoords: vec2f = refractionUVW.xy / refractionUVW.z;
        refractionCoords.y = 1.0f - refractionCoords.y;
        if (refractionLOD > 0.0f) {
            #ifdef REFRACTION_HIGH_QUALITY_BLUR
                // 4-tap rotated-grid kernel: eliminates bilinear block artifacts at higher LODs.
                // The 4 samples sit at ±0.5 texels in a noise-rotated 2×2 grid so the bilinear
                // cell boundaries are never aligned with the sample pattern. The rotation angle
                // varies by pixel (via noise) so no fixed grid accumulates even without TAA.
                let cosA: f32 = cos(noise.x * PI);
                let sinA: f32 = sin(noise.x * PI);
                let u: vec2f = vec2f( cosA, sinA) * (0.5f * lodTexelSize);
                let v: vec2f = vec2f(-sinA, cosA) * (0.5f * lodTexelSize);
                slab_translucent_background = 0.25f * (
                    textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords + u + v, refractionLOD) +
                    textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords - u + v, refractionLOD) +
                    textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords + u - v, refractionLOD) +
                    textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords - u - v, refractionLOD)
                );
            #else
                let noiseOffset: vec2f = noise.xy * lodTexelSize;
                slab_translucent_background = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords + noiseOffset, refractionLOD);
            #endif
        } else {
            slab_translucent_background = textureSampleLevel(backgroundRefractionSampler, backgroundRefractionSamplerSampler, refractionCoords, 0.0f);
        }
    }
    #endif
}

#endif
