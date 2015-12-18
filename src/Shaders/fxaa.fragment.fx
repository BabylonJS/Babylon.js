precision highp float;

#define FXAA_REDUCE_MIN   (1.0/128.0)
#define FXAA_REDUCE_MUL   (1.0/8.0)
#define FXAA_SPAN_MAX     8.0

varying vec2 vUV;
uniform sampler2D textureSampler;
uniform vec2 texelSize;

void main(){
	vec2 localTexelSize = texelSize;
	vec4 rgbNW = texture2D(textureSampler, (vUV + vec2(-1.0, -1.0) * localTexelSize));
	vec4 rgbNE = texture2D(textureSampler, (vUV + vec2(1.0, -1.0) * localTexelSize));
	vec4 rgbSW = texture2D(textureSampler, (vUV + vec2(-1.0, 1.0) * localTexelSize));
	vec4 rgbSE = texture2D(textureSampler, (vUV + vec2(1.0, 1.0) * localTexelSize));
	vec4 rgbM = texture2D(textureSampler, vUV);
	vec4 luma = vec4(0.299, 0.587, 0.114, 1.0);
	float lumaNW = dot(rgbNW, luma);
	float lumaNE = dot(rgbNE, luma);
	float lumaSW = dot(rgbSW, luma);
	float lumaSE = dot(rgbSE, luma);
	float lumaM = dot(rgbM, luma);
	float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
	float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

	vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));

	float dirReduce = max(
		(lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),
		FXAA_REDUCE_MIN);

	float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
	dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
		max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
		dir * rcpDirMin)) * localTexelSize;

	vec4 rgbA = 0.5 * (
		texture2D(textureSampler, vUV + dir * (1.0 / 3.0 - 0.5)) +
		texture2D(textureSampler, vUV + dir * (2.0 / 3.0 - 0.5)));

	vec4 rgbB = rgbA * 0.5 + 0.25 * (
		texture2D(textureSampler, vUV + dir *  -0.5) +
		texture2D(textureSampler, vUV + dir * 0.5));
	float lumaB = dot(rgbB, luma);
	if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
		gl_FragColor = rgbA;
	}
	else {
		gl_FragColor = rgbB;
	}
}