#if defined(INSTANCES)
flat varying float vSelectionId;
#else
uniform float selectionId;
#endif
varying float vViewPosZ;

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#if defined(INSTANCES)
    float id = vSelectionId;
#else
    float id = selectionId;
#endif

    gl_FragColor = vec4(id, vViewPosZ, 0.0, 1.0);

#define CUSTOM_FRAGMENT_MAIN_END
}
