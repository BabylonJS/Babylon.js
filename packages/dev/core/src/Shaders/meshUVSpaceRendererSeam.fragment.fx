precision highp float;

varying vec2 vUV;

uniform sampler2D maskTexture; // The mask texture for seams

void main(void) {

    // Hard-coded texel size for a 1024x1024 texture
    vec2 texelSize = vec2(1.0 / 1024.0, 1.0 / 1024.0);
    
    // Sample the center pixel and surrounding pixels
    float centerPixel = texture2D(maskTexture, vUV).r;
    float rightPixel = texture2D(maskTexture, vUV + vec2(texelSize.x, 0.0)).r;
    float leftPixel = texture2D(maskTexture, vUV - vec2(texelSize.x, 0.0)).r;
    float topPixel = texture2D(maskTexture, vUV + vec2(0.0, texelSize.y)).r;
    float bottomPixel = texture2D(maskTexture, vUV - vec2(0.0, texelSize.y)).r;

    // Sample the corner pixels
    float topLeftPixel = texture2D(maskTexture, vUV + vec2(-texelSize.x, texelSize.y)).r;
    float topRightPixel = texture2D(maskTexture, vUV + vec2(texelSize.x, texelSize.y)).r;
    float bottomLeftPixel = texture2D(maskTexture, vUV + vec2(-texelSize.x, -texelSize.y)).r;
    float bottomRightPixel = texture2D(maskTexture, vUV + vec2(texelSize.x, -texelSize.y)).r;

    // Detect edges by checking if the center pixel is white but at least one of the neighbors is not
    if (centerPixel > 0.5 && (rightPixel < 0.5 || leftPixel < 0.5 || topPixel < 0.5 || bottomPixel < 0.5 || topLeftPixel < 0.5 || topRightPixel < 0.5 || bottomLeftPixel < 0.5 || bottomRightPixel < 0.5)) {
        // Current pixel is on the edge of a UV island
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // YELLOW
    } else {
        // Current pixel is not on the edge of a UV island
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // GRN
    }

    // Add padding to the edge of the UV island
    vec2 offsets[4];
    offsets[0] = vec2(texelSize.x, 0.0); // right
    offsets[1] = vec2(-texelSize.x, 0.0); // left
    offsets[2] = vec2(0.0, texelSize.y); // top
    offsets[3] = vec2(0.0, -texelSize.y); // bottom

    for (int i = 0; i < 4; i++) {
        if (texture2D(maskTexture, vUV + offsets[i]).r < 0.1 && texture2D(maskTexture, vUV).r > 0.1) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // RED
        }
    }
}
