#ifndef UNIFORM_SCENE
#define UNIFORM_SCENE

uniform mat4 viewProjection;
#ifdef MULTIVIEW
    uniform mat4 viewProjectionR;
#endif
uniform mat4 view;
uniform mat4 projection;
uniform vec4 vEyePosition;

#endif
