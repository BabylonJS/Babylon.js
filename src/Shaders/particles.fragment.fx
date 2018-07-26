// Samplers
varying vec2 vUV;
varying vec4 vColor;
uniform vec4 textureMask;
uniform sampler2D diffuseSampler;

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

#include<imageProcessingDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

void main(void) {
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif
	vec4 baseColor = texture2D(diffuseSampler, vUV);
	baseColor = (baseColor * textureMask + (vec4(1., 1., 1., 1.) - textureMask)) * vColor;

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