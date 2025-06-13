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
            uniform vec2 _resolution_;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_tunnel_",
        functions: [
            {
                name: "_tunnel_",
                code: `
                    vec4 _tunnel_(vec2 vUV) {  
                        // Center the effect
                        vUV = vUV / 0.5 - 1.;
                    
                        // Adjust aspect ratio
                        vUV.x *= _resolution_.x / _resolution_.y;
                    
                        // make a tube
                        float f = 1.0 / length(vUV);
                        
                        // add the angle
                        f += atan(vUV.x, vUV.y) / acos(0.);
                        
                        // let's roll
                        f -= _time_;
                        
                        // make it black and white
                        // old version without AA: 
                        // f = floor(fract(f) * 2.);
                        // new version based on Shane's suggestion:	
                        f = 1. - clamp(sin(f * 3.14159265359 * 2.) * dot(vUV, vUV) * _resolution_.y / 15. + .5, 0., 1.);
                    
                        // add the darkness to the end of the _tunnel_
                        f *= sin(length(vUV) - .1);
                    	
                        return vec4(f, f, f, 1.0);
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
    resolution: "resolution",
};
