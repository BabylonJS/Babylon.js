import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform float _time_;
            uniform float _rows_;
            uniform float _cols_;
            uniform float _frames_;
            uniform bool _disabled_;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        if (!_disabled_) {
                            float invRows = 1.0 / _rows_;
                            float invCols = 1.0 / _cols_;
                    
                            // Get offset of frame 
                            float frame = mod(floor(_time_), _frames_);
                            float row = (_rows_ - 1.0) - floor(frame * invCols); // Reverse row direction b/c UVs start from bottom
                            float col = mod(frame, _cols_);
                    
                            // Add offset, then scale UV down to frame size
                            vUV = vec2(
                                (vUV.x + col) * invCols,
                                (vUV.y + row) * invRows
                            );
                        }
                    
                        return texture2D(_input_, vUV);
                    }
                    
                    `,
            },
        ],
    },
};

/**
 * The uniform names for this shader, to be used in the shader binding so
 * that the names are always in sync.
 */
export const uniforms = {
    input: "input",
    time: "time",
    rows: "rows",
    cols: "cols",
    frames: "frames",
    disabled: "disabled",
};
