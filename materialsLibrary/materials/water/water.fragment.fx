#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Lights
#include<lightFragmentDeclaration>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#ifdef BUMP
varying vec2 vNormalUV;
uniform sampler2D normalSampler;
uniform vec2 vNormalInfos;
#endif

uniform sampler2D refractionSampler;
uniform sampler2D reflectionSampler;

// Water uniforms
const float LOG2 = 1.442695;

uniform vec3 cameraPosition;

uniform vec4 waterColor;
uniform float colorBlendFactor;

uniform vec4 waterColor2;
uniform float colorBlendFactor2;

uniform float bumpHeight;

// Water varyings
varying vec3 vRefractionMapTexCoord;
varying vec3 vReflectionMapTexCoord;
varying vec3 vPosition;

#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
	// Clip plane
    #include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef BUMP
    //smaller bumps superimposed (better moving waves, no "conveyor belt" look):
	baseColor = (texture2D(normalSampler, vNormalUV) + texture2D(normalSampler,vec2(-vNormalUV.y*0.33,vNormalUV.x*0.33)))/2.0;
	vec3 bumpColor = baseColor.rgb;

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	baseColor.rgb *= vNormalInfos.y;
#else
	vec3 bumpColor = vec3(1.0);
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Bump
#ifdef NORMAL
    //reflection angle is also perturbed
	vec2 perturbation = bumpHeight * (baseColor.rg - 0.5);
	vec3 normalW = normalize(vNormalW + vec3(perturbation.x*3.0,perturbation.y*3.0,0.0));
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
	vec2 perturbation = bumpHeight * (vec2(1.0, 1.0) - 0.5);
#endif

#ifdef REFLECTION
	// Water
	vec3 eyeVector = normalize(vEyePosition - vPosition);
	
	vec2 projectedRefractionTexCoords = clamp(vRefractionMapTexCoord.xy / vRefractionMapTexCoord.z + perturbation, 0.0, 1.0);
	vec4 refractiveColor = texture2D(refractionSampler, projectedRefractionTexCoords);
    refractiveColor = colorBlendFactor*waterColor + (1.0-colorBlendFactor)*refractiveColor;

	vec2 projectedReflectionTexCoords = clamp(vReflectionMapTexCoord.xy / vReflectionMapTexCoord.z + perturbation, 0.0, 1.0);
	vec4 reflectiveColor = texture2D(reflectionSampler, projectedReflectionTexCoords);
	reflectiveColor = colorBlendFactor2*waterColor2 + (1.0-colorBlendFactor2)*reflectiveColor;

	vec3 upVector = vec3(0.0, 1.0, 0.0);

	float fresnelTerm = min(0.95, pow(max(dot(eyeVector, upVector), 0.0),3.0));

	vec4 combinedColor = refractiveColor * fresnelTerm + reflectiveColor * (1.0 - fresnelTerm);
	
	baseColor = combinedColor;
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
	float shadow = 1.;
    
#ifdef SPECULARTERM
	float glossiness = vSpecularColor.a;
	vec3 specularBase = vec3(0., 0., 0.);
    vec3 specularColor = vSpecularColor.rgb;
#else
	float glossiness = 0.;
#endif
    
#include<lightFragment>[0..maxSimultaneousLights]

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

#ifdef SPECULARTERM
    //specular glare: more concentrated (no flat surface, specular is only for hard lights)
	vec3 finalSpecular = specularBase * 2.0 * specularColor * specularColor;
#else
	vec3 finalSpecular = vec3(0.0);
#endif

	vec3 finalDiffuse = clamp(baseColor.rgb, 0.0, 1.0);

	// Composition
	vec4 color = vec4(finalDiffuse + finalSpecular, alpha);

#include<logDepthFragment>
#include<fogFragment>
	
	gl_FragColor = color;
}