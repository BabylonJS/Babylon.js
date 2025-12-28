// Attributes
attribute position: vec3f;
#if defined(INSTANCES)
attribute instanceSelectionId: f32;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms

#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
uniform view: mat4x4f;

// Output
#if defined(INSTANCES)
flat varying vSelectionId: f32;
#endif
varying vViewPosZ: f32;

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    
#define CUSTOM_VERTEX_MAIN_BEGIN

    var positionUpdated: vec3f = input.position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    var worldPos: vec4f = finalWorld * vec4f(positionUpdated, 1.0);
    vertexOutputs.position = uniforms.viewProjection * worldPos;

    vertexOutputs.vViewPosZ = (uniforms.view * worldPos).z;

#if defined(INSTANCES)
    vertexOutputs.vSelectionId = input.instanceSelectionId;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
