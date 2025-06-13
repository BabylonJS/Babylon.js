import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform sampler2D _particle_;
            uniform float _time_;
            uniform float _delay_;
            uniform vec2 _position_;
            uniform vec2 _size_;
            uniform float _amplitude_;
            uniform float _frequency_;`,
        const: `            const float _PI_ = 3.14159265;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        vec4 backgroundColor = texture2D(_input_, vUV);
                    
                        float delta = _time_ - _delay_;
                        float oscillationX = _position_.x + _amplitude_ * sin(_frequency_ * (delta) * _PI_); 
                        float translationY = _position_.y - delta; // Move _particle_ upwards over _time_
                    
                        vUV = vUV * _size_ + vec2(oscillationX, translationY); // Apply transformations
                    
                        // Check for out of bounds
                        if (clamp(vUV, 0.0, 1.0) != vUV) {
                            return backgroundColor;
                        }
                    
                        vec4 particleColor = texture2D(_particle_, vUV);
                    
                        return mix(backgroundColor, particleColor, particleColor.a);
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
    particle: "particle",
    time: "time",
    delay: "delay",
    position: "position",
    size: "size",
    amplitude: "amplitude",
    frequency: "frequency",
};
