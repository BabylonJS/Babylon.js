vec4 pack(float depth)
{
	const vec4 bit_shift = vec4(255.0 * 255.0 * 255.0, 255.0 * 255.0, 255.0, 1.0);
	const vec4 bit_mask = vec4(0.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);

	vec4 res = fract(depth * bit_shift);
	res -= res.xxyz * bit_mask;

	return res;
}

// Thanks to http://devmaster.net/
vec2 packHalf(float depth) 
{ 
	const vec2 bitOffset = vec2(1.0 / 255., 0.);
	vec2 color = vec2(depth, fract(depth * 255.));

	return color - (color.yy * bitOffset);
}

varying vec4 vPosition;

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#ifdef CUBEMAP
uniform vec3 lightPosition;
uniform vec2 depthValues;
#endif

void main(void)
{
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

#ifdef CUBEMAP
	vec3 directionToLight = vPosition.xyz - lightPosition;
	
	float depth = length(directionToLight);
	depth = (depth - depthValues.x) / (depthValues.y - depthValues.x);
	depth = clamp(depth, 0., 1.0);
#else
	float depth = vPosition.z / vPosition.w;
	depth = depth * 0.5 + 0.5;
#endif

#ifdef VSM
	float moment1 = depth;
	float moment2 = moment1 * moment1;

	gl_FragColor = vec4(packHalf(moment1), packHalf(moment2));
#else
	gl_FragColor = pack(depth);
#endif
}