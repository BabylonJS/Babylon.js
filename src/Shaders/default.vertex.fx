﻿precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
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

#ifdef INSTANCES
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
#else
uniform mat4 world;
#endif

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

#ifdef LIGHTMAP
varying vec2 vLightmapUV;
uniform vec2 vLightmapInfos;
uniform mat4 lightmapMatrix;
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

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

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
#ifdef LIGHT0
uniform mat4 lightMatrix0;
varying vec4 vPositionFromLight0;
#endif
#ifdef LIGHT1
uniform mat4 lightMatrix1;
varying vec4 vPositionFromLight1;
#endif
#ifdef LIGHT2
uniform mat4 lightMatrix2;
varying vec4 vPositionFromLight2;
#endif
#ifdef LIGHT3
uniform mat4 lightMatrix3;
varying vec4 vPositionFromLight3;
#endif
#endif

#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR
varying vec3 vDirectionW;
#endif

void main(void) {
#ifdef REFLECTIONMAP_SKYBOX
	vPositionUVW = position;
#endif 

#ifdef INSTANCES
	mat4 finalWorld = mat4(world0, world1, world2, world3);
#else
	mat4 finalWorld = world;
#endif

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

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

#ifdef REFLECTIONMAP_EQUIRECTANGULAR
	vDirectionW = normalize(vec3(finalWorld * vec4(position, 0.0)));
#endif

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

#ifdef LIGHTMAP
	if (vLightmapInfos.x == 0.)
	{
		vLightmapUV = vec2(lightmapMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vLightmapUV = vec2(lightmapMatrix * vec4(uv2, 1.0, 0.0));
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
#ifdef LIGHT0
	vPositionFromLight0 = lightMatrix0 * worldPos;
#endif
#ifdef LIGHT1
	vPositionFromLight1 = lightMatrix1 * worldPos;
#endif
#ifdef LIGHT2
	vPositionFromLight2 = lightMatrix2 * worldPos;
#endif
#ifdef LIGHT3
	vPositionFromLight3 = lightMatrix3 * worldPos;
#endif
#endif

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif
}