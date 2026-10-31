import { describe, it, expect, beforeEach } from "vitest";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";

/**
 * The indirect draw arguments of a draw context (WebGPUDrawContext.setIndirectData): a sub mesh can move its index range (a road
 * spline growing along its index buffer) and keep its instance count, and the GPU must get the new range.
 */
describe("WebGPUDrawContext indirect draw arguments", () => {
    let writes: number[][];
    let drawContext: WebGPUDrawContext;

    beforeEach(() => {
        writes = [];
        const bufferManager = {
            createRawBuffer: () => ({}),
            setRawData: (_buffer: unknown, _offset: number, data: Uint32Array) => writes.push(Array.from(data.subarray(0, 3))),
            releaseBuffer: () => true,
        };
        drawContext = new WebGPUDrawContext(bufferManager as any, {} as any);
        drawContext.enableIndirectDraw = true;
    });

    it("writes the arguments once while they do not change", () => {
        drawContext.setIndirectData(36, 1, 0);
        drawContext.setIndirectData(36, 1, 0);
        expect(writes).toEqual([[36, 1, 0]]);
    });

    it("writes a moved index range with the same instance count", () => {
        drawContext.setIndirectData(36, 1, 0);
        drawContext.setIndirectData(36, 1, 12);
        drawContext.setIndirectData(24, 1, 12);
        expect(writes).toEqual([
            [36, 1, 0],
            [36, 1, 12],
            [24, 1, 12],
        ]);
    });

    it("writes a changed instance count, and always when forced", () => {
        drawContext.setIndirectData(36, 1, 0);
        drawContext.setIndirectData(36, 5, 0);
        drawContext.setIndirectData(36, 5, 0, true);
        expect(writes).toEqual([
            [36, 1, 0],
            [36, 5, 0],
            [36, 5, 0],
        ]);
    });
});
