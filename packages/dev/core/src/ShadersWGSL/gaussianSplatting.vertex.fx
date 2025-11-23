#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<helperFunctions>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute splatIndex0: vec4f;
attribute splatIndex1: vec4f;
attribute splatIndex2: vec4f;
attribute splatIndex3: vec4f;
attribute position: vec3f;

// Uniforms
uniform invViewport: vec2f;
uniform dataTextureSize: vec2f;
uniform focal: vec2f;
uniform kernelSize: f32;
uniform eyePosition: vec3f;
uniform viewDirectionFactor: vec3f;

// textures
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;
#if SH_DEGREE > 0
var shTexture0: texture_2d<u32>;
#endif
#if SH_DEGREE > 1
var shTexture1: texture_2d<u32>;
#endif
#if SH_DEGREE > 2
var shTexture2: texture_2d<u32>;
#endif
// Output
varying vColor: vec4f;
varying vPosition: vec2f;

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

    let splatIndex: f32 = getSplatIndex(i32(input.position.z + 0.5), input.splatIndex0, input.splatIndex1, input.splatIndex2, input.splatIndex3);

    var splat: Splat = readSplat(splatIndex, uniforms.dataTextureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);

    let worldPos: vec4f = mesh.world * vec4f(splat.center.xyz, 1.0);

    vertexOutputs.vPosition = input.position.xy;

#if SH_DEGREE > 0
    let worldRot: mat3x3f =  mat3x3f(mesh.world[0].xyz, mesh.world[1].xyz, mesh.world[2].xyz);
    let normWorldRot: mat3x3f = inverseMat3(worldRot);

    var dir: vec3f = normalize(normWorldRot * (worldPos.xyz - uniforms.eyePosition.xyz));
    dir *= uniforms.viewDirectionFactor;
    vertexOutputs.vColor = vec4f(splat.color.xyz + computeSH(splat, dir), splat.color.w);
#else
    vertexOutputs.vColor = splat.color;
#endif

    vertexOutputs.position = gaussianSplatting(input.position.xy, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, mesh.world, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
