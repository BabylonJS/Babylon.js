/** @hidden */
export interface IStencilState {
    enabled: boolean;

    mask: number;

    func: number;
    funcRef: number;
    funcMask: number;

    opStencilDepthPass: number;
    opStencilFail: number;
    opDepthFail: number;

    reset(): void;
}
