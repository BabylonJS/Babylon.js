// Samplers
varying vec2 vUV;
varying vec4 vColor;
uniform vec4 textureMask;
uniform sampler2D diffuseSampler;

#include<clipPlaneFragmentDeclaration>

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

void main(void) {
	#include<clipPlaneFragment>

	vec4 textureColor = texture2D(diffuseSampler, vUV);
	vec4 baseColor = (textureColor * textureMask + (vec4(1., 1., 1., 1.) - textureMask)) * vColor;

	#ifdef BLENDMULTIPLYMODE
	float alpha = vColor.a * textureColor.a;
	baseColor.rgb = baseColor.rgb * alpha + vec3(1.0) * (1.0 - alpha);
	#endif

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
}