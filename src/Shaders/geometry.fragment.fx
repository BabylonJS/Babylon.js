#extension GL_EXT_draw_buffers : require

precision highp float;
precision highp int;

varying vec3 vNormalV;
varying vec4 vViewPos;

#ifdef POSITION
varying vec3 vPosition;
#endif

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#if __VERSION__ >= 200
    layout(location = 0) out vec4 color0;
    layout(location = 1) out vec4 color1;

    #ifdef POSITION
    layout(location = 2) out vec4 color2;
    #endif
#else
    #define color0 gl_FragData[0]
    #define color1 gl_FragData[1]
    #define color2 gl_FragData[2]
#endif

void main() {
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

    color0 = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
    color1 = vec4(normalize(vNormalV), 1.0);
    //color2 = vec4(vPositionV, 1.0);

    #ifdef POSITION
    color2 = vec4(vPosition, 1.0);
    #endif
}