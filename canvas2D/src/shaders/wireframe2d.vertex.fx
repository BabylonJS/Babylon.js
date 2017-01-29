// based on if Instanced Array are supported or not, declare the field either as attribute or uniform
#ifdef Instanced
#define att attribute
#else
#define att uniform
#endif

// Attributes
attribute vec2 pos;
attribute vec4 col;

// x, y, z are
//  x : alignedToPixel: 1.0 === yes, otherwise no
//  y : 1/renderGroup.Width
//  z : 1/renderGroup.height
att vec3 properties;

att vec2 zBias;
att vec4 transformX;
att vec4 transformY;
att float opacity;

// Uniforms

// Output
varying vec4 vColor;

void main(void) {

	vec4 p = vec4(pos.xy, 1.0, 1.0);
	vColor = vec4(col.xyz, col.w*opacity);

	vec4 pp = vec4(dot(p, transformX), dot(p, transformY), zBias.x, 1);
	
	if (properties.x == 1.0) {
		pp.xy = pp.xy - mod(pp.xy, properties.yz) + (properties.yz*0.5);
	}

	gl_Position = pp;
}	