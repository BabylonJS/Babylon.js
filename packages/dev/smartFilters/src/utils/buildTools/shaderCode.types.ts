/**
 * Describes a shader function.
 */
export type ShaderFunction = {
    /**
     * The name of the function.
     */
    name: string;

    /**
     * The code of the function.
     */
    code: string;

    /**
     * The parameters of the function.
     */
    params?: string;
};

/**
 * Describes a shader code.
 */
export type ShaderCode = {
    /**
     * The declaration of the const variables.
     */
    const?: string;

    /**
     * The declaration of the uniform variables.
     */
    uniform?: string;

    /**
     * The declaration of the uniform variables that should be common for all ShaderBlock instances using this shader code.
     */
    uniformSingle?: string;

    /**
     * The name of the main function.
     */
    mainFunctionName: string;

    /**
     * The name of the input texture which is passed through if the block is disabled.
     */
    mainInputTexture?: string;

    /**
     * The list of functions used in the shader.
     */
    functions: ShaderFunction[];

    /**
     * The declaration of define statements.
     */
    defines?: string[];
};
