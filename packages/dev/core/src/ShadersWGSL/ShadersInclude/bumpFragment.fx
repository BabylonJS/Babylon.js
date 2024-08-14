var uvOffset: vec2f =  vec2f(0.0, 0.0);

#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
	#ifdef NORMALXYSCALE
		var normalScale: f32 = 1.0;
	#elif defined(BUMP)
		var normalScale: f32 = uniforms.vBumpInfos.y;
	#else
		var normalScale: f32 = 1.0;
	#endif

	#if defined(TANGENT) && defined(NORMAL)
		var TBN: mat3x3f = mat3x3<f32>(input.vTBN0, input.vTBN1, input.vTBN2);	
	#elif defined(BUMP)
		// flip the uv for the backface
		var TBNUV: vec2f = select(-fragmentInputs.vBumpUV, fragmentInputs.vBumpUV, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW * normalScale, input.vPositionW, TBNUV, uniforms.vTangentSpaceParams);
	#else
		// flip the uv for the backface
		var TBNUV: vec2f = select(-fragmentInputs.vDetailUV, fragmentInputs.vDetailUV, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW * normalScale, input.vPositionW, TBNUV,  vec2f(1., 1.));
	#endif
#elif defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL)
		var TBN: mat3x3f = mat3x3<f32>(input.vTBN0, input.vTBN1, input.vTBN2);	
	#else
		// flip the uv for the backface
		var TBNUV: vec2f = select( -fragmentInputs.vMainUV1, fragmentInputs.vMainUV1, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW, input.vPositionW, TBNUV,  vec2f(1., 1.));
	#endif
#endif

#ifdef PARALLAX
	var invTBN: mat3x3f = transposeMat3(TBN);

	#ifdef PARALLAXOCCLUSION
		uvOffset = parallaxOcclusion(invTBN * -viewDirectionW, invTBN * normalW, fragmentInputs.vBumpUV, uniforms.vBumpInfos.z);
	#else
		uvOffset = parallaxOffset(invTBN * viewDirectionW, uniforms.vBumpInfos.z);
	#endif
#endif

#ifdef DETAIL
	var detailColor: vec4f = textureSample(detailSampler, detailSamplerSampler, fragmentInputs.vDetailUV + uvOffset);
    var detailNormalRG: vec2f = detailColor.wy * 2.0 - 1.0;
    var detailNormalB: f32 = sqrt(1. - saturate(dot(detailNormalRG, detailNormalRG)));
    var detailNormal: vec3f =  vec3f(detailNormalRG, detailNormalB);
#endif

#ifdef BUMP
	#ifdef OBJECTSPACE_NORMALMAP

		#define CUSTOM_FRAGMENT_BUMP_FRAGMENT

		normalW = normalize(textureSample(bumpSampler, bumpSamplerSampler, fragmentInputs.vBumpUV).xyz  * 2.0 - 1.0);
		normalW = normalize(mat3x3f(uniforms.normalMatrix[0].xyz, uniforms.normalMatrix[1].xyz, uniforms.normalMatrix[2].xyz) * normalW);
	#elif !defined(DETAIL)
		normalW = perturbNormal(TBN, textureSample(bumpSampler, bumpSamplerSampler, fragmentInputs.vBumpUV + uvOffset).xyz, uniforms.vBumpInfos.y);
    #else
        var bumpNormal: vec3f = textureSample(bumpSampler, bumpSamplerSampler, fragmentInputs.vBumpUV + uvOffset).xyz * 2.0 - 1.0;
        // Reference for normal blending: https://blog.selfshadow.com/publications/blending-in-detail/
        #if DETAIL_NORMALBLENDMETHOD == 0 // whiteout
            detailNormal = vec3f(detailNormal.xy * uniforms.vDetailInfos.z, detailNormal.z);
            var blendedNormal: vec3f = normalize( vec3f(bumpNormal.xy + detailNormal.xy, bumpNormal.z * detailNormal.z));
        #elif DETAIL_NORMALBLENDMETHOD == 1 // RNM
            detailNormal = vec3f(detailNormal.xy * uniforms.vDetailInfos.z, detailNormal.z);
            bumpNormal +=  vec3f(0.0, 0.0, 1.0);
            detailNormal *=  vec3f(-1.0, -1.0, 1.0);
            var blendedNormal: vec3f = bumpNormal * dot(bumpNormal, detailNormal) / bumpNormal.z - detailNormal;
        #endif
        normalW = perturbNormalBase(TBN, blendedNormal, uniforms.vBumpInfos.y);
	#endif
#elif defined(DETAIL)
        detailNormal = vec3f(detailNormal.xy * uniforms.vDetailInfos.z, detailNormal.z);
		normalW = perturbNormalBase(TBN, detailNormal, uniforms.vDetailInfos.z);
#endif
