#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

// Samplers
varying vec2 vUV;
varying vec4 vColor;
uniform vec4 textureMask;
uniform sampler2D diffuseSampler;

#include<clipPlaneFragmentDeclaration>

#include<imageProcessingDeclaration>
#include<logDepthDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

#ifdef RAMPGRADIENT
varying vec4 remapRanges;
uniform sampler2D rampSampler;
#endif

#include<fogFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	#include<clipPlaneFragment>

	vec4 textureColor = texture2D(diffuseSampler, vUV);
	vec4 baseColor = (textureColor * textureMask + (vec4(1., 1., 1., 1.) - textureMask)) * vColor;

	#ifdef RAMPGRADIENT
		float alpha = baseColor.a;
		float remappedColorIndex = clamp((alpha - remapRanges.x) / remapRanges.y, 0.0, 1.0);

		vec4 rampColor = texture2D(rampSampler, vec2(1.0 - remappedColorIndex, 0.));
		baseColor.rgb *= rampColor.rgb;

		// Remapped alpha
		float finalAlpha = baseColor.a;
		baseColor.a = clamp((alpha * rampColor.a - remapRanges.z) / remapRanges.w, 0.0, 1.0);
	#endif

	#ifdef BLENDMULTIPLYMODE
		float sourceAlpha = vColor.a * textureColor.a;
		baseColor.rgb = baseColor.rgb * sourceAlpha + vec3(1.0) * (1.0 - sourceAlpha);
	#endif

	#include<logDepthFragment>
	#include<fogFragment>(color,baseColor)

// Apply image processing if relevant. As this applies in linear space, 
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	baseColor.rgb = toLinearSpace(baseColor.rgb);
#else
	#ifdef IMAGEPROCESSING
		baseColor.rgb = toLinearSpace(baseColor.rgb);
		baseColor = applyImageProcessing(baseColor);
	#endif
#endif

	gl_FragColor = baseColor;

#define CUSTOM_FRAGMENT_MAIN_END

}