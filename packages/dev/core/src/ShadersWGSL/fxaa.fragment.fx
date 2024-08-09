varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

uniform texelSize: vec2f;

varying sampleCoordS: vec2f;
varying sampleCoordE: vec2f;
varying sampleCoordN: vec2f;
varying sampleCoordW: vec2f;
varying sampleCoordNW: vec2f;
varying sampleCoordSE: vec2f;
varying sampleCoordNE: vec2f;
varying sampleCoordSW: vec2f;

const fxaaQualitySubpix: f32 = 1.0;
const fxaaQualityEdgeThreshold: f32 = 0.166;
const fxaaQualityEdgeThresholdMin: f32 = 0.0833;
const kLumaCoefficients: vec3f =  vec3f(0.2126, 0.7152, 0.0722);

fn FxaaLuma(rgba: vec4f) -> f32 {
	return dot(rgba.rgb, kLumaCoefficients);
} 

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
	var posM: vec2f;

	posM.x = input.vUV.x;
	posM.y = input.vUV.y;

	var rgbyM: vec4f = textureSampleLevel(textureSampler, textureSamplerSampler, input.vUV, 0.0);
	var lumaM: f32 = FxaaLuma(rgbyM);
	var lumaS: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordS, 0.0));
	var lumaE: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordE, 0.0));
	var lumaN: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordN, 0.0));
	var lumaW: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordW, 0.0));
	var maxSM: f32 = max(lumaS, lumaM);
	var minSM: f32 = min(lumaS, lumaM);
	var maxESM: f32 = max(lumaE, maxSM);
	var minESM: f32 = min(lumaE, minSM);
	var maxWN: f32 = max(lumaN, lumaW);
	var minWN: f32 = min(lumaN, lumaW);
	var rangeMax: f32 = max(maxWN, maxESM);
	var rangeMin: f32 = min(minWN, minESM);
	var rangeMaxScaled: f32 = rangeMax * fxaaQualityEdgeThreshold;
	var range: f32 = rangeMax - rangeMin;
	var rangeMaxClamped: f32 = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);

#ifndef MALI
	if(range < rangeMaxClamped) 
	{
		fragmentOutputs.color = rgbyM;
		return fragmentOutputs;
	}
#endif

	var lumaNW: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordNW, 0.0));
	var lumaSE: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordSE, 0.0));
	var lumaNE: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordNE, 0.0));
	var lumaSW: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, input.sampleCoordSW, 0.0));
	var lumaNS: f32 = lumaN + lumaS;
	var lumaWE: f32 = lumaW + lumaE;
	var subpixRcpRange: f32 = 1.0 / range;
	var subpixNSWE: f32 = lumaNS + lumaWE;
	var edgeHorz1: f32 = (-2.0 * lumaM) + lumaNS;
	var edgeVert1: f32 = (-2.0 * lumaM) + lumaWE;
	var lumaNESE: f32 = lumaNE + lumaSE;
	var lumaNWNE: f32 = lumaNW + lumaNE;
	var edgeHorz2: f32 = (-2.0 * lumaE) + lumaNESE;
	var edgeVert2: f32 = (-2.0 * lumaN) + lumaNWNE;
	var lumaNWSW: f32 = lumaNW + lumaSW;
	var lumaSWSE: f32 = lumaSW + lumaSE;
	var edgeHorz4: f32 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
	var edgeVert4: f32 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
	var edgeHorz3: f32 = (-2.0 * lumaW) + lumaNWSW;
	var edgeVert3: f32 = (-2.0 * lumaS) + lumaSWSE;
	var edgeHorz: f32 = abs(edgeHorz3) + edgeHorz4;
	var edgeVert: f32 = abs(edgeVert3) + edgeVert4;
	var subpixNWSWNESE: f32 = lumaNWSW + lumaNESE;
	var lengthSign: f32 = uniforms.texelSize.x;
	var horzSpan: bool = edgeHorz >= edgeVert;
	var subpixA: f32 = subpixNSWE * 2.0 + subpixNWSWNESE;

	if (!horzSpan)
	{
		lumaN = lumaW;
	}

	if (!horzSpan) 
	{
		lumaS = lumaE;
	}

	if (horzSpan) 
	{
		lengthSign = uniforms.texelSize.y;
	}

	var subpixB: f32 = (subpixA * (1.0 / 12.0)) - lumaM;
	var gradientN: f32 = lumaN - lumaM;
	var gradientS: f32 = lumaS - lumaM;
	var lumaNN: f32 = lumaN + lumaM;
	var lumaSS: f32 = lumaS + lumaM;
	var pairN: bool = abs(gradientN) >= abs(gradientS);
	var gradient: f32 = max(abs(gradientN), abs(gradientS));

	if (pairN)
	{
		lengthSign = -lengthSign;
	}

	var subpixC: f32 = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
	var posB: vec2f;

	posB.x = posM.x;
	posB.y = posM.y;

	var offNP: vec2f;

	offNP.x = select(uniforms.texelSize.x, 0.0, (!horzSpan));
	offNP.y = select(uniforms.texelSize.y, 0.0, (horzSpan));

	if (!horzSpan) 
	{
		posB.x += lengthSign * 0.5;
	}

	if (horzSpan)
	{
		posB.y += lengthSign * 0.5;
	}

	var posN: vec2f;

	posN.x = posB.x - offNP.x * 1.5;
	posN.y = posB.y - offNP.y * 1.5;

	var posP: vec2f;

	posP.x = posB.x + offNP.x * 1.5;
	posP.y = posB.y + offNP.y * 1.5;

	var subpixD: f32 = ((-2.0) * subpixC) + 3.0;
	var lumaEndN: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, posN, 0.0));
	var subpixE: f32 = subpixC * subpixC;
	var lumaEndP: f32 = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, posP, 0.0));

	if (!pairN) 
	{
		lumaNN = lumaSS;
	}

	var gradientScaled: f32 = gradient * 1.0 / 4.0;
	var lumaMM: f32 = lumaM - lumaNN * 0.5;
	var subpixF: f32 = subpixD * subpixE;
	var lumaMLTZero: bool = lumaMM < 0.0;

	lumaEndN -= lumaNN * 0.5;
	lumaEndP -= lumaNN * 0.5;

	var doneN: bool = abs(lumaEndN) >= gradientScaled;
	var doneP: bool = abs(lumaEndP) >= gradientScaled;

	if (!doneN) 
	{
		posN.x -= offNP.x * 3.0;
	}

	if (!doneN) 
	{
		posN.y -= offNP.y * 3.0;
	}

	var doneNP: bool = (!doneN) || (!doneP);

	if (!doneP) 
	{
		posP.x += offNP.x * 3.0;
	}

	if (!doneP)
	{
		posP.y += offNP.y * 3.0;
	}

	if (doneNP)
	{
		if (!doneN) {
			lumaEndN = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, posN.xy, 0.0));
		}
		if (!doneP) {
			lumaEndP = FxaaLuma(textureSampleLevel(textureSampler, textureSamplerSampler, posP.xy, 0.0));
		}
		if (!doneN) {
			lumaEndN = lumaEndN - lumaNN * 0.5;
		}
		if (!doneP) {
			lumaEndP = lumaEndP - lumaNN * 0.5;
		}
	
		doneN = abs(lumaEndN) >= gradientScaled;
		doneP = abs(lumaEndP) >= gradientScaled;
	
		if (!doneN) {
			posN.x -= offNP.x * 12.0;
		}
		if (!doneN) {
			posN.y -= offNP.y * 12.0;
		}
	
		doneNP = (!doneN) || (!doneP);
	
		if (!doneP) {
			posP.x += offNP.x * 12.0;
		}
		if (!doneP) {
			posP.y += offNP.y * 12.0;
		}
	}

	var dstN: f32 = posM.x - posN.x;
	var dstP: f32 = posP.x - posM.x;

	if (!horzSpan)
	{
		dstN = posM.y - posN.y;
	}
	if (!horzSpan) 
	{
		dstP = posP.y - posM.y;
	}

	var goodSpanN: bool = (lumaEndN < 0.0) != lumaMLTZero;
	var spanLength: f32 = (dstP + dstN);
	var goodSpanP: bool = (lumaEndP < 0.0) != lumaMLTZero;
	var spanLengthRcp: f32 = 1.0 / spanLength;
	var directionN: bool = dstN < dstP;
	var dst: f32 = min(dstN, dstP);
	var goodSpan: bool = select(goodSpanP, goodSpanN, directionN);
	var subpixG: f32 = subpixF * subpixF;
	var pixelOffset: f32 = (dst * (-spanLengthRcp)) + 0.5;
	var subpixH: f32 = subpixG * fxaaQualitySubpix;
	var pixelOffsetGood: f32 = select(0.0, pixelOffset, goodSpan);
	var pixelOffsetSubpix: f32 = max(pixelOffsetGood, subpixH);

	if (!horzSpan)
	{
		posM.x += pixelOffsetSubpix * lengthSign;
	}

	if (horzSpan)
	{
		posM.y += pixelOffsetSubpix * lengthSign;
	}

#ifdef MALI
	if(range < rangeMaxClamped) 
	{
		fragmentOutputs.color = rgbyM;
	}
	else
	{
		fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, posM, 0.0);
	}
#else
	fragmentOutputs.color = textureSampleLevel(textureSampler, textureSamplerSampler, posM, 0.0);
#endif
}