precision highp float;

// Constants
uniform vec4 vDiffuseColor;

// Input
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

// Samplers
#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform sampler2D diffuseSampler;
uniform vec2 vDiffuseInfos;
#endif

// Clip plane
#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

    vec4 color = vDiffuseColor;

#ifdef DIFFUSE
    vec4 diffuseTexture = texture2D(diffuseSampler, vDiffuseUV);
    color.rgb *= toLinearSpace(diffuseTexture.rgb);
    color.rgb *= vDiffuseInfos.y;
    color.a *= diffuseTexture.a;
#endif

#ifdef VERTEXCOLOR
    color.rgb *= vColor.rgb;

    #ifdef VERTEXALPHA
        color.a *= vColor.a;
    #endif
#endif

#ifdef ALPHATEST
    if (color.a <= ALPHATESTVALUE)
        discard;

    #ifndef ALPHABLEND
        // Prevent to blend with the canvas.
        color.a = 1.0;
    #endif
#endif

#include<depthPrePass>

#include<fogFragment>

    color.rgb = toGammaSpace(color.rgb);
    color = clamp(color, 0.0, 1.0);

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    color.rgb *= color.a;
#endif

    gl_FragColor = color;
}
