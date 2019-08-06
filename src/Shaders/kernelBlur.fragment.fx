// Parameters
uniform sampler2D textureSampler;
uniform vec2 delta;

// Varying
varying vec2 sampleCenter;

#ifdef DOF
    uniform sampler2D circleOfConfusionSampler;

    uniform vec2 cameraMinMaxZ;

    float sampleDistance(const in vec2 offset) {
        float depth = texture2D(circleOfConfusionSampler, offset).g; // depth value from DepthRenderer: 0 to 1 
        return cameraMinMaxZ.x + (cameraMinMaxZ.y - cameraMinMaxZ.x)*depth; // actual distance from the lens 
    }
    float sampleCoC(const in vec2 offset) {
        float coc = texture2D(circleOfConfusionSampler, offset).r; 
        return coc; // actual distance from the lens 
    }
#endif

#include<kernelBlurVaryingDeclaration>[0..varyingCount]

#ifdef PACKEDFLOAT
	#include<packingFunctions>
#endif

void main(void)
{
    float computedWeight = 0.0;

    #ifdef PACKEDFLOAT	
        float blend = 0.;
    #else
        vec4 blend = vec4(0.);
    #endif

    #ifdef DOF
        float sumOfWeights = CENTER_WEIGHT; // Since not all values are blended, keep track of sum to devide result by at the end to get an average (start at center weight as center pixel is added by default)
        float factor = 0.0;

        // Add center pixel to the blur by default
        #ifdef PACKEDFLOAT
            blend += unpack(texture2D(textureSampler, sampleCenter)) * CENTER_WEIGHT;
        #else
            blend += texture2D(textureSampler, sampleCenter) * CENTER_WEIGHT;
        #endif
    #endif

    #include<kernelBlurFragment>[0..varyingCount]
    #include<kernelBlurFragment2>[0..depCount]

    #ifdef PACKEDFLOAT
        gl_FragColor = pack(blend);
    #else
        gl_FragColor = blend;
    #endif

    #ifdef DOF
        gl_FragColor /= sumOfWeights;
    #endif
}