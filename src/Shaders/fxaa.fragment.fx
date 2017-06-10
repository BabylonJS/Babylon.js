uniform sampler2D textureSampler;
uniform vec2 texelSize;

varying vec2 vUV;
varying vec2 sampleCoordS;
varying vec2 sampleCoordE;
varying vec2 sampleCoordN;
varying vec2 sampleCoordW;
varying vec2 sampleCoordNW;
varying vec2 sampleCoordSE;
varying vec2 sampleCoordNE;
varying vec2 sampleCoordSW;

const float fxaaQualitySubpix = 1.0;
const float fxaaQualityEdgeThreshold = 0.166;
const float fxaaQualityEdgeThresholdMin = 0.0833;
const vec3 kLumaCoefficients = vec3(0.2126, 0.7152, 0.0722);

#define FxaaLuma(rgba) dot(rgba.rgb, kLumaCoefficients)

void main(){
	vec2 posM;

	posM.x = vUV.x;
	posM.y = vUV.y;

	vec4 rgbyM = texture2D(textureSampler, vUV, 0.0);
	float lumaM = FxaaLuma(rgbyM);
	float lumaS = FxaaLuma(texture2D(textureSampler, sampleCoordS, 0.0));
	float lumaE = FxaaLuma(texture2D(textureSampler, sampleCoordE, 0.0));
	float lumaN = FxaaLuma(texture2D(textureSampler, sampleCoordN, 0.0));
	float lumaW = FxaaLuma(texture2D(textureSampler, sampleCoordW, 0.0));
	float maxSM = max(lumaS, lumaM);
	float minSM = min(lumaS, lumaM);
	float maxESM = max(lumaE, maxSM);
	float minESM = min(lumaE, minSM);
	float maxWN = max(lumaN, lumaW);
	float minWN = min(lumaN, lumaW);
	float rangeMax = max(maxWN, maxESM);
	float rangeMin = min(minWN, minESM);
	float rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
	float range = rangeMax - rangeMin;
	float rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);

	if(range < rangeMaxClamped) 
	{
		gl_FragColor = rgbyM;
		return;
	}

	float lumaNW = FxaaLuma(texture2D(textureSampler, sampleCoordNW, 0.0));
	float lumaSE = FxaaLuma(texture2D(textureSampler, sampleCoordSE, 0.0));
	float lumaNE = FxaaLuma(texture2D(textureSampler, sampleCoordNE, 0.0));
	float lumaSW = FxaaLuma(texture2D(textureSampler, sampleCoordSW, 0.0));
	float lumaNS = lumaN + lumaS;
	float lumaWE = lumaW + lumaE;
	float subpixRcpRange = 1.0 / range;
	float subpixNSWE = lumaNS + lumaWE;
	float edgeHorz1 = (-2.0 * lumaM) + lumaNS;
	float edgeVert1 = (-2.0 * lumaM) + lumaWE;
	float lumaNESE = lumaNE + lumaSE;
	float lumaNWNE = lumaNW + lumaNE;
	float edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
	float edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
	float lumaNWSW = lumaNW + lumaSW;
	float lumaSWSE = lumaSW + lumaSE;
	float edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
	float edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
	float edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
	float edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
	float edgeHorz = abs(edgeHorz3) + edgeHorz4;
	float edgeVert = abs(edgeVert3) + edgeVert4;
	float subpixNWSWNESE = lumaNWSW + lumaNESE;
	float lengthSign = texelSize.x;
	bool horzSpan = edgeHorz >= edgeVert;
	float subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;

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
		lengthSign = texelSize.y;
	}

	float subpixB = (subpixA * (1.0 / 12.0)) - lumaM;
	float gradientN = lumaN - lumaM;
	float gradientS = lumaS - lumaM;
	float lumaNN = lumaN + lumaM;
	float lumaSS = lumaS + lumaM;
	bool pairN = abs(gradientN) >= abs(gradientS);
	float gradient = max(abs(gradientN), abs(gradientS));

	if (pairN)
	{
		lengthSign = -lengthSign;
	}

	float subpixC = clamp(abs(subpixB) * subpixRcpRange, 0.0, 1.0);
	vec2 posB;

	posB.x = posM.x;
	posB.y = posM.y;

	vec2 offNP;

	offNP.x = (!horzSpan) ? 0.0 : texelSize.x;
	offNP.y = (horzSpan) ? 0.0 : texelSize.y;

	if (!horzSpan) 
	{
		posB.x += lengthSign * 0.5;
	}

	if (horzSpan)
	{
		posB.y += lengthSign * 0.5;
	}

	vec2 posN;

	posN.x = posB.x - offNP.x * 1.5;
	posN.y = posB.y - offNP.y * 1.5;

	vec2 posP;

	posP.x = posB.x + offNP.x * 1.5;
	posP.y = posB.y + offNP.y * 1.5;

	float subpixD = ((-2.0) * subpixC) + 3.0;
	float lumaEndN = FxaaLuma(texture2D(textureSampler, posN, 0.0));
	float subpixE = subpixC * subpixC;
	float lumaEndP = FxaaLuma(texture2D(textureSampler, posP, 0.0));

	if (!pairN) 
	{
		lumaNN = lumaSS;
	}

	float gradientScaled = gradient * 1.0 / 4.0;
	float lumaMM = lumaM - lumaNN * 0.5;
	float subpixF = subpixD * subpixE;
	bool lumaMLTZero = lumaMM < 0.0;

	lumaEndN -= lumaNN * 0.5;
	lumaEndP -= lumaNN * 0.5;

	bool doneN = abs(lumaEndN) >= gradientScaled;
	bool doneP = abs(lumaEndP) >= gradientScaled;

	if (!doneN) 
	{
		posN.x -= offNP.x * 3.0;
	}

	if (!doneN) 
	{
		posN.y -= offNP.y * 3.0;
	}

	bool doneNP = (!doneN) || (!doneP);

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
		if (!doneN) lumaEndN = FxaaLuma(texture2D(textureSampler, posN.xy, 0.0));
		if (!doneP) lumaEndP = FxaaLuma(texture2D(textureSampler, posP.xy, 0.0));
		if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
		if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
	
		doneN = abs(lumaEndN) >= gradientScaled;
		doneP = abs(lumaEndP) >= gradientScaled;
	
		if (!doneN) posN.x -= offNP.x * 12.0;
		if (!doneN) posN.y -= offNP.y * 12.0;
	
		doneNP = (!doneN) || (!doneP);
	
		if (!doneP) posP.x += offNP.x * 12.0;
		if (!doneP) posP.y += offNP.y * 12.0;
	}

	float dstN = posM.x - posN.x;
	float dstP = posP.x - posM.x;

	if (!horzSpan)
	{
		dstN = posM.y - posN.y;
	}
	if (!horzSpan) 
	{
		dstP = posP.y - posM.y;
	}

	bool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
	float spanLength = (dstP + dstN);
	bool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
	float spanLengthRcp = 1.0 / spanLength;
	bool directionN = dstN < dstP;
	float dst = min(dstN, dstP);
	bool goodSpan = directionN ? goodSpanN : goodSpanP;
	float subpixG = subpixF * subpixF;
	float pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
	float subpixH = subpixG * fxaaQualitySubpix;
	float pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
	float pixelOffsetSubpix = max(pixelOffsetGood, subpixH);

	if (!horzSpan)
	{
		posM.x += pixelOffsetSubpix * lengthSign;
	}

	if (horzSpan)
	{
		posM.y += pixelOffsetSubpix * lengthSign;
	}

	gl_FragColor = texture2D(textureSampler, posM, 0.0);
}