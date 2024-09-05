// Attribute
attribute position: vec3f;
attribute normal: vec3f;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<clipPlaneVertexDeclaration>

// Uniform
uniform offset: f32;

#include<instancesDeclaration>

uniform viewProjection: mat4x4f;

#ifdef ALPHATEST
varying vUV: vec2f;
uniform diffuseMatrix: mat4x4f; 
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif
#include<logDepthDeclaration>


#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    var positionUpdated: vec3f = vertexInputs.position;
    var normalUpdated: vec3f = vertexInputs.normal;
#ifdef UV1
    var uvUpdated: vec2f = vertexInputs.uv;
#endif
    #include<morphTargetsVertexGlobal>
    #include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

	var offsetPosition: vec3f = positionUpdated + (normalUpdated * uniforms.offset);

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

    var worldPos: vec4f = finalWorld * vec4f(offsetPosition, 1.0);

    vertexOutputs.position = uniforms.viewProjection * worldPos;

#ifdef ALPHATEST
#ifdef UV1
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(uvUpdated, 1.0, 0.0)).xy;
#endif
#ifdef UV2
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(vertexInputs.uv2, 1.0, 0.0)).xy;
#endif
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
}
