// Attributes
attribute float index;
attribute vec2 zBias;
attribute vec4 transformX;
attribute vec4 transformY;
attribute vec2 origin;

#ifdef FillSolid
attribute vec4 fillSolidColor;
#endif

#ifdef FillGradient
attribute vec4 fillGradientColor1;
attribute vec4 fillGradientColor2;
attribute vec4 fillGradientTY;
#endif

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
		pos2 = vec2(0.5, 0.5);
	}
	else {
		float w = properties.x;
		float h = properties.y;
		float r = properties.z;
		float nru = r / w;
		float nrv = r / h;

		if (index < rsub0) {
			pos2 = vec2(1.0-nru, nrv);
		}
		else if (index < rsub1) {
			pos2 = vec2(nru, nrv);
		}
		else if (index < rsub2) {
			pos2 = vec2(nru, 1.0 - nrv);
		}
		else {
			pos2 = vec2(1.0 - nru, 1.0 - nrv);
		}

		float angle = TWOPI - ((index - 1.0) * TWOPI / (rsub-1.0));
		pos2.x += cos(angle) * nru;
		pos2.y += sin(angle) * nrv;
	}

#ifdef FillSolid
	vColor = fillSolidColor;
#endif
#ifdef FillGradient
	float v = dot(vec4(pos2.xy, 1, 1), fillGradientTY);
	vColor = mix(fillGradientColor2, fillGradientColor1, v);	// As Y is inverted, Color2 first, then Color1
#endif

	vec4 pos;
	pos.xy = (pos2.xy - origin) * properties.xy;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, zBias.y);
}