precision highp float;

// Constants
uniform vec4 vEyePosition;
uniform float alpha;
uniform vec3 shadowColor;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

#include<clipPlaneFragmentDeclaration>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

	// Normal
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
	float shadow = 1.;
    float glossiness = 0.;
    float aggShadow = 0.;
	float numLights = 0.;
    
#include<lightFragment>[0..1]

	// Composition
	vec4 color = vec4(shadowColor, (1.0 - clamp(shadow, 0., 1.)) * alpha);

#include<logDepthFragment>
#include<fogFragment>

	gl_FragColor = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}