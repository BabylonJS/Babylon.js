precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif

// Uniforms
uniform mat4 projection;
uniform mat4 world;
uniform mat4 view;
uniform mat4 worldView;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;

#include<fogVertexDeclaration>

#ifdef OPACITY
varying vec2 vOpacityUV;
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

void main(void) {

    #ifdef FOG
    vec4 worldPos = world * vec4(position, 1.0);
    #endif

    #include<fogVertex>

    vec4 cameraSpacePosition = worldView * vec4(position, 1.0);
    gl_Position = projection * cameraSpacePosition;

#ifdef OPACITY
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif
	if (vOpacityInfos.x == 0.)
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif    

    vPosition = position;
    vNormal = normal;
}