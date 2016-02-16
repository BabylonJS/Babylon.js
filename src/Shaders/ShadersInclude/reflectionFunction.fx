vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
	vec3 direction = normalize(vDirectionW);

	float t = clamp(direction.y * -0.5 + 0.5, 0., 1.0);
	float s = atan(direction.z, direction.x) * RECIPROCAL_PI2 + 0.5;

	return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR

	vec3 cameraToVertex = normalize(worldPos.xyz - vEyePosition);
	vec3 r = reflect(cameraToVertex, worldNormal);
	float t = clamp(r.y * -0.5 + 0.5, 0., 1.0);
	float s = atan(r.z, r.x) * RECIPROCAL_PI2 + 0.5;

	return vec3(s, t, 0);
#endif

#ifdef REFLECTIONMAP_SPHERICAL
	vec3 viewDir = normalize(vec3(view * worldPos));
	vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));

	vec3 r = reflect(viewDir, viewNormal);
	r.z = r.z - 1.0;

	float m = 2.0 * length(r);

	return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);
#endif

#ifdef REFLECTIONMAP_PLANAR
	vec3 viewDir = worldPos.xyz - vEyePosition;
	vec3 coords = normalize(reflect(viewDir, worldNormal));

	return vec3(reflectionMatrix * vec4(coords, 1));
#endif

#ifdef REFLECTIONMAP_CUBIC
	vec3 viewDir = worldPos.xyz - vEyePosition;
	vec3 coords = reflect(viewDir, worldNormal);
#ifdef INVERTCUBICMAP
	coords.y = 1.0 - coords.y;
#endif
	return vec3(reflectionMatrix * vec4(coords, 0));
#endif

#ifdef REFLECTIONMAP_PROJECTION
	return vec3(reflectionMatrix * (view * worldPos));
#endif

#ifdef REFLECTIONMAP_SKYBOX
	return vPositionUVW;
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return vec3(0, 0, 0);
#endif
}