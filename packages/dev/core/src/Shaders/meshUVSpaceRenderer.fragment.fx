precision highp float;

varying vec2 vDecalTC;
varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D maskTexture; // Uniform for the mask texture
uniform vec2 texelSize; // Uniform for the texel size

void main(void) {
    // Sample the texture color
    vec4 textureColor = texture2D(textureSampler, vDecalTC);
    vec4 maskColour = texture2D(maskTexture, vDecalTC);
    // Sample the mask texture to determine border status
    float maskValue = texture2D(maskTexture, vUV).r;
    // gl_FragColor = vec4(maskValue, maskValue, maskValue, 1.0);
    // gl_FragColor = maskColour;
    // If we are within the UV borders, use the original color
    if (maskValue > 0.5) {
        gl_FragColor = maskColour;
    } else {
        gl_FragColor = textureColor;

        // vec4 colorSum = vec4(0.0);
        // float totalWeight = 0.0;

        // // Offset for neighboring texel coordinates
        // vec2 offsets[4] = vec2[](vec2(-texelSize.x, 0.0), vec2(texelSize.x, 0.0), vec2(0.0, -texelSize.y), vec2(0.0, texelSize.y));

        // // Sample neighboring texels
        // for (int i = 0; i < 4; i++) {
        //     vec2 neighborUV = vDecalTC + offsets[i];
        //     float neighborMaskValue = texture2D(maskTexture, neighborUV).r;
        //     if (neighborMaskValue > 0.5) {
        //         colorSum += texture2D(textureSampler, neighborUV);
        //         totalWeight += 1.0;
        //     }
        // }
        // gl_FragColor = colorSum / totalWeight;

        // // Only average if we have valid neighbors
        // if (totalWeight > 0.0) {
        //     gl_FragColor = colorSum / totalWeight;
        // } else {
        //     // Use the background color or discard the fragment
        //     // gl_FragColor = backgroundColor; // Define a background color if needed
        //     discard;
        // }
        // gl_FragColor =  maskColour;
        // gl_FragColor = maskColour;
    }
}