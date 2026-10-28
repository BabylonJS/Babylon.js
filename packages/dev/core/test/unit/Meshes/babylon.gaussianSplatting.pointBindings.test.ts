import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { DataBuffer } from "core/Buffers/dataBuffer";
import { ComputeShader } from "core/Compute/computeShader";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix } from "core/Maths/math.vector";
import { GaussianPointSplattingRenderer } from "core/Meshes/GaussianSplatting/gaussianPointSplattingRenderer";

/**
 * Creates a real renderer with headless resource allocation and mocked dispatch.
 * @returns the renderer, engine, and packed identity part record
 */
function CreateSetup() {
    const engine = new NullEngine({ enableMultiview: true });
    engine.getCaps().supportComputeShaders = true;
    Object.assign(engine, {
        _storageBuffers: [],
        createStorageBuffer: () => new DataBuffer(),
        updateStorageBuffer: vi.fn(),
        createComputeContext: () => ({ clear: vi.fn() }),
    });
    const renderer = new GaussianPointSplattingRenderer(engine);
    renderer.occlusionCulling = false;
    vi.spyOn(renderer, "isReady").mockReturnValue(true);
    renderer.updateSplats(new Float32Array(4), new Uint32Array(4), new Uint32Array(1), null, 0, 1);
    const parts = new Float32Array(40);
    parts.set(Matrix.Identity().m);
    parts[16] = 1;
    renderer.setPartData(parts, 1);
    renderer.setCamera(Matrix.Identity(), Matrix.Identity(), 0.1, 10, 16, 16, 0, 0, 0, 0.1, 10);
    onTestFinished(() => {
        renderer.dispose();
        engine.dispose();
    });
    return { engine, renderer, parts };
}

describe("Gaussian point-splatting resource bindings", () => {
    beforeEach(() => {
        vi.spyOn(ComputeShader.prototype, "dispatch").mockReturnValue(true);
        vi.spyOn(ComputeShader.prototype, "dispatchIndirect").mockReturnValue(true);
    });
    afterEach(() => vi.restoreAllMocks());

    it("does not call binding setters on a stable frame", () => {
        const { engine, renderer, parts } = CreateSetup();
        const storage = vi.spyOn(ComputeShader.prototype, "setStorageBuffer");
        const uniforms = vi.spyOn(ComputeShader.prototype, "setUniformBuffer");
        expect(renderer.renderToBuffer(32, 32)).toBe(true);
        storage.mockClear();
        uniforms.mockClear();
        engine["_frameId"]++;
        renderer.setPartData(parts, 1);
        expect(renderer.renderToBuffer(32, 32)).toBe(true);
        expect(storage).not.toHaveBeenCalled();
        expect(uniforms).not.toHaveBeenCalled();
        expect(renderer.renderedFrameCount).toBe(2);
    });

    it("refreshes resized, reloaded, shader-variant and part-slot bindings", () => {
        const { renderer, parts } = CreateSetup();
        renderer.renderToBuffer(32, 32);
        const firstParts = renderer["_parts"];
        parts[12] = 1;
        renderer.setPartData(parts, 1);
        expect(renderer["_parts"]).not.toBe(firstParts);
        expect(renderer["_preprocessCs"]["_bindings"].parts.object).toBe(renderer["_parts"]);
        const accumulation = renderer.accumBuffer;
        const image = renderer["_imageBuffer"];
        const hiZ = renderer["_hiZ"];
        renderer.renderToBuffer(16, 16, 32, 32, 2);
        expect(renderer.accumBuffer).toBe(accumulation);
        expect(renderer["_imageBuffer"]).not.toBe(image);
        expect(renderer["_hiZ"]).toBe(hiZ);
        expect(renderer["_splatCs"]["_bindings"].imageBuffer.object).toBe(renderer["_imageBuffer"]);
        expect(renderer["_resolveCs"]["_bindings"].imageBuffer.object).toBe(renderer["_imageBuffer"]);
        expect(renderer["_hiZBuildCs"]["_bindings"].hiZ.object).toBe(renderer["_hiZ"]);
        renderer.renderToBuffer(16, 16);
        expect(renderer.accumBuffer).not.toBe(accumulation);
        expect(renderer["_resolveCs"]["_bindings"].accumBuffer.object).toBe(renderer.accumBuffer);
        expect(renderer["_resolveCs"]["_bindings"].accumDepth.object).toBe(renderer.accumDepthBuffer);
        expect(renderer["_resolveCs"]["_bindings"].accumCount.object).toBe(renderer["_accumCount"]);
        const preprocess = renderer["_preprocessCs"];
        renderer.updateSplats(new Float32Array(4), new Uint32Array(4), new Uint32Array(1), new Uint32Array(3), 1, 1);
        expect(renderer["_preprocessCs"]).not.toBe(preprocess);
        const current = renderer["_preprocessCs"]["_bindings"];
        expect(current.uniforms.object).toBe(renderer["_uniforms"]);
        expect(current.means.object).toBe(renderer["_means"]);
        expect(current.sh.object).toBe(renderer["_sh"]);
        expect(current.parts.object).toBe(renderer["_parts"]);
        expect(current.hiZ.object).toBe(renderer["_hiZ"]);
        expect(renderer["_scanBlocksCs"]["_bindings"].weights.object).toBe(renderer["_weights"]);
        expect(renderer["_scanSumsCs"]["_bindings"].blockSums.object).toBe(renderer["_blockSums"]);
        expect(renderer["_scanAddCs"]["_bindings"].cdf.object).toBe(renderer["_cdf"]);
        expect(renderer["_partitionCs"]["_bindings"].cdf.object).toBe(renderer["_cdf"]);
        expect(renderer["_splatCs"]["_bindings"].gsData.object).toBe(renderer["_gsData"]);
        renderer.updateSplats(new Float32Array(4), new Uint32Array(4), new Uint32Array(1), null, 0, 1);
        expect(renderer["_preprocessCs"]["_bindings"].sh).toBeUndefined();
        expect(renderer["_preprocessCs"]["_bindings"].parts.object).toBe(renderer["_parts"]);
        expect(renderer["_preprocessCs"]["_bindings"].hiZ.object).toBe(renderer["_hiZ"]);
    });

    it("retains normal dispatch checks for native uniform-buffer changes", () => {
        const { renderer } = CreateSetup();
        const shader = renderer["_splatCs"];
        vi.spyOn(shader, "isReady").mockReturnValue(true);
        const native = vi.spyOn(renderer["_uniforms"], "getBuffer").mockReturnValue(new DataBuffer());
        const clear = vi.spyOn(shader["_context"], "clear");
        expect(shader.fastMode).toBe(false);
        expect(shader["_checkContext"]()).toBe(true);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(shader["_checkContext"]()).toBe(true);
        expect(clear).toHaveBeenCalledTimes(1);
        const replacement = new DataBuffer();
        native.mockReturnValue(replacement);
        expect(shader["_checkContext"]()).toBe(true);
        expect(clear).toHaveBeenCalledTimes(2);
        expect(shader["_bindings"].uniforms.buffer).toBe(replacement);
    });

    it("binds Hi-Z uniforms only when the dispatched level changes", () => {
        const { renderer } = CreateSetup();
        renderer.occlusionCulling = true;
        const uniforms = vi.spyOn(renderer["_hiZBuildCs"], "setUniformBuffer");
        renderer.renderToBuffer(2, 2);
        expect(uniforms).toHaveBeenCalledTimes(1);
        uniforms.mockClear();
        renderer.renderToBuffer(2, 2);
        expect(uniforms).not.toHaveBeenCalled();
        renderer.renderToBuffer(4, 4);
        expect(uniforms.mock.calls.map((call) => call[1])).toEqual(renderer["_hiZBuildParams"]);
    });
});
