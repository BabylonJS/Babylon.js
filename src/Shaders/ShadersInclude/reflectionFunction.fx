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

vec3 computeFixedEquirectangularCoords(vec4 worldPos, vec3 worldNormal, vec3 direction)
{
	float lon = atan(direction.z, direction.x);
	float lat = acos(direction.y);
	vec2 sphereCoords = vec2(lon, lat) * RECIPROCAL_PI2 * 2.0;
	float s = sphereCoords.x * 0.5 + 0.5;
	float t = sphereCoords.y;

	return vec3(s, t, 0);	
}

vec3 computeMirroredFixedEquirectangularCoords(vec4 worldPos, vec3 worldNormal, vec3 direction)
{
	float lon = atan(direction.z, direction.x);
	float lat = acos(direction.y);
	vec2 sphereCoords = vec2(lon, lat) * RECIPROCAL_PI2 * 2.0;
	float s = sphereCoords.x * 0.5 + 0.5;
	float t = sphereCoords.y;

	return vec3(1.0 - s, t, 0);	
}

vec3 computeEquirectangularCoords(vec4 worldPos, vec3 worldNormal, vec3 eyePosition, mat4 reflectionMatrix)
{
	vec3 cameraToVertex = normalize(worldPos.xyz - eyePosition);
	vec3 r = normalize(reflect(cameraToVertex, worldNormal));
	r = vec3(reflectionMatrix * vec4(r, 0));
	float lon = atan(r.z, r.x);
	float lat = acos(r.y);
	vec2 sphereCoords = vec2(lon, lat) * RECIPROCAL_PI2 * 2.0;
	float s = sphereCoords.x * 0.5 + 0.5;
	float t = sphereCoords.y;

	return vec3(s, t, 0);
}

vec3 computeSphericalCoords(vec4 worldPos, vec3 worldNormal, mat4 view, mat4 reflectionMatrix)
{
	vec3 viewDir = normalize(vec3(view * worldPos));
	vec3 viewNormal = normalize(vec3(view * vec4(worldNormal, 0.0)));

	vec3 r = reflect(viewDir, viewNormal);
	r = vec3(reflectionMatrix * vec4(r, 0));
	r.z = r.z - 1.0;

	float m = 2.0 * length(r);

	return vec3(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);
}

vec3 computePlanarCoords(vec4 worldPos, vec3 worldNormal, vec3 eyePosition, mat4 reflectionMatrix)
{
	vec3 viewDir = worldPos.xyz - eyePosition;
	vec3 coords = normalize(reflect(viewDir, worldNormal));

	return vec3(reflectionMatrix * vec4(coords, 1));
}

vec3 computeCubicCoords(vec4 worldPos, vec3 worldNormal, vec3 eyePosition, mat4 reflectionMatrix)
{
    vec3 viewDir = normalize(worldPos.xyz - eyePosition);

    // worldNormal has already been normalized.
    vec3 coords = reflect(viewDir, worldNormal);

    coords = vec3(reflectionMatrix * vec4(coords, 0));

    #ifdef INVERTCUBICMAP // This is not (yet) supported by Node Material
        coords.y *= -1.0;
    #endif

    return coords;
}

vec3 computeCubicLocalCoords(vec4 worldPos, vec3 worldNormal, vec3 eyePosition, mat4 reflectionMatrix, vec3 reflectionSize, vec3 reflectionPosition)
{
    vec3 viewDir = normalize(worldPos.xyz - eyePosition);

    // worldNormal has already been normalized.
    vec3 coords = reflect(viewDir, worldNormal);

	coords = parallaxCorrectNormal(worldPos.xyz, coords, reflectionSize, reflectionPosition);

    coords = vec3(reflectionMatrix * vec4(coords, 0));

    #ifdef INVERTCUBICMAP // This is not (yet) supported by Node Material
        coords.y *= -1.0;
    #endif

    return coords;
}

vec3 computeProjectionCoords(vec4 worldPos, mat4 view, mat4 reflectionMatrix)
{
	return vec3(reflectionMatrix * (view * worldPos));
}

vec3 computeSkyBoxCoords(vec3 positionW, mat4 reflectionMatrix)
{
	return vec3(reflectionMatrix * vec4(positionW, 1.));
}

#ifdef REFLECTION
vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED
	vec3 direction = normalize(vDirectionW);
	return computeMirroredFixedEquirectangularCoords(worldPos, worldNormal, direction);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
	vec3 direction = normalize(vDirectionW);
	return computeFixedEquirectangularCoords(worldPos, worldNormal, direction);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR
	return computeEquirectangularCoords(worldPos, worldNormal, vEyePosition.xyz, reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_SPHERICAL
	return computeSphericalCoords(worldPos, worldNormal, view, reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_PLANAR
	return computePlanarCoords(worldPos, worldNormal, vEyePosition.xyz, reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_CUBIC
	#ifdef USE_LOCAL_REFLECTIONMAP_CUBIC
    	return computeCubicLocalCoords(worldPos, worldNormal, vEyePosition.xyz, reflectionMatrix, vReflectionSize, vReflectionPosition);
	#else
    	return computeCubicCoords(worldPos, worldNormal, vEyePosition.xyz, reflectionMatrix);
	#endif
#endif

#ifdef REFLECTIONMAP_PROJECTION
	return computeProjectionCoords(worldPos, view, reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_SKYBOX
	return computeSkyBoxCoords(vPositionUVW, reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return vec3(0, 0, 0);
#endif
}
#endif