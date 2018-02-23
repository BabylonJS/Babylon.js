precision highp float;

// Attributes
attribute vec3 position;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>

void main(void) {

#include<instancesVertex>
#include<bonesVertex>

    gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

    // Texture coordinates
#ifndef UV1
    vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
    vec2 uv2 = vec2(0., 0.);
#endif

#ifdef DIFFUSE
    if (vDiffuseInfos.x == 0.)
    {
        vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
    }
    else
    {
        vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
    }
#endif

    // Clip plane
#include<clipPlaneVertex>

    // Fog
#include<fogVertex>

    // Vertex color
#ifdef VERTEXCOLOR
    vColor = color;
#endif

    // Point size
#ifdef POINTSIZE
    gl_PointSize = pointSize;
#endif
}
