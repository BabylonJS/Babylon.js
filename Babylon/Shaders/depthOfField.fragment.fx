// BABYLON.JS Depth-of-field GLSL Shader
// Author: Olivier Guyot
// Does depth-of-field blur, edge blur
// Inspired by Francois Tarlier & Martins Upitis

#ifdef GL_ES
precision highp float;
#endif


// samplers
uniform sampler2D textureSampler;
uniform sampler2D highlightsSampler;
uniform sampler2D depthSampler;
uniform sampler2D grainSampler;

// uniforms
uniform float grain_amount;
uniform float maxZ;
uniform bool blur_noise;
uniform float screen_width;
uniform float screen_height;
uniform float distortion;
uniform float focus_depth;
uniform float aperture;
uniform float edge_blur;
uniform bool highlights;

// varyings
varying vec2 vUV;

// constants
#define PI 3.14159265

// common calculations
vec2 centered_screen_pos;
float radius2;
float radius;


// applies edge distortion on texture coords
vec2 getDistortedCoords(vec2 coords) {

	if (distortion == 0.0) { return coords; }

	vec2 direction = 1.0 * normalize(centered_screen_pos);
	vec2 dist_coords = vec2(0.5, 0.5);
	dist_coords.x = 0.5 + direction.x * radius2 * 1.0;
	dist_coords.y = 0.5 + direction.y * radius2 * 1.0;
	float dist_amount = clamp(distortion*0.23, 0.0, 1.0);

	dist_coords = mix(coords, dist_coords, dist_amount);

	return dist_coords;
}

// returns original screen color after blur
vec4 getBlurColor(vec2 coords, float size) {

	vec4 col = texture2D(textureSampler, coords);
	if (size == 0.0) { return col; }

	// there are max. 30 samples; the number of samples chosen is dependant on the blur size
	// there can be 10, 20 or 30 samples chosen; levels of blur are then 1, 2 or 3
	float blur_level = min(3.0, ceil(size / 1.0));

	float w = (size / screen_width);
	float h = (size / screen_height);
	float total_weight = 1.0;

	col += texture2D(textureSampler, coords + vec2(-0.53*w, 0.15*h))*0.93;
	col += texture2D(textureSampler, coords + vec2(0.42*w, -0.69*h))*0.90;
	col += texture2D(textureSampler, coords + vec2(0.20*w, 1.00*h))*0.87;
	col += texture2D(textureSampler, coords + vec2(-0.97*w, -0.72*h))*0.85;
	col += texture2D(textureSampler, coords + vec2(1.37*w, -0.14*h))*0.83;
	col += texture2D(textureSampler, coords + vec2(-1.02*w, 1.16*h))*0.80;
	col += texture2D(textureSampler, coords + vec2(-0.03*w, -1.69*h))*0.78;
	col += texture2D(textureSampler, coords + vec2(1.27*w, 1.34*h))*0.76;
	col += texture2D(textureSampler, coords + vec2(-1.98*w, -0.14*h))*0.74;
	col += texture2D(textureSampler, coords + vec2(1.66*w, -1.32*h))*0.72;
	total_weight += 8.18;

	if (blur_level > 1.0) {
		col += texture2D(textureSampler, coords + vec2(-0.35*w, 2.22*h))*0.70;
		col += texture2D(textureSampler, coords + vec2(-1.31*w, -1.98*h))*0.67;
		col += texture2D(textureSampler, coords + vec2(2.42*w, 0.61*h))*0.65;
		col += texture2D(textureSampler, coords + vec2(-2.31*w, 1.25*h))*0.63;
		col += texture2D(textureSampler, coords + vec2(0.90*w, -2.59*h))*0.61;
		col += texture2D(textureSampler, coords + vec2(1.14*w, 2.62*h))*0.59;
		col += texture2D(textureSampler, coords + vec2(-2.72*w, -1.21*h))*0.56;
		col += texture2D(textureSampler, coords + vec2(2.93*w, -0.98*h))*0.54;
		col += texture2D(textureSampler, coords + vec2(-1.56*w, 2.80*h))*0.52;
		col += texture2D(textureSampler, coords + vec2(-0.77*w, -3.22*h))*0.49;
		total_weight += 5.96;
	}

	if (blur_level > 2.0) {
		col += texture2D(textureSampler, coords + vec2(2.83*w, 1.92*h))*0.46;
		col += texture2D(textureSampler, coords + vec2(-3.49*w, 0.51*h))*0.44;
		col += texture2D(textureSampler, coords + vec2(2.30*w, -2.82*h))*0.41;
		col += texture2D(textureSampler, coords + vec2(0.22*w, 3.74*h))*0.38;
		col += texture2D(textureSampler, coords + vec2(-2.76*w, -2.68*h))*0.34;
		col += texture2D(textureSampler, coords + vec2(3.95*w, 0.11*h))*0.31;
		col += texture2D(textureSampler, coords + vec2(-3.07*w, 2.65*h))*0.26;
		col += texture2D(textureSampler, coords + vec2(0.48*w, -4.13*h))*0.22;
		col += texture2D(textureSampler, coords + vec2(2.49*w, 3.46*h))*0.15;
		total_weight += 2.97;
	}

	col /= total_weight;		// scales color according to weights
	col.a = 1.0;

	// blur levels debug
	// if(blur_level == 1.0) { col.b = 0.0; }
	// if(blur_level == 2.0) { col.r = 0.0; }
	// if(blur_level == 3.0) { col.g = 0.0; }

	return col;
}

// on-the-fly constant noise
vec2 rand(vec2 co)
{
	float noise1 = (fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453));
	float noise2 = (fract(sin(dot(co, vec2(12.9898, 78.233)*2.0)) * 43758.5453));
	return clamp(vec2(noise1, noise2), 0.0, 1.0);
}

void main(void)
{

	// Common calc
	centered_screen_pos = vec2(vUV.x - 0.5, vUV.y - 0.5);
	radius2 = centered_screen_pos.x*centered_screen_pos.x + centered_screen_pos.y*centered_screen_pos.y;
	radius = sqrt(radius2);

	vec4 final_color;
	vec2 distorted_coords = getDistortedCoords(vUV);
	vec2 texels_coords = vec2(vUV.x * screen_width, vUV.y * screen_height);	// varies from 0 to SCREEN_WIDTH or _HEIGHT

	// blur from depth of field effect
	float dof_blur_amount = 0.0;
	float depth_bias = 0.0;		// positive if the pixel is further than focus depth; negative if closer
	if (focus_depth != -1.0) {
		vec4 depth_sample = texture2D(depthSampler, distorted_coords);
		float depth = depth_sample.r;
		depth_bias = depth - focus_depth;

		// compute blur amount with distance
		if (depth_bias > 0.0) { dof_blur_amount = depth_bias * aperture * 2.2; }
		else { dof_blur_amount = depth_bias * depth_bias * aperture * 30.0; }

		if (dof_blur_amount < 0.05) { dof_blur_amount = 0.0; }	// no blur at all
	}

	// blur from edge blur effect
	float edge_blur_amount = 0.0;
	if (edge_blur > 0.0) {
		edge_blur_amount = clamp((radius*2.0 - 1.0 + 0.15*edge_blur) * 1.5, 0.0, 1.0) * 1.3;
	}

	// total blur amount
	float blur_amount = max(edge_blur_amount, dof_blur_amount);

	// apply blur if necessary
	if (blur_amount == 0.0) {
		gl_FragColor = texture2D(textureSampler, distorted_coords);
	}
	else {

		// add blurred color
		gl_FragColor = getBlurColor(distorted_coords, blur_amount * 1.7);

		// if further than focus depth & we have computed highlights: enhance highlights
		if (depth_bias > 0.0 && highlights) {
			gl_FragColor += clamp(dof_blur_amount, 0.0, 1.0)*texture2D(highlightsSampler, distorted_coords);
		}

		if (blur_noise) {
			// we put a slight amount of noise in the blurred color
			vec2 noise = rand(distorted_coords) * 0.01 * blur_amount;
			vec2 blurred_coord = vec2(distorted_coords.x + noise.x, distorted_coords.y + noise.y);
			gl_FragColor = 0.04 * texture2D(textureSampler, blurred_coord) + 0.96 * gl_FragColor;
		}
	}

	// apply grain
	if (grain_amount > 0.0) {
		vec4 grain_color = texture2D(grainSampler, texels_coords*0.003);
		gl_FragColor.rgb += (-0.5 + grain_color.rgb) * 0.20;
	}
}