// based on if Instanced Array are supported or not, declare the field either as attribute or uniform
#ifdef Instanced
#define att attribute
#else
#define att uniform
#endif

// Attributes
attribute float index;

att vec2 topLeftUV;
att vec2 sizeUV;
#ifdef Scale9
att vec2 scaleFactor;
#endif
att vec2 textureSize;

// x: frame, y: invertY, z: alignToPixel
att vec3 properties;

#ifdef Scale9
att vec4 scale9;
#endif

att vec2 zBias;
att vec4 transformX;
att vec4 transformY;
att float opacity;

// Uniforms

// Output
varying vec2 vUV;
varying float vOpacity;

#ifdef Scale9
varying vec2 vTopLeftUV;
varying vec2 vBottomRightUV;
varying vec4 vScale9;
varying vec2 vScaleFactor;
#endif

void main(void) {

	vec2 pos2;

	float frame = properties.x;
	float invertY = properties.y;
	float alignToPixel = properties.z;

	// Left/Top
	if (index == 0.0) {
		pos2 = vec2(0.0, 0.0);
		vUV = vec2(topLeftUV.x + (frame*sizeUV.x), topLeftUV.y);
	}

	// Left/Bottom
	else if (index == 1.0) {
		pos2 = vec2(0.0,  1.0);
		vUV = vec2(topLeftUV.x + (frame*sizeUV.x), (topLeftUV.y + sizeUV.y));
	}

	// Right/Bottom
	else if (index == 2.0) {
		pos2 = vec2( 1.0,  1.0);
		vUV = vec2(topLeftUV.x + sizeUV.x + (frame*sizeUV.x), (topLeftUV.y + sizeUV.y));
	}

	// Right/Top
	else if (index == 3.0) {
		pos2 = vec2( 1.0, 0.0);
		vUV = vec2(topLeftUV.x + sizeUV.x + (frame*sizeUV.x), topLeftUV.y);
	}

	if (invertY == 1.0) {
		vUV.y = 1.0 - vUV.y;
	}

	vec4 pos;
	if (alignToPixel == 1.0)
	{
		pos.xy = floor(pos2.xy * sizeUV * textureSize);
	} else {
		pos.xy = pos2.xy * sizeUV * textureSize;
	}

#ifdef Scale9
	if (invertY == 1.0) {
		vTopLeftUV = vec2(topLeftUV.x, 1.0 - (topLeftUV.y + sizeUV.y));
		vBottomRightUV = vec2(topLeftUV.x + sizeUV.x, 1.0 - topLeftUV.y);
		vScale9 = vec4(scale9.x, sizeUV.y - scale9.w, scale9.z, sizeUV.y - scale9.y);
	}
	else {
		vTopLeftUV = topLeftUV;
		vBottomRightUV = vec2(topLeftUV.x, topLeftUV.y + sizeUV.y);
		vScale9 = scale9;
	}
	vScaleFactor = scaleFactor;
#endif

	vOpacity = opacity;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, 1);
}	