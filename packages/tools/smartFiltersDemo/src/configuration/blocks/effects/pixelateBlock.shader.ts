import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform float _intensity_;
            uniform bool _disabled_;`,
        const: `            const float _videoPixelatePower_ = 6.0;
            const float _videoPixelateMin_ = 10.0;
            const float _videoPixelateMax_ = 1920.0;
            const float _aspect_ = 1.72;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_pixelate_",
        functions: [
            {
                name: "_pixelate_",
                code: `
                    vec4 _pixelate_(vec2 vUV) { 
                        if (!_disabled_) {
                            float pixelateStrength = mix(_videoPixelateMin_, _videoPixelateMax_, pow(1. - _intensity_, _videoPixelatePower_));
                            vec2 _pixelate_ = vec2(pixelateStrength * _aspect_, pixelateStrength);
                            vUV = floor(_pixelate_ * vUV) / _pixelate_;
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
    intensity: "intensity",
    disabled: "disabled",
};
