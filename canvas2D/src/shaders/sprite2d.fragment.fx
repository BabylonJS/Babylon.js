varying vec2 vUV;
varying float vOpacity;

#ifdef Scale9
varying vec2 vTopLeftUV;
varying vec2 vBottomRightUV;
varying vec4 vScale9;
varying vec2 vScaleFactor;
#endif

uniform bool alphaTest;
uniform sampler2D diffuseSampler;

void main(void) {
	
	vec2 uv = vUV;

#ifdef Scale9

	vec2 sizeUV = vBottomRightUV - vTopLeftUV;

	// Compute Horizontal (U) Coordinate
	float leftPartUV = vTopLeftUV.x + (vScale9.x / vScaleFactor.x);
	float rightPartUV = vTopLeftUV.x + sizeUV.x - ((sizeUV.x - vScale9.z) / vScaleFactor.x);

	if (vUV.x < leftPartUV) {
		uv.x = vTopLeftUV.x + ((vUV.x- vTopLeftUV.x) * vScaleFactor.x);
	}

	else if (vUV.x > rightPartUV) {
		uv.x = vTopLeftUV.x + vScale9.z + ((vUV.x - rightPartUV) * vScaleFactor.x);
	}

	else {
		float r = (vUV.x - leftPartUV) / (rightPartUV - leftPartUV);
		uv.x = vTopLeftUV.x + vScale9.x + ((vScale9.z-vScale9.x) * r);
	}

	// Compute Vertical (V) Coordinate
	float topPartUV = (vTopLeftUV.y + (vScale9.y / vScaleFactor.y));
	float bottomPartUV = (vTopLeftUV.y + sizeUV.y - ((sizeUV.y - vScale9.w) / vScaleFactor.y));

	if (vUV.y < topPartUV) {
		uv.y = vTopLeftUV.y + ((vUV.y - vTopLeftUV.y) * vScaleFactor.y);
	}

	else if (vUV.y > bottomPartUV) {
		uv.y = vTopLeftUV.y + vScale9.w + ((vUV.y - bottomPartUV) * vScaleFactor.y);
	}

	else {
		float r = (vUV.y - topPartUV) / (bottomPartUV - topPartUV);
		uv.y = vTopLeftUV.y + vScale9.y + ((vScale9.w - vScale9.y) * r);
	}

#endif

	vec4 color = texture2D(diffuseSampler, uv);
	if (alphaTest)
	{
		if (color.a < 0.95) {
			discard;
		}
	}
	color.a *= vOpacity;
	gl_FragColor = color;
}