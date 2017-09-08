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

#ifdef POSITION
#include<mrtFragmentDeclaration>[3]
#else
#include<mrtFragmentDeclaration>[2]
#endif

void main() {
#ifdef ALPHATEST
	if (texture2D(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

    gl_FragData[0] = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
    //color0 = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 1.0);
    gl_FragData[1] = vec4(normalize(vNormalV), 1.0);
    //color2 = vec4(vPositionV, 1.0);

    #ifdef POSITION
    gl_FragData[2] = vec4(vPosition, 1.0);
    #endif
}