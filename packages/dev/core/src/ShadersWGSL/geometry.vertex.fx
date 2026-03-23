#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<instancesDeclaration>
#include<sceneUboDeclaration>

#include<clipPlaneVertexDeclaration>

attribute position: vec3f;
#ifdef HAS_NORMAL_ATTRIBUTE
	attribute normal: vec3f;
#endif

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
	#ifdef METALLIC_TEXTURE
	varying vMetallicUV: vec2f;
	uniform metallicMatrix: mat4x4f;
	#endif
	#ifdef ROUGHNESS_TEXTURE
	varying vRoughnessUV: vec2f;
	uniform roughnessMatrix: mat4x4f;
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

#if defined(VELOCITY) || defined(VELOCITY_LINEAR)
uniform previousViewProjection: mat4x4f;

varying vCurrentPosition: vec4f;
varying vPreviousPosition: vec4f;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    var positionUpdated: vec3f = vertexInputs.position;
#ifdef HAS_NORMAL_ATTRIBUTE
    var normalUpdated: vec3f = vertexInputs.normal;
#else
    var normalUpdated: vec3f = vec3f(0.0, 0.0, 0.0);
#endif
#ifdef UV1
    var uvUpdated: vec2f = vertexInputs.uv;
#endif
#ifdef UV2
		var uv2Updated: vec2f = vertexInputs.uv2;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

	#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && !defined(BONES_VELOCITY_ENABLED)
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

		let normalWorld: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);
		vertexOutputs.vNormalW = normalize(normalWorld * normalUpdated);
	#else
        #ifdef NORMAL_WORLDSPACE
			vertexOutputs.vNormalV = normalize((finalWorld *  vec4f(normalUpdated, 0.0)).xyz);
		#else
			vertexOutputs.vNormalV = normalize(((scene.view * finalWorld) *  vec4f(normalUpdated, 0.0)).xyz);
		#endif
	#endif

	vertexOutputs.vViewPos = scene.view * worldPos;

	#if (defined(VELOCITY) || defined(VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
		vertexOutputs.vCurrentPosition = scene.viewProjection * finalWorld *  vec4f(positionUpdated, 1.0);

		#if NUM_BONE_INFLUENCERS > 0
			var previousInfluence: mat4x4f;
			previousInfluence = uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[0])] * vertexInputs.matricesWeights[0];
			#if NUM_BONE_INFLUENCERS > 1
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[1])] * vertexInputs.matricesWeights[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 2
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[2])] * vertexInputs.matricesWeights[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 3
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndices[3])] * vertexInputs.matricesWeights[3];
			#endif

			#if NUM_BONE_INFLUENCERS > 4
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[0])] * vertexInputs.matricesWeightsExtra[0];
			#endif
			#if NUM_BONE_INFLUENCERS > 5
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[1])] * vertexInputs.matricesWeightsExtra[1];
			#endif
			#if NUM_BONE_INFLUENCERS > 6
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[2])] * vertexInputs.matricesWeightsExtra[2];
			#endif
			#if NUM_BONE_INFLUENCERS > 7
				previousInfluence += uniforms.mPreviousBones[ i32(vertexInputs.matricesIndicesExtra[3])] * vertexInputs.matricesWeightsExtra[3];
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
			vertexOutputs.vUV = uvUpdated;
			#endif

			#ifdef BUMP_UV1
			vertexOutputs.vBumpUV = (uniforms.bumpMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#endif
			#ifdef REFLECTIVITY_UV1
			vertexOutputs.vReflectivityUV = (uniforms.reflectivityMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#else
				#ifdef METALLIC_UV1
				vertexOutputs.vMetallicUV = (uniforms.metallicMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
				#endif
				#ifdef ROUGHNESS_UV1
				vertexOutputs.vRoughnessUV = (uniforms.roughnessMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
				#endif
			#endif
			#ifdef ALBEDO_UV1
			vertexOutputs.vAlbedoUV = (uniforms.albedoMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
			#endif
		#endif
		#ifdef UV2
			#if defined(ALPHATEST) && defined(ALPHATEST_UV2)
			vertexOutputs.vUV = (uniforms.diffuseMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
			#else
			vertexOutputs.vUV = uv2Updated;
			#endif

			#ifdef BUMP_UV2
			vertexOutputs.vBumpUV = (uniforms.bumpMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
			#endif
			#ifdef REFLECTIVITY_UV2
			vertexOutputs.vReflectivityUV = (uniforms.reflectivityMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
			#else
				#ifdef METALLIC_UV2
				vertexOutputs.vMetallicUV = (uniforms.metallicMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
				#endif
				#ifdef ROUGHNESS_UV2
				vertexOutputs.vRoughnessUV = (uniforms.roughnessMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
				#endif
			#endif
			#ifdef ALBEDO_UV2
			vertexOutputs.vAlbedoUV = (uniforms.albedoMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
			#endif
		#endif
	#endif

	#include<bumpVertex>
}
