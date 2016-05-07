// Attributes
attribute float index;
attribute vec2 zBias;

attribute vec4 transformX;
attribute vec4 transformY;

attribute vec2 topLeftUV;
attribute vec2 sizeUV;
attribute vec2 origin;
attribute vec2 textureSize;
attribute float frame;
attribute float invertY;

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
	pos.xy = (pos2.xy - origin) * sizeUV * textureSize;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, zBias.y);
}	