uniform sampler2D background; // main
uniform sampler2D foreground;

uniform vec2 scaleUV;
uniform vec2 translateUV;
uniform float alphaMode;
uniform float foregroundAlphaScale;

vec4 composition(vec2 vUV) { // main
    vec4 background = texture2D(background, vUV);

    vec2 transformedUV = vUV * (1.0 / scaleUV) + translateUV;
    if (transformedUV.x < 0.0 || transformedUV.x > 1.0 || transformedUV.y < 0.0 || transformedUV.y > 1.0) {
        return background;
    }

    vec4 foreground = texture2D(foreground, transformedUV);
    foreground.a *= foregroundAlphaScale;

    // SRC is foreground, DEST is background
    if (alphaMode == 0.) {
        return foreground;
    }
    else if (alphaMode == 1.) {
        return foreground.a * foreground + background;
    }
    else if (alphaMode == 2.) {
        return mix(background, foreground, foreground.a);
    }
    else if (alphaMode == 3.) {
        return background - foreground * background;
    }
    else if (alphaMode == 4.) {
        return foreground * background;
    }

    return background;
}