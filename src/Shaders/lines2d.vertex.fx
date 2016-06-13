// based on if Instanced Array are supported or not, declare the field either as attribute or uniform
#ifdef Instanced
#define att attribute
#else
#define att uniform
#endif

attribute vec2 position;
att vec2 zBias;
att vec4 transformX;
att vec4 transformY;

#ifdef FillSolid
att vec4 fillSolidColor;
#endif

#ifdef BorderSolid
att vec4 borderSolidColor;
#endif

#ifdef FillGradient
att vec2 boundingMin;
att vec2 boundingMax;
att vec4 fillGradientColor1;
att vec4 fillGradientColor2;
att vec4 fillGradientTY;
#endif

#ifdef BorderGradient
att vec4 borderGradientColor1;
att vec4 borderGradientColor2;
att vec4 borderGradientTY;
#endif

#define TWOPI 6.28318530

// Output
varying vec2 vUV;
varying vec4 vColor;

void main(void) {

#ifdef FillSolid
	vColor = fillSolidColor;
#endif

#ifdef BorderSolid
	vColor = borderSolidColor;
#endif

#ifdef FillGradient
	float v = dot(vec4((position.xy - boundingMin) / (boundingMax - boundingMin), 1, 1), fillGradientTY);
	vColor = mix(fillGradientColor2, fillGradientColor1, v);	// As Y is inverted, Color2 first, then Color1
#endif

#ifdef BorderGradient
	float v = dot(vec4((position.xy - boundingMin) / (boundingMax - boundingMin), 1, 1), borderGradientTY);
	vColor = mix(borderGradientColor2, borderGradientColor1, v);	// As Y is inverted, Color2 first, then Color1
#endif

	vec4 pos;
	pos.xy = position.xy;
	pos.z = 1.0;
	pos.w = 1.0;
	gl_Position = vec4(dot(pos, transformX), dot(pos, transformY), zBias.x, 1);

}