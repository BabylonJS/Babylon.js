// StandardMaterial alpha contributions applied after the diffuse texture: opacity texture, vertex/instance
// alpha, opacity fresnel, then the deferred alpha test (ALPHATEST_AFTERALLALPHACOMPUTATIONS).
// Shared by the colour variant (after lighting, as before) and the depth pre-pass variant (before the
// pre-pass exit), so both passes discard exactly the same texels.
#ifdef OPACITY
	var opacityMap: vec4f = TEXRD(opacitySampler, opacitySamplerSampler, fragmentInputs.vOpacityUV + uvOffset);

#ifdef OPACITYRGB
	opacityMap = vec4f(opacityMap.rgb *  vec3f(0.3, 0.59, 0.11), opacityMap.a);
	alpha *= (opacityMap.x + opacityMap.y + opacityMap.z)* uniforms.vOpacityInfos.y;
#else
	alpha *= opacityMap.a * uniforms.vOpacityInfos.y;
#endif

#endif

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= fragmentInputs.vColor.a;
#endif

#ifdef OPACITYFRESNEL
	var opacityFresnelTerm: f32 = computeFresnelTerm(viewDirectionW, normalW, uniforms.opacityParts.z, uniforms.opacityParts.w);

	alpha += uniforms.opacityParts.x * (1.0 - opacityFresnelTerm) + opacityFresnelTerm * uniforms.opacityParts.y;
#endif

#ifdef ALPHATEST
    #ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
        if (alpha < uniforms.alphaCutOff) {
            discard;
		}
    #endif
    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        alpha = 1.0;
    #endif
#endif
