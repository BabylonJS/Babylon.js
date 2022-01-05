// Attributes
attribute vec3 position;

#include<__decl__boundingBoxRendererVertex>


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

    vec4 worldPos = world * vec4(position, 1.0);

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		gl_Position = viewProjection * worldPos;
	} else {
		gl_Position = viewProjectionR * worldPos;
	}
#else
	gl_Position = viewProjection * worldPos;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
