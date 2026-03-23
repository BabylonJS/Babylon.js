// Attributes
attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceMeshID: f32;
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
flat varying vMeshID: f32;
#endif

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    
    var positionUpdated: vec3f = vertexInputs.position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    var worldPos: vec4f = finalWorld * vec4f(positionUpdated, 1.0);
	vertexOutputs.position = uniforms.viewProjection * worldPos;

#if defined(INSTANCES)
    vertexOutputs.vMeshID = vertexInputs.instanceMeshID;
#endif
}
