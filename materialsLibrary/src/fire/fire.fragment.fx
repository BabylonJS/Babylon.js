precision highp float;

// Constants
uniform vec3 vEyePosition;

// Input
varying vec3 vPositionW;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

// Fire
uniform sampler2D distortionSampler;
uniform sampler2D opacitySampler;

#ifdef DIFFUSE
varying vec2 vDistortionCoords1;
varying vec2 vDistortionCoords2;
varying vec2 vDistortionCoords3;
#endif

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

vec4 bx2(vec4 x)
{
   return vec4(2.0) * x - vec4(1.0);
}

void main(void) {
	// Clip plane
#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);

	// Alpha
	float alpha = 1.0;

#ifdef DIFFUSE
	// Fire
	const float distortionAmount0  = 0.092;
	const float distortionAmount1  = 0.092;
	const float distortionAmount2  = 0.092;
	
	vec2 heightAttenuation = vec2(0.3, 0.39);
	
	vec4 noise0 = texture2D(distortionSampler, vDistortionCoords1);
	vec4 noise1 = texture2D(distortionSampler, vDistortionCoords2);
	vec4 noise2 = texture2D(distortionSampler, vDistortionCoords3);
	
	vec4 noiseSum = bx2(noise0) * distortionAmount0 + bx2(noise1) * distortionAmount1 + bx2(noise2) * distortionAmount2;
	
	vec4 perturbedBaseCoords = vec4(vDiffuseUV, 0.0, 1.0) + noiseSum * (vDiffuseUV.y * heightAttenuation.x + heightAttenuation.y);
	
	vec4 opacityColor = texture2D(opacitySampler, perturbedBaseCoords.xy);
	
#ifdef ALPHATEST
	if (opacityColor.r < 0.1)
		discard;
#endif

#include<depthPrePass>
	
	baseColor = texture2D(diffuseSampler, perturbedBaseCoords.xy) * 2.0;
	baseColor *= opacityColor;

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Lighting
	vec3 diffuseBase = vec3(1.0, 1.0, 1.0);

#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

	// Composition
	vec4 color = vec4(baseColor.rgb, alpha);

#include<fogFragment>

	gl_FragColor = color;
}