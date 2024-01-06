precision highp float;

// Constants
uniform vec4 vEyePosition;
uniform vec4 vDiffuseColor;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

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

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef DIFFUSE
	baseColor = texture2D(diffuseSampler, vDiffuseUV);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

#include<depthPrePass>

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	baseColor.rgb *= vColor.rgb;
#endif

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

#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif    
#include<lightFragment>[0..maxSimultaneousLights]


#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
	alpha *= vColor.a;
#endif

	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;

	// Composition
	vec4 color = vec4(finalDiffuse, alpha);

#include<logDepthFragment>
#include<fogFragment>

	gl_FragColor = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}