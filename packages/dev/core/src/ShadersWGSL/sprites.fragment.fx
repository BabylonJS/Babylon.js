uniform alphaTest: i32;

varying vColor: vec4f;

// Samplers
varying vUV: vec2f;
var diffuseSamplerSampler: sampler;
var diffuseSampler: texture_2d<f32>;

// Fog
#include<fogFragmentDeclaration>

#include<logDepthDeclaration>

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

#include<logDepthFragment>
#include<fogFragment>

	fragmentOutputs.color = color;

#include<imageProcessingCompatibility>

#define CUSTOM_FRAGMENT_MAIN_END
}