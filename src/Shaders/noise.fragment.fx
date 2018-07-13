// Source: https://www.shadertoy.com/view/4lB3zz

// Uniforms
uniform float brightness;
uniform int firstOctave;
uniform int octaves;
uniform float persistence;
uniform vec2 timeScale;

// Varyings
varying vec2 vUV;

// Functions
float noise(int x,int y)
{   
    float fx = float(x);
    float fy = float(y);
    
    return 2.0 * fract(sin(dot(vec2(fx, fy), vec2(12.9898, 78.233))) * 43758.5453) - 1.0;
}

float smoothNoise(int x,int y)
{
    return noise(x, y) / 4.0 + (noise(x + 1, y) + noise(x - 1,y) + 
           noise(x, y + 1) + noise(x, y - 1)) / 8.0 + (noise(x + 1, y + 1) +
           noise(x + 1,y - 1) + noise(x - 1, y + 1) + noise(x - 1,y - 1)) / 16.0;
}

float cosInterpolation(float x,float y,float n)
{
    float r = n * 3.1415926;
    float f = (1.0 - cos(r)) * 0.5;
    return x * (1.0 - f) + y * f;    
}

float interpolationNoise(float x, float y)
{
    int ix = int(x);
    int iy = int(y);
    float fracx = x - float(int(x));
    float fracy = y - float(int(y));
    
    float v1 = smoothNoise(ix, iy);
    float v2 = smoothNoise(ix + 1, iy);
    float v3 = smoothNoise(ix, iy + 1);
    float v4 = smoothNoise(ix + 1, iy + 1);
    
   	float i1 = cosInterpolation(v1, v2, fracx);
    float i2 = cosInterpolation(v3, v4, fracx);
    
    return cosInterpolation(i1, i2, fracy);    
}

float perlinNoise2D(float x,float y)
{
    float sum = 0.0;
    float frequency = 0.0;
    float amplitude = 0.0;
    for(int i = firstOctave; i < octaves + firstOctave; i++)
    {
        frequency = pow(2.0, float(i));
        amplitude = pow(persistence, float(i));
        sum = sum + interpolationNoise(x * frequency, y * frequency) * amplitude;
    }
    
    return sum;
}

// Main
void main(void)
{
    float x = abs(vUV.x + timeScale.x);
    float y = abs(vUV.y + timeScale.y);

    float noise = brightness + (1.0 - brightness) * perlinNoise2D(x,y);

	gl_FragColor = vec4(noise, noise, noise, 1.0);
}
