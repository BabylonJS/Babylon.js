#include<sceneUboDeclaration>
#include<meshUboDeclaration>
attribute splatIndex0: vec4f;
attribute splatIndex1: vec4f;
attribute splatIndex2: vec4f;
attribute splatIndex3: vec4f;

attribute position: vec3f;

uniform invViewport: vec2f;
uniform dataTextureSize: vec2f;
uniform focal: vec2f;
uniform kernelSize: f32;

var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;

varying vPosition: vec2f;
varying vColor: vec4f;

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

    let splatIndex: f32 = getSplatIndex(i32(input.position.z + 0.5), input.splatIndex0, input.splatIndex1, input.splatIndex2, input.splatIndex3);

    var splat: Splat = readSplat(splatIndex, uniforms.dataTextureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);
    let worldPos: vec4f = mesh.world * vec4f(splat.center.xyz, 1.0);
    vertexOutputs.vPosition = input.position.xy;
    vertexOutputs.vColor = splat.color;
    vertexOutputs.position = gaussianSplatting(input.position.xy, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, mesh.world, scene.view, scene.projection, uniforms.focal, uniforms.invViewport, uniforms.kernelSize);
}