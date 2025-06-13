import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform vec2 _resolution_;
            uniform float _threshold_;`,
        const: `            const float _Soft_ = 0.001;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                    	float f = _Soft_/2.0;
                    	float a = _threshold_ - f;
                    	float b = _threshold_ + f;
                    	
                    	vec4 tx = texture(_input_, vUV);
                    	float l = (tx.x + tx.y + tx.z) / 3.0;
                    	
                    	float v = smoothstep(a, b, l);
                    	
                    	return vec4(v);
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
    resolution: "resolution",
    threshold: "threshold",
};
