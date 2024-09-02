// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

const RGBLuminanceCoefficients: vec3f =  vec3f(0.2126, 0.7152, 0.0722);


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var tex: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV);
	var c: vec3f = tex.rgb;
	var luma: f32 = dot(c.rgb, RGBLuminanceCoefficients);
	
	// to artificially desaturate/whiteout: c = mix(c,  vec3f(luma), luma * luma * luma * 0.1)
	// brighter = higher luma = lower exponent = more diffuse glow
	
	fragmentOutputs.color =  vec4f(pow(c,  vec3f(25.0 - luma * 15.0)), tex.a);	
}