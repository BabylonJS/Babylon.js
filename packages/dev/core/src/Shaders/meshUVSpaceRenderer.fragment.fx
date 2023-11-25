precision highp float;

varying vec2 vDecalTC;
varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D maskTexture; // The mask texture

void main(void) {
    // Hard-coded texel size for a 1024x1024 texture
    vec2 texelSize = vec2(4.0 / 1024.0, 4.0 / 1024.0);
    
    // Sample the center pixel and surrounding pixels
    float centerPixel = texture2D(maskTexture, vUV).r;
    float rightPixel = texture2D(maskTexture, vUV + vec2(texelSize.x, 0.0)).r;
    float leftPixel = texture2D(maskTexture, vUV - vec2(texelSize.x, 0.0)).r;
    float topPixel = texture2D(maskTexture, vUV + vec2(0.0, texelSize.y)).r;
    float bottomPixel = texture2D(maskTexture, vUV - vec2(0.0, texelSize.y)).r;

    // Detect edges by checking if the center pixel is white but at least one of the neighbors is not
    if (centerPixel > 0.5 && (rightPixel < 0.5 || leftPixel < 0.5 || topPixel < 0.5 || bottomPixel < 0.5)) {
        // Current pixel is on the edge of a UV island
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
    } else {
        // Current pixel is not on the edge of a UV island
        gl_FragColor = vec4(centerPixel, centerPixel, centerPixel, 1.0); // Original color
    }
}
