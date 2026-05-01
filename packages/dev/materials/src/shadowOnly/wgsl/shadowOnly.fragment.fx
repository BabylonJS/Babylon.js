// Constants
#include<sceneUboDeclaration>
uniform alpha: f32;
uniform shadowColor: vec3f;

// Input
varying vPositionW: vec3f;

#ifdef NORMAL
varying vNormalW: vec3f;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<lightUboDeclaration>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

#include<clipPlaneFragmentDeclaration>

#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH > 0
varying vViewDepth: f32;
#endif

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

	var viewDirectionW: vec3f = normalize(scene.vEyePosition.xyz - fragmentInputs.vPositionW);

	// Normal
#ifdef NORMAL
	var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
	var normalW: vec3f =  vec3f(1.0, 1.0, 1.0);
#endif

	// Lighting
	var diffuseBase: vec3f =  vec3f(0., 0., 0.);
    var info: lightingInfo;
	var shadow: f32 = 1.;
    var glossiness: f32 = 0.;
    var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#include<lightFragment>[0..1]

	// Composition
	var color: vec4f =  vec4f(uniforms.shadowColor, (1.0 - clamp(shadow, 0., 1.)) * uniforms.alpha);

#include<logDepthFragment>
#include<fogFragment>

	fragmentOutputs.color = color;

#define CUSTOM_FRAGMENT_MAIN_END
}
