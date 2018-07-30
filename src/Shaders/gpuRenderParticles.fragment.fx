#version 300 es

uniform sampler2D textureSampler;

in vec2 vUV;
in vec4 vColor;

out vec4 outFragColor;

#ifdef CLIPPLANE
in float fClipDistance;
#endif

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

void main() {
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif  
  outFragColor = texture(textureSampler, vUV) * vColor;

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
