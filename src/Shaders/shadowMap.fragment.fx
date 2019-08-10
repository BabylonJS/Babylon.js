#ifndef FLOAT
	#include<packingFunctions>
#endif

varying float vDepthMetric;

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

uniform vec3 biasAndScale;
uniform vec2 depthValues;

void main(void)
{
#ifdef ALPHATEST
    if (texture2D(diffuseSampler, vUV).a < 0.4)
        discard;
#endif

    float depth = vDepthMetric;

#ifdef ESM
    depth = clamp(exp(-min(87., biasAndScale.z * depth)), 0., 1.);
#endif

#ifdef FLOAT
    gl_FragColor = vec4(depth, 1.0, 1.0, 1.0);
#else
    gl_FragColor = pack(depth);
#endif
}