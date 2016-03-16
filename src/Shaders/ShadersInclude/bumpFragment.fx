#ifdef BUMP
	vec2 bumpUV = vBumpUV;
#endif

#if defined(BUMP) || defined(PARALLAX)
	mat3 TBN = cotangent_frame(normalW * vBumpInfos.y, -viewDirectionW, bumpUV);
#endif

#ifdef PARALLAX
	mat3 invTBN = transposeMat3(TBN);

	#ifdef PARALLAXOCCLUSION
		vec2 uvOffset = parallaxOcclusion(invTBN * -viewDirectionW, invTBN * normalW, bumpUV, vBumpInfos.z);
	#else
		vec2 uvOffset = parallaxOffset(invTBN * viewDirectionW, vBumpInfos.z);
	#endif

	diffuseUV += uvOffset;
	bumpUV += uvOffset;
#endif

#ifdef BUMP
	normalW = perturbNormal(viewDirectionW, TBN, bumpUV);
#endif