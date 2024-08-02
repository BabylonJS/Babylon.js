fn computeFixedEquirectangularCoords(worldPos: vec4f, worldNormal: vec3f, direction: vec3f) -> vec3f
{
	var lon: f32 = atan2(direction.z, direction.x);
	var lat: f32 = acos(direction.y);
	var sphereCoords: vec2f =  vec2f(lon, lat) * RECIPROCAL_PI2 * 2.0;
	var s: f32 = sphereCoords.x * 0.5 + 0.5;
	var t: f32 = sphereCoords.y;

	return  vec3f(s, t, 0);	
}

fn computeMirroredFixedEquirectangularCoords(worldPos: vec4f, worldNormal: vec3f, direction: vec3f) -> vec3f
{
	var lon: f32 = atan2(direction.z, direction.x);
	var lat: f32 = acos(direction.y);
	var sphereCoords: vec2f =  vec2f(lon, lat) * RECIPROCAL_PI2 * 2.0;
	var s: f32 = sphereCoords.x * 0.5 + 0.5;
	var t: f32 = sphereCoords.y;

	return  vec3f(1.0 - s, t, 0);	
}

fn computeEquirectangularCoords(worldPos: vec4f, worldNormal: vec3f, eyePosition: vec3f, reflectionMatrix: mat4x4f) -> vec3f
{
	var cameraToVertex: vec3f = normalize(worldPos.xyz - eyePosition);
	var r: vec3f = normalize(reflect(cameraToVertex, worldNormal));
	r =  (reflectionMatrix *  vec4f(r, 0)).xyz;
	var lon: f32 = atan2(r.z, r.x);
	var lat: f32 = acos(r.y);
	var sphereCoords: vec2f =  vec2f(lon, lat) * RECIPROCAL_PI2 * 2.0;
	var s: f32 = sphereCoords.x * 0.5 + 0.5;
	var t: f32 = sphereCoords.y;

	return  vec3f(s, t, 0);
}

fn computeSphericalCoords(worldPos: vec4f, worldNormal: vec3f, view: mat4x4f, reflectionMatrix: mat4x4f) -> vec3f
{
	var viewDir: vec3f = normalize((view * worldPos).xyz);
	var viewNormal: vec3f = normalize((view *  vec4f(worldNormal, 0.0)).xyz);

	var r: vec3f = reflect(viewDir, viewNormal);
	r =  (reflectionMatrix *  vec4f(r, 0)).xyz;
	r.z = r.z - 1.0;

	var m: f32 = 2.0 * length(r);

	return  vec3f(r.x / m + 0.5, 1.0 - r.y / m - 0.5, 0);
}

fn computePlanarCoords(worldPos: vec4f, worldNormal: vec3f, eyePosition: vec3f, reflectionMatrix: mat4x4f) -> vec3f
{
	var viewDir: vec3f = worldPos.xyz - eyePosition;
	var coords: vec3f = normalize(reflect(viewDir, worldNormal));

	return  (reflectionMatrix *  vec4f(coords, 1)).xyz;
}

fn computeCubicCoords(worldPos: vec4f, worldNormal: vec3f, eyePosition: vec3f, reflectionMatrix: mat4x4f) -> vec3f
{
    var viewDir: vec3f = normalize(worldPos.xyz - eyePosition);

    // worldNormal has already been normalized.
    var coords: vec3f = reflect(viewDir, worldNormal);

    coords =  (reflectionMatrix *  vec4f(coords, 0)).xyz;

    #ifdef INVERTCUBICMAP
        coords.y *= -1.0;
    #endif

    return coords;
}

fn computeCubicLocalCoords(worldPos: vec4f, worldNormal: vec3f, eyePosition: vec3f, reflectionMatrix: mat4x4f, reflectionSize: vec3f, reflectionPosition: vec3f) -> vec3f
{
    var viewDir: vec3f = normalize(worldPos.xyz - eyePosition);

    // worldNormal has already been normalized.
    var coords: vec3f = reflect(viewDir, worldNormal);

	coords = parallaxCorrectNormal(worldPos.xyz, coords, reflectionSize, reflectionPosition);

    coords = (reflectionMatrix *  vec4f(coords, 0)).xyz;

    #ifdef INVERTCUBICMAP
        coords.y *= -1.0;
    #endif

    return coords;
}

fn computeProjectionCoords(worldPos: vec4f, view: mat4x4f, reflectionMatrix: mat4x4f) -> vec3f
{
	return (reflectionMatrix * (view * worldPos)).xyz;
}

fn computeSkyBoxCoords(positionW: vec3f, reflectionMatrix: mat4x4f) -> vec3f
{
	return (reflectionMatrix *  vec4f(positionW, 1.)).xyz;
}

#ifdef REFLECTION
fn computeReflectionCoords(worldPos: vec4f, worldNormal: vec3f) -> vec3f
{
#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED
	var direction: vec3f = normalize(fragmentInputs.vDirectionW);
	return computeMirroredFixedEquirectangularCoords(worldPos, worldNormal, direction);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR_FIXED
	var direction: vec3f = normalize(fragmentInputs.vDirectionW);
	return computeFixedEquirectangularCoords(worldPos, worldNormal, direction);
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR
	return computeEquirectangularCoords(worldPos, worldNormal, scene.vEyePosition.xyz, uniforms.reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_SPHERICAL
	return computeSphericalCoords(worldPos, worldNormal, scene.view, uniforms.reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_PLANAR
	return computePlanarCoords(worldPos, worldNormal, scene.vEyePosition.xyz, uniforms.reflectionMatrix);
#endif

#ifdef REFLECTIONMAP_CUBIC
	#ifdef USE_LOCAL_REFLECTIONMAP_CUBIC
    	return computeCubicLocalCoords(worldPos, worldNormal, scene.vEyePosition.xyz, uniforms.reflectionMatrix, uniforms.vReflectionSize, uniforms.vReflectionPosition);
	#else
    	return computeCubicCoords(worldPos, worldNormal, scene.vEyePosition.xyz, uniforms.reflectionMatrix);
	#endif
#endif

#ifdef REFLECTIONMAP_PROJECTION
	return computeProjectionCoords(worldPos, scene.view, uniforms.reflectionMatrix);
#endif

#ifndef REFLECTIONMAP_CUBIC
	#ifdef REFLECTIONMAP_SKYBOX
		return computeSkyBoxCoords(fragmentInputs.vPositionUVW, uniforms.reflectionMatrix);
	#endif
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return  vec3f(0, 0, 0);
#endif
}
#endif