#ifdef USE_LOCAL_REFLECTIONMAP_CUBIC
vec3 parallaxCorrectNormal( vec3 vertexPos, vec3 origVec, vec3 cubeSize, vec3 cubePos ) {
	// Find the ray intersection with box plane
	vec3 invOrigVec = vec3(1.0,1.0,1.0) / origVec;
	vec3 halfSize = cubeSize * 0.5;
	vec3 intersecAtMaxPlane = (cubePos + halfSize - vertexPos) * invOrigVec;
	vec3 intersecAtMinPlane = (cubePos - halfSize - vertexPos) * invOrigVec;
	// Get the largest intersection values (we are not intersted in negative values)
	vec3 largestIntersec = max(intersecAtMaxPlane, intersecAtMinPlane);
	// Get the closest of all solutions
	float distance = min(min(largestIntersec.x, largestIntersec.y), largestIntersec.z);
	// Get the intersection position
	vec3 intersectPositionWS = vertexPos + origVec * distance;
	// Get corrected vector
	return intersectPositionWS - cubePos;
}
#endif

vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
	vec3 direction = normalize(vDirectionW);
	float lon = atan(direction.z, direction.x);
	float lat = acos(direction.y);
	vec2 sphereCoords = vec2(lon, lat) * RECIPROCAL_PI2 * 2.0;
	float s = sphereCoords.x * 0.5 + 0.5;
	float t = sphereCoords.y;

 	#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED
		return vec3(reflectionMatrix * vec4(1.0 - s, t, 0, 0));
	#else
		return vec3(reflectionMatrix * vec4(s, t, 0, 0));
	#endif
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR

	vec3 cameraToVertex = normalize(worldPos.xyz - vEyePosition.xyz);
	vec3 r = normalize(reflect(cameraToVertex, worldNormal));
	float lon = atan(r.z, r.x);
	float lat = acos(r.y);
	vec2 sphereCoords = vec2(lon, lat) * RECIPROCAL_PI2 * 2.0;
	float s = sphereCoords.x * 0.5 + 0.5;
	float t = sphereCoords.y;

	return vec3(reflectionMatrix * vec4(s, t, 0, 0));
#endif

#ifdef REFLECTIONMAP_SPHERICAL
	vec3 viewDir = normalize(vec3(view * worldPos));
	vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));

	vec3 r = reflect(viewDir, viewNormal);
	r.z = r.z - 1.0;

	float m = 2.0 * length(r);

	return vec3(reflectionMatrix * vec4(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0, 0));
#endif

#ifdef REFLECTIONMAP_PLANAR
	vec3 viewDir = worldPos.xyz - vEyePosition.xyz;
	vec3 coords = normalize(reflect(viewDir, worldNormal));

	return vec3(reflectionMatrix * vec4(coords, 1));
#endif

#ifdef REFLECTIONMAP_CUBIC
    vec3 viewDir = normalize(worldPos.xyz - vEyePosition.xyz);

    // worldNormal has already been normalized.
    vec3 coords = reflect(viewDir, worldNormal);

    #ifdef USE_LOCAL_REFLECTIONMAP_CUBIC
        coords = parallaxCorrectNormal(worldPos.xyz, coords, vReflectionSize, vReflectionPosition);
    #endif

    coords = vec3(reflectionMatrix * vec4(coords, 0));

    #ifdef INVERTCUBICMAP
        coords.y *= -1.0;
    #endif

    return coords;
#endif


#ifdef REFLECTIONMAP_PROJECTION
	return vec3(reflectionMatrix * (view * worldPos));
#endif

#ifdef REFLECTIONMAP_SKYBOX
	return vec3(reflectionMatrix * vec4(vPositionUVW, 0));
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return vec3(0, 0, 0);
#endif
}
