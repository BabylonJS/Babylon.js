// Per-light specialization so the tile mask storage buffer is accessed from module
// scope. Passing ptr<storage, ...> as a function parameter requires the optional
// WGSL extension unrestricted_pointer_parameters, which Firefox/Naga does not implement.
#if defined(CLUSTLIGHT{X}) && defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
fn computeClusteredLighting{X}(
	lightDataTexture: texture_2d<f32>,
	viewDirectionW: vec3f,
	vNormal: vec3f,
	lightData: vec4f,
	sliceRange: vec2u,
	glossiness: f32
) -> lightingInfo {
	var result: lightingInfo;
	let tilePosition = vec2u(fragmentInputs.position.xy * lightData.xy);
	let maskResolution = vec2u(lightData.zw);
	var tileIndex = (tilePosition.x * maskResolution.x + tilePosition.y) * maskResolution.y;

	let batchRange = sliceRange / CLUSTLIGHT_BATCH;
	var batchOffset = batchRange.x * CLUSTLIGHT_BATCH;
	tileIndex += batchRange.x;

	for (var i = batchRange.x; i <= batchRange.y; i += 1) {
		var mask = tileMaskBuffer{X}[tileIndex];
		tileIndex += 1;
		// Mask out the bits outside the range
		let maskOffset = max(sliceRange.x, batchOffset) - batchOffset; // Be careful with unsigned values
		let maskWidth = min(sliceRange.y - batchOffset + 1, CLUSTLIGHT_BATCH);
		mask = extractBits(mask, maskOffset, maskWidth);

		while mask != 0 {
			let trailing = firstTrailingBit(mask);
			mask ^= 1u << trailing;
			let light = getClusteredLight(lightDataTexture, batchOffset + maskOffset + trailing);

			var info: lightingInfo;
			if light.vLightDirection.w < 0.0 {
				// Assume an angle greater than 180º is a point light
				info = computeLighting(viewDirectionW, vNormal, light.vLightData, light.vLightDiffuse.rgb, light.vLightSpecular.rgb, light.vLightDiffuse.a, glossiness);
			} else {
				info = computeSpotLighting(viewDirectionW, vNormal, light.vLightData, light.vLightDirection, light.vLightDiffuse.rgb, light.vLightSpecular.rgb, light.vLightDiffuse.a, glossiness);
			}
			result.diffuse += info.diffuse;
			#ifdef SPECULARTERM
				result.specular += info.specular;
			#endif
		}
		batchOffset += CLUSTLIGHT_BATCH;
	}
	return result;
}
#endif
