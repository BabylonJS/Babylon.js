import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type SubMesh } from "core/Meshes/subMesh";

/**
 * SubMesh.setIndirectDrawBuffer: the draw of a sub mesh in a render pass reads its arguments from the application's buffer, filled on
 * the GPU. The binding belongs to the pass: it reaches the draw context of that pass only, outlives the pass's draw wrappers, is
 * cleared with null, and a new buffer or offset records the draw's bundle again.
 */
describe("SubMesh.setIndirectDrawBuffer", () => {
    let engine: NullEngine;
    let subMesh: SubMesh;
    const buffer = { underlyingResource: {} } as DataBuffer;
    const other = { underlyingResource: {} } as DataBuffer;
    const context = (passId: number) => subMesh._getDrawWrapper(passId, true)!.drawContext as WebGPUDrawContext;

    beforeEach(() => {
        engine = new NullEngine();
        // the draw contexts the WebGPU engine creates (a NullEngine has none)
        vi.spyOn(engine, "createDrawContext").mockImplementation(() => new WebGPUDrawContext({} as any, {} as any));
        const scene = new Scene(engine);
        subMesh = MeshBuilder.CreateBox("box", {}, scene).subMeshes[0];
    });

    afterEach(() => {
        engine.dispose();
    });

    it("binds the draw context of its pass only", () => {
        const camera = context(3);
        const shadow = context(5);
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        expect(camera._externalIndirectDrawBuffer).toBe(buffer);
        expect(camera._externalIndirectDrawByteOffset).toBe(20);
        expect(shadow._externalIndirectDrawBuffer).toBeNull();
    });

    it("binds a draw context created after the call, and again after resetDrawCache", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 4);
        expect(context(4)._externalIndirectDrawBuffer).toBe(buffer);
        subMesh.resetDrawCache();
        expect(context(4)._externalIndirectDrawBuffer).toBe(buffer);
        expect(context(4)._externalIndirectDrawByteOffset).toBe(20);
    });

    it("clears the binding with null", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        subMesh.setIndirectDrawBuffer(null, 0, 3);
        expect(context(3)._externalIndirectDrawBuffer).toBeNull();
        subMesh.resetDrawCache();
        expect(context(3)._externalIndirectDrawBuffer).toBeNull();
    });

    it("records the draw's bundle again on a new buffer or offset, not on the same binding", () => {
        const ctx = context(3);
        const recorded = () => {
            ctx.fastBundle = {} as GPURenderBundle;
            ctx.resetIsDirty(0);
        };
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        recorded();
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        expect(ctx.fastBundle).toBeDefined();
        expect(ctx.isDirty(0)).toBe(false);

        subMesh.setIndirectDrawBuffer(buffer, 40, 3);
        expect(ctx.fastBundle).toBeUndefined();
        expect(ctx.isDirty(0)).toBe(true);

        recorded();
        subMesh.setIndirectDrawBuffer(other, 40, 3);
        expect(ctx.fastBundle).toBeUndefined();
        expect(ctx.isDirty(0)).toBe(true);
    });

    it("keeps the binding through a reset of the draw context, which a new effect does", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        context(3).reset();
        expect(context(3)._externalIndirectDrawBuffer).toBe(buffer);
    });
});
