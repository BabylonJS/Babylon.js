// Attribute
attribute position: vec3f;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniform
#include<instancesDeclaration>

uniform viewProjection: mat4x4f;
uniform depthValues: vec2f;

#if defined(ALPHATEST) || defined(NEED_UV)
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
    var positionUpdated: vec3f = vertexInputs.position;
#if (defined(ALPHATEST) || defined(NEED_UV)) && defined(UV1)
    var uvUpdated: vec2f = vertexInputs.uv;
#endif
#if (defined(ALPHATEST) || defined(NEED_UV)) && defined(UV2)
    var uv2Updated: vec2f = vertexInputs.uv2;
#endif

#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>

#include<bonesVertex>
#include<bakedVertexAnimation>

    vertexOutputs.position = uniforms.viewProjection * finalWorld * vec4f(positionUpdated, 1.0);

#if defined(ALPHATEST) || defined(BASIC_RENDER)
#ifdef UV1
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(uvUpdated, 1.0, 0.0)).xy;
#endif
#ifdef UV2
    vertexOutputs.vUV = (uniforms.diffuseMatrix * vec4f(uv2Updated, 1.0, 0.0)).xy;
#endif
#endif
}
