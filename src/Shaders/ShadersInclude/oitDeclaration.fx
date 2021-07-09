#ifdef ORDER_INDEPENDANT_TRANSPARENCY
#extension GL_EXT_draw_buffers : require
layout(location=0) out vec2 depth;  // RG32F, R - negative front depth, G - back depth
layout(location=1) out vec4 frontColor;
layout(location=2) out vec4 backColor;
#define MAX_DEPTH 99999.0
highp vec4 gl_FragColor;

uniform sampler2D oitDepthSampler;
uniform sampler2D oitFrontColorSampler;
#endif
