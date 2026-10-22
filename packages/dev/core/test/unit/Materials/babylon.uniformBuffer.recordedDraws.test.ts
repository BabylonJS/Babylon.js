import { describe, it, expect, beforeEach, vi } from "vitest";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";

/**
 * The checks a draw recorded by a snapshot relies on to be encoded again without binding: whether two draw contexts' slots of an
 * effect's leftover uniform buffer hold the same bytes, whether a flush used the draw context's own slot, and whether a shared
 * uniform buffer is on the first buffer of the frame. Same minimal engine as the owner-keyed slots tests.
 */
interface MockGpuBuffer {
    uniqueId: number;
    gpu: Float32Array;
}

function createEngine() {
    let nextId = 1;
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
        },
        _releaseBuffer(): boolean {
            return true;
        },
    };
    return engine;
}

function createOwner(): WebGPUDrawContext {
    return new WebGPUDrawContext({} as any, {} as any);
}

describe("UniformBuffer checks for recorded draws", () => {
    let engine: ReturnType<typeof createEngine>;
    let ubo: UniformBuffer;
    let owners: WebGPUDrawContext[];

    // a draw of a material: the material's values written in the effect's leftover buffer, then flushed for the draw context
    function draw(owner: WebGPUDrawContext, value: number): void {
        ubo.updateFloat4("color", value, value, value, 1);
        ubo._updateOwnerKeyed(owner);
    }

    beforeEach(() => {
        engine = createEngine();
        ubo = new UniformBuffer(engine as any, undefined, false, "leftOver-test");
        ubo.addUniform("color", 4);
        ubo.create();
        owners = Array.from({ length: 4 }, () => createOwner());
    });

    it("finds the slots of two draws flushed with the same values equal, and different values different", () => {
        draw(owners[0], 1);
        draw(owners[1], 1);
        draw(owners[2], 2);
        expect(ubo._isOwnerSlotEqual(owners[1], owners[0])).toBe(true);
        expect(ubo._isOwnerSlotEqual(owners[2], owners[0])).toBe(false);
    });

    it("finds equal bytes flushed under different generations (two materials sharing an effect), then compares in O(1)", () => {
        // frame 1: a draw of material A, one of material B, one of A again: the data generation moves on although A's bytes come back
        draw(owners[0], 1);
        draw(owners[1], 2);
        draw(owners[2], 1);
        // frame 2: the first draw of A binds again; the other draw of A was recorded under another generation
        engine.frameId = 2;
        draw(owners[2], 1);
        const compare = vi.spyOn(ubo as any, "_buffersEqual");
        expect(ubo._isOwnerSlotEqual(owners[0], owners[2])).toBe(true);
        expect(compare).toHaveBeenCalledTimes(1);
        // the slot took the reference's generation: no byte comparison the second time
        expect(ubo._isOwnerSlotEqual(owners[0], owners[2])).toBe(true);
        expect(compare).toHaveBeenCalledTimes(1);
        expect(ubo._isOwnerSlotEqual(owners[1], owners[2])).toBe(false);
    });

    it("sees a value changed since the draw was recorded", () => {
        draw(owners[0], 1);
        draw(owners[1], 1);
        engine.frameId = 2;
        // the material's value changed in place: its first draw of the frame writes the new value
        draw(owners[1], 5);
        expect(ubo._isOwnerSlotEqual(owners[0], owners[1])).toBe(false);
    });

    it("has nothing to compare for a draw context without a slot", () => {
        draw(owners[0], 1);
        expect(ubo._isOwnerSlotEqual(owners[3], owners[0])).toBe(false);
        expect(ubo._isOwnerSlotEqual(owners[0], owners[3])).toBe(false);
    });

    it("tells whether a flush used the draw context's own slot", () => {
        draw(owners[0], 1);
        expect(ubo._isOwnerSlotBound(owners[0])).toBe(true);
        // a second flush of the same draw context in the frame with other values goes to a slot it does not own
        draw(owners[0], 2);
        expect(ubo._isOwnerSlotBound(owners[0])).toBe(false);
        engine.frameId = 2;
        draw(owners[0], 3);
        expect(ubo._isOwnerSlotBound(owners[0])).toBe(true);
    });

    it("tells whether a shared buffer is on the first buffer of the frame", () => {
        const shared = new UniformBuffer(engine as any, undefined, false, "shared-test");
        shared.addUniform("value", 4);
        shared.create();
        shared.updateFloat4("value", 1, 1, 1, 1);
        shared.update();
        expect(shared._isFirstBufferBound()).toBe(true);
        // other content in the same frame: the buffer moves to a second GPU buffer
        shared.updateFloat4("value", 2, 2, 2, 2);
        shared.update();
        expect(shared._isFirstBufferBound()).toBe(false);
        engine.frameId = 2;
        shared.updateFloat4("value", 3, 3, 3, 3);
        shared.update();
        expect(shared._isFirstBufferBound()).toBe(true);
    });
});
