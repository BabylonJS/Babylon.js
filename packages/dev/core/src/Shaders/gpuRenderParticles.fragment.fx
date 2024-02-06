precision highp float;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

uniform sampler2D diffuseSampler;

varying vec2 vUV;
varying vec4 vColor;

#include<clipPlaneFragmentDeclaration2> 

#include<imageProcessingDeclaration>

#include<logDepthDeclaration>

#include<helperFunctions>

#include<imageProcessingFunctions>

#include<fogFragmentDeclaration>

void main() {
	#include<clipPlaneFragment> 

	vec4 textureColor = texture2D(diffuseSampler, vUV);
  	gl_FragColor = textureColor * vColor;

	#ifdef BLENDMULTIPLYMODE
	    float alpha = vColor.a * textureColor.a;
	    gl_FragColor.rgb = gl_FragColor.rgb * alpha + vec3(1.0) * (1.0 - alpha);
	#endif	 
	 
	#include<logDepthFragment>
	#include<fogFragment>(color,gl_FragColor)

// Apply image processing if relevant. As this applies in linear space, 
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	gl_FragColor.rgb = toLinearSpace(gl_FragColor.rgb);
#else
	#ifdef IMAGEPROCESSING
		gl_FragColor.rgb = toLinearSpace(gl_FragColor.rgb);
		gl_FragColor = applyImageProcessing(gl_FragColor);
	#endif
#endif
}
