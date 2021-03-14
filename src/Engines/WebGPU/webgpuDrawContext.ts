import { IDrawContext } from "../IDrawContext";
import { WebGPUIdentifiedBindGroups } from "./webgpuCacheBindGroups";

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastRenderPipeline: GPURenderPipeline | undefined;
    public fastBindGroups: { [id: number]: WebGPUIdentifiedBindGroups } = {};

    public uniqueId: number;

    constructor() {
        this.uniqueId = WebGPUDrawContext._Counter++;
    }
}
