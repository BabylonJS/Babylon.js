precision highp float;

// Attribute
attribute vec3 position;
attribute vec3 normal;

#if NUM_BONE_INFLUENCERS > 0
uniform mat4 mBones[BonesPerMesh];

attribute vec4 matricesIndices;
attribute vec4 matricesWeights;
#if NUM_BONE_INFLUENCERS > 4
attribute vec4 matricesIndicesExtra;
attribute vec4 matricesWeightsExtra;
#endif
#endif

// Uniform
uniform float offset;

#ifdef INSTANCES
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
#else
uniform mat4 world;
#endif

uniform mat4 viewProjection;

#ifdef ALPHATEST
varying vec2 vUV;
uniform mat4 diffuseMatrix;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#endif

void main(void)
{
	vec3 offsetPosition = position + normal * offset;

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
	gl_Position = viewProjection * finalWorld * vec4(offsetPosition, 1.0);

#ifdef ALPHATEST
#ifdef UV1
	vUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
#endif
#ifdef UV2
	vUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
#endif
#endif
}
