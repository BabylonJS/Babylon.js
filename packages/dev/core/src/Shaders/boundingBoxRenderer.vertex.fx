// Attributes
attribute vec3 position;

#include<__decl__boundingBoxRendererVertex>

#ifdef INSTANCES
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
#endif

#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef INSTANCES
    mat4 finalWorld = mat4(world0, world1, world2, world3);
    vec4 worldPos = finalWorld * vec4(position, 1.0);
#else
    vec4 worldPos = world * vec4(position, 1.0);
#endif
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
