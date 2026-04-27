// Attribute
attribute position: vec3f;

#ifdef NORMAL
    attribute normal: vec3f;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms
// #include<instancesDeclaration>
#ifdef INSTANCES
	attribute world0: vec4f;
	attribute world1: vec4f;
	attribute world2: vec4f;
	attribute world3: vec4f;
#endif

#include<helperFunctions>

#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#ifdef ALPHATEXTURE
varying vUV: vec2f;
uniform diffuseMatrix: mat4x4f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#endif

#include<shadowMapVertexExtraDeclaration>

#include<clipPlaneVertexDeclaration>


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
#ifdef NORMAL
	var normalUpdated: vec3f = vertexInputs.normal;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

var worldPos: vec4f = finalWorld *  vec4f(positionUpdated, 1.0);

#ifdef NORMAL
    var normWorldSM: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);

    #if defined(INSTANCES) && defined(THIN_INSTANCES)
        var vNormalW: vec3f = normalUpdated /  vec3f(dot(normWorldSM[0], normWorldSM[0]), dot(normWorldSM[1], normWorldSM[1]), dot(normWorldSM[2], normWorldSM[2]));
        vNormalW = normalize(normWorldSM * vNormalW);
    #else
        #ifdef NONUNIFORMSCALING
            normWorldSM = transposeMat3(inverseMat3(normWorldSM));
        #endif

        var vNormalW: vec3f = normalize(normWorldSM * normalUpdated);
    #endif
#endif

#include<shadowMapVertexNormalBias>

// Projection.
vertexOutputs.position = scene.viewProjection * worldPos;

#include<shadowMapVertexMetric>

#ifdef ALPHATEXTURE
    #ifdef UV1
        vertexOutputs.vUV =  (uniforms.diffuseMatrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
    #endif
    #ifdef UV2
        vertexOutputs.vUV =  (uniforms.diffuseMatrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
    #endif
#endif

#include<clipPlaneVertex>

}