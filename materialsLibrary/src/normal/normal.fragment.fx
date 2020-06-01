precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef LIGHTING
// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0]
#include<__decl__lightFragment>[1]
#include<__decl__lightFragment>[2]
#include<__decl__lightFragment>[3]


#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#endif

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Deferred
#include<deferredDeclaration>[SCENE_MRT_COUNT]

void main(void) {
#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

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

#ifdef NORMAL
    baseColor = mix(baseColor, vec4(vNormalW, 1.0), 0.5);
#endif

	// Normal
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

	// Lighting

#ifdef LIGHTING
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
	float shadow = 1.;
    float glossiness = 0.;
    
#include<lightFragment>[0]
#include<lightFragment>[1]
#include<lightFragment>[2]
#include<lightFragment>[3]
	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;
#else
	vec3 finalDiffuse =  baseColor.rgb;
#endif

	// Composition
	vec4 color = vec4(finalDiffuse, alpha);

#include<fogFragment>

	gl_FragColor = color;

#include<deferredDefaultOutput>

}