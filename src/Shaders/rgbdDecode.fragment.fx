// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

#include<helperFunctions>

#ifndef HAS_ORIGIN_BOTTOM_LEFT
    vec2 _forceFlipY(vec2 uv) {
        return vec2(uv.x, 1.0 - uv.y);
    }
#else
    vec2 _forceFlipY(vec2 uv) {
        return uv;
    }
#endif

void main(void) 
{
	gl_FragColor = vec4(fromRGBD(texture2D(textureSampler, _forceFlipY(vUV))), 1.0);
}