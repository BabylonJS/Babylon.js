#ifdef NUM_SAMPLES
	#if NUM_SAMPLES > 0
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
		vec3 irradiance(samplerCube inputTexture, vec3 inputN, vec2 filteringInfo)
		{
			vec3 n = normalize(inputN);
		    vec3 result = vec3(0.0);
			vec3 tangent = abs(n.z) < 0.999 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
			tangent = normalize(cross(tangent, n));
			vec3 bitangent = cross(n, tangent);
			mat3 tbn = mat3(tangent, bitangent, n);

		    float maxLevel = filteringInfo.y;
		    float dim0 = filteringInfo.x;
		    float omegaP = (4. * PI) / (6. * dim0 * dim0);

		    #ifdef WEBGL2
		    for(uint i = 0u; i < NUM_SAMPLES; ++i)
		    #else
		    for(int i = 0; i < NUM_SAMPLES; ++i)
		    #endif
		    {
		        vec2 Xi = hammersley(i, NUM_SAMPLES);
		        vec3 Ls = hemisphereCosSample(Xi);

		        Ls = normalize(Ls);

		        vec3 Ns = vec3(0., 0., 1.);

		        float NoL = dot(Ns, Ls);

		        if (NoL > 0.) {
		            float pdf_inversed = PI / NoL;

		            float omegaS = NUM_SAMPLES_FLOAT_INVERSED * pdf_inversed;
		            float l = log4(omegaS) - log4(omegaP) + log4(K);
		            float mipLevel = clamp(l, 0.0, maxLevel);

		            vec3 c = textureCubeLodEXT(inputTexture, tbn * Ls, mipLevel).rgb;
		            #ifdef GAMMA_INPUT
		                c = toLinearSpace(c);
		            #endif
		            result += c;
		        }
		    }

		    result = result * NUM_SAMPLES_FLOAT_INVERSED;

		    return result;
		}

		#define inline
		vec3 radiance(float alphaG, samplerCube inputTexture, vec3 inputN, vec2 filteringInfo)
		{
			vec3 n = normalize(inputN);

			if (alphaG == 0.) {
				vec3 c = textureCube(inputTexture, n).rgb;
				#ifdef GAMMA_INPUT
				    c = toLinearSpace(c);
				#endif
				return c;
			}

			vec3 result = vec3(0.);
			vec3 tangent = abs(n.z) < 0.999 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
			tangent = normalize(cross(tangent, n));
			vec3 bitangent = cross(n, tangent);
			mat3 tbn = mat3(tangent, bitangent, n);

			float maxLevel = filteringInfo.y;
			float dim0 = filteringInfo.x;
			float omegaP = (4. * PI) / (6. * dim0 * dim0);

			float weight = 0.;
			#ifdef WEBGL2
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
			        #ifdef GAMMA_INPUT
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