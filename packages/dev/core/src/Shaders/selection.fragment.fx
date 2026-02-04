#ifdef INSTANCES
flat varying float vSelectionId;
#else
uniform float selectionId;
#endif

#ifdef STORE_CAMERASPACE_Z
varying float vViewPosZ;
#else
varying float vDepthMetric;
#endif

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#include<clipPlaneFragmentDeclaration>

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

#ifdef ALPHATEST
    if (texture2D(diffuseSampler, vUV).a < 0.4)
        discard;
#endif

#ifdef INSTANCES
    float id = vSelectionId;
#else
    float id = selectionId;
#endif

#ifdef STORE_CAMERASPACE_Z
    gl_FragColor = vec4(id, vViewPosZ, 0.0, 1.0);
#else
    gl_FragColor = vec4(id, vDepthMetric, 0.0, 1.0);
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}
