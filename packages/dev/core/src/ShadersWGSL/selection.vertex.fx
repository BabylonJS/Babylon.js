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
uniform depthValues: vec2f;

// Output
#if defined(INSTANCES)
flat varying vSelectionId: f32;
#endif
varying vDepthMetric: f32;

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    var worldPos: vec4f = finalWorld * vec4f(input.position, 1.0);
    vertexOutputs.position = uniforms.viewProjection * worldPos;

    #ifdef USE_REVERSE_DEPTHBUFFER
        vertexOutputs.vDepthMetric = ((-vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
    #else
        vertexOutputs.vDepthMetric = ((vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
    #endif

#if defined(INSTANCES)
    vertexOutputs.vSelectionId = input.instanceSelectionId;
#endif
}
