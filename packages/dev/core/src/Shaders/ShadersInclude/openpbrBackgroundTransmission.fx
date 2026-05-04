
vec4 slab_translucent_background = vec4(0., 0., 0., 1.);

#ifdef REFRACTED_BACKGROUND
{
    // Select a mipmap LOD appropriate for the roughness.
    // vBackgroundRefractionInfos.x = log2(LOD0 resolution) = number of mip levels.
    float refractionLOD = min(transmission_roughness, 0.7) * vBackgroundRefractionInfos.x;

    // Size of one texel at the selected LOD, expressed in UV [0,1] space.
    // At LOD k of an N-level mip chain, one texel = 2^k / 2^N = 2^(k-N).
    float lodTexelSize = pow(2.0, refractionLOD - vBackgroundRefractionInfos.x);

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
            vec3 dispResult = vec3(0.0);
            vec3 dispWeight = vec3(0.0);
            vec2 noiseOffset = noise.xy * (refractionLOD > 0.0 ? lodTexelSize : 0.0);
            for (int k = 0; k < 6; k++) {
                // Stratified spectral position: one sample per sixth of [0, 1], jittered by noise.y
                float t = (float(k) + noise.y) / 6.0;
                // Piecewise-linear refracted view vector: R→G over [0, 0.5], G→B over [0.5, 1].
                // Written branchlessly via two clamped lerp parameters.
                float t_rg = clamp(t * 2.0, 0.0, 1.0);
                float t_gb = clamp((t - 0.5) * 2.0, 0.0, 1.0);
                vec3 refVec = mix(mix(refractedViewVectors[0], refractedViewVectors[1], t_rg), refractedViewVectors[2], t_gb);
                vec3 uvw = vec3(backgroundRefractionMatrix * (view * vec4(vPositionW + refVec * geometry_thickness, 1.0)));
                vec2 coords = uvw.xy / uvw.z;
                coords.y = 1.0 - coords.y;
                vec4 s = texture2DLodEXT(backgroundRefractionSampler, coords + noiseOffset, refractionLOD);
                // Tent-function spectral weights: each peaks at its anchor wavelength
                float rw = max(0.0, 1.0 - 2.0 * t);
                float gw = max(0.0, 1.0 - abs(2.0 * t - 1.0));
                float bw = max(0.0, 2.0 * t - 1.0);
                vec3 w = vec3(rw, gw, bw);
                dispResult += s.rgb * w;
                dispWeight += w;
            }
            slab_translucent_background = vec4(dispResult / max(dispWeight, vec3(1e-6)), 1.0);
        }
        #else
        // Low quality: one sample per channel, noise-dithered when blurring.
        for (int i = 0; i < 3; i++) {
            vec3 refractedViewVector = refractedViewVectors[i];
            vec3 uvw = vec3(backgroundRefractionMatrix * (view * vec4(vPositionW + refractedViewVector * geometry_thickness, 1.0)));
            vec2 coords = uvw.xy / uvw.z;
            coords.y = 1.0 - coords.y;
            if (refractionLOD > 0.0) {
                vec2 noiseOffset = noise.xy * lodTexelSize;
                slab_translucent_background[i] = texture2DLodEXT(backgroundRefractionSampler, coords + noiseOffset, refractionLOD)[i];
            } else {
                slab_translucent_background[i] = texture2DLodEXT(backgroundRefractionSampler, coords, 0.0)[i];
            }
        }
        #endif
    }
    #else
    {
        vec3 refractionUVW = vec3(backgroundRefractionMatrix * (view * vec4(vPositionW + refractedViewVector * geometry_thickness, 1.0)));
        vec2 refractionCoords = refractionUVW.xy / refractionUVW.z;
        refractionCoords.y = 1.0 - refractionCoords.y;
        if (refractionLOD > 0.0) {
            #ifdef REFRACTION_HIGH_QUALITY_BLUR
                // 4-tap rotated-grid kernel: eliminates bilinear block artifacts at higher LODs.
                // The 4 samples sit at ±0.5 texels in a noise-rotated 2×2 grid so the bilinear
                // cell boundaries are never aligned with the sample pattern. The rotation angle
                // varies by pixel (via noise) so no fixed grid accumulates even without TAA.
                float cosA = cos(noise.x * PI);
                float sinA = sin(noise.x * PI);
                vec2 u = vec2( cosA, sinA) * (0.5 * lodTexelSize);
                vec2 v = vec2(-sinA, cosA) * (0.5 * lodTexelSize);
                slab_translucent_background = 0.25 * (
                    texture2DLodEXT(backgroundRefractionSampler, refractionCoords + u + v, refractionLOD) +
                    texture2DLodEXT(backgroundRefractionSampler, refractionCoords - u + v, refractionLOD) +
                    texture2DLodEXT(backgroundRefractionSampler, refractionCoords + u - v, refractionLOD) +
                    texture2DLodEXT(backgroundRefractionSampler, refractionCoords - u - v, refractionLOD)
                );
            #else
                vec2 noiseOffset = noise.xy * lodTexelSize;
                slab_translucent_background = texture2DLodEXT(backgroundRefractionSampler, refractionCoords + noiseOffset, refractionLOD);
            #endif
        } else {
            slab_translucent_background = texture2DLodEXT(backgroundRefractionSampler, refractionCoords, 0.0);
        }
    }
    #endif
}

#endif
