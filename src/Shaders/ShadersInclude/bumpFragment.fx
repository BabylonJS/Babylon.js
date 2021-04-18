vec2 uvOffset = vec2(0.0, 0.0);

#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
	#ifdef NORMALXYSCALE
		float normalScale = 1.0;
	#elif defined(BUMP)
		float normalScale = vBumpInfos.y;
	#else
		float normalScale = 1.0;
	#endif

	#if defined(TANGENT) && defined(NORMAL)
		mat3 TBN = vTBN;
	#elif defined(BUMP)
		// flip the uv for the backface
		vec2 TBNUV = gl_FrontFacing ? vBumpUV : -vBumpUV;
		mat3 TBN = cotangent_frame(normalW * normalScale, vPositionW, TBNUV, vTangentSpaceParams);
	#else
		// flip the uv for the backface
		vec2 TBNUV = gl_FrontFacing ? vDetailUV : -vDetailUV;
		mat3 TBN = cotangent_frame(normalW * normalScale, vPositionW, TBNUV, vec2(1., 1.));
	#endif
#elif defined(ANISOTROPIC)
	#if defined(TANGENT) && defined(NORMAL)
		mat3 TBN = vTBN;
	#else
		// flip the uv for the backface
		vec2 TBNUV = gl_FrontFacing ? vMainUV1 : -vMainUV1;
		mat3 TBN = cotangent_frame(normalW, vPositionW, TBNUV, vec2(1., 1.));
	#endif
#endif

#ifdef PARALLAX
	mat3 invTBN = transposeMat3(TBN);

	#ifdef PARALLAXOCCLUSION
		uvOffset = parallaxOcclusion(invTBN * -viewDirectionW, invTBN * normalW, vBumpUV, vBumpInfos.z);
	#else
		uvOffset = parallaxOffset(invTBN * viewDirectionW, vBumpInfos.z);
	#endif
#endif

#ifdef DETAIL
	vec4 detailColor = texture2D(detailSampler, vDetailUV + uvOffset);
    vec2 detailNormalRG = detailColor.wy * 2.0 - 1.0;
    float detailNormalB = sqrt(1. - saturate(dot(detailNormalRG, detailNormalRG)));
    vec3 detailNormal = vec3(detailNormalRG, detailNormalB);
#endif

#ifdef BUMP
	#ifdef OBJECTSPACE_NORMALMAP
		normalW = normalize(texture2D(bumpSampler, vBumpUV).xyz  * 2.0 - 1.0);
		normalW = normalize(mat3(normalMatrix) * normalW);	
	#elif !defined(DETAIL)
		normalW = perturbNormal(TBN, texture2D(bumpSampler, vBumpUV + uvOffset).xyz, vBumpInfos.y);
    #else
        vec3 bumpNormal = texture2D(bumpSampler, vBumpUV + uvOffset).xyz * 2.0 - 1.0;
        // Reference for normal blending: https://blog.selfshadow.com/publications/blending-in-detail/
        #if DETAIL_NORMALBLENDMETHOD == 0 // whiteout
            detailNormal.xy *= vDetailInfos.z;
            vec3 blendedNormal = normalize(vec3(bumpNormal.xy + detailNormal.xy, bumpNormal.z * detailNormal.z));
        #elif DETAIL_NORMALBLENDMETHOD == 1 // RNM
            detailNormal.xy *= vDetailInfos.z;
            bumpNormal += vec3(0.0, 0.0, 1.0);
            detailNormal *= vec3(-1.0, -1.0, 1.0);
            vec3 blendedNormal = bumpNormal * dot(bumpNormal, detailNormal) / bumpNormal.z - detailNormal;
        #endif
        normalW = perturbNormalBase(TBN, blendedNormal, vBumpInfos.y);
	#endif
#elif defined(DETAIL)
        detailNormal.xy *= vDetailInfos.z;
		normalW = perturbNormalBase(TBN, detailNormal, vDetailInfos.z);
#endif
