uniform alphaTest: i32;

#include<prePassDeclaration>[SCENE_MRT_COUNT]

varying vColor: vec4f;
#ifdef PREPASS
varying vPositionW: vec3f;
varying vNormalV: vec3f;
varying vNormalW: vec3f;
#endif

// Samplers
varying vUV: vec2f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;

// Fog
#include<fogFragmentDeclaration>

#include<logDepthDeclaration>
#include<helperFunctions>

#define CUSTOM_FRAGMENT_DEFINITIONS

#ifdef PIXEL_PERFECT
// see iq comment here: https://www.shadertoy.com/view/MllBWf
fn uvPixelPerfect(uv: vec2f) -> vec2f {
    var res: vec2f =  vec2f(textureDimensions(diffuseSampler, 0));
    
    var uvTemp = uv * res;
    var seam: vec2f = floor(uvTemp + 0.5);
    uvTemp = seam + clamp((uvTemp-seam) / fwidth(uvTemp), vec2f(-0.5), vec2f(0.5));
    return uvTemp / res;
}
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

	#ifdef PIXEL_PERFECT
		var uv: vec2f = uvPixelPerfect(input.vUV);
	#else
		var uv: vec2f = input.vUV;
	#endif

	var color: vec4f = textureSample(diffuseSampler, diffuseSamplerSampler, uv);
	// Fix for ios14 and lower
	var fAlphaTest: f32 =  f32(uniforms.alphaTest);

	if (fAlphaTest != 0.)
	{
		if (color.a < 0.95) {
			discard;
		}
	}

	color *= input.vColor;

#ifdef PREPASS
	var geometryAlbedo: vec3f = toLinearSpaceVec3(color.rgb);
	if (fAlphaTest == 0.0 && color.a == 0.0) {
		discard;
	}
#endif

#include<logDepthFragment>
#include<fogFragment>

#ifdef PREPASS
	#include<imageProcessingCompatibility>(fragmentOutputs.color,color)
	var geometryColor: vec4f = color;
	#ifdef PREPASS_POSITION
	var geometryPositionW: vec3f = input.vPositionW;
	#endif
	#ifdef PREPASS_LOCAL_POSITION
	var geometryPositionL: vec3f = input.vPosition;
	#endif
	#ifdef PREPASS_DEPTH
	var geometryViewDepth: f32 = input.vViewPos.z;
	#endif
	#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
	var geometryNormalizedViewDepth: f32 = input.vNormViewDepth;
	#endif
	#ifdef PREPASS_NORMAL
	var geometryNormalV: vec3f = input.vNormalV;
	#endif
	#ifdef PREPASS_WORLD_NORMAL
	var geometryNormalW: vec3f = input.vNormalW;
	#endif
	#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
		var geometryCurrentPosition: vec4f = input.vCurrentPosition;
		var geometryPreviousPosition: vec4f = input.vPreviousPosition;
	#endif
	#include<geometryRenderingFragment>
#else
	fragmentOutputs.color = color;
	#include<imageProcessingCompatibility>
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}