precision highp float;
precision highp int;

#include<bonesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<instancesDeclaration>

attribute vec3 position;
attribute vec3 normal;

#if defined(ALPHATEST) || defined(NEED_UV)
varying vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif

// Uniform
uniform mat4 viewProjection;
uniform mat4 view;

varying vec3 vNormalV;
varying vec4 vViewPos;

#ifdef POSITION
varying vec3 vPosition;
#endif

#ifdef VELOCITY
uniform mat4 previousWorld;
uniform mat4 previousViewProjection;
#ifdef BONES_VELOCITY_ENABLED
#if NUM_BONE_INFLUENCERS > 0
uniform mat4 mPreviousBones[BonesPerMesh];
#endif
#endif

varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif

void main(void)
{
    vec3 positionUpdated = position;
    vec3 normalUpdated = normal;
#ifdef UV1
    vec2 uvUpdated = uv;
#endif
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

	#if defined(VELOCITY) && !defined(BONES_VELOCITY_ENABLED)
	// Compute velocity before bones computation
	vCurrentPosition = viewProjection * finalWorld * vec4(positionUpdated, 1.0);
	vPreviousPosition = previousViewProjection * previousWorld * vec4(positionUpdated, 1.0);
	#endif

#include<bonesVertex>
	vec4 pos = vec4(finalWorld * vec4(positionUpdated, 1.0));

	vNormalV = normalize(vec3((view * finalWorld) * vec4(normalUpdated, 0.0)));
	vViewPos = view * pos;

	#if defined(VELOCITY) && defined(BONES_VELOCITY_ENABLED)
		vCurrentPosition = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

		#if NUM_BONE_INFLUENCERS > 0
			mat4 previousInfluence;
			previousInfluence = mPreviousBones[int(matricesIndices[0])] * matricesWeights[0];
			#if NUM_BONE_INFLUENCERS > 1
				previousInfluence += mPreviousBones[int(matricesIndices[1])] * matricesWeights[1];
			#endif	
			#if NUM_BONE_INFLUENCERS > 2
				previousInfluence += mPreviousBones[int(matricesIndices[2])] * matricesWeights[2];
			#endif	
			#if NUM_BONE_INFLUENCERS > 3
				previousInfluence += mPreviousBones[int(matricesIndices[3])] * matricesWeights[3];
			#endif	

			#if NUM_BONE_INFLUENCERS > 4
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
			#endif	
			#if NUM_BONE_INFLUENCERS > 5
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
			#endif	
			#if NUM_BONE_INFLUENCERS > 6
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
			#endif	
			#if NUM_BONE_INFLUENCERS > 7
				previousInfluence += mPreviousBones[int(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
			#endif

			vPreviousPosition = previousViewProjection * previousWorld * previousInfluence * vec4(positionUpdated, 1.0);
		#else
			vPreviousPosition = previousViewProjection * previousWorld * vec4(positionUpdated, 1.0);
		#endif
	#endif

	#ifdef POSITION
	vPosition = pos.xyz / pos.w;
	#endif

	gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
	vUV = vec2(diffuseMatrix * vec4(uvUpdated, 1.0, 0.0));
#endif
#ifdef UV2
	vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
#endif
#endif
}
