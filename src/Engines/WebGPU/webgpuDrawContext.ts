import { IDrawContext } from "../IDrawContext";

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastBundle: GPURenderBundle;

    public uniqueId: number;

    constructor() {
        this.uniqueId = WebGPUDrawContext._Counter++;
    }
}
