varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;


// uniforms
uniform chromatic_aberration: f32;
uniform radialIntensity: f32;
uniform direction: vec2f;
uniform centerPosition: vec2f;
uniform screen_width: f32;
uniform screen_height: f32;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var centered_screen_pos: vec2f =  vec2f(input.vUV.x - uniforms.centerPosition.x, input.vUV.y - uniforms.centerPosition.y);
	var directionOfEffect: vec2f = uniforms.direction;
	if(directionOfEffect.x == 0. && directionOfEffect.y == 0.){
		directionOfEffect = normalize(centered_screen_pos);
	}

	var radius2: f32 = centered_screen_pos.x*centered_screen_pos.x
		+ centered_screen_pos.y*centered_screen_pos.y;
	var radius: f32 = sqrt(radius2);

	//index of refraction of each color channel, causing chromatic dispersion
	var ref_indices: vec3f =  vec3f(-0.3, 0.0, 0.3);
	var ref_shiftX: f32 = uniforms.chromatic_aberration * pow(radius, uniforms.radialIntensity) * directionOfEffect.x / uniforms.screen_width;
	var ref_shiftY: f32 = uniforms.chromatic_aberration * pow(radius, uniforms.radialIntensity) * directionOfEffect.y / uniforms.screen_height;

	// shifts for red, green & blue
	var ref_coords_r: vec2f = vec2f(input.vUV.x + ref_indices.r*ref_shiftX, input.vUV.y + ref_indices.r*ref_shiftY*0.5);
	var ref_coords_g: vec2f = vec2f(input.vUV.x + ref_indices.g*ref_shiftX, input.vUV.y + ref_indices.g*ref_shiftY*0.5);
	var ref_coords_b: vec2f = vec2f(input.vUV.x + ref_indices.b*ref_shiftX, input.vUV.y + ref_indices.b*ref_shiftY*0.5);

	var r = textureSample(textureSampler, textureSamplerSampler, ref_coords_r);
	var g = textureSample(textureSampler, textureSamplerSampler, ref_coords_g);
	var b = textureSample(textureSampler, textureSamplerSampler, ref_coords_b);

	var a = clamp(r.a + g.a + b.a, 0., 1.);
	fragmentOutputs.color = vec4f(r.r, g.g, b.b, a);
}