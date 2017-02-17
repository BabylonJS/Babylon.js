// samplers
uniform sampler2D textureSampler;	// original color

// uniforms
uniform float chromatic_aberration;
uniform float screen_width;
uniform float screen_height;

// varyings
varying vec2 vUV;

void main(void)
{
	vec2 centered_screen_pos = vec2(vUV.x - 0.5, vUV.y - 0.5);
	float radius2 = centered_screen_pos.x*centered_screen_pos.x
		+ centered_screen_pos.y*centered_screen_pos.y;
	float radius = sqrt(radius2);

	vec4 original = texture2D(textureSampler, vUV);

	if (chromatic_aberration > 0.0) {
		//index of refraction of each color channel, causing chromatic dispersion
		vec3 ref_indices = vec3(-0.3, 0.0, 0.3);
		float ref_shiftX = chromatic_aberration * radius * 17.0 / screen_width;
		float ref_shiftY = chromatic_aberration * radius * 17.0 / screen_height;

		// shifts for red, green & blue
		vec2 ref_coords_r = vec2(vUV.x + ref_indices.r*ref_shiftX, vUV.y + ref_indices.r*ref_shiftY*0.5);
		vec2 ref_coords_g = vec2(vUV.x + ref_indices.g*ref_shiftX, vUV.y + ref_indices.g*ref_shiftY*0.5);
		vec2 ref_coords_b = vec2(vUV.x + ref_indices.b*ref_shiftX, vUV.y + ref_indices.b*ref_shiftY*0.5);

		original.r = texture2D(textureSampler, ref_coords_r).r;
		original.g = texture2D(textureSampler, ref_coords_g).g;
		original.b = texture2D(textureSampler, ref_coords_b).b;
	}

	gl_FragColor = original;
}