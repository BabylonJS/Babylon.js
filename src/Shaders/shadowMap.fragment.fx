#ifndef FLOAT
	#include<packingFunctions>
#endif

varying float vDepthMetric;

#ifdef USEDISTANCE
uniform vec3 lightData;
varying vec3 vPositionW;
#endif

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

uniform vec3 biasAndScale;
uniform vec2 depthValues;

#ifdef DEPTHCLAMP
varying float z;
#endif

#include<clipPlaneFragmentDeclaration>

void main(void)
{
#include<clipPlaneFragment>

#ifdef ALPHATEST
    if (texture2D(diffuseSampler, vUV).a < 0.4)
        discard;
#endif

    float depth = vDepthMetric;

#ifdef DEPTHCLAMP
    #ifdef USEDISTANCE
        depth = clamp(((length(vPositionW - lightData) + depthValues.x) / (depthValues.y)) + biasAndScale.x, 0.0, 1.0);
    #else
        depth = clamp(((z + depthValues.x) / (depthValues.y)) + biasAndScale.x, 0.0, 1.0);
    #endif
    gl_FragDepth = depth;
#elif defined(USEDISTANCE)
    depth = (length(vPositionW - lightData) + depthValues.x) / (depthValues.y) + biasAndScale.x;
#endif

#ifdef ESM
    depth = clamp(exp(-min(87., biasAndScale.z * depth)), 0., 1.);
#endif

#ifdef FLOAT
    gl_FragColor = vec4(depth, 1.0, 1.0, 1.0);
#else
    gl_FragColor = pack(depth);
#endif
}