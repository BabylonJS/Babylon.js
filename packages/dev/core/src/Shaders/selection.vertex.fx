// Attributes
attribute vec3 position;
#if defined(INSTANCES)
attribute float instanceSelectionId;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms

#include<instancesDeclaration>
uniform mat4 viewProjection;
uniform mat4 view;

// Output
#if defined(INSTANCES)
flat varying float vSelectionId;
#endif
varying float vViewPosZ;

#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {
    
#define CUSTOM_VERTEX_MAIN_BEGIN

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);
    gl_Position = viewProjection * worldPos;

    vViewPosZ = (view * worldPos).z;

#if defined(INSTANCES)
    vSelectionId = instanceSelectionId;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
