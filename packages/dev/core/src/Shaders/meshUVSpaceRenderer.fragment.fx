precision highp float;

varying vec2 vDecalTC; // Texture coordinates from the decal
varying vec2 vUV; // Original UV coordinates

uniform sampler2D textureSampler; // The main texture sampler for decals
uniform sampler2D maskTexture; // The mask texture for seams

void main(void) {
    // Hard-coded texel size for a 1024x1024 texture
    vec2 texelSize = vec2(1.0 / 1024.0, 1.0 / 1024.0);

    // Sample the center pixel and surrounding pixels from the mask texture
    float centerPixel = texture2D(maskTexture, vUV).r;
    float rightPixel = texture2D(maskTexture, vUV + vec2(texelSize.x, 0.0)).r;
    float leftPixel = texture2D(maskTexture, vUV - vec2(texelSize.x, 0.0)).r;
    float topPixel = texture2D(maskTexture, vUV + vec2(0.0, texelSize.y)).r;
    float bottomPixel = texture2D(maskTexture, vUV - vec2(0.0, texelSize.y)).r;

    // Check if the current pixel is near a seam
    bool nearSeam = centerPixel >= 0.5 && (rightPixel < 0.5 || leftPixel < 0.5 || topPixel < 0.5 || bottomPixel < 0.5);

    // Sample the decal texture
    vec4 decalColor = texture2D(textureSampler, vDecalTC);

    // Determine if the pixel is part of a decal (non-transparent pixel in the decal texture)
    bool isDecal = decalColor.a > 0.5;

    // Apply edge bleeding
    if (isDecal && nearSeam) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Draw green line over the seam
    } else {
        gl_FragColor = decalColor;
    }
}
