uniform sampler2D input; // main
uniform float time;
uniform float rows;
uniform float cols;
uniform float frames;
uniform bool disabled;

vec4 mainImage(vec2 vUV) { // main
    if (!disabled) {
        float invRows = 1.0 / rows;
        float invCols = 1.0 / cols;

        // Get offset of frame 
        float frame = mod(floor(time), frames);
        float row = (rows - 1.0) - floor(frame * invCols); // Reverse row direction b/c UVs start from bottom
        float col = mod(frame, cols);

        // Add offset, then scale UV down to frame size
        vUV = vec2(
            (vUV.x + col) * invCols,
            (vUV.y + row) * invRows
        );
    }

    return texture2D(input, vUV);
}