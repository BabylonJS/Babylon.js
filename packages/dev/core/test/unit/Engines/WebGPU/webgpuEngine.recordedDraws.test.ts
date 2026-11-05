import { describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUStencilStateComposer } from "core/Engines/WebGPU/webgpuStencilStateComposer";
import { StencilState } from "core/States/stencilState";
import { MaterialStencilState } from "core/Materials/materialStencilState";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { WebGPUMaterialContext } from "core/Engines/WebGPU/webgpuMaterialContext";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { type Effect } from "core/Materials/effect";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import { RenderCommandBatcher } from "core/Engines/renderCommandBatcher.pure";
import { WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";
import {
    ApplyWebGPURenderPassDrawCommand,
    type IWebGPURenderPassCommandRecorderProvider,
    type IWebGPURenderPassDrawCommand,
    WebGPURenderPassCommandOpcode,
    WebGPURenderPassCommandStream,
    WebGPURenderPassCommandStreamProtocolVersion,
    WebGPURenderPassDrawKind,
} from "core/Engines/WebGPU/webgpuRenderPassCommandStream";
import * as WebGPUConstants from "core/Engines/WebGPU/webgpuConstants";

/**
 * A draw recorded by a snapshot is encoded again from its commands (WebGPUEngine._replayRecordedDraw) only while its draw context
 * keeps what it was recorded with. Shader hot swapping draws with the previous effect while the new one compiles, then sets the new
 * effect on the sub mesh (StandardMaterial.isReadyForSubMesh): that resets the draw context, so a draw recorded with the previous
 * effect is not encoded again, and the next full draw records the new pipeline.
 */
describe("WebGPUEngine recorded draws and shader hot swapping", () => {
    it("does not encode again a draw recorded with the previous effect once the new effect is set", () => {
        const bufferManager = { createRawBuffer: () => ({}), setRawData: () => {}, releaseBuffer: () => true };
        const materialContext = new WebGPUMaterialContext();
        const drawWrapper = new DrawWrapper({
            createDrawContext: () => new WebGPUDrawContext(bufferManager as any, {} as any),
            createMaterialContext: () => materialContext,
        } as any);
        drawWrapper.setEffect({} as Effect);
        const drawContext = drawWrapper.drawContext as WebGPUDrawContext;

        // the engine while a snapshot records again: a recorded draw is encoded into the bundle list
        const encoder = { setPipeline: vi.fn(), setIndexBuffer: vi.fn(), setVertexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn(), draw: vi.fn() };
        const engine = {
            _snapshotRendering: { record: true },
            _recordedDrawsGeneration: 0,
            _currentRenderTarget: null,
            currentSampleCount: 1,
            _bundleList: { numDrawCalls: 0, getBundleEncoder: () => encoder },
            _cacheRenderPipeline: { colorFormats: [] },
            _getCurrentRenderPass: () => {},
            applyStates: () => {},
            _applyRenderPassChanges: () => {},
            _flushRenderPassCommands: () => {},
            _reportDrawCall: () => {},
            _canEncodeRecordedDraw: (wrapper: DrawWrapper): boolean => WebGPUEngine.prototype._canEncodeRecordedDraw.call(engine as any, wrapper),
        };
        const replay = () => WebGPUEngine.prototype._replayRecordedDraw.call(engine as any, drawWrapper);

        // a full draw with the previous effect: its bind groups created and its commands recorded
        materialContext.isDirty = false;
        drawContext.resetIsDirty(materialContext.updateId);
        drawContext._recordedDraw = {
            kept: true,
            generation: 0,
            renderTarget: null,
            sampleCount: 1,
            colorFormats: [],
            depthFormat: undefined,
            pipeline: {} as GPURenderPipeline,
            bindGroups: [],
            indexBuffer: null,
            indexFormat: "uint16",
            vertexBuffers: [],
            vertexOffsets: [],
            indirectBuffer: null,
            indexed: true,
            count: 36,
            instances: 1,
            start: 0,
        };
        expect(replay()).toBe(true);
        expect(encoder.drawIndexed).toHaveBeenCalledTimes(1);

        // the new effect compiled: the sub mesh gets it
        drawWrapper.setEffect({} as Effect);
        expect(drawContext._recordedDraw).toBeUndefined();
        expect(replay()).toBe(false);
        expect(encoder.drawIndexed).toHaveBeenCalledTimes(1);
    });
});

describe("WebGPUEngine recorded draws", () => {
    function setup() {
        const materialContext = new WebGPUMaterialContext();
        const drawWrapper = new DrawWrapper({
            createDrawContext: () => new WebGPUDrawContext({ createRawBuffer: () => ({}), setRawData: () => {}, releaseBuffer: () => true } as any, {} as any),
            createMaterialContext: () => materialContext,
        } as any);
        const markOwnerSlotUsed = vi.fn();
        const effect = { onBind: null, _onBindObservable: null, _pipelineContext: { uniformBuffer: { _markOwnerSlotUsed: markOwnerSlotUsed } } } as any;
        drawWrapper.setEffect(effect);
        const drawContext = drawWrapper.drawContext as WebGPUDrawContext;
        materialContext.isDirty = false;
        drawContext.resetIsDirty(materialContext.updateId);
        const encoder = { setPipeline: vi.fn(), setIndexBuffer: vi.fn(), setVertexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn(), draw: vi.fn() };
        const engine: any = {
            _snapshotRendering: { record: true, reset: vi.fn() },
            snapshotRenderingReuseDraws: true,
            _recordedDrawsGeneration: 0,
            _currentRenderTarget: null,
            currentSampleCount: 1,
            _currentDrawContext: drawContext,
            _currentEffect: { _pipelineContext: {} },
            _currentIndexBuffer: null,
            _bundleList: { numDrawCalls: 0, getBundleEncoder: () => encoder },
            _cacheRenderPipeline: { colorFormats: [], vertexBuffers: [{ effectiveBuffer: { underlyingResource: {} }, _validOffsetRange: true, byteOffset: 0 }] },
            _getCurrentRenderPass: () => {},
            _stencilStateComposer: { apply: vi.fn() },
            _alphaState: { _alphaBlend: false, _numTargetEnabled: 1 },
            _applyRenderPassChanges: () => {},
            _flushRenderPassCommands: () => {},
            _reportDrawCall: () => {},
            _recordedDrawContext: null,
        };
        engine._canEncodeRecordedDraw = (wrapper: DrawWrapper) => WebGPUEngine.prototype._canEncodeRecordedDraw.call(engine, wrapper);
        engine._cacheRenderPipeline.setAlphaBlendEnabled = vi.fn();
        engine.applyStates = () => WebGPUEngine.prototype.applyStates.call(engine);
        engine._keepInheritedState = (wrapper: DrawWrapper) => WebGPUEngine.prototype._keepInheritedState.call(engine, wrapper);
        const keep = () => (WebGPUEngine.prototype as any)._keepRecordedDraw.call(engine, {}, [{}, {}], 0, 36, 1, 0);
        const replay = () => WebGPUEngine.prototype._replayRecordedDraw.call(engine, drawWrapper);
        const reset = (forceFullRecording?: boolean) => WebGPUEngine.prototype.snapshotRenderingReset.call(engine, forceFullRecording);
        keep();
        return { engine, effect, drawWrapper, drawContext, keep, replay, reset, markOwnerSlotUsed };
    }

    it("marks the slot of its draw context as used in the frame when it encodes a draw again", () => {
        const { replay, markOwnerSlotUsed, drawContext } = setup();
        expect(replay()).toBe(true);
        expect(markOwnerSlotUsed).toHaveBeenCalledWith(drawContext);
    });

    it("composes the stencil before it encodes a draw again, as a full draw does: the render pass reads the reference of the material's stencil, else the global one", () => {
        const { engine, replay } = setup();
        // the composer's effective state is what the render pass reads (_applyRenderPassChanges sets the stencil reference from it)
        const cache = new Proxy({}, { get: () => () => {} }) as any;
        const composer = new WebGPUStencilStateComposer(cache);
        composer.stencilGlobal = new StencilState();
        composer.stencilGlobal.enabled = true;
        composer.stencilGlobal.funcRef = 1;
        engine._stencilStateComposer = composer;
        const read: Array<{ enabled: boolean; funcRef: number }> = [];
        engine._applyRenderPassChanges = () => read.push({ enabled: composer.enabled, funcRef: composer.funcRef });
        // B's full draw composed its stencil, of reference 2
        const b = new MaterialStencilState();
        b.enabled = true;
        b.funcRef = 2;
        composer.stencilMaterial = b;
        composer.apply();
        // the replayed draw's material has no stencil (Mesh.render sets it through Material._setStates): the global one applies
        composer.stencilMaterial = new MaterialStencilState();
        expect(replay()).toBe(true);
        expect(read).toEqual([{ enabled: true, funcRef: 1 }]);
    });

    it("does not encode again a draw whose effect has a bind callback, which a full draw calls", () => {
        const { effect, replay } = setup();
        effect.onBind = () => {};
        expect(replay()).toBe(false);
        effect.onBind = null;
        effect._onBindObservable = { hasObservers: () => true };
        expect(replay()).toBe(false);
        effect._onBindObservable = { hasObservers: () => false };
        expect(replay()).toBe(true);
    });

    it("does not encode again a draw recorded with other attachment formats, which a render target can change under the same wrapper", () => {
        const { engine, keep, replay } = setup();
        expect(replay()).toBe(true);
        // setInternalTexture of a multi render target swaps an attachment for one of another format: the bundle encoder is created with
        // the current formats, which the recorded pipeline does not match
        engine._cacheRenderPipeline.colorFormats = ["rgba16float"];
        expect(replay()).toBe(false);
        keep();
        expect(replay()).toBe(true);
        engine._depthTextureFormat = "depth32float";
        expect(replay()).toBe(false);
        keep();
        expect(replay()).toBe(true);
    });

    it("fills the same record and arrays on each capture", () => {
        const { drawContext, keep } = setup();
        const draw = drawContext._recordedDraw!;
        const arrays = [draw.bindGroups, draw.vertexBuffers, draw.vertexOffsets];
        keep();
        expect(drawContext._recordedDraw).toBe(draw);
        expect([draw.bindGroups, draw.vertexBuffers, draw.vertexOffsets]).toEqual(arrays);
        expect(draw.bindGroups[0]).toBe(arrays[0][0]);
        expect(draw.bindGroups.length).toBe(2);
        expect(draw.vertexBuffers.length).toBe(1);
    });

    it("does not encode again a draw announced before its bind until the draw records its commands", () => {
        const { engine, drawWrapper, drawContext, keep, replay } = setup();
        // the states the draw inherits are kept by the engine, which is not what this checks
        const keepState = vi.spyOn(AbstractEngine.prototype, "_keepInheritedState").mockImplementation(() => {});
        engine._keepInheritedState(drawWrapper);
        expect(engine._recordedDrawContext).toBe(drawContext);
        expect(replay()).toBe(false);
        keep();
        expect(replay()).toBe(true);
        keepState.mockRestore();
    });

    it("does not encode again a draw with the indirect buffer indirect drawing released, nor without the one it creates again", () => {
        const { engine, drawContext, keep, replay, reset } = setup();
        const encoder = engine._bundleList.getBundleEncoder();
        encoder.drawIndexedIndirect = vi.fn();
        // in compatibility mode, the end user enables indirect draws: a full draw records them with the buffer
        drawContext.enableIndirectDraw = true;
        const indirectBuffer = drawContext.indirectDrawBuffer;
        keep();
        reset();
        expect(replay()).toBe(true);
        expect(encoder.drawIndexedIndirect).toHaveBeenLastCalledWith(indirectBuffer, 0);

        // disabled: the buffer is released, and the next recording does not encode the draw with it
        drawContext.enableIndirectDraw = false;
        reset();
        expect(replay()).toBe(false);
        keep();
        expect(replay()).toBe(true);
        expect(encoder.drawIndexed).toHaveBeenCalledTimes(1);

        // enabled again: a new buffer, which the draw recorded without indirect drawing does not use
        drawContext.enableIndirectDraw = true;
        reset();
        expect(replay()).toBe(false);
        keep();
        expect(replay()).toBe(true);
        expect(drawContext.indirectDrawBuffer).not.toBe(indirectBuffer);
        expect(encoder.drawIndexedIndirect).toHaveBeenLastCalledWith(drawContext.indirectDrawBuffer, 0);
    });

    it("reuses none of the commands recorded before snapshotRenderingReset(true), and the recording after it reuses the new ones", () => {
        const { engine, reset, keep, replay } = setup();
        // a new snapshot reuses the recorded commands by default
        reset();
        expect(engine._snapshotRendering.reset).toHaveBeenCalledTimes(1);
        expect(replay()).toBe(true);
        // a full recording: no draw is encoded again, and each full draw keeps new commands
        reset(true);
        expect(engine._snapshotRendering.reset).toHaveBeenCalledTimes(2);
        expect(replay()).toBe(false);
        keep();
        // the next recording reuses them
        reset();
        expect(replay()).toBe(true);
    });

    it("keeps the states the pipeline reads outside of the engine's state objects: alpha to coverage and the attachments written", () => {
        // what the engine's state objects hold is written by the base class, which is not what this checks
        const base = vi.spyOn(AbstractEngine.prototype as any, "_getInheritedState").mockReturnValue(0);
        // alpha to coverage as the pipeline cache holds it (setAlphaToCoverage of the alphaToCoverage extension)
        const engine: any = { _cacheRenderPipeline: { _alphaToCoverageEnabled: false }, _mrtAttachments: [1, 2, 3] };
        const state = () => {
            const target: number[] = [];
            return target.slice(0, (WebGPUEngine.prototype as any)._getInheritedState.call(engine, target));
        };
        const kept = state();
        expect(kept.length).toBe(2);
        engine._cacheRenderPipeline._alphaToCoverageEnabled = true;
        expect(state()).not.toEqual(kept);
        engine._cacheRenderPipeline._alphaToCoverageEnabled = false;
        expect(state()).toEqual(kept);
        engine._mrtAttachments = [1, 0, 3];
        expect(state()).not.toEqual(kept);
        base.mockRestore();
    });
});

/**
 * The meshes and the shadow maps check and keep their draws only while a snapshot records with snapshotRenderingReuseDraws on
 * (engine._recordsDraws): with it off (the default), a recording costs what it did before it.
 */
describe("WebGPUEngine._recordsDraws", () => {
    const recordsDraws = (record: boolean, reuseDraws: boolean) =>
        Object.getOwnPropertyDescriptor(WebGPUEngine.prototype, "_recordsDraws")!.get!.call({ _snapshotRendering: { record }, snapshotRenderingReuseDraws: reuseDraws });

    it("is true only while a snapshot records with snapshotRenderingReuseDraws on", () => {
        expect(recordsDraws(true, true)).toBe(true);
        expect(recordsDraws(true, false)).toBe(false);
        expect(recordsDraws(false, true)).toBe(false);
        expect(recordsDraws(false, false)).toBe(false);
    });
});

/**
 * A draw the render pass batcher holds (lowered into the command stream of a native host) reaches its encoder only when the batcher
 * flushes, while a recorded draw encoded again goes straight into the bundle encoder. With no dynamic state changed (viewport,
 * scissor, stencil reference, blend constant), _applyRenderPassChanges flushes nothing, so the flush of _replayRecordedDraw is the
 * one that keeps the held draw before the replayed one. These use the batcher, the command stream and the bundle list of the engine.
 */
describe("WebGPUEngine recorded draws and the render pass command batcher", () => {
    const ids = new WeakMap<object, number>();
    let nextId = 1;
    const resource = <T extends object>(): T => {
        const r = {} as T;
        ids.set(r, nextId++);
        return r;
    };
    const provider: IWebGPURenderPassCommandRecorderProvider = {
        protocolVersion: WebGPURenderPassCommandStreamProtocolVersion,
        isEnabled: () => true,
        getResourceId: (r: Nullable<object>) => (r ? (ids.get(r) ?? 0) : 0),
    };

    /** A bundle encoder of a native host: it takes direct calls and decoded batches, and lists its draws in the order they reach it. */
    class RecordingEncoder {
        public readonly draws: string[] = [];
        public setPipeline(): void {}
        public setIndexBuffer(): void {}
        public setVertexBuffer(): void {}
        public setBindGroup(): void {}
        public drawIndexed(_count: number, _instances?: number, firstIndex?: number): void {
            this.draws.push(`direct ${firstIndex}`);
        }
        public draw(_count: number, _instances?: number, firstVertex?: number): void {
            this.draws.push(`direct ${firstVertex}`);
        }
        public finish(): GPURenderBundle {
            return {} as GPURenderBundle;
        }
        public _recordCommands = (words: Uint32Array, _drawCount: number, _multiDrawCallCount: number, _multiDrawDrawCount: number, wordCount: number): boolean => {
            for (let i = 0; i < wordCount;) {
                switch (words[i]) {
                    case WebGPURenderPassCommandOpcode.setPipeline:
                        i += 3;
                        break;
                    case WebGPURenderPassCommandOpcode.setBindGroup:
                        i += 5;
                        break;
                    case WebGPURenderPassCommandOpcode.setVertexBuffer:
                    case WebGPURenderPassCommandOpcode.setIndexBuffer:
                        i += 8;
                        break;
                    case WebGPURenderPassCommandOpcode.draw:
                        this.draws.push(`batched ${words[i + 3]}`);
                        i += 5;
                        break;
                    case WebGPURenderPassCommandOpcode.drawIndexed:
                        this.draws.push(`batched ${words[i + 3]}`);
                        i += 6;
                        break;
                    default:
                        throw new Error(`Unexpected opcode ${words[i]} at word ${i}`);
                }
            }
            return true;
        };
    }

    function setup(drawKind: WebGPURenderPassDrawKind) {
        const encoder = new RecordingEncoder();
        const bundleList = new WebGPUBundleList({ createRenderBundleEncoder: () => encoder } as unknown as GPUDevice);
        const stream = new WebGPURenderPassCommandStream({ getProvider: () => provider });
        const batcher = new RenderCommandBatcher<IWebGPURenderPassDrawCommand>(stream, ApplyWebGPURenderPassDrawCommand);
        const materialContext = new WebGPUMaterialContext();
        const drawWrapper = new DrawWrapper({
            createDrawContext: () => new WebGPUDrawContext({ createRawBuffer: () => ({}), setRawData: () => {}, releaseBuffer: () => true } as any, {} as any),
            createMaterialContext: () => materialContext,
        } as any);
        drawWrapper.setEffect({ onBind: null, _onBindObservable: null, _pipelineContext: {} } as any);
        const drawContext = drawWrapper.drawContext as WebGPUDrawContext;
        materialContext.isDirty = false;
        drawContext.resetIsDirty(materialContext.updateId);
        const vertexBuffer = { effectiveBuffer: { underlyingResource: resource<GPUBuffer>() }, _validOffsetRange: true, byteOffset: 0 };
        const engine: any = {
            _snapshotRendering: { record: true },
            _recordedDrawsGeneration: 0,
            _currentRenderTarget: null,
            currentSampleCount: 1,
            _currentDrawContext: drawContext,
            _currentEffect: { _pipelineContext: {} },
            _currentIndexBuffer: drawKind === WebGPURenderPassDrawKind.INDEXED ? { underlyingResource: resource<GPUBuffer>(), is32Bits: true } : null,
            _cacheRenderPipeline: { colorFormats: [], vertexBuffers: [vertexBuffer], setAlphaBlendEnabled: () => {} },
            _bundleList: bundleList,
            _renderPassDrawBatcher: batcher,
            _getCurrentRenderPass: () => {},
            _reportDrawCall: () => {},
            // the dynamic states the render pass already has are the ones the engine holds: none to update
            _viewportCached: { x: 0, y: 0, z: 1280, w: 720 },
            _viewportsCurrent: { x: 0, y: 0, w: 1280, h: 720 },
            _scissorCached: { x: 8, y: 8, z: 64, w: 64 },
            _scissorsCurrent: { x: 8, y: 8, w: 64, h: 64 },
            _stencilStateComposer: { enabled: true, funcRef: 1, apply: () => {} },
            _stencilRefsCurrent: 1,
            _alphaState: { alphaBlend: true, _alphaBlend: true, _numTargetEnabled: 1, _blendConstants: [0.25, 0.5, 0.75, 1] },
            _blendColorsCurrent: [0.25, 0.5, 0.75, 1],
        };
        const proto = WebGPUEngine.prototype as any;
        for (const name of [
            "_canEncodeRecordedDraw",
            "applyStates",
            "_applyRenderPassChanges",
            "_mustUpdateViewport",
            "_mustUpdateScissor",
            "_mustUpdateStencilRef",
            "_mustUpdateBlendColor",
            "_flushRenderPassCommands",
        ]) {
            engine[name] = (...args: unknown[]) => proto[name].apply(engine, args);
        }
        // the full draw that recorded it, at start 100
        proto._keepRecordedDraw.call(engine, resource<GPURenderPipeline>(), [resource<GPUBindGroup>()], drawKind, 36, 1, 100);
        // a draw the batcher holds, in the bundle encoder the recording writes into
        const hold = (start: number) =>
            batcher.submit({
                renderPass: bundleList.getBundleEncoder([], undefined, 1),
                drawKind: WebGPURenderPassDrawKind.INDEXED,
                pipeline: resource<GPURenderPipeline>(),
                bindGroups: [resource<GPUBindGroup>()],
                vertexBuffers: [{ effectiveBuffer: { underlyingResource: resource<GPUBuffer>() }, byteOffset: 0, _validOffsetRange: true } as unknown as VertexBuffer],
                indexBuffer: { underlyingResource: resource<GPUBuffer>(), is32Bits: true } as unknown as DataBuffer,
                indexFormat: WebGPUConstants.IndexFormat.Uint32,
                count: 36,
                instancesCount: 1,
                start,
                indirectDrawBuffer: null,
            });
        const replay = () => proto._replayRecordedDraw.call(engine, drawWrapper);
        return { encoder, bundleList, batcher, hold, replay };
    }

    it("encodes a draw the batcher holds before an indexed recorded draw it encodes again, with no dynamic state changed", () => {
        const { encoder, bundleList, batcher, hold, replay } = setup(WebGPURenderPassDrawKind.INDEXED);
        expect(hold(0)).toBe(true);
        expect(replay()).toBe(true);
        // the end of the pass flushes what is left
        batcher.flush();
        expect(encoder.draws).toEqual(["batched 0", "direct 100"]);
        // nothing changed: the bundle list holds the bundle alone, no viewport, scissor, stencil reference or blend constant
        const pass = { executeBundles: vi.fn(), setViewport: vi.fn(), setScissorRect: vi.fn(), setStencilReference: vi.fn(), setBlendConstant: vi.fn() };
        bundleList.run(pass as unknown as GPURenderPassEncoder);
        expect(pass.executeBundles).toHaveBeenCalledTimes(1);
        expect([pass.setViewport, pass.setScissorRect, pass.setStencilReference, pass.setBlendConstant].map((f) => f.mock.calls.length)).toEqual([0, 0, 0, 0]);
    });

    it("keeps the order of the draws the batcher holds before and after a non-indexed recorded draw it encodes again, and keeps batching", () => {
        const { encoder, batcher, hold, replay } = setup(WebGPURenderPassDrawKind.NON_INDEXED);
        expect(hold(0)).toBe(true);
        expect(hold(36)).toBe(true);
        expect(replay()).toBe(true);
        expect(hold(200)).toBe(true);
        batcher.flush();
        expect(encoder.draws).toEqual(["batched 0", "batched 36", "direct 100", "batched 200"]);
    });
});
