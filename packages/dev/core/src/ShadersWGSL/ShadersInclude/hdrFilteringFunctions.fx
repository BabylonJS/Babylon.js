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

        fn irradiance(inputTexture: texture_cube<f32>, inputSampler: sampler, inputN: vec3f, filteringInfo: vec2f) -> vec3f
        {
            var n: vec3f = normalize(inputN);
            var result: vec3f =  vec3f(0.0);
            var tangent: vec3f = select(vec3f(1., 0., 0.), vec3f(0., 0., 1.), abs(n.z) < 0.999);
            tangent = normalize(cross(tangent, n));
            var bitangent: vec3f = cross(n, tangent);
            var tbn: mat3x3f =  mat3x3f(tangent, bitangent, n);

            var maxLevel: f32 = filteringInfo.y;
            var dim0: f32 = filteringInfo.x;
            var omegaP: f32 = (4. * PI) / (6. * dim0 * dim0);

            for(var i: u32 = 0u; i < NUM_SAMPLES; i++)
            {
                var Xi: vec2f = hammersley(i, NUM_SAMPLES);
                var Ls: vec3f = hemisphereCosSample(Xi);

                Ls = normalize(Ls);

                var Ns: vec3f =  vec3f(0., 0., 1.);

                var NoL: f32 = dot(Ns, Ls);

                if (NoL > 0.) {
                    var pdf_inversed: f32 = PI / NoL;

                    var omegaS: f32 = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                    var l: f32 = log4(omegaS) - log4(omegaP) + log4(K);
                    var mipLevel: f32 = clamp(l, 0.0, maxLevel);

                    var c: vec3f = textureSampleLevel(inputTexture, inputSampler, tbn * Ls, mipLevel).rgb;
                    #ifdef GAMMA_INPUT
                        c = toLinearSpaceVec3(c);
                    #endif
                    result += c;
                }
            }

            result = result * NUM_SAMPLES_FLOAT_INVERSED;

            return result;
        }

        fn radiance(alphaG: f32, inputTexture: texture_cube<f32>, inputSampler: sampler, inputN: vec3f, filteringInfo: vec2f) -> vec3f
        {
            var n: vec3f = normalize(inputN);
            var c: vec3f = textureSample(inputTexture, inputSampler, n).rgb; // Don't put it in the "if (alphaG == 0.)" branch for uniformity (analysis) reasons!

            if (alphaG == 0.) {
                #ifdef GAMMA_INPUT
                    c = toLinearSpace(c);
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
                            c = toLinearSpace(c);
                        #endif
                        result += c * NoL;
                    }
                }

                result = result / weight;

                return result;
            }
        }

    #endif
#endif