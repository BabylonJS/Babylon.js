﻿#ifdef GL_ES
precision highp float;
#endif

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
#ifdef BONES
attribute vec4 matricesIndices;
attribute vec4 matricesWeights;
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

#ifdef SPECULAR
varying vec2 vSpecularUV;
uniform vec2 vSpecularInfos;
uniform mat4 specularMatrix;
#endif

#ifdef BUMP
varying vec2 vBumpUV;
uniform vec2 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef BONES
uniform mat4 mBones[BonesPerMesh];
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

#ifdef REFLECTION
varying vec3 vPositionUVW;
#endif

void main(void) {
	mat4 finalWorld;

#ifdef REFLECTION
	vPositionUVW = position;
#endif 

#ifdef INSTANCES
	finalWorld = mat4(world0, world1, world2, world3);
#else
	finalWorld = world;
#endif

#ifdef BONES
	mat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;
	mat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;
	mat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;

#ifdef BONES4
	mat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;
	finalWorld = finalWorld * (m0 + m1 + m2 + m3);
#else
	finalWorld = finalWorld * (m0 + m1 + m2);
#endif 

#endif
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
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

#ifdef SPECULAR
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