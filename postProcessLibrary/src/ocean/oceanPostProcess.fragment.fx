/*
 * "Seascape" by Alexander Alekseev aka TDM - 2014
 * Babylon.js integration by luaacro https://twitter.com/Luaacro
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Contact: tdmaav@gmail.com
 */

// Uniforms
uniform sampler2D textureSampler;
uniform sampler2D positionSampler;

#ifdef REFLECTION_ENABLED
uniform sampler2D reflectionSampler;
#endif
#ifdef REFRACTION_ENABLED
uniform sampler2D refractionSampler;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec3 cameraRotation;
uniform vec3 cameraPosition;

// Varyings
varying vec2 vUV;

// Constants
const int NUM_STEPS = 8;
const float PI	 	= 3.141592;
const float EPSILON	= 1e-3;
#define EPSILON_NRM (0.1 / resolution.x)

// Sea
const int ITER_GEOMETRY = 8;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);
#define SEA_TIME (1.0 + time * SEA_SPEED)
const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// Math
mat3 fromEuler(vec3 ang)
{
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}

float hash( vec2 p )
{
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// Lighting
float diffuse(vec3 n,vec3 l,float p)
{
    return pow(dot(n,l) * 0.4 + 0.6,p);
}

float specular(vec3 n,vec3 l,vec3 e,float s)
{
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// Sea
float sea_octave(vec2 uv, float choppy)
{
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p)
{
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++)
    {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p)
{
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++)
    {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist)
{
    float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0) * 0.65;

    #if defined(REFLECTION_ENABLED) || defined(REFRACTION_ENABLED)
    vec2 reflectionUv = vec2(vUV.x, vUV.y + normalize(n).y);
    #endif

    #ifdef REFLECTION_ENABLED
    vec3 reflected = texture2D(reflectionSampler, reflectionUv).rgb * (1.0 - fresnel);
    #else
    vec3 eyeNormal = reflect(eye, n);
    eyeNormal.y = max(eyeNormal.y,0.0);
    vec3 reflected = vec3(pow(1.0-eyeNormal.y,2.0), 1.0-eyeNormal.y, 0.6+(1.0-eyeNormal.y)*0.4);
    #endif

    #ifdef REFRACTION_ENABLED
    vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;
    refracted += (texture2D(refractionSampler, reflectionUv).rgb * fresnel);
    #else
    vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;
    #endif

    vec3 color = mix(refracted, reflected, fresnel);
    
    float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;
    
    color += vec3(specular(n,l,eye,60.0));
    
    return color;
}

// Tracing
vec3 getNormal(vec3 p, float eps)
{
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p)
{
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;   
    float hm = map(ori + dir * tm);    
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++)
    {
        tmid = mix(tm,tx, hm/(hm-hx));                   
        p = ori + dir * tmid;                   
    	float hmid = map(p);
        if(hmid < 0.0)
        {
        	tx = tmid;
            hx = hmid;
        }
        else
        {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

// Main
void main()
{
    #ifdef NOT_SUPPORTED
    // Just work as a pass through
    gl_FragColor = texture2D(textureSampler, vUV);
    #else
	vec2 uv = vUV;
    uv = uv * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;
    
    // ray
    vec3 ang = vec3(cameraRotation.z, cameraRotation.x, cameraRotation.y);
    vec3 ori = vec3(cameraPosition.x, cameraPosition.y, -cameraPosition.z);

    vec3 dir = normalize(vec3(uv.xy, -3.0));
    dir = normalize(dir) * fromEuler(ang);
    
    // Tracing
    vec3 p;
    heightMapTracing(ori, dir, p);
    vec3 dist = p - ori;

    vec3 n = getNormal(p, dot(dist, dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0, 1.0, 0.8));
    
    // Color
    float seaFact = clamp(max(ori.y, 0.0), 0.0, 1.0);
    vec3 position = texture2D(positionSampler, vUV).rgb;
    vec3 baseColor = texture2D(textureSampler, vUV).rgb;

    vec3 color = baseColor;

    if (max(position.y, 0.0) < p.y)
    {
        // Sea above
        color = mix(
            baseColor,
            getSeaColor(p, n, light, dir, dist),
            pow(smoothstep(0.0, -0.05, dir.y), 0.3)
        ) * seaFact;
    }

    color = mix(
        color,
        baseColor * SEA_BASE + diffuse(n, n, 80.0) * SEA_WATER_COLOR * 0.12,
        1.0 - seaFact
    );

    // post
    gl_FragColor = vec4(pow(color, vec3(0.75)), 1.0);
    #endif
}
