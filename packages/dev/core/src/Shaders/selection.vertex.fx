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
uniform vec2 depthValues;

// Output
#if defined(INSTANCES)
flat varying float vSelectionId;
#endif
varying float vDepthMetric;

void main(void) {
    
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);
    gl_Position = viewProjection * worldPos;

    #ifdef USE_REVERSE_DEPTHBUFFER
        vDepthMetric = ((-gl_Position.z + depthValues.x) / (depthValues.y));
    #else
        vDepthMetric = ((gl_Position.z + depthValues.x) / (depthValues.y));
    #endif

#if defined(INSTANCES)
    vSelectionId = instanceSelectionId;
#endif
}
