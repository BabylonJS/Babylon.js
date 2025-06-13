import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform sampler2D _mask_;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_maskBlock_",
        functions: [
            {
                name: "_maskBlock_",
                code: `
                    vec4 _maskBlock_(vec2 vUV) { 
                        vec4 color = texture2D(_input_, vUV);
                        vec3 maskColor = texture2D(_mask_, vUV).rgb;
                        float luminance = dot(maskColor, vec3(0.3, 0.59, 0.11));
                    
                        return vec4(color.rgb * luminance, luminance * color.a);
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
    mask: "mask",
};
