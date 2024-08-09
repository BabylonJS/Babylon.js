// Attribute
attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<clipPlaneVertexDeclaration>

// Uniform
#include<instancesDeclaration>

uniform viewProjection: mat4x4f;
uniform depthValues: vec2f;

#if defined(ALPHATEST) || defined(NEED_UV)
varying vUV: vec2f;
uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif

#ifdef STORE_CAMERASPACE_Z
	uniform view: mat4x4f;
	varying vViewPos: vec4f;
#endif

varying vDepthMetric: f32;


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    var positionUpdated: vec3f = input.position;
#ifdef UV1
    var uvUpdated: vec2f = input.uv;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

#include<bonesVertex>
#include<bakedVertexAnimation>

	var worldPos: vec4f = finalWorld *  vec4f(positionUpdated, 1.0);
	#include<clipPlaneVertex>
	vertexOutputs.position = uniforms.viewProjection * worldPos;

	#ifdef STORE_CAMERASPACE_Z
		vertexOutputs.vViewPos = uniforms.view * worldPos;
	#else
		#ifdef USE_REVERSE_DEPTHBUFFER
			vertexOutputs.vDepthMetric = ((-vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
		#else
			vertexOutputs.vDepthMetric = ((vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
		#endif
	#endif

#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
	vertexOutputs.vUV =  (uniforms.diffuseMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
#endif
#ifdef UV2
	vertexOutputs.vUV =  (uniforms.diffuseMatrix *  vec4f(input.uv2, 1.0, 0.0)).xy;
#endif
#endif

}
