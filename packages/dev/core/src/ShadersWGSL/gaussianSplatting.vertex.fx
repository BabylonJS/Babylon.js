#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<helperFunctions>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute splatIndex: f32;
attribute position: vec2f;

// Uniforms
uniform invViewport: vec2f;
uniform dataTextureSize: vec2f;
uniform focal: vec2f;
uniform kernelSize: f32;

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

    var splat: Splat = readSplat(input.splatIndex, uniforms.dataTextureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);

    let worldPos: vec4f = mesh.world * vec4f(splat.center.xyz, 1.0);

    vertexOutputs.vPosition = input.position;

#if SH_DEGREE > 0
    let worldRot: mat3x3f =  mat3x3f(mesh.world[0].xyz, mesh.world[1].xyz, mesh.world[2].xyz);
    let normWorldRot: mat3x3f = inverseMat3(worldRot);

    var dir: vec3f = normalize(normWorldRot * (worldPos.xyz - scene.vEyePosition.xyz));
    dir *= vec3f(1.,1.,-1.); // convert to Babylon Space
    vertexOutputs.vColor = vec4f(computeSH(splat, splat.color.xyz, dir), splat.color.w);
#else
    vertexOutputs.vColor = splat.color;
#endif

    vertexOutputs.position = gaussianSplatting(input.position, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, mesh.world, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
