#ifdef GL_ES
precision mediump float;
#endif

vec4 pack(float depth)
{
	const vec4 bitOffset = vec4(255. * 255. * 255., 255. * 255., 255., 1.);
	const vec4 bitMask = vec4(0., 1. / 255., 1. / 255., 1. / 255.);
	
	vec4 comp = mod(depth * bitOffset * vec4(254.), vec4(255.)) / vec4(254.);
	comp -= comp.xxyz * bitMask;
	
	return comp;
}

// Thanks to http://devmaster.net/
vec2 packHalf(float depth) 
{ 
	const vec2 bitOffset = vec2(1.0 / 255., 0.);
	vec2 color = vec2(depth, fract(depth * 255.));

	return color - (color.yy * bitOffset);
}

#ifndef VSM
varying vec4 vPosition;
#endif

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

#ifdef VSM
	float moment1 = gl_FragCoord.z / gl_FragCoord.w;
	float moment2 = moment1 * moment1;
	gl_FragColor = vec4(packHalf(moment1), packHalf(moment2));
#else
	gl_FragColor = pack(vPosition.z / vPosition.w);
#endif
}