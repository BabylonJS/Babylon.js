import type { ShaderProgram } from "../utils/shaderCodeUtils";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main`,
        mainInputTexture: "_input_",
        mainFunctionName: "_copy_",
        functions: [
            {
                name: "_copy_",
                code: `
                    vec4 _copy_(vec2 vUV) { 
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
};
