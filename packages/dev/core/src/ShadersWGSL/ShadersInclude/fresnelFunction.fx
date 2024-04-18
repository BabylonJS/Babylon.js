#ifdef FRESNEL
	fn computeFresnelTerm(viewDirection: vec3f, worldNormal: vec3f, bias: f32, power: f32) -> f32
	{
		let fresnelTerm: f32 = pow(bias + abs(dot(viewDirection, worldNormal)), power);
		return clamp(fresnelTerm, 0., 1.);
	}
#endif