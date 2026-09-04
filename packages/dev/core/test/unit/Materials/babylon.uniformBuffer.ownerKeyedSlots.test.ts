import { describe, it, expect, beforeEach } from "vitest";
import { UniformBuffer, type IUniformBufferSlotOwner } from "core/Materials/uniformBuffer";

/**
 * A minimal engine that tracks its uniform buffers per frame the way WebGPUEngine does
 * (trackUbosInFrame + checkUbosContentBeforeUpload), recording every GPU upload.
 */
interface MockGpuBuffer {
    uniqueId: number;
    gpu: Float32Array;
}

function createEngine() {
    let nextId = 1;
    const uploads: number[] = [];
    const engine = {
        supportsUniformBuffers: true,
        frameId: 1,
        _uniformBuffers: [] as UniformBuffer[],
        _features: { trackUbosInFrame: true, checkUbosContentBeforeUpload: true, uniformBufferHardCheckMatrix: false },
        createUniformBuffer(data: Float32Array): MockGpuBuffer {
            return { uniqueId: nextId++, gpu: data.slice() };
        },
        createDynamicUniformBuffer(data: Float32Array): MockGpuBuffer {
            return { uniqueId: nextId++, gpu: data.slice() };
        },
        updateUniformBuffer(buffer: MockGpuBuffer, data: Float32Array): void {
            buffer.gpu = data.slice();
            uploads.push(buffer.uniqueId);
        },
        _releaseBuffer(): boolean {
            return true;
        },
        uploads,
    };
    return engine;
}

function createOwner(id: number): IUniformBufferSlotOwner {
    return {
        uniqueId: id,
        useInstancing: false,
        enableIndirectDraw: false,
        setIndirectData: () => {},
        reset: () => {},
        dispose: () => {},
    };
}

function shuffle<T>(array: T[]): T[] {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

describe("UniformBuffer owner-keyed slots", () => {
    let engine: ReturnType<typeof createEngine>;
    let ubo: UniformBuffer;
    let owners: IUniformBufferSlotOwner[];
    const OWNERS = 40;

    // Each owner writes its own values (as each material does into the effect's leftover UBO), then flushes on its own behalf.
    function drawFrame(order: number[]): void {
        for (const i of order) {
            ubo.updateFloat4("color", i, i * 2, i * 3, 1);
            ubo.updateFloat("scalar", i / 10);
            ubo.update(owners[i]);
            const gpu = (ubo.getBuffer() as unknown as MockGpuBuffer).gpu;
            expect([gpu[0], gpu[1], gpu[2], gpu[4]]).toEqual([i, i * 2, i * 3, Math.fround(i / 10)]);
        }
    }

    beforeEach(() => {
        engine = createEngine();
        ubo = new UniformBuffer(engine as any, undefined, false, "leftOver-test");
        ubo.addUniform("color", 4);
        ubo.addUniform("scalar", 1);
        ubo.create();
        owners = Array.from({ length: OWNERS }, (_, i) => createOwner(i));
    });

    it("keeps the pool at one GPU buffer per owner whatever the draw order, and every owner reads back its own values", () => {
        const order = owners.map((_, i) => i);
        for (let frame = 1; frame <= 200; ++frame) {
            engine.frameId = frame;
            drawFrame(shuffle(order));
            expect(ubo._numBuffers).toBe(OWNERS);
        }
    });

    it("uploads nothing once every owner's values are on the GPU, even when the draw order changes", () => {
        const order = owners.map((_, i) => i);
        engine.frameId = 1;
        drawFrame(order);
        const uploadsAfterFirstFrame = engine.uploads.length;
        for (let frame = 2; frame <= 20; ++frame) {
            engine.frameId = frame;
            drawFrame(shuffle(order));
        }
        expect(engine.uploads.length).toBe(uploadsAfterFirstFrame);
    });

    it("binds the same GPU buffer for a given owner frame after frame", () => {
        const order = owners.map((_, i) => i);
        const bufferOf = new Map<number, unknown>();
        engine.frameId = 1;
        for (const i of order) {
            ubo.updateFloat4("color", i, i * 2, i * 3, 1);
            ubo.updateFloat("scalar", i / 10);
            ubo.update(owners[i]);
            bufferOf.set(i, ubo.getBuffer());
        }
        engine.frameId = 2;
        for (const i of shuffle(order)) {
            ubo.updateFloat4("color", i, i * 2, i * 3, 1);
            ubo.updateFloat("scalar", i / 10);
            ubo.update(owners[i]);
            expect(ubo.getBuffer()).toBe(bufferOf.get(i));
        }
    });

    it("does not overwrite a slot the GPU has not consumed yet when the same owner flushes twice in a frame with different values", () => {
        engine.frameId = 1;
        ubo.updateFloat4("color", 7, 7, 7, 7);
        ubo.update(owners[3]);
        const firstBuffer = ubo.getBuffer() as unknown as MockGpuBuffer;

        ubo.updateFloat4("color", 8, 8, 8, 8);
        ubo.update(owners[3]);
        const secondBuffer = ubo.getBuffer() as unknown as MockGpuBuffer;

        expect(secondBuffer).not.toBe(firstBuffer);
        expect(firstBuffer.gpu[0]).toBe(7);
        expect(secondBuffer.gpu[0]).toBe(8);

        // next frame: the owner is back on its own slot, and the spill slot is reusable
        engine.frameId = 2;
        ubo.updateFloat4("color", 3, 3, 3, 3);
        ubo.update(owners[3]);
        expect(ubo.getBuffer()).toBe(firstBuffer);
        ubo.updateFloat4("color", 9, 9, 9, 9);
        ubo.update(owners[3]);
        expect(ubo.getBuffer()).toBe(secondBuffer);
        expect(ubo._numBuffers).toBe(2);
    });

    it("registers itself on the owner and gives a released slot to the next new owner", () => {
        engine.frameId = 1;
        for (let i = 0; i < 3; ++i) {
            ubo.updateFloat4("color", i, i, i, i);
            ubo.update(owners[i]);
        }
        expect(ubo._numBuffers).toBe(3);
        expect(owners[1]._uniformBuffersWithOwnedSlot).toEqual([ubo]);
        const releasedBuffer = (() => {
            ubo.updateFloat4("color", 1, 1, 1, 1);
            ubo.update(owners[1]);
            return ubo.getBuffer();
        })();

        // the context is disposed (WebGPUDrawContext.dispose does exactly this)
        ubo._releaseOwnerSlot(owners[1]);

        engine.frameId = 2;
        ubo.updateFloat4("color", 5, 5, 5, 5);
        ubo.update(owners[10]);
        expect(ubo.getBuffer()).toBe(releasedBuffer);
        expect(ubo._numBuffers).toBe(3);
    });

    it("keeps the draw-order behavior when no owner is given", () => {
        const order = owners.map((_, i) => i);
        engine.frameId = 1;
        for (const i of order) {
            ubo.updateFloat4("color", i, i * 2, i * 3, 1);
            ubo.update();
        }
        // one buffer per differing write in the frame, exactly as before
        expect(ubo._numBuffers).toBe(OWNERS);
    });
});
