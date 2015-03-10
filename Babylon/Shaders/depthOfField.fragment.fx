/*
	BABYLON.JS Depth-of-field GLSL Shader
	Author: Olivier Guyot
	Does depth-of-field blur, edge blur, highlights enhancing
	Inspired by Francois Tarlier & Martins Upitis
*/

#ifdef GL_ES
precision highp float;
#endif


// samplers
uniform sampler2D textureSampler;
uniform sampler2D depthSampler;
uniform sampler2D grainSampler;

// uniforms
uniform float grain_amount;
uniform bool pentagon;
uniform float maxZ;
uniform bool blur_noise;
uniform float screen_width;
uniform float screen_height;
uniform float distortion;
uniform float focus_depth;
uniform float aperture;
uniform float gain;
uniform float threshold;
uniform float edge_blur;

// varyings
varying vec2 vUV;

// constants
#define PI 3.14159265
const int RING_1_SAMPLES = 4;
const int RING_2_SAMPLES = 6;
const int RING_3_SAMPLES = 9;
const int RING_4_SAMPLES = 12;
const int RING_5_SAMPLES = 16;
//const int RING_6_SAMPLES = 15;
const float RING_STEP_DIST = 0.4;			// a new blur ring is added each time this distance is passed
const float PENTAGON_ANGLE_SUB = 1.2566;		// 2PI / 5
const float PENTAGON_ANGLE_SUB_HALF = 0.6283;	// 2PI / 10

// common calculations
vec2 centered_screen_pos;
float radius2;
float radius;


// applies edge distortion on texture coords
vec2 getDistortedCoords(vec2 coords) {

	if(distortion == 0.0) { return coords; }

	vec2 direction = 1.0 * normalize(centered_screen_pos);
	vec2 dist_coords = vec2(0.5, 0.5);
	dist_coords.x = 0.5 + direction.x * radius2 * 1.0;
	dist_coords.y = 0.5 + direction.y * radius2 * 1.0;
	float dist_amount = clamp(distortion*0.23, 0.0, 1.0);

	dist_coords = mix(coords, dist_coords, dist_amount);

	return dist_coords;
}

// picks either original screen color or highlights only
vec4 getColor(vec2 coords, bool highlight) {

	vec4 color = texture2D(textureSampler, coords);

	if(highlight) {
		float luminance = dot(color.rgb, vec3(0.2125, 0.7154, 0.0721));
		float lum_threshold;
		if(threshold > 1.0) { lum_threshold = 0.94 + 0.01 * threshold; }
		else { lum_threshold = 0.5 + 0.44 * threshold; }
		if(luminance < lum_threshold) {
			color.rgb = vec3(0.0, 0.0, 0.0);
			color.a = 1.0;
		}
	}

	return color;
}

// returns a modifier to be applied on the radius, in order to simulate a pentagon
float pentagonShape(float angle) {
    float a1 = mod(angle, PENTAGON_ANGLE_SUB) / PENTAGON_ANGLE_SUB - 0.5;
    float a2 = 0.5 - a1 * a1;
    return 1.35 - 0.94 * a2;
}

// returns original screen color after blur
vec4 getBlurColor(vec2 coords, float size, bool highlight) {

	float w = (size/screen_width);
	float h = (size/screen_height);

	vec4 col = getColor(coords, highlight);
	if(size == 0.0) { return col; }

	float s = 1.0;
	float pw;			// sample x relative coord
	float ph;			// sample y relative coord
	float bias = 0.65;	// inner/outer ring bias
	if(highlight) { bias = 0.95; }
	float sample_angle;
	float ratio_rings;
	float ring_radius;
	float penta;		// pentagon shape modifier

	int ring_count;
	if(size >= 6.0 * RING_STEP_DIST) { ring_count = 6; }
	else if(size >= 5.0 * RING_STEP_DIST) { ring_count = 5; }
	else if(size >= 4.0 * RING_STEP_DIST) { ring_count = 4; }
	else if(size >= 3.0 * RING_STEP_DIST) { ring_count = 3; }
	else if(size >= 2.0 * RING_STEP_DIST) { ring_count = 2; }
	else { ring_count = 1; }
	
	// RING 1
	if(size > RING_STEP_DIST) {
		ring_radius = size / float(ring_count);
		ratio_rings = 1.0 / float(ring_count);
		for(int i = 0; i < RING_1_SAMPLES; i++) {
			sample_angle = PI *2.0 * float(i) / float(RING_1_SAMPLES);
			if(pentagon) { penta = pentagonShape(sample_angle); }
			else { penta = 1.0; }
			pw = cos( sample_angle ) * penta * ring_radius;
			ph = sin( sample_angle ) * penta * ring_radius;
			col += getColor(coords + vec2(pw*w,ph*h), highlight) * mix( 1.0, ratio_rings, bias );
			s += 1.0 * mix(1.0, ratio_rings, bias);
		}
	}	

	// RING 2
	if(size > RING_STEP_DIST * 2.0) {
		ring_radius = 2.0 * size / float(ring_count);
		ratio_rings = 2.0 / float(ring_count);
		for(int i = 0; i < RING_2_SAMPLES; i++) {
			sample_angle = PI *2.0 * float(i) / float(RING_2_SAMPLES);
			if(pentagon) { penta = pentagonShape(sample_angle); }
			else { penta = 1.0; }
			pw = cos( sample_angle ) * penta * ring_radius;
			ph = sin( sample_angle ) * penta * ring_radius;
			col += getColor(coords + vec2(pw*w,ph*h), highlight) * mix( 1.0, ratio_rings, bias );
			s += 1.0 * mix(1.0, ratio_rings, bias);  
		}
	}	

	// RING 3
	if(size > RING_STEP_DIST * 3.0) {
		ring_radius = 3.0 * size / float(ring_count);
		ratio_rings = 3.0 / float(ring_count);
		for(int i = 0; i < RING_3_SAMPLES; i++) {
			sample_angle = PI *2.0 * float(i) / float(RING_3_SAMPLES);
			if(pentagon) { penta = pentagonShape(sample_angle); }
			else { penta = 1.0; }
			pw = cos( sample_angle ) * penta * ring_radius;
			ph = sin( sample_angle ) * penta * ring_radius;
			col += getColor(coords + vec2(pw*w,ph*h), highlight) * mix( 1.0, ratio_rings, bias );
			s += 1.0 * mix(1.0, ratio_rings, bias);  
		}
	}	

	// RING 4
	if(size > RING_STEP_DIST * 4.0) {
		ring_radius = 4.0 * size / float(ring_count);
		ratio_rings = 4.0 / float(ring_count);
		for(int i = 0; i < RING_4_SAMPLES; i++) {
			sample_angle = PI *2.0 * float(i) / float(RING_4_SAMPLES);
			if(pentagon) { penta = pentagonShape(sample_angle); }
			else { penta = 1.0; }
			pw = cos( sample_angle ) * penta * ring_radius;
			ph = sin( sample_angle ) * penta * ring_radius;
			col += getColor(coords + vec2(pw*w,ph*h), highlight) * mix( 1.0, ratio_rings, bias );
			s += 1.0 * mix(1.0, ratio_rings, bias);  
		}
	}	

	// RING 5
	if(size > RING_STEP_DIST * 5.0) {
		ring_radius = 5.0 * size / float(ring_count);
		ratio_rings = 5.0 / float(ring_count);
		for(int i = 0; i < RING_5_SAMPLES; i++) {
			sample_angle = PI *2.0 * float(i) / float(RING_5_SAMPLES);
			if(pentagon) { penta = pentagonShape(sample_angle); }
			else { penta = 1.0; }
			pw = cos( sample_angle ) * penta * ring_radius;
			ph = sin( sample_angle ) * penta * ring_radius;
			col += getColor(coords + vec2(pw*w,ph*h), highlight) * mix( 1.0, ratio_rings, bias );
			s += 1.0 * mix(1.0, ratio_rings, bias);  
		}
	}	

	col /= s;		// scales color according to samples taken
	col.a = 1.0;

	return col;
}

// on-the-fly constant noise
vec2 rand(vec2 co)
{
	float noise1 = (fract(sin(dot(co ,vec2(12.9898,78.233))) * 43758.5453));
	float noise2 = (fract(sin(dot(co ,vec2(12.9898,78.233)*2.0)) * 43758.5453));
	return clamp(vec2(noise1,noise2),0.0,1.0);
}

void main(void)
{

	// Common calc
	centered_screen_pos = vec2(vUV.x-0.5, vUV.y-0.5);
	radius2 = centered_screen_pos.x*centered_screen_pos.x + centered_screen_pos.y*centered_screen_pos.y;
	radius = sqrt(radius2);

	vec4 final_color;
	vec2 distorted_coords = getDistortedCoords(vUV);
	vec2 texels_coords = vec2(vUV.x * screen_width, vUV.y * screen_height);	// varies from 0 to SCREEN_WIDTH or _HEIGHT

	// blur from depth of field effect
	float dof_blur_amount = 0.0;
	if(focus_depth != -1.0) {
		vec4 depth_sample = texture2D(depthSampler, distorted_coords);
		float depth = depth_sample.r;
		dof_blur_amount = abs(depth - focus_depth) * aperture * 3.5;
		if(dof_blur_amount < 0.05) { dof_blur_amount = 0.0; }				// no blur at all
		else if( depth - focus_depth < 0.0 ) { dof_blur_amount *= 2.0; }	// blur more when close to camera
		dof_blur_amount = clamp(dof_blur_amount, 0.0, 1.0);
	}

	// blur from edge blur effect
	float edge_blur_amount = 0.0;
	if(edge_blur > 0.0) {
		edge_blur_amount = clamp( ( radius*2.0 - 1.0 + 0.15*edge_blur ) * 1.5 , 0.0 , 1.0 ) * 1.3;
	}

	// total blur amount
	float blur_amount = max(edge_blur_amount, dof_blur_amount);

	// apply blur if necessary
	if(blur_amount == 0.0) {
		gl_FragColor = getColor(distorted_coords, false);
	} else {
		gl_FragColor = getBlurColor(distorted_coords, blur_amount * 1.7, false)
					   + gain * blur_amount*getBlurColor(distorted_coords, blur_amount * 2.75, true);

		if(blur_noise) {
			// we put a slight amount of noise in the blurred color
			vec2 noise = rand(distorted_coords) * 0.01 * blur_amount;
			vec2 blurred_coord = vec2(distorted_coords.x + noise.x, distorted_coords.y + noise.y);
			gl_FragColor = 0.04 * getColor(blurred_coord, false) + 0.96 * gl_FragColor;
		}
	}

	if(grain_amount > 0.0) {
		vec4 grain_color = texture2D(grainSampler, texels_coords*0.003);
		gl_FragColor.rgb += ( -0.5 + grain_color.rgb ) * 0.20;
	}
}