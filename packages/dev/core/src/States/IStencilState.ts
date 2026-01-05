/**
 * Interface defining the properties of the stencil state.
 */
export interface IStencilStateProperties {
    /**
     * Whether the stencil test is enabled or not.
     */
    enabled: boolean;

    /**
     * The stencil mask to use for writing.
     */
    mask: number; // write mask
    /**
     * The stencil mask to use for reading.
     */
    funcMask: number; // read mask

    /**
     * The reference value to use for the stencil test.
     */
    funcRef: number;

    // Front stencil operations
    /**
     * The stencil comparison function to use for front faces.
     */
    func: number;
    /**
     * The operation to perform when both the stencil and depth tests pass for front faces.
     */
    opStencilDepthPass: number;
    /**
     * The operation to perform when the stencil test fails for front faces.
     */
    opStencilFail: number;
    /**
     * The operation to perform when the stencil test passes but the depth test fails for front faces.
     */
    opDepthFail: number;

    // Back stencil operations
    /**
     * The stencil comparison function to use for back faces.
     */
    backFunc: number;
    /**
     * The operation to perform when both the stencil and depth tests pass for back faces.
     */
    backOpStencilDepthPass: number;
    /**
     * The operation to perform when the stencil test fails for back faces.
     */
    backOpStencilFail: number;
    /**
     * The operation to perform when the stencil test passes but the depth test fails for back faces.
     */
    backOpDepthFail: number;
}

/**
 * Interface defining the stencil state.
 */
export interface IStencilState extends IStencilStateProperties {
    /**
     * Resets the stencil state to default values.
     */
    reset(): void;
}
