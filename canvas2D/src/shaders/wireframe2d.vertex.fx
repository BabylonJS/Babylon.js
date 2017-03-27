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
att vec3 renderingInfo;
att float opacity;

// Uniforms

// Output
varying vec4 vColor;

void main(void) {

	vec4 p = vec4(pos.xy, 1.0, 1.0);
	vColor = vec4(col.xyz, col.w*opacity);

	float x = dot(p, transformX);
	float y = dot(p, transformY);
	if (renderingInfo.z == 1.0) {
		float rw = renderingInfo.x;
		float rh = renderingInfo.y;
		float irw = 2.0 / rw;
		float irh = 2.0 / rh;

		x = (floor((x / irw) + 0.5) * irw) + irw/2.0;
		y = (floor((y / irh) + 0.5) * irh) + irh/2.0;
	}

	gl_Position = vec4(x, y, zBias.x, 1);
}