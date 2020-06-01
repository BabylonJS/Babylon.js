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

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

// Samplers
#ifdef DIFFUSE
varying vec2 vTextureUV;
uniform sampler2D mixMap1Sampler;
uniform vec2 vTextureInfos;

#ifdef MIXMAP2
uniform sampler2D mixMap2Sampler;
#endif

uniform sampler2D diffuse1Sampler;
uniform sampler2D diffuse2Sampler;
uniform sampler2D diffuse3Sampler;
uniform sampler2D diffuse4Sampler;

uniform vec2 diffuse1Infos;
uniform vec2 diffuse2Infos;
uniform vec2 diffuse3Infos;
uniform vec2 diffuse4Infos;

#ifdef MIXMAP2
uniform sampler2D diffuse5Sampler;
uniform sampler2D diffuse6Sampler;
uniform sampler2D diffuse7Sampler;
uniform sampler2D diffuse8Sampler;

uniform vec2 diffuse5Infos;
uniform vec2 diffuse6Infos;
uniform vec2 diffuse7Infos;
uniform vec2 diffuse8Infos;
#endif

#endif

// Shadows
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Deferred
#include<deferredDeclaration>[SCENE_MRT_COUNT]

void main(void) {
	// Clip plane
	#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 finalMixColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;

#ifdef MIXMAP2
	vec4 mixColor2 = vec4(1., 1., 1., 1.);
#endif
	
#ifdef SPECULARTERM
	float glossiness = vSpecularColor.a;
	vec3 specularColor = vSpecularColor.rgb;
#else
	float glossiness = 0.;
#endif

	// Alpha
	float alpha = vDiffuseColor.a;
	
	// Normal
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

#ifdef DIFFUSE
	vec4 mixColor = texture2D(mixMap1Sampler, vTextureUV);

#include<depthPrePass>

	mixColor.rgb *= vTextureInfos.y;
	
	vec4 diffuse1Color = texture2D(diffuse1Sampler, vTextureUV * diffuse1Infos);
	vec4 diffuse2Color = texture2D(diffuse2Sampler, vTextureUV * diffuse2Infos);
	vec4 diffuse3Color = texture2D(diffuse3Sampler, vTextureUV * diffuse3Infos);
	vec4 diffuse4Color = texture2D(diffuse4Sampler, vTextureUV * diffuse4Infos);
	
	diffuse1Color.rgb *= mixColor.r;
   	diffuse2Color.rgb = mix(diffuse1Color.rgb, diffuse2Color.rgb, mixColor.g);
   	diffuse3Color.rgb = mix(diffuse2Color.rgb, diffuse3Color.rgb, mixColor.b);
	finalMixColor.rgb = mix(diffuse3Color.rgb, diffuse4Color.rgb, 1.0 - mixColor.a);

#ifdef MIXMAP2
	mixColor = texture2D(mixMap2Sampler, vTextureUV);
	mixColor.rgb *= vTextureInfos.y;

	vec4 diffuse5Color = texture2D(diffuse5Sampler, vTextureUV * diffuse5Infos);
	vec4 diffuse6Color = texture2D(diffuse6Sampler, vTextureUV * diffuse6Infos);
	vec4 diffuse7Color = texture2D(diffuse7Sampler, vTextureUV * diffuse7Infos);
	vec4 diffuse8Color = texture2D(diffuse8Sampler, vTextureUV * diffuse8Infos);

	diffuse5Color.rgb = mix(finalMixColor.rgb, diffuse5Color.rgb, mixColor.r);
   	diffuse6Color.rgb = mix(diffuse5Color.rgb, diffuse6Color.rgb, mixColor.g);
   	diffuse7Color.rgb = mix(diffuse6Color.rgb, diffuse7Color.rgb, mixColor.b);
	finalMixColor.rgb = mix(diffuse7Color.rgb, diffuse8Color.rgb, 1.0 - mixColor.a);
#endif
	
#endif

#ifdef VERTEXCOLOR
	finalMixColor.rgb *= vColor.rgb;
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
	float shadow = 1.;
	
#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
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

    vec3 finalDiffuse = clamp(diffuseBase * diffuseColor * finalMixColor.rgb, 0.0, 1.0);

	// Composition
	vec4 color = vec4(finalDiffuse + finalSpecular, alpha);

#include<fogFragment>

	gl_FragColor = color;

#include<deferredDefaultOutput>

}
