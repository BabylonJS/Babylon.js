// Attribute
attribute position: vec3f;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<clipPlaneVertexDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform viewProjection: mat4x4f;

varying vPosition: vec4f;

#ifdef UV1
attribute uv: vec2f;
#endif

#ifdef UV2
attribute uv2: vec2f;
#endif

#ifdef DIFFUSE
	varying vUVDiffuse: vec2f;
	uniform diffuseMatrix: mat4x4f;
#endif

#ifdef OPACITY
	varying vUVOpacity: vec2f;
	uniform opacityMatrix: mat4x4f;
#endif

#ifdef EMISSIVE
	varying vUVEmissive: vec2f;
	uniform emissiveMatrix: mat4x4f;
#endif

#ifdef VERTEXALPHA
	attribute color: vec4f;
	varying vColor: vec4f;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
	var positionUpdated: vec3f = vertexInputs.position;
#ifdef UV1
    var uvUpdated: vec2f = vertexInputs.uv;
#endif
#ifdef UV2
		var uv2Updated: vec2f = vertexInputs.uv2;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

var worldPos: vec4f = finalWorld *  vec4f(positionUpdated, 1.0);

#ifdef CUBEMAP
	vertexOutputs.vPosition = worldPos;
	vertexOutputs.position = uniforms.viewProjection * finalWorld *  vec4f(vertexInputs.position, 1.0);
#else
	vertexOutputs.vPosition = uniforms.viewProjection * worldPos;
	vertexOutputs.position = vertexOutputs.vPosition;
#endif

#ifdef DIFFUSE
	#ifdef DIFFUSEUV1
		vertexOutputs.vUVDiffuse =  (uniforms.diffuseMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
	#endif
	#ifdef DIFFUSEUV2
		vertexOutputs.vUVDiffuse =  (uniforms.diffuseMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
	#endif
#endif

#ifdef OPACITY
	#ifdef OPACITYUV1
		vertexOutputs.vUVOpacity =  (uniforms.opacityMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
	#endif
	#ifdef OPACITYUV2
		vertexOutputs.vUVOpacity =  (uniforms.opacityMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
	#endif
#endif

#ifdef EMISSIVE
	#ifdef EMISSIVEUV1
		vertexOutputs.vUVEmissive =  (uniforms.emissiveMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
	#endif
	#ifdef EMISSIVEUV2
		vertexOutputs.vUVEmissive =  (uniforms.emissiveMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
	#endif
#endif

#ifdef VERTEXALPHA
    vertexOutputs.vColor = vertexInputs.color;
#endif

#include<clipPlaneVertex>

}