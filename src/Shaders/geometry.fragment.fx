#extension GL_EXT_draw_buffers : require

precision highp float;
precision highp int;

varying vec3 vNormalV;
varying vec4 vViewPos;

#ifdef POSITION
varying vec3 vPosition;
#endif

#ifdef VELOCITY
varying vec4 vCurrentPosition;
varying vec4 vPreviousPosition;
#endif

#ifdef ALPHATEST
varying vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

#include<mrtFragmentDeclaration>[RENDER_TARGET_COUNT]

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
    gl_FragData[POSITION_INDEX] = vec4(vPosition, 1.0);
    #endif

    #ifdef VELOCITY
    vec2 a = (vCurrentPosition.xy / vCurrentPosition.w) * 0.5 + 0.5;
	vec2 b = (vPreviousPosition.xy / vPreviousPosition.w) * 0.5 + 0.5;

    vec2 velocity = abs(a - b);
    velocity = vec2(pow(velocity.x, 1.0 / 3.0), pow(velocity.y, 1.0 / 3.0)) * sign(a - b) * 0.5 + 0.5;

    gl_FragData[VELOCITY_INDEX] = vec4(velocity, 0.0, 1.0);
    #endif
}