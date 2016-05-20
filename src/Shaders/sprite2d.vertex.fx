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
att vec2 origin;
att vec2 textureSize;
att float frame;
att float invertY;
att vec2 zBias;
att vec4 transformX;
att vec4 transformY;

// Uniforms

// Output
varying vec2 vUV;
varying vec4 vColor;

void main(void) {

	vec2 pos2;

	//vec2 off = vec2(1.0 / textureSize.x, 1.0 / textureSize.y);
	vec2 off = vec2(0.0, 0.0);

	// Left/Top
	if (index == 0.0) {
		pos2 = vec2(0.0, 0.0);
		vUV = vec2(topLeftUV.x + (frame*sizeUV.x) + off.x, topLeftUV.y - off.y);
	}

	// Left/Bottom
	else if (index == 1.0) {
		pos2 = vec2(0.0,  1.0);
		vUV = vec2(topLeftUV.x + (frame*sizeUV.x) + off.x, (topLeftUV.y + sizeUV.y));
	}

	// Right/Bottom
	else if (index == 2.0) {
		pos2 = vec2( 1.0,  1.0);
		vUV = vec2(topLeftUV.x + sizeUV.x + (frame*sizeUV.x), (topLeftUV.y + sizeUV.y));
	}

	// Right/Top
	else if (index == 3.0) {
		pos2 = vec2( 1.0, 0.0);
		vUV = vec2(topLeftUV.x + sizeUV.x + (frame*sizeUV.x), topLeftUV.y - off.y);
	}

	if (invertY == 1.0) {
		vUV.y = 1.0 - vUV.y;
	}

	vec4 pos;
	pos.xy = (pos2.xy * sizeUV * textureSize) - origin;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, zBias.y);
}	