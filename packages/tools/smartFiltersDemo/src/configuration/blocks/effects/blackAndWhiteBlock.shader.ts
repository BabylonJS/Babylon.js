import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main`,
        mainInputTexture: "_input_",
        mainFunctionName: "_blackAndWhite_",
        functions: [
            {
                name: "_blackAndWhite_",
                code: `
                    vec4 _blackAndWhite_(vec2 vUV) { 
                        vec4 color = texture2D(_input_, vUV);
                    
                        float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));
                        vec3 bg = vec3(luminance, luminance, luminance);
                    
                        return vec4(bg, color.a);
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
