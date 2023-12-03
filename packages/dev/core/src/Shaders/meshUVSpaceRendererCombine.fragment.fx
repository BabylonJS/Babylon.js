// Simple fragment shader to blend two textures
precision highp float;

// Varying: received from the vertex shader
varying vec2 vUV;

// Uniforms: the two textures and the blend factor
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float blendFactor; // Ranges from 0.0 (only texture1) to 1.0 (only texture2)

void main(void) {
    // Sample the pixel from both textures
    vec4 color1 = texture2D(texture1, vUV);
    vec4 color2 = texture2D(texture2, vUV);

    // Linearly interpolate between the two textures based on the blendFactor
    vec4 blendedColor = mix(color1, color2, blendFactor);

    // Set the final color
    gl_FragColor = blendedColor;
}
