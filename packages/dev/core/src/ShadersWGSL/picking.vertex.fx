// Attributes
attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceMeshID: vec4f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms

#include<instancesDeclaration>
uniform viewProjection: mat4x4f;

// Output
#if defined(INSTANCES)
varying vMeshID: vec4f;
#endif

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    var worldPos: vec4f = finalWorld * vec4f(input.position, 1.0);
	vertexOutputs.position = uniforms.viewProjection * worldPos;

#if defined(INSTANCES)
    vertexOutputs.vMeshID = input.instanceMeshID;
#endif
}