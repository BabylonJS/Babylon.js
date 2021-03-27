import { IDrawContext } from "../IDrawContext";

/** @hidden */
export class WebGPUDrawContext implements IDrawContext {
    private static _Counter = 0;

    public fastBundle: { [id: number]: GPURenderBundle[] } = {};
    public fastBundleSingle: GPURenderBundle[];

    public uniqueId: number;

    constructor() {
        this.uniqueId = WebGPUDrawContext._Counter++;
    }
}
