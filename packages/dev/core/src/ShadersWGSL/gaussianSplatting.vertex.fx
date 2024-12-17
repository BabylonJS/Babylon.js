#include<sceneUboDeclaration>
#include<meshUboDeclaration>

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
    let dir: vec3f = normalize(worldPos.xyz - scene.vEyePosition.xyz);
    vertexOutputs.vColor = vec4f(computeSH(splat, splat.color.xyz, dir), 1.0);
#else
    vertexOutputs.vColor = splat.color;
#endif

    vertexOutputs.position = gaussianSplatting(input.position, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, mesh.world, scene.view, scene.projection, uniforms.focal, uniforms.invViewport);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
