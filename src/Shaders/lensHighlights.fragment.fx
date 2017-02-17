// samplers
uniform sampler2D textureSampler;	// original color

// uniforms
uniform float gain;
uniform float threshold;
uniform float screen_width;
uniform float screen_height;

// varyings
varying vec2 vUV;

// apply luminance filter
vec4 highlightColor(vec4 color) {
	vec4 highlight = color;
	float luminance = dot(highlight.rgb, vec3(0.2125, 0.7154, 0.0721));
	float lum_threshold;
	if (threshold > 1.0) { lum_threshold = 0.94 + 0.01 * threshold; }
	else { lum_threshold = 0.5 + 0.44 * threshold; }

	luminance = clamp((luminance - lum_threshold) * (1.0 / (1.0 - lum_threshold)), 0.0, 1.0);

	highlight *= luminance * gain;
	highlight.a = 1.0;

	return highlight;
}

void main(void)
{
	vec4 original = texture2D(textureSampler, vUV);

	// quick exit if no highlight computing
	if (gain == -1.0) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	float w = 2.0 / screen_width;
	float h = 2.0 / screen_height;

	float weight = 1.0;

	// compute blurred color
	vec4 blurred = vec4(0.0, 0.0, 0.0, 0.0);

#ifdef PENTAGON
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.84*w, 0.43*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.48*w, -1.29*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.61*w, 1.51*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.55*w, -0.74*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.71*w, -0.52*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.94*w, 1.59*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.40*w, -1.87*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.62*w, 1.16*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.09*w, 0.25*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.46*w, -1.71*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.08*w, 2.42*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.85*w, -1.89*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.89*w, 0.16*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.29*w, 1.88*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.40*w, -2.81*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.54*w, 2.26*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.60*w, -0.61*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.31*w, -1.30*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.83*w, 2.53*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.12*w, -2.48*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.60*w, 1.11*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.82*w, 0.99*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.50*w, -2.81*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.85*w, 3.33*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.94*w, -1.92*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(3.27*w, -0.53*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.95*w, 2.48*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.23*w, -3.04*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.17*w, 2.05*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.97*w, -0.04*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.25*w, -2.00*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.31*w, 3.08*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.94*w, -2.59*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(3.37*w, 0.64*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-3.13*w, 1.93*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.03*w, -3.65*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.60*w, 3.17*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-3.14*w, -1.19*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(3.00*w, -1.19*h)));
#else
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.85*w, 0.36*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.52*w, -1.14*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.46*w, 1.42*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.46*w, -0.83*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.79*w, -0.42*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.11*w, 1.62*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.29*w, -2.07*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.69*w, 1.39*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.28*w, 0.12*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.65*w, -1.69*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.08*w, 2.44*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.63*w, -1.90*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.55*w, 0.31*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.13*w, 1.52*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.56*w, -2.61*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.38*w, 2.34*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.64*w, -0.81*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.53*w, -1.21*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.06*w, 2.63*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.00*w, -2.69*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.59*w, 1.32*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.82*w, 0.78*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.57*w, -2.50*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(0.54*w, 2.93*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.39*w, -1.81*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(3.01*w, -0.28*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.04*w, 2.25*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.02*w, -3.05*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.09*w, 2.25*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-3.07*w, -0.25*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.44*w, -1.90*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-0.52*w, 3.05*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-1.68*w, -2.61*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(3.01*w, 0.79*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.76*w, 1.46*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.05*w, -2.94*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(1.21*w, 2.88*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(-2.84*w, -1.30*h)));
		blurred += highlightColor(texture2D(textureSampler, vUV + vec2(2.98*w, -0.96*h)));
#endif

	blurred /= 39.0;

	gl_FragColor = blurred;

	//if(vUV.x > 0.5) { gl_FragColor.rgb *= 0.0; }
}