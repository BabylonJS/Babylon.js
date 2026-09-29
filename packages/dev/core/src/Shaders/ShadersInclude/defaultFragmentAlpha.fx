// StandardMaterial alpha contributions applied after the diffuse texture: opacity texture, vertex/instance
// alpha, opacity fresnel, then the deferred alpha test (ALPHATEST_AFTERALLALPHACOMPUTATIONS).
// Shared by the colour variant (after lighting, as before) and the depth pre-pass variant (before the
// pre-pass exit), so both passes discard exactly the same texels.
#ifdef OPACITY
	vec4 opacityMap = TEXRD(opacitySampler, vOpacityUV + uvOffset);

#ifdef OPACITYRGB
	opacityMap.rgb = opacityMap.rgb * vec3(0.3, 0.59, 0.11);
	alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;
#else
	alpha *= opacityMap.a * vOpacityInfos.y;
#endif

#endif

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= vColor.a;
#endif

#ifdef OPACITYFRESNEL
	float opacityFresnelTerm = computeFresnelTerm(viewDirectionW, normalW, opacityParts.z, opacityParts.w);

	alpha += opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * opacityParts.y;
#endif

#ifdef ALPHATEST
    #ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
        if (alpha < alphaCutOff)
            discard;
    #endif
    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        alpha = 1.0;
    #endif
#endif
