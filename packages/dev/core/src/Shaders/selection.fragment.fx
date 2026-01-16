#ifdef INSTANCES
flat varying float vSelectionId;
#else
uniform float selectionId;
#endif

varying float vViewPosZ;

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

    gl_FragColor = vec4(id, vViewPosZ, 0.0, 1.0);

#define CUSTOM_FRAGMENT_MAIN_END
}
