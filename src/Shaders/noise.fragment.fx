// Source: https://www.shadertoy.com/view/4lB3zz

// Uniforms
uniform float brightness;
uniform float persistence;
uniform float timeScale;

// Varyings
varying vec2 vUV;

// Functions
vec2 hash22(vec2 p)
{
    p = p * mat2(127.1, 311.7, 269.5, 183.3);
	p = -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
	return sin(p * 6.283 + timeScale);
}

float interpolationNoise(vec2 p)
{
	vec2 pi = floor(p);
    vec2 pf = p-pi;
    
    vec2 w = pf * pf * (3.-2. * pf);
    
    float f00 = dot(hash22(pi + vec2(.0,.0)), pf-vec2(.0,.0));
    float f01 = dot(hash22(pi + vec2(.0,1.)), pf-vec2(.0,1.));
    float f10 = dot(hash22(pi + vec2(1.0,0.)), pf-vec2(1.0,0.));
    float f11 = dot(hash22(pi + vec2(1.0,1.)), pf-vec2(1.0,1.));
     
    float xm1 = mix(f00,f10,w.x);
    float xm2 = mix(f01,f11,w.x);
    
    float ym = mix(xm1,xm2,w.y); 
    return ym;
   
}

float perlinNoise2D(float x,float y)
{
    float sum = 0.0;
    float frequency = 0.0;
    float amplitude = 0.0;
    for(int i = 0; i < OCTAVES; i++)
    {
        frequency = pow(2.0, float(i));
        amplitude = pow(persistence, float(i));
        sum = sum + interpolationNoise(vec2(x * frequency, y * frequency)) * amplitude;
    }
    
    return sum;
}

// Main
void main(void)
{
    float x = abs(vUV.x);
    float y = abs(vUV.y);

    float noise = brightness + (1.0 - brightness) * perlinNoise2D(x,y);

	gl_FragColor = vec4(noise, noise, noise, 1.0);
}
