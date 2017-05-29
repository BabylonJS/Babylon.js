#version 300 es

precision highp float;
precision highp int;

in vec3 vNormalV;
in vec4 vViewPos;

#ifdef ALPHATEST
in vec2 vUV;
uniform sampler2D diffuseSampler;
#endif

layout(location = 0) out vec4 color0;
layout(location = 1) out vec4 color1;

void main() {
#ifdef ALPHATEST
	if (texture(diffuseSampler, vUV).a < 0.4)
		discard;
#endif

    color0 = vec4(vViewPos.z / vViewPos.w, 0.0, 0.0, 0.0);
    color1 = vec4(normalize(vNormalV), 1.0);
    //color2 = vec4(vPositionV, 1.0);
}