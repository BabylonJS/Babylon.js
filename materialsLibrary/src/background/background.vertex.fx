precision highp float;

#include<__decl__backgroundVertex>

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif
#ifdef MAINUV2
varying vec2 vMainUV2; 
#endif

#if defined(OPACITY) && OPACITYDIRECTUV == 0
varying vec2 vOpacityUV;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]

void main(void) {

#include<instancesVertex>
#include<bonesVertex>

	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	mat3 normalWorld = mat3(finalWorld);

	#ifdef NONUNIFORMSCALING
		normalWorld = transposeMat3(inverseMat3(normalWorld));
	#endif

	vNormalW = normalize(normalWorld * normal);
#endif

#ifndef UV1
    vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
    vec2 uv2 = vec2(0., 0.);
#endif

#ifdef MAINUV1
	vMainUV1 = uv;
#endif 

#ifdef MAINUV2
	vMainUV2 = uv2;
#endif

#if defined(OPACITY) && OPACITYDIRECTUV == 0 
    if (vOpacityInfo.x == 0.)
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Shadows
#include<shadowsVertex>[0..maxSimultaneousLights]

    // Vertex color
#ifdef VERTEXCOLOR
    vColor = color;
#endif

    // Point size
#ifdef POINTSIZE
    gl_PointSize = pointSize;
#endif
}
