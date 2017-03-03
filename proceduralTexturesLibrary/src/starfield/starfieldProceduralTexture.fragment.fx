precision highp float;

//defined as const as fragment shaders does not support uniforms in loops
#define volsteps 20
#define iterations 15

varying vec2 vPosition;
varying vec2 vUV;

uniform float time;
uniform float alpha;
uniform float beta;
uniform float zoom;
uniform float formuparam;
uniform float stepsize;
uniform float tile;
uniform float brightness;
uniform float darkmatter;
uniform float distfading;
uniform float saturation;

void main()
{
	vec3 dir = vec3(vUV * zoom, 1.);

	float localTime = time * 0.0001;

	// Rotation
	mat2 rot1 = mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));
	mat2 rot2 = mat2(cos(beta), sin(beta), -sin(beta), cos(beta));
	dir.xz *= rot1;
	dir.xy *= rot2;
	vec3 from = vec3(1., .5, 0.5);
	from += vec3(-2., localTime*2., localTime);
	from.xz *= rot1;
	from.xy *= rot2;

	//volumetric rendering
	float s = 0.1, fade = 1.;
	vec3 v = vec3(0.);
	for (int r = 0; r < volsteps; r++) {
		vec3 p = from + s*dir*.5;
		p = abs(vec3(tile) - mod(p, vec3(tile*2.))); // tiling fold
		float pa, a = pa = 0.;
		for (int i = 0; i < iterations; i++) {
			p = abs(p) / dot(p, p) - formuparam; // the magic formula
			a += abs(length(p) - pa); // absolute sum of average change
			pa = length(p);
		}
		float dm = max(0., darkmatter - a*a*.001); //dark matter
		a *= a*a; // add contrast
		if (r > 6) fade *= 1. - dm; // dark matter, don't render near
								  //v+=vec3(dm,dm*.5,0.);
		v += fade;
		v += vec3(s, s*s, s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade *= distfading; // distance fading
		s += stepsize;
	}
	v = mix(vec3(length(v)), v, saturation); //color adjust
	gl_FragColor = vec4(v*.01, 1.);
}