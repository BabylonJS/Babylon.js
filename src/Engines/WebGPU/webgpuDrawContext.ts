import { IDrawContext } from "../IDrawContext";

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastRenderPipeline: GPURenderPipeline | undefined;
    public fastBindGroups: { [id: number]: GPUBindGroup[] } = {};

    public uniqueId: number;

    constructor() {
        this.uniqueId = WebGPUDrawContext._Counter++;
    }
}
