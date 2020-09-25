#ifdef PREPASS
#extension GL_EXT_draw_buffers : require
layout(location = 0) out vec4 glFragData[{X}];
vec4 gl_FragColor;

#ifdef PREPASS_DEPTHNORMAL
    varying vec3 vViewPos;
#endif
#ifdef PREPASS_VELOCITY
    varying vec4 vCurrentPosition;
    varying vec4 vPreviousPosition;
#endif

#endif
