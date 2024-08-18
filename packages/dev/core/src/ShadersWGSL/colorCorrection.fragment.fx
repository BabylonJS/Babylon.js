// samplers
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

varying vUV: vec2f;
var colorTableSampler: sampler;
var colorTable: texture_2d<f32>;

// constants
const SLICE_COUNT: f32 = 16.0;		// how many slices in the color cube; 1 slice = 1 pixel
// it means the image is 256x16 pixels

fn sampleAs3DTexture(uv: vec3f, width: f32) -> vec4f {
	var sliceSize: f32 = 1.0 / width;              // space of 1 slice
	var slicePixelSize: f32 = sliceSize / width;           // space of 1 pixel
	var sliceInnerSize: f32 = slicePixelSize * (width - 1.0);  // space of width pixels
	var zSlice0: f32 = min(floor(uv.z * width), width - 1.0);
	var zSlice1: f32 = min(zSlice0 + 1.0, width - 1.0);
	var xOffset: f32 = slicePixelSize * 0.5 + uv.x * sliceInnerSize;
	var s0: f32 = xOffset + (zSlice0 * sliceSize);
	var s1: f32 = xOffset + (zSlice1 * sliceSize);
	var slice0Color: vec4f = textureSample(colorTable, colorTableSampler, vec2f(s0, uv.y));
	var slice1Color: vec4f = textureSample(colorTable, colorTableSampler, vec2f(s1, uv.y));
	var zOffset: f32 = ((uv.z * width)%(1.0));
	return mix(slice0Color, slice1Color, zOffset);
}


#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var screen_color: vec4f = textureSample(textureSampler, textureSamplerSampler, input.vUV);
	fragmentOutputs.color = sampleAs3DTexture(screen_color.rgb, SLICE_COUNT);
}