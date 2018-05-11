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

#ifdef MIXMAP2
uniform sampler2D diffuse5Sampler;
uniform sampler2D diffuse6Sampler;
uniform sampler2D diffuse7Sampler;
uniform sampler2D diffuse8Sampler;
#endif

uniform vec2 diffuse1Infos;
uniform vec2 diffuse2Infos;
uniform vec2 diffuse3Infos;
uniform vec2 diffuse4Infos;

#ifdef MIXMAP2
uniform vec2 diffuse5Infos;
uniform vec2 diffuse6Infos;
uniform vec2 diffuse7Infos;
uniform vec2 diffuse8Infos;
#endif

#endif

#ifdef BUMP
uniform sampler2D bump1Sampler;
uniform sampler2D bump2Sampler;
uniform sampler2D bump3Sampler;
uniform sampler2D bump4Sampler;

#ifdef MIXMAP2
uniform sampler2D bump5Sampler;
uniform sampler2D bump6Sampler;
uniform sampler2D bump7Sampler;
uniform sampler2D bump8Sampler;
#endif
#endif

// Shadows
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

// Bump
#ifdef BUMP
#extension GL_OES_standard_derivatives : enable
// Thanks to http://www.thetenthplanet.de/archives/1180
mat3 cotangent_frame(vec3 normal, vec3 p, vec2 uv)
{
	// get edge vectors of the pixel triangle
	vec3 dp1 = dFdx(p);
	vec3 dp2 = dFdy(p);
	vec2 duv1 = dFdx(uv);
	vec2 duv2 = dFdy(uv);

	// solve the linear system
	vec3 dp2perp = cross(dp2, normal);
	vec3 dp1perp = cross(normal, dp1);
	vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 binormal = dp2perp * duv1.y + dp1perp * duv2.y;

	// construct a scale-invariant frame 
	float invmax = inversesqrt(max(dot(tangent, tangent), dot(binormal, binormal)));
	return mat3(tangent * invmax, binormal * invmax, normal);
}

vec3 perturbNormal(vec3 viewDir, vec4 mixColor)
{	
	vec3 bump1Color = texture2D(bump1Sampler, vTextureUV * diffuse1Infos).xyz;
	vec3 bump2Color = texture2D(bump2Sampler, vTextureUV * diffuse2Infos).xyz;
	vec3 bump3Color = texture2D(bump3Sampler, vTextureUV * diffuse3Infos).xyz;
	vec3 bump4Color = texture2D(bump4Sampler, vTextureUV * diffuse4Infos).xyz;
	
	bump1Color.rgb *= mixColor.r;
   	bump2Color.rgb = mix(bump1Color.rgb, bump2Color.rgb, mixColor.g);
   	bump3Color.rgb = mix(bump2Color.rgb, bump3Color.rgb, mixColor.b);
	
	vec3 map = mix(bump3Color.rgb, bump4Color.rgb, mixColor.a);

	map = map * 255. / 127. - 128. / 127.;
	mat3 TBN = cotangent_frame(vNormalW * vTextureInfos.y, -viewDir, vTextureUV);
	return normalize(TBN * map);
}
#endif


void main(void) {
	// Clip plane
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 mixColor1 = vec4(1., 1., 1., 1.);
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
	
	// Bump
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
#endif

#ifdef DIFFUSE
	mixColor1 = texture2D(mixMap1Sampler, vTextureUV);

#if defined(BUMP) && defined(DIFFUSE)
	normalW = perturbNormal(viewDirectionW, mixColor1);
#endif

#include<depthPrePass>

	mixColor1.rgb *= vTextureInfos.y;
	
	vec4 diffuse1Color = texture2D(diffuse1Sampler, vTextureUV * diffuse1Infos);
	vec4 diffuse2Color = texture2D(diffuse2Sampler, vTextureUV * diffuse2Infos);
	vec4 diffuse3Color = texture2D(diffuse3Sampler, vTextureUV * diffuse3Infos);
	vec4 diffuse4Color = texture2D(diffuse4Sampler, vTextureUV * diffuse4Infos);
	
	diffuse1Color.rgb *= mixColor1.r;
   	diffuse2Color.rgb = mix(diffuse1Color.rgb, diffuse2Color.rgb, mixColor1.g);
   	diffuse3Color.rgb = mix(diffuse2Color.rgb, diffuse3Color.rgb, mixColor1.b);
	mixColor1.rgb = mix(diffuse3Color.rgb, diffuse4Color.rgb, 1.0 - mixColor1.a);

#ifdef MIXMAP2
	vec4 diffuse5Color = texture2D(diffuse5Sampler, vTextureUV * diffuse5Infos);
	vec4 diffuse6Color = texture2D(diffuse6Sampler, vTextureUV * diffuse6Infos);
	vec4 diffuse7Color = texture2D(diffuse7Sampler, vTextureUV * diffuse7Infos);
	vec4 diffuse8Color = texture2D(diffuse8Sampler, vTextureUV * diffuse8Infos);
#endif
	
#endif

#ifdef VERTEXCOLOR
	mixColor1.rgb *= vColor.rgb;
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

    vec3 finalDiffuse = clamp(diffuseBase * diffuseColor * mixColor1.rgb, 0.0, 1.0);

	// Composition
	vec4 color = vec4(finalDiffuse + finalSpecular, alpha);

#include<fogFragment>

	gl_FragColor = color;
}
