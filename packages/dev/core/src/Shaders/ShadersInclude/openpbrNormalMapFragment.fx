vec2 uvOffset = vec2(0.0, 0.0);
#if defined(GEOMETRY_NORMAL) || defined(GEOMETRY_COAT_NORMAL) || defined(PARALLAX) || defined(DETAIL)
	#ifdef NORMALXYSCALE
		float normalScale = 1.0;
	#elif defined(GEOMETRY_NORMAL)
		float normalScale = vGeometryNormalInfos.y;
	#else
		float normalScale = 1.0;
	#endif

	#if defined(TANGENT) && defined(NORMAL)
		mat3 TBN = vTBN;
	#elif defined(GEOMETRY_NORMAL)
		// flip the uv for the backface
		vec2 TBNUV = gl_FrontFacing ? vGeometryNormalUV : -vGeometryNormalUV;
		mat3 TBN = cotangent_frame(normalW * normalScale, vPositionW, TBNUV, vTangentSpaceParams);
	#else
		// flip the uv for the backface
		vec2 TBNUV = gl_FrontFacing ? vDetailUV : -vDetailUV;
		mat3 TBN = cotangent_frame(normalW * normalScale, vPositionW, TBNUV, vec2(1., 1.));
	#endif
#elif defined(SPECULAR_ROUGHNESS_ANISOTROPY) || defined(COAT_ROUGHNESS_ANISOTROPY)
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
		// TODO: Implement parallax occlusion scale
		// uvOffset = parallaxOcclusion(invTBN * -viewDirectionW, invTBN * normalW, vGeometryNormalUV, vGeometryNormalInfos.z);
	#else
		// uvOffset = parallaxOffset(invTBN * viewDirectionW, vGeometryNormalInfos.z);
	#endif
#endif

#ifdef DETAIL
	vec4 detailColor = texture2D(detailSampler, vDetailUV + uvOffset);
    vec2 detailNormalRG = detailColor.wy * 2.0 - 1.0;
    float detailNormalB = sqrt(1. - saturate(dot(detailNormalRG, detailNormalRG)));
    vec3 detailNormal = vec3(detailNormalRG, detailNormalB);
#endif

#ifdef GEOMETRY_COAT_NORMAL
	coatNormalW = perturbNormal(TBN, texture2D(geometryCoatNormalSampler, vGeometryCoatNormalUV + uvOffset).xyz, vGeometryCoatNormalInfos.y);
#endif

#ifdef GEOMETRY_NORMAL
	#ifdef OBJECTSPACE_NORMALMAP

		#define CUSTOM_FRAGMENT_BUMP_FRAGMENT

		normalW = normalize(texture2D(geometryNormalSampler, vGeometryNormalUV).xyz  * 2.0 - 1.0);
		normalW = normalize(mat3(normalMatrix) * normalW);
	#elif !defined(DETAIL)
		normalW = perturbNormal(TBN, texture2D(geometryNormalSampler, vGeometryNormalUV + uvOffset).xyz, vGeometryNormalInfos.y);
    #else
        vec3 sampledNormal = texture2D(geometryNormalSampler, vGeometryNormalUV + uvOffset).xyz * 2.0 - 1.0;
        // Reference for normal blending: https://blog.selfshadow.com/publications/blending-in-detail/
        #if DETAIL_NORMALBLENDMETHOD == 0 // whiteout
            detailNormal.xy *= vDetailInfos.z;
            vec3 blendedNormal = normalize(vec3(sampledNormal.xy + detailNormal.xy, sampledNormal.z * detailNormal.z));
        #elif DETAIL_NORMALBLENDMETHOD == 1 // RNM
            detailNormal.xy *= vDetailInfos.z;
            sampledNormal += vec3(0.0, 0.0, 1.0);
            detailNormal *= vec3(-1.0, -1.0, 1.0);
            vec3 blendedNormal = sampledNormal * dot(sampledNormal, detailNormal) / sampledNormal.z - detailNormal;
        #endif
        normalW = perturbNormalBase(TBN, blendedNormal, vGeometryNormalInfos.y);
	#endif
#elif defined(DETAIL)
        detailNormal.xy *= vDetailInfos.z;
		normalW = perturbNormalBase(TBN, detailNormal, vDetailInfos.z);
#endif
