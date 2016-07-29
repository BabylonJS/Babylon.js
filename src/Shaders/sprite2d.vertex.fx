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
att vec2 scaleFactor;
att vec2 textureSize;

// x: frame, y: invertY, z: alignToPixel
att vec3 properties;

att vec2 zBias;
att vec4 transformX;
att vec4 transformY;
att float opacity;

// Uniforms

// Output
varying vec2 vUV;
varying float vOpacity;

void main(void) {

	vec2 pos2;

	//vec2 off = vec2(1.0 / textureSize.x, 1.0 / textureSize.y);
	vec2 off = vec2(0.0, 0.0);
	vec2 sfSizeUV = sizeUV * scaleFactor;

	float frame = properties.x;
	float invertY = properties.y;
	float alignToPixel = properties.z;

	// Left/Top
	if (index == 0.0) {
		pos2 = vec2(0.0, 0.0);
		vUV = vec2(topLeftUV.x + (frame*sfSizeUV.x) + off.x, topLeftUV.y - off.y);
	}

	// Left/Bottom
	else if (index == 1.0) {
		pos2 = vec2(0.0,  1.0);
		vUV = vec2(topLeftUV.x + (frame*sfSizeUV.x) + off.x, (topLeftUV.y + sfSizeUV.y));
	}

	// Right/Bottom
	else if (index == 2.0) {
		pos2 = vec2( 1.0,  1.0);
		vUV = vec2(topLeftUV.x + sfSizeUV.x + (frame*sfSizeUV.x), (topLeftUV.y + sfSizeUV.y));
	}

	// Right/Top
	else if (index == 3.0) {
		pos2 = vec2( 1.0, 0.0);
		vUV = vec2(topLeftUV.x + sfSizeUV.x + (frame*sfSizeUV.x), topLeftUV.y - off.y);
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

	vOpacity = opacity;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, 1);
}	