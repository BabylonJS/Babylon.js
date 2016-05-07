// Attributes
attribute float index;
attribute vec2 zBias;

attribute vec4 transformX;
attribute vec4 transformY;

attribute vec2 topLeftUV;
attribute vec2 sizeUV;
attribute vec2 origin;
attribute vec2 textureSize;

// Uniforms

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

	vec4 pos;
	pos.xy = (pos2.xy - origin) * sizeUV * textureSize;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, zBias.y);
}