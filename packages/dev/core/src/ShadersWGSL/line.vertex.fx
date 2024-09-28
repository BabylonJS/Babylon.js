// Uniforms
#define ADDITIONAL_VERTEX_DECLARATION

#include<instancesDeclaration>

#include<clipPlaneVertexDeclaration>

#include<sceneUboDeclaration>
#include<meshUboDeclaration>

// Attributes
attribute position: vec3f;
attribute normal: vec4f;

uniform width: f32;
uniform aspectRatio: f32;

#include<logDepthDeclaration>

#define CUSTOM_VERTEX_DEFINITIONS

@vertex
fn main(input : VertexInputs) -> FragmentInputs {

#define CUSTOM_VERTEX_MAIN_BEGIN

    #include<instancesVertex>

    var worldViewProjection: mat4x4f = scene.viewProjection * finalWorld;

	var viewPosition: vec4f = worldViewProjection *  vec4f(input.position, 1.0);
	var viewPositionNext: vec4f = worldViewProjection *  vec4f(input.normal.xyz, 1.0);

	var currentScreen: vec2f = viewPosition.xy / viewPosition.w;
	var nextScreen: vec2f = viewPositionNext.xy / viewPositionNext.w;

	currentScreen = vec2f(currentScreen.x * uniforms.aspectRatio, currentScreen.y);
	nextScreen = vec2f(nextScreen.x * uniforms.aspectRatio, nextScreen.y);

	var dir: vec2f = normalize(nextScreen - currentScreen);
	var normalDir: vec2f =  vec2f(-dir.y, dir.x);

	normalDir *= uniforms.width / 2.0;
	normalDir = vec2f(normalDir.x / uniforms.aspectRatio, normalDir.y);

	var offset: vec4f =  vec4f(normalDir * input.normal.w, 0.0, 0.0);
	vertexOutputs.position = viewPosition + offset;

#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
    var worldPos: vec4f = finalWorld * vec4f(input.position, 1.0);
    #include<clipPlaneVertex>
#endif

	#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END

}