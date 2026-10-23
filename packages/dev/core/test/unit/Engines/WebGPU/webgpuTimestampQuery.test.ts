import { WebGPUDurationMeasure, WebGPUTimestampQuery } from "core/Engines/WebGPU/webgpuTimestampQuery";
import { Observable } from "core/Misc/observable";
import { describe, expect, it, vi } from "vitest";

// A device, buffer manager, engine and command encoder that record what is asked of them; the mapped range holds two timestamps 2500 ns apart
function setup() {
    const submit = vi.fn();
    const mapAsync = vi.fn(async () => {});
    const buffer = { mapAsync, getMappedRange: () => new BigUint64Array([1000n, 3500n]).buffer, unmap: vi.fn(), destroy: vi.fn() };
    const device = { createQuerySet: vi.fn(() => ({ destroy: vi.fn() })), createCommandEncoder: vi.fn(() => encoder()), queue: { submit } };
    const bufferManager = { createRawBuffer: vi.fn(() => buffer), releaseBuffer: vi.fn() };
    const engine = { uniqueId: 1, isDisposed: false, frameId: 7, onEndFrameObservable: new Observable<unknown>() };
    return { submit, mapAsync, device, bufferManager, engine };
}

function encoder() {
    const passes: GPUComputePassDescriptor[] = [];
    return {
        passes,
        beginComputePass: vi.fn((descriptor: GPUComputePassDescriptor) => {
            passes.push(descriptor);
            return { end: vi.fn() };
        }),
        resolveQuerySet: vi.fn(),
        copyBufferToBuffer: vi.fn(),
        finish: vi.fn(() => ({})),
    };
}

const measure = (t: ReturnType<typeof setup>, count = 2) => new WebGPUDurationMeasure(t.engine as any, t.device as any, t.bufferManager as any, count);
const tick = async () => await new Promise((resolve) => setTimeout(resolve, 0));

describe("WebGPU frame timestamps", () => {
    it("stamps the frame with empty compute passes, not with the encoder's writeTimestamp", () => {
        const t = setup();
        const e = encoder();
        const m = measure(t);

        m.start(e as any);
        void m.stop(e as any);

        expect(e.passes.map((p) => [p.timestampWrites!.beginningOfPassWriteIndex, p.timestampWrites!.endOfPassWriteIndex])).toEqual([
            [0, undefined],
            [undefined, 1],
        ]);
    });

    it("resolves in the frame's encoder and maps only after the frame is submitted", async () => {
        const t = setup();
        const e = encoder();
        const m = measure(t);

        m.start(e as any);
        const duration = m.stop(e as any);
        expect(e.resolveQuerySet).toHaveBeenCalledOnce();
        expect(e.copyBufferToBuffer).toHaveBeenCalledOnce();
        expect(t.submit).not.toHaveBeenCalled();

        await tick();
        expect(t.mapAsync).not.toHaveBeenCalled();

        t.engine.onEndFrameObservable.notifyObservers(t.engine);
        expect(await duration).toBe(2500);
        expect(t.mapAsync).toHaveBeenCalledOnce();
    });

    it("gives the frame counter the frame's own duration", async () => {
        const t = setup();
        const e = encoder();
        const query = new WebGPUTimestampQuery(t.engine as any, t.device as any, t.bufferManager as any);
        query.enable = true;

        query.startFrame(e as any);
        query.endFrame(e as any);
        t.engine.onEndFrameObservable.notifyObservers(t.engine);
        await tick();

        expect(query.gpuFrameTimeCounter.current).toBe(2500);
    });

    it("still resolves on its own encoder when none is given", async () => {
        const t = setup();
        const m = measure(t, 4);

        expect(await m.stopPass(0)).toBe(2500);
        expect(t.submit).toHaveBeenCalledOnce();
    });
});
