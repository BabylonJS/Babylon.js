// Attributes
attribute position: vec3f;
#ifdef INSTANCES
attribute instanceSelectionId: f32;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<clipPlaneVertexDeclaration>

// Uniforms

#include<instancesDeclaration>
uniform viewProjection: mat4x4f;

#ifdef STORE_CAMERASPACE_Z
uniform view: mat4x4f;
#else
uniform depthValues: vec2f;
#endif

// Output
#ifdef INSTANCES
flat varying vSelectionId: f32;
#endif

#ifdef STORE_CAMERASPACE_Z
varying vViewPosZ: f32;
#else
varying vDepthMetric: f32;
#endif

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

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    
#define CUSTOM_VERTEX_MAIN_BEGIN

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
    var worldPos: vec4f = finalWorld * vec4f(positionUpdated, 1.0);
    vertexOutputs.position = uniforms.viewProjection * worldPos;

#ifdef ALPHATEST
#ifdef UV1
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(uvUpdated, 1.0, 0.0)).xy;
#endif
#ifdef UV2
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(uv2Updated, 1.0, 0.0)).xy;
#endif
#endif

    #ifdef STORE_CAMERASPACE_Z
        vertexOutputs.vViewPosZ = (uniforms.view * worldPos).z;
    #else
        #ifdef USE_REVERSE_DEPTHBUFFER
            vertexOutputs.vDepthMetric = ((-vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
        #else
            vertexOutputs.vDepthMetric = ((vertexOutputs.position.z + uniforms.depthValues.x) / (uniforms.depthValues.y));
        #endif
    #endif

#ifdef INSTANCES
    vertexOutputs.vSelectionId = vertexInputs.instanceSelectionId;
#endif

#include<clipPlaneVertex>

#define CUSTOM_VERTEX_MAIN_END
}
