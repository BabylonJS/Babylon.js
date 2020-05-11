#version 300 es

uniform sampler2D diffuseSampler;

in vec2 vUV;
in vec4 vColor;

out vec4 outFragColor;

#include<clipPlaneFragmentDeclaration2> 

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

void main() {
	#include<clipPlaneFragment> 
	vec4 textureColor = texture(diffuseSampler, vUV);
  	outFragColor = textureColor * vColor;

	#ifdef BLENDMULTIPLYMODE
	float alpha = vColor.a * textureColor.a;
	outFragColor.rgb = outFragColor.rgb * alpha + vec3(1.0) * (1.0 - alpha);	
	#endif	  

// Apply image processing if relevant. As this applies in linear space, 
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	outFragColor.rgb = toLinearSpace(outFragColor.rgb);
#else
	#ifdef IMAGEPROCESSING
		outFragColor.rgb = toLinearSpace(outFragColor.rgb);
		outFragColor = applyImageProcessing(outFragColor);
	#endif
#endif
}
