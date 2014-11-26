#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPosition;
varying vec2 vUV;

vec3 hash(vec3 x)
{
	x = vec3(dot(x, vec3(127.1, 311.7, 74.7)),
		dot(x, vec3(269.5, 183.3, 246.1)),
		dot(x, vec3(113.5, 271.9, 124.6)));

	return fract(sin(x)*43758.5453123);
}

// returns closest, second closest, and cell id
vec3 voronoi(in vec3 x)
{
	vec3 p = floor(x);
	vec3 f = fract(x);

	float id = 0.0;
	vec2 res = vec2(100.0);
	for (int k = -1; k <= 1; k++)
		for (int j = -1; j <= 1; j++)
			for (int i = -1; i <= 1; i++)
			{
		vec3 b = vec3(float(i), float(j), float(k));
		vec3 r = vec3(b) - f + hash(p + b);
		float d = dot(r, r);

		if (d < res.x)
		{
			id = dot(p + b, vec3(1.0, 57.0, 113.0));
			res = vec2(d, res.x);
		}
		else if (d < res.y)
		{
			res.y = d;
		}
			}

	return vec3(sqrt(res), abs(id));
}

const mat3 m = mat3(0.00, 0.80, 0.60,
	-0.80, 0.36, -0.48,
	-0.60, -0.48, 0.64);

void main(void)
{
	vec2 p = vUV;

	// camera movement	
	float an = 0.5*0.1;
	vec3 ro = vec3(2.5*cos(an), 1.0, 2.5*sin(an));
	vec3 ta = vec3(0.0, 1.0, 0.0);
	// camera matrix
	vec3 ww = normalize(ta - ro);
	vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
	vec3 vv = normalize(cross(uu, ww));
	// create view ray
	vec3 rd = normalize(p.x*uu + p.y*vv + 1.5*ww);

	// sphere center	
	vec3 sc = vec3(0.0, 1.0, 0.0);

	// raytrace
	float tmin = 10000.0;
	vec3  nor = vec3(0.0);
	float occ = 1.0;
	vec3  pos = vec3(0.0);

	// raytrace-plane
	float h = (0.0 - ro.y) / rd.y;
	if (h>0.0)
	{
		tmin = h;
		nor = vec3(0.0, 1.0, 0.0);
		pos = ro + h*rd;
		vec3 di = sc - pos;
		float l = length(di);
		occ = 1.0 - dot(nor, di / l)*1.0*1.0 / (l*l);
	}

	// raytrace-sphere
	vec3  ce = ro - sc;
	float b = dot(rd, ce);
	float c = dot(ce, ce) - 1.0;
	h = b*b - c;
	if (h>0.0)
	{
		h = -b - sqrt(h);
		if (h<tmin)
		{
			tmin = h;
			nor = normalize(ro + h*rd - sc);
			occ = 0.5 + 0.5*nor.y;
		}
	}

	// shading/lighting	
	vec3 col = vec3(0.9);
	if (tmin<100.0)
	{
		pos = ro + tmin*rd;

		float f = voronoi(4.0*pos).x;

		f *= occ;
		col = vec3(f*1.2);
		col = mix(col, vec3(0.9), 1.0 - exp(-0.003*tmin*tmin));
	}

	col = sqrt(col);


	gl_FragColor = vec4(col, 1.0);
}