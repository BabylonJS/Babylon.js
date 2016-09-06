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

uniform float bumpHeight;

// Water varyings
varying vec3 vRefractionMapTexCoord;
varying vec3 vReflectionMapTexCoord;
varying vec3 vPosition;

#include<clipPlaneFragmentDeclaration>

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
	baseColor = texture2D(normalSampler, vNormalUV);
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
	vec3 normalW = normalize(vNormalW);
	vec2 perturbation = bumpHeight * (baseColor.rg - 0.5);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
	vec2 perturbation = bumpHeight * (vec2(1.0, 1.0) - 0.5);
#endif

#ifdef REFLECTION
	// Water
	vec3 eyeVector = normalize(vEyePosition - vPosition);
	
	vec2 projectedRefractionTexCoords = clamp(vRefractionMapTexCoord.xy / vRefractionMapTexCoord.z + perturbation, 0.0, 1.0);
	vec4 refractiveColor = texture2D(refractionSampler, projectedRefractionTexCoords);
	
	vec2 projectedReflectionTexCoords = clamp(vReflectionMapTexCoord.xy / vReflectionMapTexCoord.z + perturbation, 0.0, 1.0);
	vec4 reflectiveColor = texture2D(reflectionSampler, projectedReflectionTexCoords);
	
	vec3 upVector = vec3(0.0, 1.0, 0.0);
	
	float fresnelTerm = max(dot(eyeVector, upVector), 0.0);
	
	vec4 combinedColor = refractiveColor * fresnelTerm + reflectiveColor * (1.0 - fresnelTerm);
	
	baseColor = colorBlendFactor * waterColor + (1.0 - colorBlendFactor) * combinedColor;
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
	vec3 finalSpecular = specularBase * specularColor;
#else
	vec3 finalSpecular = vec3(0.0);
#endif

	vec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;

	// Composition
	vec4 color = vec4(finalDiffuse + finalSpecular, alpha);

#include<fogFragment>
	
	gl_FragColor = color;
}