// Samplers
varying vec2 vUV;

uniform sampler2D textureSampler;
uniform float motionStrength;
uniform float motionScale;
uniform vec2 screenSize;

#ifdef OBJECT_BASED
uniform sampler2D velocitySampler;
#else
uniform sampler2D depthSampler;

uniform mat4 inverseViewProjection;
uniform mat4 prevViewProjection;
#endif

void main(void)
{
    #ifdef GEOMETRY_SUPPORTED
        #ifdef OBJECT_BASED
            vec2 texelSize = 1.0 / screenSize;
            vec4 velocityColor = texture2D(velocitySampler, vUV);
            velocityColor.rg = velocityColor.rg * 2.0 - vec2(1.0);
            vec2 velocity = vec2(pow(velocityColor.r, 3.0), pow(velocityColor.g, 3.0)) * velocityColor.a;
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
            gl_FragColor.a = 1.0;
        #else
            vec2 texelSize = 1.0 / screenSize;
            float depth = texture2D(depthSampler, vUV).r;

            vec4 cpos = vec4(vUV * 2.0 - 1.0, depth, 1.0);
            cpos = cpos * inverseViewProjection;

            vec4 ppos = cpos * prevViewProjection;
            ppos.xyz /= ppos.w;
            ppos.xy = ppos.xy * 0.5 + 0.5;

            vec2 velocity = (ppos.xy - vUV) * motionScale * motionStrength;
            float speed = length(velocity / texelSize);
            int nSamples = int(clamp(speed, 1.0, SAMPLES));

            vec4 result = texture2D(textureSampler, vUV);

            for (int i = 1; i < int(SAMPLES); ++i) {
                if (i >= nSamples)
                    break;
                
                vec2 offset1 = vUV + velocity * (float(i) / float(nSamples - 1) - 0.5);
                result += texture2D(textureSampler, offset1);
            }

            gl_FragColor = result / float(nSamples);
        #endif
    #else
    gl_FragColor = texture2D(textureSampler, vUV);
    #endif
}
