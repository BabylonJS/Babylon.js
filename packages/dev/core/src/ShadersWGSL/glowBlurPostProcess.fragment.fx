// Samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

// Parameters
uniform screenSize: vec2f;
uniform direction: vec2f;
uniform blurWidth: f32;

// Transform color to luminance.
fn getLuminance(color: vec3f) -> f32
{
    return dot(color,  vec3f(0.2126, 0.7152, 0.0722));
}


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var weights: array<f32 ,7>;
	weights[0] = 0.05;
	weights[1] = 0.1;
	weights[2] = 0.2;
	weights[3] = 0.3;
	weights[4] = 0.2;
	weights[5] = 0.1;
	weights[6] = 0.05;

	var texelSize: vec2f =  vec2f(1.0 / uniforms.screenSize.x, 1.0 / uniforms.screenSize.y);
	var texelStep: vec2f = texelSize * uniforms.direction * uniforms.blurWidth;
	var start: vec2f = input.vUV - 3.0 * texelStep;

	var baseColor: vec4f =  vec4f(0., 0., 0., 0.);
	var texelOffset: vec2f =  vec2f(0., 0.);

	for (var i: i32 = 0; i < 7; i++)
	{
		// alpha blur.
		var texel: vec4f = textureSample(textureSampler, textureSamplerSampler, start + texelOffset);
		baseColor = vec4f(baseColor.rgb, baseColor.a + texel.a * weights[i]);

		// Highest Luma for outline.
		var luminance: f32 = getLuminance(baseColor.rgb);
		var luminanceTexel: f32 = getLuminance(texel.rgb);
		var choice: f32 = step(luminanceTexel, luminance);
		baseColor = vec4f(choice * baseColor.rgb + (1.0 - choice) * texel.rgb, baseColor.a);

		texelOffset += texelStep;
	}

	fragmentOutputs.color = baseColor;
}