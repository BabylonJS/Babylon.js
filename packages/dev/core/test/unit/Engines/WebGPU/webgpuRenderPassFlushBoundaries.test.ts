/**
 * Flush-boundary scenario tests for the WebGPU render pass command stream.
 *
 * These tests exercise the real engine prototype methods (occlusion queries, debug markers) against
 * a semantic model of a native render pass: a GPU timeline that executes both direct encoder calls
 * and decoded command-stream batches in submission order. The assertions are about user-visible
 * outcomes — "which draws did this occlusion query observe", "which draws does this debug group
 * contain" — not about the ordinality of encoder calls. In particular they pin the failure mode
 * where a draw batched between beginOcclusionQuery/endOcclusionQuery would otherwise be recorded
 * after the bracket closes, making the query report zero samples and the mesh wrongly disappear as
 * "occluded".
 */
import { describe, expect, it, vi } from "vitest";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import { RenderCommandBatcher } from "core/Engines/renderCommandBatcher.pure";
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
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { RegisterEnginesWebGPUExtensionsEngineQuery } from "core/Engines/WebGPU/Extensions/engine.query.pure";
import { RegisterWebGPUDebugging } from "core/Engines/WebGPU/Extensions/engine.debugging.pure";
import { type OcclusionQuery } from "core/Engines/AbstractEngine/abstractEngine.query.pure";

// The code under test is the extension registration functions above: they attach the production
// occlusion-query and debug-marker methods (including their flush-boundary handling) onto the engine
// prototypes. The engine base classes themselves are not under test, and their real modules pull a
// transitive import graph (shader modules) that cannot resolve in unit tests — so they are replaced
// with bare classes for the registrations to attach to.
vi.mock("core/Engines/thinWebGPUEngine", () => ({ ThinWebGPUEngine: class {} }));
vi.mock("core/Engines/webgpuEngine.pure", () => ({ WebGPUEngine: class {} }));

RegisterEnginesWebGPUExtensionsEngineQuery();
RegisterWebGPUDebugging();

const ResourceIds = new WeakMap<object, number>();
let NextResourceId = 1;

function createTrackedResource<T extends object>(): T {
    const resource = {} as T;
    ResourceIds.set(resource, NextResourceId++);
    return resource;
}

const Provider: IWebGPURenderPassCommandRecorderProvider = {
    protocolVersion: WebGPURenderPassCommandStreamProtocolVersion,
    isEnabled: () => true,
    getResourceId: (resource: Nullable<object>) => (resource ? (ResourceIds.get(resource) ?? 0) : 0),
};

interface ISemanticDraw {
    start: number;
    queryIndex: Nullable<number>;
    groups: string[];
    viaCommandStream: boolean;
}

/**
 * Models what the native backend does with a render pass: executes direct encoder calls and decoded
 * command-stream batches in the order they arrive, attributing every executed draw to the occlusion
 * query and debug groups that are open at execution time.
 */
class SemanticRenderPass {
    public readonly draws: ISemanticDraw[] = [];
    private _activeQueryIndex: Nullable<number> = null;
    private readonly _groupStack: string[] = [];

    // Direct (unbatched) encoder surface.
    public setPipeline(): void {}
    public setIndexBuffer(): void {}
    public setVertexBuffer(): void {}
    public setBindGroup(): void {}
    public drawIndexed(_indexCount: number, _instanceCount?: number, firstIndex?: number): void {
        this._executeDraw(firstIndex ?? 0, false);
    }
    public draw(_vertexCount: number, _instanceCount?: number, firstVertex?: number): void {
        this._executeDraw(firstVertex ?? 0, false);
    }
    public beginOcclusionQuery(queryIndex: number): void {
        this._activeQueryIndex = queryIndex;
    }
    public endOcclusionQuery(): void {
        this._activeQueryIndex = null;
    }
    public pushDebugGroup(groupName: string): void {
        this._groupStack.push(groupName);
    }
    public popDebugGroup(): void {
        this._groupStack.pop();
    }
    public insertDebugMarker(): void {}
    public end(): void {}

    // Host recording hook: decodes a batched command stream the way the native backend would.
    public _recordCommands = (words: Uint32Array, _drawCount: number, _multiDrawCallCount: number, _multiDrawDrawCount: number, wordCount: number): boolean => {
        let index = 0;
        while (index < wordCount) {
            const opcode = words[index];
            switch (opcode) {
                case WebGPURenderPassCommandOpcode.setPipeline:
                    index += 3;
                    break;
                case WebGPURenderPassCommandOpcode.setBindGroup:
                    index += 5;
                    break;
                case WebGPURenderPassCommandOpcode.setVertexBuffer:
                case WebGPURenderPassCommandOpcode.setIndexBuffer:
                    index += 8;
                    break;
                case WebGPURenderPassCommandOpcode.draw:
                    this._executeDraw(words[index + 3], true);
                    index += 5;
                    break;
                case WebGPURenderPassCommandOpcode.drawIndexed:
                    this._executeDraw(words[index + 3], true);
                    index += 6;
                    break;
                case WebGPURenderPassCommandOpcode.drawIndirect:
                case WebGPURenderPassCommandOpcode.drawIndexedIndirect:
                    this._executeDraw(-1, true);
                    index += 5;
                    break;
                default:
                    throw new Error(`Unexpected opcode ${opcode} at word ${index}`);
            }
        }
        return true;
    };

    // Number of draws the query observed — the stand-in for the samples-passed result a mesh's
    // occlusion state is derived from.
    public samplesPassedForQuery(queryIndex: number): number {
        return this.draws.filter((draw) => draw.queryIndex === queryIndex).length;
    }

    public drawStartsForQuery(queryIndex: number): number[] {
        return this.draws.filter((draw) => draw.queryIndex === queryIndex).map((draw) => draw.start);
    }

    public drawStartsOutsideQueries(): number[] {
        return this.draws.filter((draw) => draw.queryIndex === null).map((draw) => draw.start);
    }

    public drawStartsInGroup(groupName: string): number[] {
        return this.draws.filter((draw) => draw.groups.includes(groupName)).map((draw) => draw.start);
    }

    private _executeDraw(start: number, viaCommandStream: boolean): void {
        this.draws.push({ start, queryIndex: this._activeQueryIndex, groups: [...this._groupStack], viaCommandStream });
    }
}

function createBatcher(): RenderCommandBatcher<IWebGPURenderPassDrawCommand> {
    const stream = new WebGPURenderPassCommandStream({ getProvider: () => Provider });
    return new RenderCommandBatcher<IWebGPURenderPassDrawCommand>(stream, ApplyWebGPURenderPassDrawCommand);
}

function submitDraw(batcher: RenderCommandBatcher<IWebGPURenderPassDrawCommand>, renderPass: SemanticRenderPass, start: number): void {
    const lowered = batcher.submit({
        renderPass: renderPass as unknown as GPURenderPassEncoder,
        drawKind: WebGPURenderPassDrawKind.INDEXED,
        pipeline: createTrackedResource<GPURenderPipeline>(),
        bindGroups: [createTrackedResource<GPUBindGroup>()],
        vertexBuffers: [
            {
                effectiveBuffer: { underlyingResource: createTrackedResource<GPUBuffer>() },
                byteOffset: 0,
                _validOffsetRange: true,
            } as unknown as VertexBuffer,
        ],
        indexBuffer: { underlyingResource: createTrackedResource<GPUBuffer>(), is32Bits: true } as unknown as DataBuffer,
        indexFormat: WebGPUConstants.IndexFormat.Uint32,
        count: 36,
        instancesCount: 1,
        start,
        indirectDrawBuffer: null,
    });

    // The scenarios below are only meaningful if the draw actually takes the batched path.
    expect(lowered).toBe(true);
}

// Builds the minimal engine state the registered ThinWebGPUEngine occlusion-query methods rely on,
// with the flush hook wired to the batcher exactly like WebGPUEngine._flushRenderPassCommands.
function createOcclusionQueryEngine(renderPass: SemanticRenderPass, batcher: RenderCommandBatcher<IWebGPURenderPassDrawCommand>): ThinWebGPUEngine {
    const engine = {
        compatibilityMode: true,
        _occlusionQuery: { canBeginQuery: () => true },
        _currentRenderPass: renderPass,
        _flushRenderPassCommands: () => void batcher.flush(),
    };
    Object.setPrototypeOf(engine, ThinWebGPUEngine.prototype);
    return engine as unknown as ThinWebGPUEngine;
}

// Builds the minimal engine state the registered WebGPUEngine debug-marker methods rely on, with
// the flush hook wired to the batcher exactly like WebGPUEngine._flushRenderPassCommands.
function createDebugMarkersEngine(renderPass: SemanticRenderPass, batcher: RenderCommandBatcher<IWebGPURenderPassDrawCommand>): WebGPUEngine {
    const engine = {
        _enableGPUDebugMarkers: true,
        _showGPUDebugMarkersLog: false,
        frameId: 1,
        _currentRenderPass: renderPass,
        _renderEncoder: {},
        _debugMarkersPassGroups: [],
        _debugMarkersEncoderGroups: [],
        _debugMarkersPendingEncoderPops: 0,
        _flushRenderPassCommands: () => void batcher.flush(),
    };
    Object.setPrototypeOf(engine, WebGPUEngine.prototype);
    return engine as unknown as WebGPUEngine;
}

describe("WebGPU render pass command stream flush boundaries", () => {
    describe("occlusion queries", () => {
        it("keeps a batched draw inside the occlusion query that brackets it, so a visible mesh is not misreported as occluded", () => {
            const renderPass = new SemanticRenderPass();
            const batcher = createBatcher();
            const engine = createOcclusionQueryEngine(renderPass, batcher);
            const queryIndex = 7;

            submitDraw(batcher, renderPass, 0); // unrelated draw issued before the query opens
            expect(engine.beginOcclusionQuery(0, queryIndex as unknown as OcclusionQuery)).toBe(true);
            submitDraw(batcher, renderPass, 36); // the mesh whose visibility the query measures
            engine.endOcclusionQuery(0);
            submitDraw(batcher, renderPass, 72); // unrelated draw issued after the query closes
            batcher.flush(); // render pass ends

            // Zero samples here is the user-visible bug this boundary flushing prevents: the mesh
            // would be flagged occluded and disappear even though it was drawn.
            expect(renderPass.samplesPassedForQuery(queryIndex)).toBeGreaterThan(0);
            expect(renderPass.drawStartsForQuery(queryIndex)).toEqual([36]);

            // Draws issued outside the bracket must not inflate the query result either.
            expect(renderPass.drawStartsOutsideQueries()).toEqual([0, 72]);

            // The boundary flushes must keep the draws on the batched path rather than silently
            // degrading them to one-call-per-draw replay.
            expect(renderPass.draws.map((draw) => draw.viaCommandStream)).toEqual([true, true, true]);
        });

        it("reports zero samples for a query that brackets no draws, even with batched draws pending around it", () => {
            const renderPass = new SemanticRenderPass();
            const batcher = createBatcher();
            const engine = createOcclusionQueryEngine(renderPass, batcher);
            const queryIndex = 3;

            submitDraw(batcher, renderPass, 0); // pending when the empty bracket opens
            expect(engine.beginOcclusionQuery(0, queryIndex as unknown as OcclusionQuery)).toBe(true);
            engine.endOcclusionQuery(0);
            submitDraw(batcher, renderPass, 36); // issued after the bracket closed
            batcher.flush();

            // Neither the draw pending before the bracket nor the one issued after it may leak in:
            // a leak would report a fully occluded mesh as visible.
            expect(renderPass.samplesPassedForQuery(queryIndex)).toBe(0);
            expect(renderPass.drawStartsOutsideQueries()).toEqual([0, 36]);
        });

        it("attributes draws to the correct query across consecutive brackets in one batch run", () => {
            const renderPass = new SemanticRenderPass();
            const batcher = createBatcher();
            const engine = createOcclusionQueryEngine(renderPass, batcher);

            expect(engine.beginOcclusionQuery(0, 1 as unknown as OcclusionQuery)).toBe(true);
            submitDraw(batcher, renderPass, 10);
            engine.endOcclusionQuery(0);
            expect(engine.beginOcclusionQuery(0, 2 as unknown as OcclusionQuery)).toBe(true);
            submitDraw(batcher, renderPass, 20);
            engine.endOcclusionQuery(0);
            batcher.flush();

            expect(renderPass.drawStartsForQuery(1)).toEqual([10]);
            expect(renderPass.drawStartsForQuery(2)).toEqual([20]);
        });
    });

    describe("debug marker groups", () => {
        it("attributes batched draws to the debug group that was open when they were issued", () => {
            const renderPass = new SemanticRenderPass();
            const batcher = createBatcher();
            const engine = createDebugMarkersEngine(renderPass, batcher);

            submitDraw(batcher, renderPass, 0); // issued before the group opens
            engine._debugPushGroup("portal interior");
            submitDraw(batcher, renderPass, 36); // issued inside the group
            engine._debugPopGroup();
            submitDraw(batcher, renderPass, 72); // issued after the group closes
            batcher.flush();

            // A GPU capture must show exactly the draw issued inside the group — otherwise frame
            // debugging attributes work to the wrong scope.
            expect(renderPass.drawStartsInGroup("portal interior")).toEqual([36]);
            expect(renderPass.draws.map((draw) => draw.viaCommandStream)).toEqual([true, true, true]);
        });

        it("keeps draws batched while nesting and unwinding debug groups", () => {
            const renderPass = new SemanticRenderPass();
            const batcher = createBatcher();
            const engine = createDebugMarkersEngine(renderPass, batcher);

            engine._debugPushGroup("frame");
            submitDraw(batcher, renderPass, 0);
            engine._debugPushGroup("shadows");
            submitDraw(batcher, renderPass, 36);
            engine._debugPopGroup();
            submitDraw(batcher, renderPass, 72);
            engine._debugPopGroup();
            batcher.flush();

            expect(renderPass.drawStartsInGroup("frame")).toEqual([0, 36, 72]);
            expect(renderPass.drawStartsInGroup("shadows")).toEqual([36]);
            expect(renderPass.draws.map((draw) => draw.viaCommandStream)).toEqual([true, true, true]);
        });
    });
});
