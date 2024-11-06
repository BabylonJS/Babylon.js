#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute splatIndex: f32;
attribute position: vec2f;

// Uniforms
uniform invViewport: vec2f;
uniform textureSize: vec2f;
uniform focal: vec2f;

uniform view: mat4x4f;
uniform projection: mat4x4f;
uniform world: mat4x4f;

// textures
var covariancesATexture: texture_2d<f32>;
var covariancesBTexture: texture_2d<f32>;
var centersTexture: texture_2d<f32>;
var colorsTexture: texture_2d<f32>;

// Output
varying vColor: vec4f;
varying vPosition: vec2f;

#include<gaussianSplatting>

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

    var splat: Splat = readSplat(input.splatIndex, uniforms.textureSize);
    var covA: vec3f = splat.covA.xyz;
    var covB: vec3f = vec3f(splat.covA.w, splat.covB.xy);

    let worldPos: vec4f = uniforms.world * vec4f(splat.center.xyz, 1.0);

    vertexOutputs.vColor = splat.color;
    vertexOutputs.vPosition = input.position;
    vertexOutputs.position = gaussianSplatting(input.position, worldPos.xyz, vec2f(1.0, 1.0), covA, covB, uniforms.world, uniforms.view, uniforms.projection, uniforms.focal, uniforms.textureSize);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>

	return vertexOutputs;
}
