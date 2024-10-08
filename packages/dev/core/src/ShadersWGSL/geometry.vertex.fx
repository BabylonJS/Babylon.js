#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<instancesDeclaration>
#include<sceneUboDeclaration>

#include<clipPlaneVertexDeclaration>

attribute position: vec3f;
attribute normal: vec3f;

#ifdef NEED_UV
	varying vUV: vec2f;

	#ifdef ALPHATEST
	uniform diffuseMatrix: mat4x4f;
	#endif
	#ifdef BUMP
	uniform bumpMatrix: mat4x4f;
	varying vBumpUV: vec2f;
	#endif
	#ifdef REFLECTIVITY
	uniform reflectivityMatrix: mat4x4f;
	uniform albedoMatrix: mat4x4f;
	varying vReflectivityUV: vec2f;
	varying vAlbedoUV: vec2f;
	#endif

	#ifdef UV1
	attribute uv: vec2f;
	#endif

	#ifdef UV2
	attribute uv2: vec2f;
	#endif
#endif

#ifdef BUMP
varying vWorldView0: vec4f;
varying vWorldView1: vec4f;
varying vWorldView2: vec4f;
varying vWorldView3: vec4f;
#endif

#ifdef BUMP
varying vNormalW: vec3f;
#else
varying vNormalV: vec3f;
#endif

varying vViewPos: vec4f;

#if defined(POSITION) || defined(BUMP)
varying vPositionW: vec3f;
#endif

#ifdef VELOCITY
uniform previousViewProjection: mat4x4f;

varying vCurrentPosition: vec4f;
varying vPreviousPosition: vec4f;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    var positionUpdated: vec3f = input.position;
    var normalUpdated: vec3f = input.normal;
#ifdef UV1
    var uvUpdated: vec2f = input.uv;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

	#if defined(VELOCITY) && !defined(BONES_VELOCITY_ENABLED)
	// Compute velocity before bones computation
	vCurrentPosition = scene.viewProjection * finalWorld * vec4f(positionUpdated, 1.0);
	vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld *  vec4f(positionUpdated, 1.0);
	#endif

#include<bonesVertex>
#include<bakedVertexAnimation>
	var worldPos: vec4f =  vec4f(finalWorld *  vec4f(positionUpdated, 1.0));

	#ifdef BUMP
	let vWorldView = scene.view * finalWorld;
		vertexOutputs.vWorldView0 = vWorldView[0];
		vertexOutputs.vWorldView1 = vWorldView[1];
		vertexOutputs.vWorldView2 = vWorldView[2];
		vertexOutputs.vWorldView3 = vWorldView[3];
		vertexOutputs.vNormalW = normalUpdated;
	#else
        #ifdef NORMAL_WORLDSPACE
			vertexOutputs.vNormalV = normalize((finalWorld *  vec4f(normalUpdated, 0.0)).xyz);
		#else
			vertexOutputs.vNormalV = normalize(((scene.view * finalWorld) *  vec4f(normalUpdated, 0.0)).xyz);
		#endif
	#endif

	vertexOutputs.vViewPos = scene.view * worldPos;

	#if defined(VELOCITY) && defined(BONES_VELOCITY_ENABLED)
		vertexOutputs.vCurrentPosition = scene.viewProjection * finalWorld *  vec4f(positionUpdated, 1.0);

		#if NUM_BONE_INFLUENCERS > 0
			var previousInfluence: mat4x4f;
			previousInfluence = mPreviousBones[ i32(matricesIndices[0])] * matricesWeights[0];
			#if NUM_BONE_INFLUENCERS > 1
				previousInfluence += mPreviousBones[ i32(matricesIndices[1])] * matricesWeights[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 2
				previousInfluence += mPreviousBones[ i32(matricesIndices[2])] * matricesWeights[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 3
				previousInfluence += mPreviousBones[ i32(matricesIndices[3])] * matricesWeights[3];
			#endif

			#if NUM_BONE_INFLUENCERS > 4
				previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[0])] * matricesWeightsExtra[0];
			#endif
			#if NUM_BONE_INFLUENCERS > 5
				previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[1])] * matricesWeightsExtra[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 6
				previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[2])] * matricesWeightsExtra[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 7
				previousInfluence += mPreviousBones[ i32(matricesIndicesExtra[3])] * matricesWeightsExtra[3];
			#endif

			vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld * previousInfluence *  vec4f(positionUpdated, 1.0);
		#else
			vertexOutputs.vPreviousPosition = uniforms.previousViewProjection * finalPreviousWorld *  vec4f(positionUpdated, 1.0);
		#endif
	#endif

	#if defined(POSITION) || defined(BUMP)
	vertexOutputs.vPositionW = worldPos.xyz / worldPos.w;
	#endif

	vertexOutputs.position = scene.viewProjection * finalWorld *  vec4f(positionUpdated, 1.0);

	#include<clipPlaneVertex>

	#ifdef NEED_UV
		#ifdef UV1
			#if defined(ALPHATEST) && defined(ALPHATEST_UV1)
			vertexOutputs.vUV = (uniforms.diffuseMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#else
			vertexOutputs.vUV = input.uv;
			#endif

			#ifdef BUMP_UV1
			vertexOutputs.vBumpUV = (uniforms.bumpMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#endif
			#ifdef REFLECTIVITY_UV1
			vertexOutputs.vReflectivityUV = (uniforms.reflectivityMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#endif
			#ifdef ALBEDO_UV1
			vertexOutputs.vAlbedoUV = (uniforms.albedoMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#endif
		#endif
		#ifdef UV2
			#if defined(ALPHATEST) && defined(ALPHATEST_UV2)
			vertexOutputs.vUV = (uniforms.diffuseMatrix *  vec4f(input.uv2, 1.0, 0.0)).xy;
			#else
			vertexOutputs.vUV = input.uv2;
			#endif

			#ifdef BUMP_UV2
			vertexOutputs.vBumpUV = (uniforms.bumpMatrix *  vec4f(input.uv2, 1.0, 0.0)).xy;
			#endif
			#ifdef REFLECTIVITY_UV2
			vertexOutputs.vReflectivityUV = (uniforms.reflectivityMatrix *  vec4f(input.uv2, 1.0, 0.0)).xy;
			#endif
			#ifdef ALBEDO_UV2
			vertexOutputs.vAlbedoUV = (uniforms.albedoMatrix *  vec4f(input.uv2, 1.0, 0.0)).xy;
			#endif
		#endif
	#endif

	#include<bumpVertex>
}
