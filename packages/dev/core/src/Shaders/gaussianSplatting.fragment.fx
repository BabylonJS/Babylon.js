#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif

precision highp float;

#include<helperFunctions>

varying vec3 vPositionW;
varying vec4 vColor;

// Forces linear space for image processing
#ifndef FROMLINEARSPACE
    #define FROMLINEARSPACE;
#endif

#include<imageProcessingFunctions>

#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    float A = -dot(vPositionW.xy, vPositionW.xy);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    vec4 color = vec4(vColor.rgb, B);

#include<fogFragment>

#ifdef IMAGEPROCESSINGPOSTPROCESS
    // Sanitize output incase invalid normals or tangents have caused div by 0 or undefined behavior
    // this also limits the brightness which helpfully reduces over-sparkling in bloom (native handles this in the bloom blur shader)
#if !defined(SKIPFINALCOLORCLAMP)
    color.rgb = clamp(color.rgb, 0., 30.0);
#endif
#else
    // Alway run even to ensure going back to gamma space.
    color = applyImageProcessing(color);
#endif

#ifdef PREMULTIPLYALPHA
    // Convert to associative (premultiplied) format if needed.
    color.rgb *= color.a;
#endif

#ifdef NOISE
    color.rgb += dither(vPositionW.xy, 0.5);
    color = max(color, 0.0);
#endif

    gl_FragColor = color;

#define CUSTOM_FRAGMENT_MAIN_END
}
