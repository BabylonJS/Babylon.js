// Samplers
varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D velocitySampler;

uniform float motionStrength;
uniform float motionScale;
uniform vec2 screenSize;

void main(void)
{
    #ifdef GEOMETRY_SUPPORTED
    vec2 texelSize = 1.0 / screenSize;
    vec2 velocityColor = texture2D(velocitySampler, vUV).rg;
	
    vec2 velocity = vec2(pow(velocityColor.r, 1.0 / 3.0), pow(velocityColor.g, 1.0 / 3.0)) * 2.0 - 1.0;
	velocity *= motionScale * motionStrength;

    float speed = length(velocity / texelSize);
    int samplesCount = int(clamp(speed, 1.0, SAMPLES));

    velocity = normalize(velocity) * texelSize;
    float hlim = float(-samplesCount) * 0.5 + 0.5;

    vec4 result = texture2D(textureSampler, vUV);

    for (int i = 1; i < int(SAMPLES); ++i)
    {
        if (i >= samplesCount)
            break;
        
        vec2 offset = vUV + velocity * (hlim + float(i));
        result += texture2D(textureSampler, offset);
    }

	gl_FragColor = result / float(samplesCount);
    #else
    gl_FragColor = texture2D(textureSampler, vUV);
    #endif
}
