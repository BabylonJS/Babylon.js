#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<prePassDeclaration>[SCENE_MRT_COUNT]

uniform bool alphaTest;

varying vec4 vColor;
#ifdef PREPASS
varying vec3 vPositionW;
varying vec3 vNormalV;
varying vec3 vNormalW;
#endif

// Samplers
varying vec2 vUV;
uniform sampler2D diffuseSampler;

// Fog
#include<fogFragmentDeclaration>

#include<logDepthDeclaration>
#include<helperFunctions>

#define CUSTOM_FRAGMENT_DEFINITIONS

#ifdef PIXEL_PERFECT
// see iq comment here: https://www.shadertoy.com/view/MllBWf
vec2 uvPixelPerfect(vec2 uv) {
    vec2 res = vec2(textureSize(diffuseSampler, 0));
    
    uv = uv * res;
    vec2 seam = floor(uv + 0.5);
    uv = seam + clamp((uv-seam) / fwidth(uv), -0.5, 0.5);
    return uv / res;
}
#endif

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

	#ifdef PIXEL_PERFECT
		vec2 uv = uvPixelPerfect(vUV);
	#else
		vec2 uv = vUV;
	#endif

	vec4 color = texture2D(diffuseSampler, uv);
	// Fix for ios14 and lower
	float fAlphaTest = float(alphaTest);

	if (fAlphaTest != 0.)
	{
		if (color.a < 0.95)
			discard;
	}

	color *= vColor;

#ifdef PREPASS
	vec3 geometryAlbedo = toLinearSpace(color.rgb);
	if (fAlphaTest == 0.0 && color.a == 0.0) {
		discard;
	}
#endif

#include<logDepthFragment>
#include<fogFragment>

	gl_FragColor = color;

#include<imageProcessingCompatibility>

#ifdef PREPASS
	vec4 geometryColor = gl_FragColor;
	#ifdef PREPASS_POSITION
	vec3 geometryPositionW = vPositionW;
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
	vec3 geometryNormalV = vNormalV;
	#endif
	#ifdef PREPASS_WORLD_NORMAL
	vec3 geometryNormalW = vNormalW;
	#endif
	#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
		vec4 geometryCurrentPosition = vCurrentPosition;
		vec4 geometryPreviousPosition = vPreviousPosition;
	#endif
	#include<geometryRenderingFragment>
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}