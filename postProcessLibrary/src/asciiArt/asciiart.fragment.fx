// Samplers.
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D asciiArtFont;

// Infos.
uniform vec4 asciiArtFontInfos;
uniform vec4 asciiArtOptions;

// Transform color to luminance.
float getLuminance(vec3 color)
{
    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);
}

// Main functions.
void main(void) 
{
    float caracterSize = asciiArtFontInfos.x;
    float numChar = asciiArtFontInfos.y - 1.0;
    float fontx = asciiArtFontInfos.z;
    float fonty = asciiArtFontInfos.w;

    float screenx = asciiArtOptions.x;
    float screeny = asciiArtOptions.y;

    float tileX = float(floor((gl_FragCoord.x) / caracterSize)) * caracterSize / screenx;
    float tileY = float(floor((gl_FragCoord.y) / caracterSize)) * caracterSize / screeny;

    vec2 tileUV = vec2(tileX, tileY);
    vec4 tileColor = texture2D(textureSampler, tileUV);
    vec4 baseColor = texture2D(textureSampler, vUV);

    float tileLuminance = getLuminance(tileColor.rgb);

    float offsetx = (float(floor(tileLuminance * numChar))) * caracterSize / fontx;
    float offsety = 0.0;

    float x = float(mod(gl_FragCoord.x, caracterSize)) / fontx;
    float y = float(mod(gl_FragCoord.y, caracterSize)) / fonty;

    vec4 finalColor =  texture2D(asciiArtFont, vec2(offsetx + x, offsety + (caracterSize / fonty - y)));
    finalColor.rgb *= tileColor.rgb;
    finalColor.a = 1.0;

    finalColor =  mix(finalColor, tileColor, asciiArtOptions.w);
    finalColor =  mix(finalColor, baseColor, asciiArtOptions.z);

    gl_FragColor = finalColor;
}