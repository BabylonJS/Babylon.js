// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

// Color
uniform color: vec4f;

// Helper functions
#include<helperFunctions>


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

	var baseColor: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV);
	
#ifdef LINEAR
	baseColor = vec4f(toGammaSpace(baseColor.rgb), baseColor.a);
#endif

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	fragmentOutputs.color = baseColor * uniforms.color;

#define CUSTOM_FRAGMENT_MAIN_END
	
}