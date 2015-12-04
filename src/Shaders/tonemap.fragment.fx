precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

// Constants
uniform float _ExposureAdjustment;

#if defined(HABLE_TONEMAPPING)
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    const float W = 11.2;
#endif

float Luminance(vec3 c)
{
    return dot(c, vec3(0.22, 0.707, 0.071));
}

void main(void) 
{
    vec3 colour = texture2D(textureSampler, vUV).rgb;

#if defined(REINHARD_TONEMAPPING)

    float lum = Luminance(colour.rgb); 
    float lumTm = lum * _ExposureAdjustment;
    float scale = lumTm / (1.0 + lumTm);  

    colour *= scale / lum;

#elif defined(HABLE_TONEMAPPING)

    colour *= _ExposureAdjustment;

    const float ExposureBias = 2.0;
    vec3 x = ExposureBias * colour;

    vec3 curr = ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    
    x = vec3(W, W, W);
    vec3 whiteScale = 1.0 / (((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F);
    colour = curr * whiteScale;

#elif defined(OPTIMIZED_HEJIDAWSON_TONEMAPPING)

    colour *= _ExposureAdjustment;
    
    vec3 X = max(vec3(0.0, 0.0, 0.0), colour - 0.004);
    vec3 retColor = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);

    colour = retColor * retColor;

#elif defined(PHOTOGRAPHIC_TONEMAPPING)

    colour =  vec3(1.0, 1.0, 1.0) - exp2(-_ExposureAdjustment * colour);

#endif

	gl_FragColor = vec4(colour.rgb, 1.0);
}