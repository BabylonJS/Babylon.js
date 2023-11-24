// varying vec2 vUV;

// uniform sampler2D textureSampler;

// void main(void) {
//     gl_FragColor = vec4(vUV.x, vUV.y, 0.0, 1.0);
// }

varying vec2 vUV;

void main(void) {
    // Check if the UV coordinates are within the 0 to 1 range
    if (vUV.x >= 0.0 && vUV.x <= 1.0 && vUV.y >= 0.0 && vUV.y <= 1.0) {
        // If inside the UV range, draw white
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        // If outside the UV range, draw black
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}
