// based on if Instanced Array are supported or not, declare the field either as attribute or uniform
#ifdef Instanced
#define att attribute
#else
#define att uniform
#endif

attribute float index;
att vec2 zBias;
att vec4 transformX;
att vec4 transformY;
att float opacity;

#ifdef Border
att float borderThickness;
#endif

#ifdef FillSolid
att vec4 fillSolidColor;
#endif

#ifdef BorderSolid
att vec4 borderSolidColor;
#endif

#ifdef FillGradient
att vec4 fillGradientColor1;
att vec4 fillGradientColor2;
att vec4 fillGradientTY;
#endif

#ifdef BorderGradient
att vec4 borderGradientColor1;
att vec4 borderGradientColor2;
att vec4 borderGradientTY;
#endif

// x, y and z are: width, height, subdivisions
att vec3 properties;

#define TWOPI 6.28318530

// Output
varying vec2 vUV;
varying vec4 vColor;

void main(void) {

	vec2 pos2;

#ifdef Border
	float w = properties.x;
	float h = properties.y;
	float ms = properties.z;
	vec2 borderOffset = vec2(1.0, 1.0);

	float segi = index;
	if (index < ms) {
		borderOffset = vec2(1.0-(borderThickness*2.0 / w), 1.0-(borderThickness*2.0 / h));
	}
	else {
		segi -= ms;
	}

	float angle = TWOPI * segi / ms;
	pos2.x = (cos(angle) / 2.0) + 0.5;
	pos2.y = (sin(angle) / 2.0) + 0.5;

	pos2.x = ((pos2.x - 0.5) * borderOffset.x) + 0.5;
	pos2.y = ((pos2.y - 0.5) * borderOffset.y) + 0.5;
#else
	if (index == 0.0) {
		pos2 = vec2(0.5, 0.5);
	}
	else {
		float ms = properties.z;

		float angle = TWOPI * (index - 1.0) / ms;
		pos2.x = (cos(angle) / 2.0) + 0.5;
		pos2.y = (sin(angle) / 2.0) + 0.5;
	}
#endif

#ifdef FillSolid
	vColor = fillSolidColor;
#endif

#ifdef BorderSolid
	vColor = borderSolidColor;
#endif

#ifdef FillGradient
	float v = dot(vec4(pos2.xy, 1, 1), fillGradientTY);
	vColor = mix(fillGradientColor2, fillGradientColor1, v);	// As Y is inverted, Color2 first, then Color1
#endif

#ifdef BorderGradient
	float v = dot(vec4(pos2.xy, 1, 1), borderGradientTY);
	vColor = mix(borderGradientColor2, borderGradientColor1, v);	// As Y is inverted, Color2 first, then Color1
#endif

	vColor.a *= opacity;
	vec4 pos;
	pos.xy = pos2.xy * properties.xy;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, 1);

}