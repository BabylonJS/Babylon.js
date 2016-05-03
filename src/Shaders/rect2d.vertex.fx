// Attributes
attribute float index;
attribute vec2 zBias;
attribute vec4 transformX;
attribute vec4 transformY;
attribute vec2 origin;

attribute vec4 fillSolidColor;

attribute vec3 properties;

// First index is the center, then there's four sections of 16 subdivisions

#define rsub0 17.0
#define rsub1 33.0
#define rsub2 49.0
#define rsub3 65.0
#define rsub 64.0
#define TWOPI 6.28318530

// Output
varying vec2 vUV;
varying vec4 vColor;

void main(void) {

	vec2 pos2;
	if (index == 0.0) {
		pos2 = vec2(0.5, 0.5) * properties.xy;
	}
	else {
		float w = properties.x;
		float h = properties.y;
		float r = properties.z;

		if (index < rsub0) {
			pos2 = vec2(w-r, r);
		}
		else if (index < rsub1) {
			pos2 = vec2(r, r);
		}
		else if (index < rsub2) {
			pos2 = vec2(r, h - r);
		}
		else {
			pos2 = vec2(w - r, h - r);
		}

		float angle = TWOPI - ((index - 1.0) * TWOPI / (rsub-1.0));
		pos2.x += cos(angle) * properties.z;
		pos2.y += sin(angle) * properties.z;

	}

	vColor = fillSolidColor;

	vec4 pos;
	pos.xy = pos2.xy - (origin * properties.xy);
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, zBias.y);
}