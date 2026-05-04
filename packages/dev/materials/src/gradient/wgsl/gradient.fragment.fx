uniform vEyePosition: vec4f;

// Gradient variables
uniform topColor: vec4f;
uniform bottomColor: vec4f;
uniform offset: f32;
uniform scale: f32;
uniform smoothness: f32;

// Input
varying vPositionW: vec3f;
varying vPosition: vec3f;

#ifdef NORMAL
varying vNormalW: vec3f;
#endif

#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<lightUboDeclaration>[0]
#include<lightUboDeclaration>[1]
#include<lightUboDeclaration>[2]
#include<lightUboDeclaration>[3]


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

	var viewDirectionW: vec3f = normalize(uniforms.vEyePosition.xyz - fragmentInputs.vPositionW);

    var h: f32 = fragmentInputs.vPosition.y * uniforms.scale + uniforms.offset;
    var mysmoothness: f32 = clamp(uniforms.smoothness, 0.01, max(uniforms.smoothness, 10.));

    var baseColor: vec4f = mix(uniforms.bottomColor, uniforms.topColor, vec4f(max(pow(max(h, 0.0), mysmoothness), 0.0)));

	// Base color
	var diffuseColor: vec3f = baseColor.rgb;

	// Alpha
	var alpha: f32 = baseColor.a;


#ifdef ALPHATEST
	if (baseColor.a < 0.4) {
        discard;
    }
#endif

#include<depthPrePass>

#ifdef VERTEXCOLOR
	baseColor = vec4f(baseColor.rgb * fragmentInputs.vColor.rgb, baseColor.a);
#endif

	// Bump
#ifdef NORMAL
	var normalW: vec3f = normalize(fragmentInputs.vNormalW);
#else
	var normalW: vec3f =  vec3f(1.0, 1.0, 1.0);
#endif

	// Lighting
#ifdef EMISSIVE
	var diffuseBase: vec3f = baseColor.rgb;
#else
	var diffuseBase: vec3f =  vec3f(0., 0., 0.);
#endif
    var info: lightingInfo;
	var shadow: f32 = 1.;
    var glossiness: f32 = 0.;
	var aggShadow: f32 = 0.;
	var numLights: f32 = 0.;

#include<lightFragment>[0..maxSimultaneousLights]

#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= fragmentInputs.vColor.a;
#endif

	var finalDiffuse: vec3f = clamp(diffuseBase * diffuseColor, vec3f(0.0), vec3f(1.0)) * baseColor.rgb;

	// Composition
	var color: vec4f =  vec4f(finalDiffuse, alpha);

#include<logDepthFragment>
#include<fogFragment>

	fragmentOutputs.color = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}
