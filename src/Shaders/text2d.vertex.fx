﻿// based on if Instanced Array are supported or not, declare the field either as attribute or uniform
#ifdef Instanced
#define att attribute
#else
#define att uniform
#endif

// Attributes
attribute float index;
att vec2 zBias;

att vec4 transformX;
att vec4 transformY;
att float opacity;

att vec2 topLeftUV;
att vec2 sizeUV;
att vec2 textureSize;
att vec4 color;
att float superSampleFactor;

// Output
varying vec2 vUV;
varying vec4 vColor;

void main(void) {

	vec2 pos2;

	// Bottom/Left
	if (index == 0.0) {
		pos2 = vec2(0.0, 0.0);
		vUV = vec2(topLeftUV.x, topLeftUV.y + sizeUV.y);
	}

	// Top/Left
	else if (index == 1.0) {
		pos2 = vec2(0.0, 1.0);
		vUV = vec2(topLeftUV.x, topLeftUV.y);
	}
	
	// Top/Right
	else if (index == 2.0) {
		pos2 = vec2(1.0, 1.0);
		vUV = vec2(topLeftUV.x + sizeUV.x, topLeftUV.y);
	}

	// Bottom/Right
	else if (index == 3.0) {
		pos2 = vec2(1.0, 0.0);
		vUV = vec2(topLeftUV.x + sizeUV.x, topLeftUV.y + sizeUV.y);
	}

	// Align texture coordinate to texel to enhance rendering quality
	vUV = (floor(vUV*textureSize) + vec2(0.0, 0.0)) / textureSize;

	vColor = color;
	vColor.a *= opacity;
	vec4 pos;
	pos.xy = floor(pos2.xy * superSampleFactor * sizeUV * textureSize);	// Align on target pixel to avoid bad interpolation
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, 1);
}