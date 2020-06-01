precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

// Input
uniform vec4 furColor;
uniform float furLength;
varying vec3 vPositionW;
varying float vfur_length;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

// Fur uniforms
#ifdef HIGHLEVEL
uniform float furOffset;
uniform float furOcclusion;
uniform sampler2D furTexture;

varying vec2 vFurUV;
#endif

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<fogFragmentDeclaration>
#include<clipPlaneFragmentDeclaration>

// Deferred
#include<deferredDeclaration>[SCENE_MRT_COUNT]

float Rand(vec3 rv) {
	float x = dot(rv, vec3(12.9898,78.233, 24.65487));
	return fract(sin(x) * 43758.5453);
}

void main(void) {
	// Clip plane
	#include<clipPlaneFragment>
	
	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = furColor;
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef DIFFUSE
	baseColor *= texture2D(diffuseSampler, vDiffuseUV);
    
#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

#include<depthPrePass>

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

	#ifdef HIGHLEVEL
	// Fur
	vec4 furTextureColor = texture2D(furTexture, vec2(vFurUV.x, vFurUV.y));
	
	if (furTextureColor.a <= 0.0 || furTextureColor.g < furOffset) {
		discard;
	}
	
    float occlusion = mix(0.0, furTextureColor.b * 1.2, furOffset);
    
	baseColor = vec4(baseColor.xyz * max(occlusion, furOcclusion), 1.1 - furOffset);
	#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;

	float shadow = 1.;
	float glossiness = 0.;

#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif

	#include<lightFragment>[0..maxSimultaneousLights]

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

    vec3 finalDiffuse = clamp(diffuseBase.rgb * baseColor.rgb, 0.0, 1.0);

	// Composition
	#ifdef HIGHLEVEL
	vec4 color = vec4(finalDiffuse, alpha);
	#else
	float r = vfur_length / furLength * 0.5;
	vec4 color = vec4(finalDiffuse * (0.5 + r), alpha);
	#endif
	
#include<fogFragment>

	gl_FragColor = color;

#include<deferredDefaultOutput>

}