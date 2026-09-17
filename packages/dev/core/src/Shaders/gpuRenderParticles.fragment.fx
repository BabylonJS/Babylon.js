precision highp float;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

uniform sampler2D diffuseSampler;

varying vec2 vUV;
varying vec4 vColor;

#ifdef PREPASS
#ifdef PREPASS_POSITION
varying vec3 vGeometryPositionW;
#endif
#ifdef PREPASS_WORLD_NORMAL
varying vec3 vGeometryNormalW;
#endif
#ifdef PREPASS_NORMAL
varying vec3 vGeometryNormalV;
#endif
#endif
#define PREPASS_VELOCITY_ZERO
#include<prePassDeclaration>[SCENE_MRT_COUNT]
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
#ifdef PREPASS
	vec3 geometryAlbedo = toLinearSpace(gl_FragColor.rgb);
#endif

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

#ifdef PREPASS
	vec4 geometryColor = gl_FragColor;
	if (geometryColor.a <= 0.0) {
		discard;
	}
	#ifdef PREPASS_POSITION
		vec3 geometryPositionW = vGeometryPositionW;
	#endif
	#ifdef PREPASS_LOCAL_POSITION
		vec3 geometryPositionL = vPosition;
	#endif
	#ifdef PREPASS_DEPTH
		float geometryViewDepth = vViewPos.z;
	#endif
	#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
		float geometryNormalizedViewDepth = vNormViewDepth;
	#endif
	#ifdef PREPASS_NORMAL
		vec3 geometryNormalV = normalize(vGeometryNormalV);
	#endif
	#ifdef PREPASS_WORLD_NORMAL
		vec3 geometryNormalW = normalize(vGeometryNormalW);
	#endif
	#include<geometryRenderingFragment>
#endif
}
