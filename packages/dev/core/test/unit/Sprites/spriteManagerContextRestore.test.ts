import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Buffer, type VertexBuffer } from "core/Buffers/buffer";
import { type IDrawContext } from "core/Engines/IDrawContext";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { Scene } from "core/scene";
import { SpriteManager } from "core/Sprites/spriteManager";
import { type SpriteRenderer } from "core/Sprites/spriteRenderer";
import "core/Sprites/spriteSceneComponent";

import { type FakeGPUBuffer, MakeWebGPULike } from "../Engines/helpers/webgpuLikeNullEngine";

describe("SpriteManager across WebGPU restorations", () => {
    let engine: NullEngine;
    let scene: Scene;
    let webgpu: ReturnType<typeof MakeWebGPULike>;

    beforeEach(() => {
        engine = new NullEngine();
        webgpu = MakeWebGPULike(engine);
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    async function CreateSpriteManagerAsync(): Promise<{ manager: SpriteManager; renderer: SpriteRenderer }> {
        const manager = new SpriteManager("sprites", "", 100, 64, scene);
        const renderer = manager.spriteRenderer;
        // The renderer creates its draw wrappers once its shaders are loaded
        await vi.waitFor(() => expect((renderer as any)._shadersLoaded).toBe(true));
        return { manager, renderer };
    }

    // A draw context must belong to the current device: the buffer manager it creates its buffers with, and the
    // indirect draw buffer that an instanced draw passes to the device when compatibilityMode is false.
    function ExpectOnCurrentDevice(drawContext: IDrawContext | undefined) {
        const context = drawContext as WebGPUDrawContext;
        expect(context).toBeInstanceOf(WebGPUDrawContext);
        expect((context as any)._bufferManager.deviceId).toBe(webgpu.deviceId());
        expect(context.useInstancing).toBe(true);
        expect((context.indirectDrawBuffer as unknown as FakeGPUBuffer).deviceId).toBe(webgpu.deviceId());
    }

    it("recreates the instanced draw contexts on the new device", async () => {
        const { manager, renderer } = await CreateSpriteManagerAsync();
        const base = renderer._drawWrapperBase;
        const depth = renderer._drawWrapperDepth;
        const effect = base.effect;
        ExpectOnCurrentDevice(base.drawContext);
        ExpectOnCurrentDevice(depth.drawContext);
        const oldContexts = [base.drawContext, depth.drawContext];

        webgpu.restore();

        expect(base.drawContext).not.toBe(oldContexts[0]);
        expect(depth.drawContext).not.toBe(oldContexts[1]);
        ExpectOnCurrentDevice(base.drawContext);
        ExpectOnCurrentDevice(depth.drawContext);
        // The renderer keeps its draw wrappers and effect
        expect(renderer._drawWrapperBase).toBe(base);
        expect(base.effect).toBe(effect);

        webgpu.restore();
        ExpectOnCurrentDevice(base.drawContext);
        ExpectOnCurrentDevice(depth.drawContext);

        manager.dispose();
    });

    it.each([
        { instancing: true, label: "instanced (WebGPU)" },
        { instancing: false, label: "not instanced" },
    ])("rebuilds each backing buffer once per restoration, $label", async ({ instancing }) => {
        engine.getCaps().instancedArrays = instancing;
        const { manager, renderer } = await CreateSpriteManagerAsync();
        const internals = renderer as any;
        const mainBuffer: Buffer = internals._buffer;
        const spriteBuffer: Buffer | null = internals._spriteBuffer;
        expect(!!spriteBuffer).toBe(instancing);

        const rebuild = vi.spyOn(Buffer.prototype, "_rebuild");
        const createDynamicVertexBuffer = vi.spyOn(engine, "createDynamicVertexBuffer");
        const createVertexBuffer = vi.spyOn(engine, "createVertexBuffer");

        webgpu.restore();

        // One allocation for the main (dynamic) buffer, and one for the static sprite corner buffer when instanced
        expect(rebuild.mock.contexts.filter((buffer) => buffer === mainBuffer)).toHaveLength(1);
        expect(rebuild.mock.contexts.filter((buffer) => buffer === spriteBuffer)).toHaveLength(instancing ? 1 : 0);
        expect(createDynamicVertexBuffer).toHaveBeenCalledTimes(1);
        expect(createVertexBuffer).toHaveBeenCalledTimes(instancing ? 1 : 0);
        // and every vertex buffer reads the rebuilt data buffers
        for (const key in internals._vertexBuffers) {
            const vertexBuffer: VertexBuffer = internals._vertexBuffers[key];
            expect(vertexBuffer.getBuffer()).toBe(vertexBuffer.getWrapperBuffer().getBuffer());
        }

        manager.dispose();
    });
});
