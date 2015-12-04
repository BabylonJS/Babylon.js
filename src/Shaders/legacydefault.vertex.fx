precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#if NUM_BONE_INFLUENCERS > 0

	// having bone influencers implies you have bones
	uniform mat4 mBones[BonesPerMesh];

	attribute vec4 matricesIndices;
	attribute vec4 matricesWeights;
	#if NUM_BONE_INFLUENCERS > 4
		attribute vec4 matricesIndicesExtra;
		attribute vec4 matricesWeightsExtra;
	#endif
#endif

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform mat4 ambientMatrix;
uniform vec2 vAmbientInfos;
#endif

#ifdef OPACITY
varying vec2 vOpacityUV;
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform mat4 emissiveMatrix;
#endif

#if defined(SPECULAR) && defined(SPECULARTERM)
varying vec2 vSpecularUV;
uniform vec2 vSpecularInfos;
uniform mat4 specularMatrix;
#endif

#ifdef BUMP
varying vec2 vBumpUV;
uniform vec2 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

// Output
varying vec3 vPositionW;
varying vec3 vNormalW;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
varying float fClipDistance;
#endif

#ifdef FOG
varying float fFogDistance;
#endif

#ifdef SHADOWS
#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
uniform mat4 lightMatrix0;
varying vec4 vPositionFromLight0;
#endif
#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
uniform mat4 lightMatrix1;
varying vec4 vPositionFromLight1;
#endif
#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
uniform mat4 lightMatrix2;
varying vec4 vPositionFromLight2;
#endif
#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
uniform mat4 lightMatrix3;
varying vec4 vPositionFromLight3;
#endif
#endif

#ifdef REFLECTION
uniform vec3 vEyePosition;
varying vec3 vReflectionUVW;
uniform mat4 reflectionMatrix;

vec3 computeReflectionCoords(vec4 worldPos, vec3 worldNormal)
{
#ifdef REFLECTIONMAP_SPHERICAL
	vec3 coords = vec3(view * vec4(worldNormal, 0.0));

	return vec3(reflectionMatrix * vec4(coords, 1.0));
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
	return position;
#endif

#ifdef REFLECTIONMAP_EXPLICIT
	return vec3(0, 0, 0);
#endif
}
#endif

void main(void) {
	mat4 finalWorld = world;

#if NUM_BONE_INFLUENCERS > 0
	mat4 influence;
	influence = mBones[int(matricesIndices[0])] * matricesWeights[0];

	#if NUM_BONE_INFLUENCERS > 1
		influence += mBones[int(matricesIndices[1])] * matricesWeights[1];
	#endif 
	#if NUM_BONE_INFLUENCERS > 2
		influence += mBones[int(matricesIndices[2])] * matricesWeights[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 3
		influence += mBones[int(matricesIndices[3])] * matricesWeights[3];
	#endif	

	#if NUM_BONE_INFLUENCERS > 4
		influence += mBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
	#endif
	#if NUM_BONE_INFLUENCERS > 5
		influence += mBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
	#endif	
	#if NUM_BONE_INFLUENCERS > 6
		influence += mBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
	#endif	
	#if NUM_BONE_INFLUENCERS > 7
		influence += mBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
	#endif	

	finalWorld = finalWorld * influence;
#endif
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef DIFFUSE
	if (vDiffuseInfos.x == 0.)
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef AMBIENT
	if (vAmbientInfos.x == 0.)
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef OPACITY
	if (vOpacityInfos.x == 0.)
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif
	
#ifdef REFLECTION
	vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), vNormalW);
#endif

#ifdef EMISSIVE
	if (vEmissiveInfos.x == 0.)
	{
		vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(SPECULAR) && defined(SPECULARTERM)
	if (vSpecularInfos.x == 0.)
	{
		vSpecularUV = vec2(specularMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vSpecularUV = vec2(specularMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef BUMP
	if (vBumpInfos.x == 0.)
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

	// Clip plane
#ifdef CLIPPLANE
	fClipDistance = dot(worldPos, vClipPlane);
#endif

	// Fog
#ifdef FOG
	fFogDistance = (view * worldPos).z;
#endif

	// Shadows
#ifdef SHADOWS
#if defined(SPOTLIGHT0) || defined(DIRLIGHT0)
	vPositionFromLight0 = lightMatrix0 * worldPos;
#endif
#if defined(SPOTLIGHT1) || defined(DIRLIGHT1)
	vPositionFromLight1 = lightMatrix1 * worldPos;
#endif
#if defined(SPOTLIGHT2) || defined(DIRLIGHT2)
	vPositionFromLight2 = lightMatrix2 * worldPos;
#endif
#if defined(SPOTLIGHT3) || defined(DIRLIGHT3)
	vPositionFromLight3 = lightMatrix3 * worldPos;
#endif
#endif

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif
}