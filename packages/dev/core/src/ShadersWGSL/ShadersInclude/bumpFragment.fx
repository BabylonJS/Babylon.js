var uvOffset: vec2f =  vec2f(0.0, 0.0);

#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
	#ifdef NORMALXYSCALE
		var normalScale: f32 = 1.0;
	#elif defined(BUMP)
		var normalScale: f32 = vBumpInfos.y;
	#else
		var normalScale: f32 = 1.0;
	#endif

	#if defined(TANGENT) && defined(NORMAL)
		var TBN: mat3x3f = vTBN;
	#elif defined(BUMP)
		// flip the uv for the backface
		var TBNUV: vec2f = select(-vBumpUV, vBumpUV, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW * normalScale, vPositionW, TBNUV, vTangentSpaceParams);
	#else
		// flip the uv for the backface
		var TBNUV: vec2f = select(-vDetailUV, vDetailUV, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW * normalScale, vPositionW, TBNUV,  vec2f(1., 1.));
	#endif
#elif defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL)
		var TBN: mat3x3f = vTBN;
	#else
		// flip the uv for the backface
		var TBNUV: vec2f = select( -vMainUV1, vMainUV1, fragmentInputs.frontFacing);
		var TBN: mat3x3f = cotangent_frame(normalW, vPositionW, TBNUV,  vec2f(1., 1.));
	#endif
#endif

#ifdef PARALLAX
	var invTBN: mat3x3f = transposeMat3(TBN);

	#ifdef PARALLAXOCCLUSION
		uvOffset = parallaxOcclusion(invTBN * -viewDirectionW, invTBN * normalW, vBumpUV, vBumpInfos.z);
	#else
		uvOffset = parallaxOffset(invTBN * viewDirectionW, vBumpInfos.z);
	#endif
#endif

#ifdef DETAIL
	var detailColor: vec4f = textureSample(detail, detailSampler, vDetailUV + uvOffset);
    var detailNormalRG: vec2f = detailColor.wy * 2.0 - 1.0;
    var detailNormalB: f32 = sqrt(1. - saturate(dot(detailNormalRG, detailNormalRG)));
    var detailNormal: vec3f =  vec3f(detailNormalRG, detailNormalB);
#endif

#ifdef BUMP
	#ifdef OBJECTSPACE_NORMALMAP

		#define CUSTOM_FRAGMENT_BUMP_FRAGMENT

		normalW = normalize(textureSample(bump, bumpSampler, vBumpUV).xyz  * 2.0 - 1.0);
		normalW = normalize( mat3x3f(normalMatrix) * normalW);
	#elif !defined(DETAIL)
		normalW = perturbNormal(TBN, textureSample(bump, bumpSampler, vBumpUV + uvOffset).xyz, vBumpInfos.y);
    #else
        var bumpNormal: vec3f = textureSample(bump, bumpSampler, vBumpUV + uvOffset).xyz * 2.0 - 1.0;
        // Reference for normal blending: https://blog.selfshadow.com/publications/blending-in-detail/
        #if DETAIL_NORMALBLENDMETHOD == 0 // whiteout
            detailNormal.xy *= vDetailInfos.z;
            var blendedNormal: vec3f = normalize( vec3f(bumpNormal.xy + detailNormal.xy, bumpNormal.z * detailNormal.z));
        #elif DETAIL_NORMALBLENDMETHOD == 1 // RNM
            detailNormal.xy *= vDetailInfos.z;
            bumpNormal +=  vec3f(0.0, 0.0, 1.0);
            detailNormal *=  vec3f(-1.0, -1.0, 1.0);
            var blendedNormal: vec3f = bumpNormal * dot(bumpNormal, detailNormal) / bumpNormal.z - detailNormal;
        #endif
        normalW = perturbNormalBase(TBN, blendedNormal, vBumpInfos.y);
	#endif
#elif defined(DETAIL)
        detailNormal.xy *= vDetailInfos.z;
		normalW = perturbNormalBase(TBN, detailNormal, vDetailInfos.z);
#endif
