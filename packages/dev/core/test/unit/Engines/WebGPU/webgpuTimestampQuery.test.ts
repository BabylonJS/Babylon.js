import { WebGPUDurationMeasure, WebGPUTimestampQuery } from "core/Engines/WebGPU/webgpuTimestampQuery";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { Observable } from "core/Misc/observable";
import { describe, expect, it, vi } from "vitest";

// A device, buffer manager, engine and command encoder that record what is asked of them; the mapped range holds two timestamps 2500 ns apart.
// The engine waits for submissions with WebGPUEngine's own methods; submitEncoders() is what flushFramebuffer does right after queue.submit
function setup() {
    const submit = vi.fn();
    const mapAsync = vi.fn(async () => {});
    const buffer = { mapAsync, getMappedRange: () => new BigUint64Array([1000n, 3500n]).buffer, unmap: vi.fn(), destroy: vi.fn() };
    const device = { createQuerySet: vi.fn(() => ({ destroy: vi.fn() })), createCommandEncoder: vi.fn(() => encoder()), queue: { submit } };
    const bufferManager = { createRawBuffer: vi.fn(() => buffer), releaseBuffer: vi.fn() };
    const proto = WebGPUEngine.prototype as any;
    const engine = {
        uniqueId: 1,
        isDisposed: false,
        frameId: 7,
        onEndFrameObservable: new Observable<unknown>(),
        _submitted: null,
        _resolveSubmitted: null,
        _whenSubmittedAsync: proto._whenSubmittedAsync as () => Promise<void>,
        _notifySubmitted: proto._notifySubmitted as () => void,
    };
    const submitEncoders = () => engine._notifySubmitted();
    return { submit, mapAsync, device, bufferManager, engine, submitEncoders };
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

    it("resolves in the frame's encoder and maps only after that encoder is submitted", async () => {
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

        t.submitEncoders();
        expect(await duration).toBe(2500);
        expect(t.mapAsync).toHaveBeenCalledOnce();
    });

    it("maps a readback recorded by an end of frame observer only once the next encoders are submitted", async () => {
        const t = setup();
        const m = measure(t, 6);
        const first = m.stopPass(0, encoder() as any);
        let second: Promise<number | null> | undefined;
        // as endFrame runs: the frame's encoders are submitted, then its observers record into the encoders of the next frame
        t.engine.onEndFrameObservable.add(() => {
            second = m.stopPass(1, encoder() as any);
        });

        t.submitEncoders();
        t.engine.onEndFrameObservable.notifyObservers(t.engine);
        expect(await first).toBe(2500);
        await tick();
        expect(second).toBeDefined();
        expect(t.mapAsync).toHaveBeenCalledOnce();

        t.submitEncoders();
        expect(await second).toBe(2500);
        expect(t.mapAsync).toHaveBeenCalledTimes(2);
    });

    it("maps a readback once its encoder is submitted by a flush outside of endFrame", async () => {
        const t = setup();
        const m = measure(t, 4);
        const duration = m.stopPass(0, encoder() as any);
        await tick();
        expect(t.mapAsync).not.toHaveBeenCalled();

        // flushFramebuffer() with no endFrame, as StorageBuffer.read(..., true) does
        t.submitEncoders();
        expect(await duration).toBe(2500);
    });

    it("shares one wait among the readbacks of a submission, with no observer", async () => {
        const t = setup();
        const m = measure(t, 8);
        const wait = vi.spyOn(t.engine, "_whenSubmittedAsync");
        const e = encoder();

        const durations = [m.stopPass(0, e as any), m.stopPass(1, e as any), m.stopPass(2, e as any)];
        expect(wait).toHaveBeenCalledTimes(3);
        expect(new Set(wait.mock.results.map((r) => r.value)).size).toBe(1);
        expect(t.engine.onEndFrameObservable.hasObservers()).toBe(false);

        t.submitEncoders();
        expect(await Promise.all(durations)).toEqual([2500, 2500, 2500]);
    });

    it("gives the frame counter the frame's own duration", async () => {
        const t = setup();
        const e = encoder();
        const query = new WebGPUTimestampQuery(t.engine as any, t.device as any, t.bufferManager as any);
        query.enable = true;

        query.startFrame(e as any);
        query.endFrame(e as any);
        t.submitEncoders();
        await tick();

        expect(query.gpuFrameTimeCounter.current).toBe(2500);
    });

    it("still resolves on its own encoder when none is given, without waiting for a submission", async () => {
        const t = setup();
        const m = measure(t, 4);
        const wait = vi.spyOn(t.engine, "_whenSubmittedAsync");

        expect(await m.stopPass(0)).toBe(2500);
        expect(t.submit).toHaveBeenCalledOnce();
        expect(wait).not.toHaveBeenCalled();
    });

    it("is released by flushFramebuffer right after the queue submit, and a later wait is for the next submit", async () => {
        const order: string[] = [];
        const commandEncoder = () => ({ finish: () => ({}) });
        const engine = Object.assign(Object.create(WebGPUEngine.prototype), {
            _submitted: null,
            _resolveSubmitted: null,
            _commandBuffers: [null, null],
            _uploadEncoder: commandEncoder(),
            _renderEncoder: commandEncoder(),
            _uploadEncoderDescriptor: {},
            _renderEncoderDescriptor: {},
            _internalFrameCounter: 0,
            _frameId: 3,
            _device: { queue: { submit: () => order.push("submit") }, createCommandEncoder: commandEncoder },
            _endCurrentRenderPass: () => {},
            _debugPopBeforeEndOfEncoder: () => {},
            _debugPushAfterStartOfEncoder: () => {},
            _debugMarkersEncoderGroups: [],
            _debugMarkersPassGroups: [],
            _timestampQuery: { startFrame: () => {} },
            _textureHelper: { setCommandEncoder: () => {} },
            _bundleList: { reset: () => {} },
        }) as WebGPUEngine;

        const before = engine._whenSubmittedAsync();
        // eslint-disable-next-line github/no-then
        const released = before.then(() => order.push("released"));
        engine.flushFramebuffer();
        const after = engine._whenSubmittedAsync();
        await released;

        expect(order).toEqual(["submit", "released"]);
        expect(after).not.toBe(before);
    });
});
