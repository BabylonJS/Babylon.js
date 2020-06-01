#ifdef HIGH_DEFINITION_PIPELINE
#if __VERSION__ >= 200
#extension GL_EXT_draw_buffers : require
layout(location = 0) out vec4 glFragData[{X}];
vec4 gl_FragColor;
#endif
#endif
