import { describe, it, expect } from "vitest";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";

function setup() {
    let id = 0;
    const live = new Set<any>();
    const engine = {
        supportsUniformBuffers: true,
        frameId: 1,
        _uniformBuffers: [] as UniformBuffer[],
        _features: { trackUbosInFrame: true, checkUbosContentBeforeUpload: true },
        createUniformBuffer(data: Float32Array) {
            const buffer = { uniqueId: ++id, gpu: data.slice() };
            live.add(buffer);
            return buffer;
        },
        updateUniformBuffer(buffer: any, data: Float32Array) {
            buffer.gpu.set(data);
        },
        _releaseBuffer(buffer: any) {
            return live.delete(buffer);
        },
        createDrawContext() {
            return new WebGPUDrawContext({} as any, {} as any);
        },
    };
    const make = () => {
        const buffer = new UniformBuffer(engine as any);
        buffer.addUniform("value", 1);
        buffer.create();
        return buffer;
    };
    const draw = (buffer: UniformBuffer, owner: WebGPUDrawContext, value = 1) => {
        buffer.updateFloat("value", value);
        buffer._updateOwnerKeyed(owner);
        return buffer.getBuffer() as any;
    };
    return { engine, live, make, draw };
}

describe("owner slot lifecycle through real draw/pipeline entry points", () => {
    it.each([false, true])("bounds shared-effect/pass churn and accounts for retained capacity (distinct=%s)", (distinct) => {
        const { engine, live, draw } = setup();
        const buffers = Array.from({ length: 3 }, () => {
            const buffer = new UniformBuffer(engine as any);
            buffer.addUniform("value", 64); // 256-byte blocks
            buffer.create();
            return buffer;
        });
        for (let cycle = 0; cycle < 20; cycle++) {
            engine.frameId++;
            for (const buffer of buffers) {
                // 40 objects, two pass-specific contexts each, sharing this effect.
                const contexts = Array.from({ length: 80 }, () => engine.createDrawContext());
                contexts.forEach((context, i) => draw(buffer, context, distinct ? i : 1));
                contexts.forEach((context) => context.dispose());
                expect((buffer as any)._ownerCount).toBe(0);
                expect((buffer as any)._ownerListsBySlot.size).toBe(0);
                expect(buffer._numBuffers).toBe(80); // Reusable high-water capacity, not live ownership.
            }
            expect(live.size).toBe(240);
        }
        expect([...live].reduce((sum, buffer) => sum + buffer.gpu.byteLength, 0)).toBe(61440);
        expect(buffers.reduce((sum, buffer) => sum + (buffer as any)._buffers.reduce((n: number, slot: any) => n + slot[1].byteLength, 0), 0)).toBe(61440);
        buffers.forEach((buffer) => buffer.dispose());
        expect(live.size).toBe(0);
        // These UBO objects are deliberately retained here: their slot arrays must still be empty.
        buffers.forEach((buffer) => expect(buffer._numBuffers).toBe(0));
    });

    it.each([true, false])("releases the previous effect even with resetContext=%s", (resetContext) => {
        const { engine, make, draw } = setup();
        const wrapper = new DrawWrapper(engine as any, false);
        const first = make();
        const second = make();
        const context = wrapper.drawContext as WebGPUDrawContext;
        wrapper.setEffect({} as any);
        draw(first, context);
        wrapper.setEffect({} as any, undefined, resetContext);
        expect((first as any)._ownerCount).toBe(0);
        expect(context._uniformBuffersWithOwnedSlot).toBeUndefined();
        draw(second, context);
        expect(context._uniformBuffersWithOwnedSlot).toEqual([second]);
    });

    it("preserves a reservation when the same effect is set without resetting", () => {
        const { engine, make, draw } = setup();
        const wrapper = new DrawWrapper(engine as any, false);
        const effect = {} as any;
        wrapper.setEffect(effect);
        const buffer = make();
        draw(buffer, wrapper.drawContext as WebGPUDrawContext);
        wrapper.setEffect(effect, undefined, false);
        expect((buffer as any)._ownerCount).toBe(1);
    });

    it.each(["reset", "dispose"] as const)("%s releases every reciprocal registration exactly once", (method) => {
        const { engine, make, draw } = setup();
        const context = engine.createDrawContext();
        const buffers = [make(), make(), make()];
        buffers.forEach((buffer) => draw(buffer, context));
        context[method]();
        context[method]();
        for (const buffer of buffers) {
            expect((buffer as any)._ownerCount).toBe(0);
            expect((buffer as any)._freeSlots).toEqual([0]);
            expect((buffer as any)._ownerListsBySlot.size).toBe(0);
        }
        expect(context._uniformBuffersWithOwnedSlot).toBeUndefined();
    });

    it("UBO disposal detaches live owners and clears slot wrappers/shadows", () => {
        const { engine, live, make, draw } = setup();
        const buffer = make();
        const other = make();
        const contexts = [engine.createDrawContext(), engine.createDrawContext()];
        contexts.forEach((context) => {
            draw(buffer, context);
            draw(other, context);
        });
        buffer.dispose();
        buffer.dispose();
        contexts.forEach((context) => expect(context._uniformBuffersWithOwnedSlot).toEqual([other]));
        expect(buffer.getBuffer()).toBeNull();
        expect(buffer._numBuffers).toBe(0);
        expect((buffer as any)._ownerListsBySlot.size).toBe(0);
        expect(live.size).toBe(2);
        contexts.forEach((context) => context.dispose());
        other.dispose();
        expect(live.size).toBe(0);
    });

    it("context restoration detaches registrations before assigning new slots", () => {
        const { engine, live, make, draw } = setup();
        const buffer = make();
        const context = engine.createDrawContext();
        draw(buffer, context);
        for (let i = 0; i < 20; i++) {
            live.clear(); // Device loss invalidates old GPU allocations; do not emulate loss on a live device.
            buffer._rebuildAfterContextLost();
            expect(context._uniformBuffersWithOwnedSlot).toEqual([]);
            engine.frameId++;
            draw(buffer, context, i);
            expect(context._uniformBuffersWithOwnedSlot).toEqual([buffer]);
            expect((buffer as any)._ownerCount).toBe(1);
            expect(live.size).toBe(1);
        }
    });

    it("layout replacement and pipeline disposal detach their old UBO", () => {
        const { engine, live, draw } = setup();
        const pipeline = new WebGPUPipelineContext({ leftOverUniforms: [{ name: "value", type: "float" }] } as any, engine as any);
        const context = engine.createDrawContext();
        for (let i = 0; i < 20; i++) {
            const old = pipeline.uniformBuffer;
            pipeline.buildUniformLayout();
            if (old) expect(old._numBuffers).toBe(0);
            draw(pipeline.uniformBuffer!, context);
            expect(context._uniformBuffersWithOwnedSlot).toEqual([pipeline.uniformBuffer]);
            expect(live.size).toBe(1);
        }
        pipeline.dispose();
        expect(context._uniformBuffersWithOwnedSlot).toEqual([]);
        expect(live.size).toBe(0);
    });

    it("does not overwrite bytes used before an effect replacement in the same frame", () => {
        const { engine, make, draw } = setup();
        const wrapper = new DrawWrapper(engine as any, false);
        const buffer = make();
        const context = wrapper.drawContext as WebGPUDrawContext;
        const first = draw(buffer, context, 7);
        wrapper.setEffect({} as any);
        const second = draw(buffer, engine.createDrawContext(), 9);
        expect(second).not.toBe(first);
        expect(first.gpu[0]).toBe(7);
        expect(second.gpu[0]).toBe(9);
        engine.frameId++;
        expect(draw(buffer, context, 3)).toBe(first);
        expect(buffer._numBuffers).toBe(2);
    });

    it("effect churn reuses capacity and leaves no departed owner reservations", () => {
        const { engine, live, make, draw } = setup();
        const buffer = make();
        const wrappers: DrawWrapper[] = [];
        for (let i = 0; i < 100; i++) {
            engine.frameId++;
            const wrapper = new DrawWrapper(engine as any, false);
            wrappers.push(wrapper); // Keep departed contexts live to prove eager teardown.
            draw(buffer, wrapper.drawContext as WebGPUDrawContext, i);
            wrapper.setEffect({} as any);
            expect((buffer as any)._ownerCount).toBe(0);
            expect(buffer._numBuffers).toBe(1);
        }
        expect(wrappers).toHaveLength(100);
        buffer.dispose();
        expect(live.size).toBe(0);
    });
});
