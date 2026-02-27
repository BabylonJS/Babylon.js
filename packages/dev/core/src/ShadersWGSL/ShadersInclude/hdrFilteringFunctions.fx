#ifdef NUM_SAMPLES
    #if NUM_SAMPLES > 0

    // https://learnopengl.com/PBR/IBL/Specular-IBL
    // Hammersley
    fn radicalInverse_VdC(value: u32) -> f32 
    {
        var bits = (value << 16u) | (value >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        return  f32(bits) * 2.3283064365386963e-10; // / 0x100000000
    }

    fn hammersley(i: u32, N: u32) -> vec2f
    {
        return vec2f( f32(i)/ f32(N), radicalInverse_VdC(i));
    }

    fn log4(x: f32) -> f32 {
        return log2(x) / 2.;
    }

    
    fn uv_to_normal(uv: vec2f) -> vec3f {
        var N: vec3f;

        var uvRange: vec2f = uv;
        var theta: f32 = uvRange.x * 2.0 * PI;
        var phi: f32 = uvRange.y * PI;

        N.x = cos(theta) * sin(phi);
        N.z = sin(theta) * sin(phi);
        N.y = cos(phi);
        return N;
    }

        const NUM_SAMPLES_FLOAT: f32 =  f32(NUM_SAMPLES);
        const NUM_SAMPLES_FLOAT_INVERSED: f32 = 1. / NUM_SAMPLES_FLOAT;

        const K: f32 = 4.;

        //
        //
        // Importance sampling GGX - Trowbridge-Reitz
        // ------------------------------------------
        //
        // Important samples are chosen to integrate Dggx() * cos(theta) over the hemisphere.
        //
        // All calculations are made in tangent space, with n = [0 0 1]
        //
        //             l        h (important sample)
        //             .\      /.
        //             . \    / .
        //             .  \  /  .
        //             .   \/   .
        //         ----+---o----+-------> n [0 0 1]
        //     cos(2*theta)     cos(theta)
        //        = n•l            = n•h
        //
        //  v = n
        //  f0 = f90 = 1
        //  V = 1
        //
        //  h is micro facet's normal
        //
        //  l is the reflection of v (i.e.: n) around h  ==>  n•h = l•h = v•h
        //
        //  h = important_sample_ggx()
        //
        //  n•h = [0 0 1]•h = h.z
        //
        //  l = reflect(-n, h)
        //    = 2 * (n•h) * h - n;
        //
        //  n•l = cos(2 * theta)
        //      = cos(theta)^2 - sin(theta)^2
        //      = (n•h)^2 - (1 - (n•h)^2)
        //      = 2(n•h)^2 - 1
        //
        //
        //  pdf() = D(h) <n•h> |J(h)|
        //
        //               1
        //  |J(h)| = ----------
        //            4 <v•h>
        //
        //    v = n -> <v•h>/<n•h> = 1
        //
        //  pdf() = D(h) / 4
        //
        //
        // Pre-filtered importance sampling
        // --------------------------------
        //
        //  see: "Real-time Shading with Filtered Importance Sampling", Jaroslav Krivanek
        //  see: "GPU-Based Importance Sampling, GPU Gems 3", Mark Colbert
        //
        //
        //                   Ωs
        //     lod = log4(K ----)
        //                   Ωp
        //
        //     log4(K) = 1, works well for box filters
        //     K = 4
        //
        //             1
        //     Ωs = ---------, solid-angle of an important sample
        //           N * pdf
        //
        //              4 PI
        //     Ωp ~ --------------, solid-angle of a sample in the base cubemap
        //           texel_count
        //
        //
        // Evaluating the integral
        // -----------------------
        //
        //                    K     fr(h)
        //            Er() = --- ∑ ------- L(h) <n•l>
        //                    N  h   pdf
        //
        // with:
        //
        //            fr() = D(h)
        //
        //                       N
        //            K = -----------------
        //                    fr(h)
        //                 ∑ ------- <n•l>
        //                 h   pdf
        //
        //
        //  It results that:
        //
        //            K           4 <v•h>
        //    Er() = --- ∑ D(h) ------------ L(h) <n•l>
        //            N  h        D(h) <n•h>
        //
        //    v = n -> <v•h>/<n•h> = 1
        //
        //              K
        //    Er() = 4 --- ∑ L(h) <n•l>
        //              N  h
        //
        //                  N       4
        //    Er() = ------------- --- ∑ V(v) <n•l>
        //             4 ∑ <n•l>    N
        //
        //
        //  +------------------------------+
        //  |          ∑ <n•l> L(h)        |
        //  |  Er() = --------------       |
        //  |            ∑ <n•l>           |
        //  +------------------------------+
        //
        //

        fn irradiance(
        #ifdef CUSTOM_IRRADIANCE_FILTERING_INPUT
            CUSTOM_IRRADIANCE_FILTERING_INPUT
        #else
            inputTexture: texture_cube<f32>, inputSampler: sampler,
        #endif
            inputN: vec3f,
            filteringInfo: vec2f,
            diffuseRoughness: f32,
            surfaceAlbedo: vec3f,
            inputV: vec3f
        #ifdef IBL_CDF_FILTERING
            , icdfSampler: texture_2d<f32>, icdfSamplerSampler: sampler
        #endif
        ) -> vec3f
        {
            var n: vec3f = normalize(inputN);
            var result: vec3f =  vec3f(0.0);

            #ifndef IBL_CDF_FILTERING
            var tangent: vec3f = select(vec3f(1., 0., 0.), vec3f(0., 0., 1.), abs(n.z) < 0.999);
            tangent = normalize(cross(tangent, n));
            var bitangent: vec3f = cross(n, tangent);
            var tbn: mat3x3f =  mat3x3f(tangent, bitangent, n);
            var tbnInverse: mat3x3f = transpose(tbn);
            #endif

            var maxLevel: f32 = filteringInfo.y;
            var dim0: f32 = filteringInfo.x;
            var omegaP: f32 = (4. * PI) / (6. * dim0 * dim0);
            var clampedAlbedo: vec3f = clamp(surfaceAlbedo, vec3f(0.1), vec3f(1.0));
            for(var i: u32 = 0u; i < NUM_SAMPLES; i++)
            {
                var Xi: vec2f = hammersley(i, NUM_SAMPLES);

                #ifdef IBL_CDF_FILTERING
                    var T: vec2f;
                    T.x = textureSampleLevel(icdfSampler, icdfSamplerSampler, vec2(Xi.x, 0.0), 0.0).x;
                    T.y = textureSampleLevel(icdfSampler, icdfSamplerSampler, vec2(T.x, Xi.y), 0.0).y;
                    var Ls: vec3f = uv_to_normal(vec2f(1.0 - fract(T.x + 0.25), T.y));
                    var NoL: f32 = dot(n, Ls);
                    var NoV: f32 = dot(n, inputV);
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        var LoV: f32 = dot(Ls, inputV);
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        var H: vec3f = (inputV + Ls) * 0.5;
                        var VoH: f32 = dot(inputV, H);
                    #endif                    
                #else
                    var Ls: vec3f = hemisphereCosSample(Xi);
                    Ls = normalize(Ls);
                    var Ns: vec3f =  vec3f(0., 0., 1.);
                    var NoL: f32 = dot(Ns, Ls);
                    var V: vec3f = tbnInverse * inputV;
                    var NoV: f32 = dot(Ns, V);
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        var LoV: f32 = dot(Ls, V);
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        var H: vec3f = (V + Ls) * 0.5;
                        var VoH: f32 = dot(V, H);
                    #endif
                #endif

                if (NoL > 0.) {
                    
                    #ifdef IBL_CDF_FILTERING
                        var pdf: f32 = textureSampleLevel(icdfSampler, icdfSamplerSampler, T, 0.0).z;
                        var c: vec3f = textureSampleLevel(inputTexture, inputSampler, Ls, 0.0).rgb;
                    #else
                        var pdf_inversed: f32 = PI / NoL;

                        var omegaS: f32 = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                        var l: f32 = log4(omegaS) - log4(omegaP) + log4(K);
                        var mipLevel: f32 = clamp(l, 0.0, maxLevel);
                        #ifdef CUSTOM_IRRADIANCE_FILTERING_FUNCTION
                            CUSTOM_IRRADIANCE_FILTERING_FUNCTION
                        #else
                            var c: vec3f = textureSampleLevel(inputTexture, inputSampler, tbn * Ls, mipLevel).rgb;
                        #endif
                    #endif
                    #ifdef GAMMA_INPUT
                        c = toLinearSpaceVec3(c);
                    #endif

                    var diffuseRoughnessTerm: vec3f = vec3f(1.0);
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        diffuseRoughnessTerm = diffuseBRDF_EON(clampedAlbedo, diffuseRoughness, NoL, NoV, LoV) * PI;
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        diffuseRoughnessTerm = vec3f(diffuseBRDF_Burley(NoL, NoV, VoH, diffuseRoughness) * PI);
                    #endif

                    #ifdef IBL_CDF_FILTERING
                        var light: vec3f = vec3f(0.0);
                        if (pdf > 1e-6) {
                            light = vec3f(1.0) / vec3f(pdf) * c;
                        }
                        result += NoL * diffuseRoughnessTerm * light;
                    #else
                        result += c * diffuseRoughnessTerm;
                    #endif
                }
            }

            result = result * NUM_SAMPLES_FLOAT_INVERSED;

            #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                result = result / clampedAlbedo;
            #endif

            return result;
        }

        fn radiance(alphaG: f32, inputTexture: texture_cube<f32>, inputSampler: sampler, inputN: vec3f, filteringInfo: vec2f) -> vec3f
        {
            var n: vec3f = normalize(inputN);
            var c: vec3f = textureSample(inputTexture, inputSampler, n).rgb; // Don't put it in the "if (alphaG == 0.)" branch for uniformity (analysis) reasons!

            if (alphaG == 0.) {
                #ifdef GAMMA_INPUT
                    c = toLinearSpaceVec3(c);
                #endif
                return c;
            } else {

                var result: vec3f =  vec3f(0.);
                var tangent: vec3f = select(vec3f(1., 0., 0.), vec3f(0., 0., 1.), abs(n.z) < 0.999);
                tangent = normalize(cross(tangent, n));
                var bitangent: vec3f = cross(n, tangent);
                var tbn: mat3x3f =  mat3x3f(tangent, bitangent, n);

                var maxLevel: f32 = filteringInfo.y;
                var dim0: f32 = filteringInfo.x;
                var omegaP: f32 = (4. * PI) / (6. * dim0 * dim0);

                var weight: f32 = 0.;
                for(var i: u32 = 0u; i < NUM_SAMPLES; i++)
                {
                    var Xi: vec2f = hammersley(i, NUM_SAMPLES);
                    var H: vec3f = hemisphereImportanceSampleDggx(Xi, alphaG);

                    var NoV: f32 = 1.;
                    var NoH: f32 = H.z;
                    var NoH2: f32 = H.z * H.z;
                    var NoL: f32 = 2. * NoH2 - 1.;
                    var L: vec3f =  vec3f(2. * NoH * H.x, 2. * NoH * H.y, NoL);
                    L = normalize(L);

                    if (NoL > 0.) {
                        var pdf_inversed: f32 = 4. / normalDistributionFunction_TrowbridgeReitzGGX(NoH, alphaG);

                        var omegaS: f32 = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                        var l: f32 = log4(omegaS) - log4(omegaP) + log4(K);
                        var mipLevel: f32 = clamp( f32(l), 0.0, maxLevel);

                        weight += NoL;

                        var c: vec3f = textureSampleLevel(inputTexture, inputSampler, tbn * L, mipLevel).rgb;
                        #ifdef GAMMA_INPUT
                            c = toLinearSpaceVec3(c);
                        #endif
                        result += c * NoL;
                    }
                }

                result = result / weight;

                return result;
            }
        }

    #ifdef ANISOTROPIC
        // Anisotropic version of the radiance function
        // This function samples the IBL in an anisotropic fashion using separate tangent and bitangent roughness values
        // and uses the reflection vector instead of the normal for proper anisotropic reflections
        fn radianceAnisotropic(
            alphaTangent: f32,      // Roughness along the tangent direction
            alphaBitangent: f32,    // Roughness along the bitangent direction
            inputTexture: texture_cube<f32>,
            inputSampler: sampler,
            inputView: vec3f,          // View vector (from surface to camera)
            inputTangent: vec3f,       // Surface tangent vector
            inputBitangent: vec3f,     // Surface bitangent vector
            inputNormal: vec3f,        // Surface normal vector
            filteringInfo: vec2f,
            noiseInput: vec2f,          // [-1,1] noise value per pixel for sample jittering
            isRefraction: bool,
            ior: f32 // Index of refraction for refraction calculations
        ) -> vec3f {
            var V: vec3f = inputView;
            var N: vec3f = inputNormal;
            var T: vec3f = inputTangent;
            var B: vec3f = inputBitangent;

            // Anisotropic implementation using proper half-vector importance sampling
            // We sample half-vectors from the anisotropic GGX distribution and compute
            // the corresponding light directions for environment map lookup
            var result: vec3f = vec3f(0.f);

            var maxLevel: f32 = filteringInfo.y;
            var dim0: f32 = filteringInfo.x;

            // Clamp alphas to avoid division by zero
            let clampedAlphaT: f32 = max(alphaTangent, MINIMUMVARIANCE);
            let clampedAlphaB: f32 = max(alphaBitangent, MINIMUMVARIANCE);

            // Compute effective dimension scaled by anisotropy for proper solid angle
            var effectiveDim: f32 = dim0 * sqrt(clampedAlphaT * clampedAlphaB);
            var omegaP: f32 = (4.f * PI) / (6.f * effectiveDim * effectiveDim);
            let noiseScale: f32 = clamp(log2(f32(NUM_SAMPLES)) / 12.0f, 0.0f, 1.0f);
            var weight: f32 = 0.f;

            for(var i: u32 = 0u; i < NUM_SAMPLES; i++)
            {
                var Xi: vec2f = hammersley(i, NUM_SAMPLES);
                
                // Add noise to sample coordinates to break up sampling artifacts
                Xi = fract(Xi + noiseInput * mix(0.5f, 0.015f, noiseScale)); // Wrap around to stay in [0,1] range
                
                // Generate anisotropic half vector using importance sampling
                var H_tangent: vec3f = hemisphereImportanceSampleDggxAnisotropic(Xi, clampedAlphaT, clampedAlphaB);
                
                // Transform half vector from tangent space to world space
                var H: vec3f = normalize(H_tangent.x * T + H_tangent.y * B + H_tangent.z * N);

                // Calculate light direction by reflecting view vector around half vector
                // V is surface-to-eye, L will be surface-to-light
                var L: vec3f;
                if (isRefraction) {
                    L = refract(-V, H, 1.0 / ior);
                } else {
                    L = reflect(-V, H);
                }

                // Calculate dot products
                var NoH: f32 = max(dot(N, H), 0.001f);
                var VoH: f32 = max(dot(V, H), 0.001f);
                var NoL: f32 = max(dot(N, L), 0.001f);

                if (NoL > 0.f) {
                    // Calculate PDF following isotropic pattern: 4/D(H)
                    var pdf_inversed: f32 = 4. / normalDistributionFunction_BurleyGGX_Anisotropic(
                        H_tangent.z, H_tangent.x, H_tangent.y, vec2f(clampedAlphaT, clampedAlphaB)
                    );

                    var omegaS: f32 = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                    var l: f32 = log4(omegaS) - log4(omegaP) + log4(K);
                    var mipLevel: f32 = clamp(l, 0.0f, maxLevel);

                    // Simple NoL weighting
                    weight += NoL;

                    var c: vec3f = textureSampleLevel(inputTexture, inputSampler, L, mipLevel).rgb;
                    #if GAMMA_INPUT
                        c = toLinearSpaceVec3(c);
                    #endif
                    result += c * NoL;
                }
            }
            
            result = result / weight;
            return result;
        }
    #endif

    #endif
#endif