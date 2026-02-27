#if NUM_SAMPLES
    #if NUM_SAMPLES > 0

    #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
        // https://learnopengl.com/PBR/IBL/Specular-IBL
        // Hammersley
        float radicalInverse_VdC(uint bits) 
        {
            bits = (bits << 16u) | (bits >> 16u);
            bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
            bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
            bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
            bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
            return float(bits) * 2.3283064365386963e-10; // / 0x100000000
        }

        vec2 hammersley(uint i, uint N)
        {
            return vec2(float(i)/float(N), radicalInverse_VdC(i));
        }
    #else
        float vanDerCorpus(int n, int base)
        {
            float invBase = 1.0 / float(base);
            float denom   = 1.0;
            float result  = 0.0;

            for(int i = 0; i < 32; ++i)
            {
                if(n > 0)
                {
                    denom   = mod(float(n), 2.0);
                    result += denom * invBase;
                    invBase = invBase / 2.0;
                    n       = int(float(n) / 2.0);
                }
            }

            return result;
        }

        vec2 hammersley(int i, int N)
        {
            return vec2(float(i)/float(N), vanDerCorpus(i, 2));
        }
    #endif

    float log4(float x) {
        return log2(x) / 2.;
    }

    vec3 uv_to_normal(vec2 uv) {
        vec3 N;

        vec2 uvRange = uv;
        float theta = uvRange.x * 2. * PI;
        float phi = uvRange.y * PI;

        float sinPhi = sin(phi);
        N.x = cos(theta) * sinPhi;
        N.z = sin(theta) * sinPhi;
        N.y = cos(phi);
        return N;
    }

        const float NUM_SAMPLES_FLOAT = float(NUM_SAMPLES);
        const float NUM_SAMPLES_FLOAT_INVERSED = 1. / NUM_SAMPLES_FLOAT;

        const float K = 4.;

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

        #define inline
        vec3 irradiance(
        #ifdef CUSTOM_IRRADIANCE_FILTERING_INPUT
            CUSTOM_IRRADIANCE_FILTERING_INPUT
        #else
            samplerCube inputTexture,
        #endif
            vec3 inputN, vec2 filteringInfo,
            float diffuseRoughness,
            vec3 surfaceAlbedo,
            vec3 inputV
        #if IBL_CDF_FILTERING
            , sampler2D icdfSampler
        #endif
        )
        {
            vec3 n = normalize(inputN);
            vec3 result = vec3(0.);

            #ifndef IBL_CDF_FILTERING
            vec3 tangent = abs(n.z) < 0.999 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
            tangent = normalize(cross(tangent, n));
            vec3 bitangent = cross(n, tangent);
            mat3 tbn = mat3(tangent, bitangent, n);
            // The inverse is just the transpose of the TBN matrix. However, WebGL 1.0 doesn't support mat3 transpose.
            // So, we have to calculate it manually.
            mat3 tbnInverse = mat3(tangent.x, bitangent.x, n.x, tangent.y, bitangent.y, n.y, tangent.z, bitangent.z, n.z);
            #endif

            float maxLevel = filteringInfo.y;
            float dim0 = filteringInfo.x;
            float omegaP = (4. * PI) / (6. * dim0 * dim0);
            vec3 clampedAlbedo = clamp(surfaceAlbedo, vec3(0.1), vec3(1.0));
            #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
            for(uint i = 0u; i < NUM_SAMPLES; ++i)
            #else
            for(int i = 0; i < NUM_SAMPLES; ++i)
            #endif
            {
                vec2 Xi = hammersley(i, NUM_SAMPLES);

                #if IBL_CDF_FILTERING
                    vec2 T;
                    T.x = texture2D(icdfSampler, vec2(Xi.x, 0.)).x;
                    T.y = texture2D(icdfSampler, vec2(T.x, Xi.y)).y;
                    vec3 Ls = uv_to_normal(vec2(1.0 - fract(T.x + 0.25), T.y));
                    float NoL = dot(n, Ls);
                    float NoV = dot(n, inputV);
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        float LoV = dot (Ls, inputV);
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        vec3 H = (inputV + Ls) * 0.5;
                        float VoH = dot(inputV, H);
                    #endif
                #else
                    vec3 Ls = hemisphereCosSample(Xi);
                    Ls = normalize(Ls);
                    float NoL = Ls.z; // N = (0, 0, 1)
                    vec3 V = tbnInverse * inputV;
                    float NoV = V.z; // N = (0, 0, 1)
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        float LoV = dot (Ls, V);
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        vec3 H = (V + Ls) * 0.5;
                        float VoH = dot(V, H);
                    #endif
                    
                #endif

                if (NoL > 0.) {
                    #if IBL_CDF_FILTERING
                        float pdf = texture2D(icdfSampler, T).z;
                        vec3 c = textureCubeLodEXT(inputTexture, Ls, 0.).rgb;
                    #else
                        float pdf_inversed = PI / NoL;
                        float omegaS = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                        float l = log4(omegaS) - log4(omegaP) + log4(K);
                        float mipLevel = clamp(l, 0., maxLevel);
                        #ifdef CUSTOM_IRRADIANCE_FILTERING_FUNCTION
                            CUSTOM_IRRADIANCE_FILTERING_FUNCTION
                        #else
                            vec3 c = textureCubeLodEXT(inputTexture, tbn * Ls, mipLevel).rgb;
                        #endif
                    #endif
                    #if GAMMA_INPUT
                        c = toLinearSpace(c);
                    #endif

                    vec3 diffuseRoughnessTerm = vec3(1.0);
                    #if BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_EON
                        diffuseRoughnessTerm = diffuseBRDF_EON(clampedAlbedo, diffuseRoughness, NoL, NoV, LoV) * PI;
                    #elif BASE_DIFFUSE_MODEL == BRDF_DIFFUSE_MODEL_BURLEY
                        diffuseRoughnessTerm = vec3(diffuseBRDF_Burley(NoL, NoV, VoH, diffuseRoughness) * PI);
                    #endif

                    #if IBL_CDF_FILTERING
                        vec3 light = pdf < 1e-6 ? vec3(0.0) : vec3(1.0) / vec3(pdf) * c;
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

        #define inline
        vec3 radiance(float alphaG, samplerCube inputTexture, vec3 inputN, vec2 filteringInfo)
        {
            vec3 n = normalize(inputN);
            vec3 c = textureCube(inputTexture, n).rgb; // Don't put it in the "if (alphaG == 0.)" branch for uniformity (analysis) reasons!

            if (alphaG == 0.) {
                #if GAMMA_INPUT
                    c = toLinearSpace(c);
                #endif
                return c;
            } else {

                vec3 result = vec3(0.);
                vec3 tangent = abs(n.z) < 0.999 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
                tangent = normalize(cross(tangent, n));
                vec3 bitangent = cross(n, tangent);
                mat3 tbn = mat3(tangent, bitangent, n);

                float maxLevel = filteringInfo.y;
                float dim0 = filteringInfo.x;
                float omegaP = (4. * PI) / (6. * dim0 * dim0);

                float weight = 0.;
                #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
                for(uint i = 0u; i < NUM_SAMPLES; ++i)
                #else
                for(int i = 0; i < NUM_SAMPLES; ++i)
                #endif
                {
                    vec2 Xi = hammersley(i, NUM_SAMPLES);
                    vec3 H = hemisphereImportanceSampleDggx(Xi, alphaG);

                    float NoV = 1.;
                    float NoH = H.z;
                    float NoH2 = H.z * H.z;
                    float NoL = 2. * NoH2 - 1.;
                    vec3 L = vec3(2. * NoH * H.x, 2. * NoH * H.y, NoL);
                    L = normalize(L);

                    if (NoL > 0.) {
                        float pdf_inversed = 4. / normalDistributionFunction_TrowbridgeReitzGGX(NoH, alphaG);

                        float omegaS = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                        float l = log4(omegaS) - log4(omegaP) + log4(K);
                        float mipLevel = clamp(float(l), 0.0, maxLevel);

                        weight += NoL;
                        vec3 c = textureCubeLodEXT(inputTexture, tbn * L, mipLevel).rgb;
                        #if GAMMA_INPUT
                            c = toLinearSpace(c);
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
        #define inline
        vec3 radianceAnisotropic(
            float alphaTangent,      // Roughness along the tangent direction
            float alphaBitangent,    // Roughness along the bitangent direction
            samplerCube inputTexture,
            vec3 inputView,          // View vector (from surface to camera)
            vec3 inputTangent,       // Surface tangent vector
            vec3 inputBitangent,     // Surface bitangent vector  
            vec3 inputNormal,        // Surface normal vector
            vec2 filteringInfo,
            vec2 noiseInput,          // [-1,1] noise value per pixel for sample jittering
            bool isRefraction,
            float ior // Index of refraction for refraction calculations
        )
        {
            vec3 V = inputView;
            vec3 N = inputNormal;
            vec3 T = inputTangent;
            vec3 B = inputBitangent;

            // Anisotropic implementation using proper half-vector importance sampling
            // We sample half-vectors from the anisotropic GGX distribution and compute
            // the corresponding light directions for environment map lookup
            vec3 result = vec3(0.);
            
            float maxLevel = filteringInfo.y;
            float dim0 = filteringInfo.x;

            float clampedAlphaT = max(alphaTangent, MINIMUMVARIANCE);
            float clampedAlphaB = max(alphaBitangent, MINIMUMVARIANCE);
            
            // Compute effective dimension scaled by anisotropy for proper solid angle
            float effectiveDim = dim0 * sqrt(clampedAlphaT * clampedAlphaB);
            float omegaP = (4. * PI) / (6. * effectiveDim * effectiveDim);
            const float noiseScale = clamp(log2(float(NUM_SAMPLES)) / 12.0f, 0.0f, 1.0f);
            float weight = 0.;
            
            #if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
            for(uint i = 0u; i < NUM_SAMPLES; ++i)
            #else
            for(int i = 0; i < NUM_SAMPLES; ++i)
            #endif
            {
                vec2 Xi = hammersley(i, NUM_SAMPLES);
                
                // Add noise to sample coordinates to break up sampling artifacts
                Xi = fract(Xi + noiseInput * mix(0.5f, 0.015f, noiseScale)); // Wrap around to stay in [0,1] range

                // Generate anisotropic half vector using importance sampling
                vec3 H_tangent = hemisphereImportanceSampleDggxAnisotropic(Xi, clampedAlphaT, clampedAlphaB);

                // Transform half vector from tangent space to world space
                vec3 H = normalize(H_tangent.x * T + H_tangent.y * B + H_tangent.z * N);
                
                // Calculate light direction by reflecting view vector around half vector
                // V is surface-to-eye, L will be surface-to-light
                vec3 L;
                if (isRefraction) {
                    L = refract(-V, H, 1.0 / ior);
                } else {
                    L = reflect(-V, H);
                }
                
                // Calculate dot products
                float NoH = max(dot(N, H), 0.001);
                float VoH = max(dot(V, H), 0.001);
                float NoL = max(dot(N, L), 0.001);
                
                if (NoL > 0.) {
                    // Calculate PDF following isotropic pattern: 4/D(H)
                    float pdf_inversed = 4. / normalDistributionFunction_BurleyGGX_Anisotropic(
                        H_tangent.z, H_tangent.x, H_tangent.y, vec2(clampedAlphaT, clampedAlphaB)
                    );
                    
                    float omegaS = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
                    float l = log4(omegaS) - log4(omegaP) + log4(K);
                    float mipLevel = clamp(float(l), 0.0, maxLevel);
                    
                    // Simple NoL weighting 
                    weight += NoL;
                    
                    vec3 c = textureCubeLodEXT(inputTexture, L, mipLevel).rgb;
                    #if GAMMA_INPUT
                        c = toLinearSpace(c);
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