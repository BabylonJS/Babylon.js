import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { Nullable } from "../../types";
import { IDrawContext } from "../IDrawContext";

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastBundle?: GPURenderBundle; // used only when compatibilityMpode==false
    public bindGroups?: GPUBindGroup[]; // cache of the bind groups. Will be reused for the next draw if isDirty==false (and materialContext.isDirty==false)

    public uniqueId: number;

    public isDirty: boolean;
    public buffers: { [name: string]: Nullable<WebGPUDataBuffer> };

    constructor() {
        this.uniqueId = WebGPUDrawContext._Counter++;
        this.reset();
    }

    public reset(): void {
        this.buffers = {};
        this.isDirty = true;
        this.fastBundle = undefined;
        this.bindGroups = undefined;
    }

    public setBuffer(name: string, buffer: Nullable<WebGPUDataBuffer>): void {
        this.isDirty ||= buffer?.uniqueId !== this.buffers[name]?.uniqueId;

        this.buffers[name] = buffer;
    }
}
