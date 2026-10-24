import { afterEach, describe, expect, it, vi } from "vitest";

import { EngineStore } from "core/Engines/engineStore";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";

// A NullEngine running the real WebGPUEngine frame admission and endFrame, with the GPU members endFrame touches. Each frame's
// onSubmittedWorkDone stays pending until the test finishes it, as the GPU would.
function CreateWebGPULikeEngine() {
    const pending: Array<() => void> = [];
    const createDevice = () => ({ queue: { onSubmittedWorkDone: vi.fn(() => new Promise<void>((resolve) => pending.push(resolve))) } });
    const device = createDevice();
    const engine = Object.assign(new NullEngine(), {
        maxFramesInFlight: 0,
        _framesInFlight: 0,
        _framesInFlightDevice: null,
        _device: device,
        _endCurrentRenderPass: vi.fn(),
        _snapshotRendering: { endFrame: vi.fn() },
        _timestampQuery: { endFrame: vi.fn() },
        _textureHelper: { destroyDeferredTextures: vi.fn() },
        _bufferManager: { destroyDeferredBuffers: vi.fn() },
        _counters: { numEnableEffects: 0, numEnableDrawWrapper: 0, numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 },
        countersLastFrame: { numEnableEffects: 0, numEnableDrawWrapper: 0, numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 },
        _cacheRenderPipeline: { endFrame: vi.fn() },
        _cacheBindGroups: { endFrame: vi.fn() },
        flushFramebuffer: vi.fn(),
        _processFrame: WebGPUEngine.prototype["_processFrame"],
        endFrame: WebGPUEngine.prototype.endFrame,
        _countFrameInFlight: WebGPUEngine.prototype["_countFrameInFlight"],
    }) as unknown as WebGPUEngine;
    // the GPU finishes the oldest frame still on it
    const finishOldest = async () => {
        pending.shift()!();
        await new Promise((resolve) => setTimeout(resolve, 0));
    };
    return { engine, device, createDevice, finishOldest };
}

describe("WebGPUEngine.maxFramesInFlight", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        for (const engine of EngineStore.Instances.slice()) {
            engine.dispose();
        }
    });

    it("neither counts nor holds back frames by default", () => {
        const { engine, device } = CreateWebGPULikeEngine();
        const begin = vi.spyOn(engine, "beginFrame");
        for (let i = 0; i < 5; i++) {
            engine["_processFrame"]();
        }
        expect(begin).toHaveBeenCalledTimes(5);
        expect(device.queue.onSubmittedWorkDone).not.toHaveBeenCalled();
    });

    it("starts no frame while the GPU has the limit in flight, and starts one once the GPU finishes a frame", async () => {
        const { engine, finishOldest } = CreateWebGPULikeEngine();
        engine.maxFramesInFlight = 2;
        const begin = vi.spyOn(engine, "beginFrame");
        engine["_processFrame"]();
        engine["_processFrame"]();
        expect(begin).toHaveBeenCalledTimes(2);

        engine["_processFrame"]();
        expect(begin).toHaveBeenCalledTimes(2);
        expect(engine._frameHandler).toBe(0);

        await finishOldest();
        engine["_processFrame"]();
        expect(begin).toHaveBeenCalledTimes(3);
    });

    it("asks again at the next animation frame, and a frame the GPU finishes never queues one (a stopped loop stays stopped)", async () => {
        const { engine, finishOldest } = CreateWebGPULikeEngine();
        engine.maxFramesInFlight = 1;
        const queue = vi.spyOn(engine as any, "_queueNewFrame").mockReturnValue(1);
        const render = vi.fn();
        engine.runRenderLoop(render);
        expect(queue).toHaveBeenCalledTimes(1);

        engine._renderLoop(0);
        engine._renderLoop(16);
        expect(render).toHaveBeenCalledTimes(1);
        expect(queue).toHaveBeenCalledTimes(3);

        engine.stopRenderLoop();
        await finishOldest();
        expect(queue).toHaveBeenCalledTimes(3);
        expect(render).toHaveBeenCalledTimes(1);
    });

    it("does not let maxFPS count a frame it holds back", async () => {
        const { engine, finishOldest } = CreateWebGPULikeEngine();
        engine.maxFramesInFlight = 1;
        engine.maxFPS = 60;
        const begin = vi.spyOn(engine, "beginFrame");
        const overFrameTime = vi.spyOn(engine as any, "_isOverFrameTime");
        engine["_processFrame"](1000);
        engine["_processFrame"](1017);
        expect(begin).toHaveBeenCalledTimes(1);
        expect(overFrameTime).toHaveBeenCalledTimes(1);

        // the frame time went by while the GPU was busy: the next animation frame starts one
        await finishOldest();
        engine["_processFrame"](1034);
        expect(begin).toHaveBeenCalledTimes(2);
    });

    it("does not count the frames of a lost device against the new one", async () => {
        const { engine, createDevice, finishOldest } = CreateWebGPULikeEngine();
        engine.maxFramesInFlight = 2;
        engine["_processFrame"]();
        engine["_processFrame"]();

        // the device is lost and initAsync creates a new one
        engine["_device"] = createDevice() as unknown as GPUDevice;
        const begin = vi.spyOn(engine, "beginFrame");
        engine["_processFrame"]();
        expect(begin).toHaveBeenCalledTimes(1);
        expect(engine["_framesInFlight"]).toBe(1);

        // the lost device's frames settle late: the new device's count does not move
        await finishOldest();
        await finishOldest();
        expect(engine["_framesInFlight"]).toBe(1);
    });
});
