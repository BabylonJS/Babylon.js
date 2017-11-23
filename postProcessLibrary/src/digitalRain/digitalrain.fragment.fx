// Samplers.
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D digitalRainFont;

// Infos.
uniform vec4 digitalRainFontInfos;
uniform vec4 digitalRainOptions;
uniform mat4 matrixSpeed;

uniform float cosTimeZeroOne;

// Transform color to luminance.
float getLuminance(vec3 color)
{
    return clamp(dot(color, vec3(0.2126, 0.7152, 0.0722)), 0., 1.);
}

// Main functions.
void main(void) 
{
    float caracterSize = digitalRainFontInfos.x;
    float numChar = digitalRainFontInfos.y - 1.0;
    float fontx = digitalRainFontInfos.z;
    float fonty = digitalRainFontInfos.w;

    float screenx = digitalRainOptions.x;
    float screeny = digitalRainOptions.y;
    float ratio = screeny / fonty;

    float columnx = float(floor((gl_FragCoord.x) / caracterSize));
    float tileX = float(floor((gl_FragCoord.x) / caracterSize)) * caracterSize / screenx;
    float tileY = float(floor((gl_FragCoord.y) / caracterSize)) * caracterSize / screeny;

    vec2 tileUV = vec2(tileX, tileY);
    vec4 tileColor = texture2D(textureSampler, tileUV);
    vec4 baseColor = texture2D(textureSampler, vUV);

    float tileLuminance = getLuminance(tileColor.rgb);
    
    int st = int(mod(columnx, 4.0));
    float speed = cosTimeZeroOne * (sin(tileX * 314.5) * 0.5 + 0.6); 
    float x = float(mod(gl_FragCoord.x, caracterSize)) / fontx;
    float y = float(mod(speed + gl_FragCoord.y / screeny, 1.0));
    y *= ratio;

    vec4 finalColor =  texture2D(digitalRainFont, vec2(x, 1.0 - y));
    vec3 high = finalColor.rgb * (vec3(1.2,1.2,1.2) * pow(1.0 - y, 30.0));

    finalColor.rgb *= vec3(pow(tileLuminance, 5.0), pow(tileLuminance, 1.5), pow(tileLuminance, 3.0));
    finalColor.rgb += high;
    finalColor.rgb = clamp(finalColor.rgb, 0., 1.);
    finalColor.a = 1.0;

    finalColor =  mix(finalColor, tileColor, digitalRainOptions.w);
    finalColor =  mix(finalColor, baseColor, digitalRainOptions.z);

    gl_FragColor = finalColor;
}