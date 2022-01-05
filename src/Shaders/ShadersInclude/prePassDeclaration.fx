#ifdef PREPASS
#extension GL_EXT_draw_buffers : require
layout(location = 0) out highp vec4 glFragData[{X}];
highp vec4 gl_FragColor;

#ifdef PREPASS_DEPTH
    varying highp vec3 vViewPos;
#endif
#ifdef PREPASS_VELOCITY
    varying highp vec4 vCurrentPosition;
    varying highp vec4 vPreviousPosition;
#endif

#endif
