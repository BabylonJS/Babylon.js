/** @internal */
export interface IStencilState {
    enabled: boolean;

    mask: number; // write mask
    funcMask: number; // read mask

    funcRef: number;

    // Front stencil operations
    func: number;
    opStencilDepthPass: number;
    opStencilFail: number;
    opDepthFail: number;

    // Back stencil operations
    backFunc: number;
    backOpStencilDepthPass: number;
    backOpStencilFail: number;
    backOpDepthFail: number;

    reset(): void;
}
